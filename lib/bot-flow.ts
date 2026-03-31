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

export interface FlowResult {
  message: string
  document?: { url: string; filename: string; caption: string }
  session: BotSession | null
}

const FLOW_MESSAGES = {
  user_not_found:
    'Hello \u{1F44B}\n\nWe could not find your account in our system.\n\nPlease contact support or register to access your documents.',
  category_selection:
    'Hello \u{1F44B}\n\nWelcome to JPCO Client Document Service.\n\nPlease select a document category:\n\n1\uFE0F\u20E3 Audit Report\n2\uFE0F\u20E3 Financial Statements\n3\uFE0F\u20E3 GST Documents\n4\uFE0F\u20E3 Income Tax Documents\n5\uFE0F\u20E3 Other Documents\n\nReply with the number to continue.',
  audit_year:
    'You selected: Audit Report \u{1F4CA}\n\nPlease select Financial Year:\n\n1\uFE0F\u20E3 FY 2021-22\n2\uFE0F\u20E3 FY 2022-23\n3\uFE0F\u20E3 FY 2023-24\n4\uFE0F\u20E3 FY 2024-25\n\nReply with the number.\nType *#* to go back.',
  financial_year:
    'You selected: Financial Statements \u{1F4CA}\n\nPlease select Financial Year:\n\n1\uFE0F\u20E3 FY 2022-23\n2\uFE0F\u20E3 FY 2023-24\n3\uFE0F\u20E3 FY 2024-25\n\nReply with the number.\nType *#* to go back.',
  gst_year:
    'You selected: GST Documents \u{1F4CA}\n\nPlease select Financial Year:\n\n1\uFE0F\u20E3 FY 2022-23\n2\uFE0F\u20E3 FY 2023-24\n3\uFE0F\u20E3 FY 2024-25\n4\uFE0F\u20E3 FY 2025-26\n\nReply with the number.\nType *#* to go back.',
  gst_type:
    'Please select document type:\n\n1\uFE0F\u20E3 GSTR-1\n2\uFE0F\u20E3 GSTR-3B\n\nReply with the number.\nType *#* to go back.',
  income_tax_year:
    'You selected: Income Tax Documents \u{1F4C4}\n\nPlease select Financial Year:\n\n1\uFE0F\u20E3 FY 2022-23\n2\uFE0F\u20E3 FY 2023-24\n3\uFE0F\u20E3 FY 2024-25\n\nReply with the number.\nType *#* to go back.',
  income_tax_type:
    'Please select document type:\n\n1\uFE0F\u20E3 ITR\n2\uFE0F\u20E3 Acknowledgement\n3\uFE0F\u20E3 Computation\n\nReply with the number.\nType *#* to go back.',
  no_documents:
    'No documents found for the selected option.\n\nPlease try another category or year.',
  invalid_input:
    'Invalid input \u2757\n\nPlease reply with a valid number from the options above.',
  restart: 'Returning to main menu...',
  back: 'Going back...',
  no_back: 'You are already at the main menu. Please select an option above.',
} as const

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
 * Process an incoming message and return the response + updated session.
 * User verification is handled by the caller — this function is only called for verified users.
 */
export async function processMessage(
  phone: string,
  text: string,
  session: BotSession | null
): Promise<FlowResult> {
  const input = text.toLowerCase().trim()

  // Ensure stepHistory exists for legacy sessions
  if (session && !session.stepHistory) {
    session = { ...session, stepHistory: [] }
  }

  // "hi" / "hello" → start fresh with category menu
  if (input === 'hi' || input === 'hello') {
    return {
      message: FLOW_MESSAGES.category_selection,
      session: createSession('category_selection'),
    }
  }

  // "0" → restart to category menu
  if (input === '0' && session) {
    return {
      message: FLOW_MESSAGES.restart + '\n\n' + FLOW_MESSAGES.category_selection,
      session: createSession('category_selection'),
    }
  }

  // "back" / "#" → go back to previous step
  if ((input === 'back' || input === '#') && session) {
    const result = goBack(session)
    if (!result) {
      return { message: FLOW_MESSAGES.no_back, session }
    }

    const backStep = result.step
    const backSession = result.session

    // Return the appropriate message for the step we're going back to
    const stepMessage = FLOW_MESSAGES[backStep as keyof typeof FLOW_MESSAGES]
    if (stepMessage) {
      return {
        message: FLOW_MESSAGES.back + '\n\n' + stepMessage,
        session: backSession,
      }
    }

    // If going back to a fetch step (like other_docs), go to category instead
    return {
      message: FLOW_MESSAGES.back + '\n\n' + FLOW_MESSAGES.category_selection,
      session: createSession('category_selection'),
    }
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
    return {
      message: FLOW_MESSAGES[selected.step as keyof typeof FLOW_MESSAGES],
      session: newSession,
    }
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
    return {
      message: FLOW_MESSAGES[yearEntry.nextStep as keyof typeof FLOW_MESSAGES],
      session: updatedSession,
    }
  }

  // Sub-category selection steps
  if (SUB_CATEGORY_MAP[step]) {
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
      return {
        message: FLOW_MESSAGES.no_documents,
        session: createSession('category_selection'),
      }
    }

    const lines = documents.map((doc, i) => `${i + 1}. ${doc.title}`)
    const message =
      'Here are your documents:\n\n' + lines.join('\n') + '\n\nReply with the number to download.\nType *#* to go back.'

    return {
      message,
      session: {
        ...session,
        currentStep: 'list_documents',
        documentList: documents,
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
