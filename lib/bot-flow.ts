import { Document, getFilteredDocuments } from './document-service'
import { generateSignedUrl } from './storage-service'

export interface BotSession {
  currentStep: string
  stepHistory: string[]
  category?: string
  fiscalYear?: string
  subCategory?: string
  documentList?: Document[]
  createdAt: string
  expiresAt: string
}

export type InteractivePayload =
  | {
      type: 'button'
      body: string
      buttons: { id: string; title: string }[]
    }
  | {
      type: 'list'
      body: string
      buttonText: string
      sections: {
        title: string
        rows: { id: string; title: string; description?: string }[]
      }[]
    }

export interface FlowResult {
  message: string
  document?: { url: string; filename: string; caption: string }
  documents?: { url: string; filename: string; caption: string }[]
  interactive?: InteractivePayload
  followUp?: InteractivePayload
  session: BotSession | null
}

// ---------------------------------------------------------------------------
// Flow message body text (descriptive only — no numbered lists)
// ---------------------------------------------------------------------------
const FLOW_MESSAGES = {
  user_not_found:
    'Hello \u{1F44B}\n\nWe could not find your account in our system.\n\nPlease contact support or register to access your documents.',
  category_selection:
    'Hello \u{1F44B}\n\nWelcome to JPCO Client Document Service.\n\nPlease select a document category:',
  audit_year: 'You selected: Audit Report \u{1F4CA}\n\nPlease select Financial Year:',
  financial_year:
    'You selected: Financial Statements \u{1F4CA}\n\nPlease select Financial Year:',
  gst_year: 'You selected: GST Documents \u{1F4CA}\n\nPlease select Financial Year:',
  gst_type: 'Please select document type:',
  income_tax_year:
    'You selected: Income Tax Documents \u{1F4C4}\n\nPlease select Financial Year:',
  income_tax_type: 'Please select document type:',
  no_documents:
    'No documents found for the selected option.\n\nPlease try another category or year.',
  invalid_input:
    'Invalid input \u2757\n\nPlease reply with a valid number from the options above.',
  restart: 'Returning to main menu...',
  back: 'Going back...',
  no_back: 'You are already at the main menu. Please select an option above.',
} as const

// ---------------------------------------------------------------------------
// Reusable navigation section for list menus (Back + Main Menu)
// ---------------------------------------------------------------------------
const NAV_SECTION = {
  title: 'Navigation',
  rows: [
    { id: 'back', title: 'Back' },
    { id: 'main_menu', title: 'Main Menu' },
  ],
}

// ---------------------------------------------------------------------------
// Interactive payload builders for each step
// ---------------------------------------------------------------------------
const STEP_INTERACTIVE: Record<string, InteractivePayload> = {
  category_selection: {
    type: 'list',
    body: FLOW_MESSAGES.category_selection,
    buttonText: 'Select Category',
    sections: [
      {
        title: 'Categories',
        rows: [
          { id: '1', title: 'Audit Report' },
          { id: '2', title: 'Financial Statements' },
          { id: '3', title: 'GST Documents' },
          { id: '4', title: 'Income Tax Documents' },
          { id: '5', title: 'Other Documents' },
        ],
      },
    ],
  },
  audit_year: {
    type: 'list',
    body: FLOW_MESSAGES.audit_year,
    buttonText: 'Select Year',
    sections: [
      {
        title: 'Financial Years',
        rows: [
          { id: '1', title: 'FY 2021-22' },
          { id: '2', title: 'FY 2022-23' },
          { id: '3', title: 'FY 2023-24' },
          { id: '4', title: 'FY 2024-25' },
        ],
      },
      NAV_SECTION,
    ],
  },
  financial_year: {
    type: 'list',
    body: FLOW_MESSAGES.financial_year,
    buttonText: 'Select Year',
    sections: [
      {
        title: 'Financial Years',
        rows: [
          { id: '1', title: 'FY 2022-23' },
          { id: '2', title: 'FY 2023-24' },
          { id: '3', title: 'FY 2024-25' },
        ],
      },
      NAV_SECTION,
    ],
  },
  gst_year: {
    type: 'list',
    body: FLOW_MESSAGES.gst_year,
    buttonText: 'Select Year',
    sections: [
      {
        title: 'Financial Years',
        rows: [
          { id: '1', title: 'FY 2022-23' },
          { id: '2', title: 'FY 2023-24' },
          { id: '3', title: 'FY 2024-25' },
          { id: '4', title: 'FY 2025-26' },
        ],
      },
      NAV_SECTION,
    ],
  },
  gst_type: {
    type: 'list',
    body: FLOW_MESSAGES.gst_type,
    buttonText: 'Select Type',
    sections: [
      {
        title: 'Document Types',
        rows: [
          { id: '1', title: 'GSTR-1' },
          { id: '2', title: 'GSTR-3B' },
        ],
      },
      NAV_SECTION,
    ],
  },
  income_tax_year: {
    type: 'list',
    body: FLOW_MESSAGES.income_tax_year,
    buttonText: 'Select Year',
    sections: [
      {
        title: 'Financial Years',
        rows: [
          { id: '1', title: 'FY 2022-23' },
          { id: '2', title: 'FY 2023-24' },
          { id: '3', title: 'FY 2024-25' },
        ],
      },
      NAV_SECTION,
    ],
  },
  income_tax_type: {
    type: 'list',
    body: FLOW_MESSAGES.income_tax_type,
    buttonText: 'Select Type',
    sections: [
      {
        title: 'Document Types',
        rows: [
          { id: 'download_all', title: 'Download All' },
          { id: '1', title: 'ITR' },
          { id: '2', title: 'Acknowledgement' },
          { id: '3', title: 'Computation' },
        ],
      },
      NAV_SECTION,
    ],
  },
}

// Maps category_selection input → { step, category }
const CATEGORY_MAP: Record<string, { step: string; category: string }> = {
  '1': { step: 'audit_year', category: 'Audit Report' },
  '2': { step: 'financial_year', category: 'Financial Statements' },
  '3': { step: 'gst_year', category: 'GST Related Documents' },
  '4': { step: 'income_tax_year', category: 'Income Tax Documents' },
  '5': { step: 'other_docs', category: 'Incorporation & Other Documents' },
}

// Maps year-selection steps → valid inputs → fiscal year
const YEAR_MAP: Record<string, Record<string, { year: string; nextStep: string }>> = {
  audit_year: {
    '1': { year: 'FY 2021-22', nextStep: 'fetch_documents' },
    '2': { year: 'FY 2022-23', nextStep: 'fetch_documents' },
    '3': { year: 'FY 2023-24', nextStep: 'fetch_documents' },
    '4': { year: 'FY 2024-25', nextStep: 'fetch_documents' },
  },
  financial_year: {
    '1': { year: 'FY 2022-23', nextStep: 'fetch_documents' },
    '2': { year: 'FY 2023-24', nextStep: 'fetch_documents' },
    '3': { year: 'FY 2024-25', nextStep: 'fetch_documents' },
  },
  gst_year: {
    '1': { year: 'FY 2022-23', nextStep: 'gst_type' },
    '2': { year: 'FY 2023-24', nextStep: 'gst_type' },
    '3': { year: 'FY 2024-25', nextStep: 'gst_type' },
    '4': { year: 'FY 2025-26', nextStep: 'gst_type' },
  },
  income_tax_year: {
    '1': { year: 'FY 2022-23', nextStep: 'income_tax_type' },
    '2': { year: 'FY 2023-24', nextStep: 'income_tax_type' },
    '3': { year: 'FY 2024-25', nextStep: 'income_tax_type' },
  },
}

// Maps sub-category steps → valid inputs → subCategory
const SUB_CATEGORY_MAP: Record<string, Record<string, string>> = {
  gst_type: {
    '1': 'GSTR-1',
    '2': 'GSTR-3B',
  },
  income_tax_type: {
    '1': 'ITR',
    '2': 'Acknowledgement',
    '3': 'Computation',
  },
}

function createSession(step: string, overrides?: Partial<BotSession>): BotSession {
  const now = Date.now()
  return {
    currentStep: step,
    stepHistory: [],
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 30 * 60 * 1000).toISOString(),
    ...overrides,
  }
}

function pushStep(session: BotSession, nextStep: string): BotSession {
  return {
    ...session,
    currentStep: nextStep,
    stepHistory: [...session.stepHistory, session.currentStep],
  }
}

function goBack(session: BotSession): { step: string; session: BotSession } | null {
  if (session.stepHistory.length === 0) return null
  const history = [...session.stepHistory]
  const previousStep = history.pop()!
  return {
    step: previousStep,
    session: { ...session, currentStep: previousStep, stepHistory: history },
  }
}

/**
 * Build a FlowResult that includes the interactive payload for a given step.
 */
function buildStepResult(step: string, session: BotSession, prefixMessage?: string): FlowResult {
  const interactive = STEP_INTERACTIVE[step]
  const body = interactive ? ('body' in interactive ? interactive.body : '') : ''
  const message = prefixMessage ? prefixMessage + '\n\n' + body : body

  return {
    message,
    interactive: interactive ?? undefined,
    session,
  }
}

/**
 * Truncate a string to a max length, appending "…" if truncated.
 */
function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.slice(0, max - 1) + '…'
}

/**
 * Build a follow-up interactive payload shown after document(s) are sent.
 */
function buildFollowUp(): InteractivePayload {
  return {
    type: 'button',
    body: 'Your document has been sent successfully!\n\nWould you like to download another document?',
    buttons: [{ id: 'select_category', title: 'Select Category' }],
  }
}

/**
 * Process an incoming message and return the response + updated session.
 * User verification is handled by the caller — this function is only called for verified users.
 *
 * @param interactiveReplyId - The button/list reply ID from an interactive message tap.
 */
export async function processMessage(
  phone: string,
  text: string,
  session: BotSession | null,
  interactiveReplyId?: string
): Promise<FlowResult> {
  // If an interactive reply ID is present, use it as the effective input.
  // "back" maps to "#" so the existing back-handling logic works.
  let input: string
  if (interactiveReplyId) {
    input = interactiveReplyId === 'back' ? '#' : interactiveReplyId.toLowerCase().trim()
  } else {
    input = text.toLowerCase().trim()
  }

  // Ensure stepHistory exists for legacy sessions
  if (session && !session.stepHistory) {
    session = { ...session, stepHistory: [] }
  }

  // "hi" / "hello" → start fresh with category menu
  if (input === 'hi' || input === 'hello') {
    return buildStepResult('category_selection', createSession('category_selection'))
  }

  // "0" / "main_menu" / "select_category" → restart to category menu
  if ((input === '0' || input === 'main_menu' || input === 'select_category') && session) {
    return buildStepResult(
      'category_selection',
      createSession('category_selection'),
      FLOW_MESSAGES.restart
    )
  }

  // "back" / "#" → go back to previous step
  if ((input === 'back' || input === '#') && session) {
    const result = goBack(session)
    if (!result) {
      return { message: FLOW_MESSAGES.no_back, session }
    }

    const backStep = result.step
    const backSession = result.session

    // If the step has a known interactive payload, return it
    if (STEP_INTERACTIVE[backStep]) {
      return buildStepResult(backStep, backSession, FLOW_MESSAGES.back)
    }

    // If going back to a fetch step (like other_docs), go to category instead
    return buildStepResult(
      'category_selection',
      createSession('category_selection'),
      FLOW_MESSAGES.back
    )
  }

  // No active session
  if (!session) {
    return {
      message: "Please send 'Hi' to start.",
      session: null,
    }
  }

  const step = session.currentStep

  // Category selection
  if (step === 'category_selection') {
    const selected = CATEGORY_MAP[input]
    if (!selected) {
      return { message: FLOW_MESSAGES.invalid_input, session }
    }

    // "Other Documents" → fetch directly without year selection
    if (selected.step === 'other_docs') {
      return fetchAndListDocuments(phone, {
        ...pushStep(session, 'other_docs'),
        category: selected.category,
      })
    }

    const newSession = pushStep(session, selected.step)
    newSession.category = selected.category
    return buildStepResult(selected.step, newSession)
  }

  // Year selection steps
  if (YEAR_MAP[step]) {
    const yearEntry = YEAR_MAP[step][input]
    if (!yearEntry) {
      return { message: FLOW_MESSAGES.invalid_input, session }
    }

    const updatedSession = pushStep(session, yearEntry.nextStep)
    updatedSession.fiscalYear = yearEntry.year

    // If next step is fetch_documents, query and list
    if (yearEntry.nextStep === 'fetch_documents') {
      return fetchAndListDocuments(phone, updatedSession)
    }

    // Otherwise show sub-category menu
    return buildStepResult(yearEntry.nextStep, updatedSession)
  }

  // Sub-category selection steps
  if (SUB_CATEGORY_MAP[step]) {
    // Download All for income tax — fetch docs across all sub-categories
    if (input === 'download_all' && step === 'income_tax_type') {
      try {
        const documents = await getFilteredDocuments(
          phone,
          session.category!,
          session.fiscalYear
        )

        if (documents.length === 0) {
          return buildStepResult(
            'category_selection',
            createSession('category_selection'),
            FLOW_MESSAGES.no_documents
          )
        }

        const signedDocs = await Promise.all(
          documents.map(async (d) => {
            const url = await generateSignedUrl(d.filePath)
            const filename = d.filePath.split('/').pop() || d.title
            return { url, filename, caption: `Here is your document \u{1F4C4}\n\n${d.title}` }
          })
        )

        return {
          message: '',
          documents: signedDocs,
          followUp: buildFollowUp(),
          session,
        }
      } catch (error) {
        console.error('Error fetching all income tax documents:', error)
        return {
          message: 'Something went wrong while fetching your documents. Please try again later.',
          session: createSession('category_selection'),
        }
      }
    }

    const subCat = SUB_CATEGORY_MAP[step][input]
    if (!subCat) {
      return { message: FLOW_MESSAGES.invalid_input, session }
    }

    const updatedSession = pushStep(session, 'fetch_documents')
    updatedSession.subCategory = subCat

    return fetchAndListDocuments(phone, updatedSession)
  }

  // Document list — user picks a number to download
  if (step === 'list_documents' && session.documentList) {
    // Download All documents in the current list
    if (input === 'download_all_docs') {
      try {
        const docs = session.documentList
        const signedDocs = await Promise.all(
          docs.map(async (d) => {
            const url = await generateSignedUrl(d.filePath)
            const filename = d.filePath.split('/').pop() || d.title
            return { url, filename, caption: `Here is your document \u{1F4C4}\n\n${d.title}` }
          })
        )
        return {
          message: '',
          documents: signedDocs,
          followUp: buildFollowUp(),
          session,
        }
      } catch (error) {
        console.error('Error generating signed URLs for download all:', error)
        return {
          message: 'Unable to retrieve documents. Please try again later.',
          session,
        }
      }
    }

    const num = parseInt(input, 10)
    if (isNaN(num) || num < 1 || num > session.documentList.length) {
      return { message: FLOW_MESSAGES.invalid_input, session }
    }

    const doc = session.documentList[num - 1]
    try {
      const signedUrl = await generateSignedUrl(doc.filePath)
      const filename = doc.filePath.split('/').pop() || doc.title
      return {
        message: '',
        document: {
          url: signedUrl,
          filename,
          caption: `Here is your document \u{1F4C4}\n\n${doc.title}`,
        },
        followUp: buildFollowUp(),
        session,
      }
    } catch (error) {
      console.error('Error generating signed URL:', error)
      return {
        message: 'Unable to retrieve document. Please try again later.',
        session,
      }
    }
  }

  // Fallback
  return {
    message: FLOW_MESSAGES.invalid_input,
    session,
  }
}

async function fetchAndListDocuments(
  phone: string,
  session: BotSession
): Promise<FlowResult> {
  try {
    const documents = await getFilteredDocuments(
      phone,
      session.category!,
      session.fiscalYear,
      session.subCategory
    )

    if (documents.length === 0) {
      return buildStepResult(
        'category_selection',
        createSession('category_selection'),
        FLOW_MESSAGES.no_documents
      )
    }

    // Cap at 8 documents (+ Download All = 9 rows in section; nav is a separate section)
    const cappedDocs = documents.slice(0, 7)

    const rows: { id: string; title: string }[] = []

    // Add Download All when there are multiple documents
    if (cappedDocs.length > 1) {
      rows.push({ id: 'download_all_docs', title: 'Download All' })
    }

    cappedDocs.forEach((doc, i) => {
      rows.push({ id: String(i + 1), title: truncate(doc.title, 24) })
    })

    const bodyText =
      'Here are your documents \u{1F4C2}\n\nTap a document to download.'

    const interactive: InteractivePayload = {
      type: 'list',
      body: bodyText,
      buttonText: 'View Documents',
      sections: [
        {
          title: 'Documents',
          rows,
        },
        NAV_SECTION,
      ],
    }

    return {
      message: bodyText,
      interactive,
      session: {
        ...session,
        currentStep: 'list_documents',
        documentList: cappedDocs,
      },
    }
  } catch (error) {
    console.error('Error fetching documents:', error)
    return {
      message: 'Something went wrong while fetching your documents. Please try again later.',
      session: createSession('category_selection'),
    }
  }
}
