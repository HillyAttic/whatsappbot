import { Document, getFilteredDocuments, getCategories } from './document-service'
import { generateSignedUrl } from './storage-service'

export interface BotSession {
  currentStep: string
  stepHistory: string[]
  category?: string
  categoryId?: string
  fiscalYear?: string
  subCategory?: string
  documentList?: Document[]
  fullDocumentList?: Document[]
  selectedClientId?: string
  selectedClientName?: string
  availableClients?: Array<{ id: string; name: string }>
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
  client_selection:
    'Hello \u{1F44B}\n\nYour phone number is associated with multiple companies.\n\nPlease select which company\'s documents you want to access:',
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
// Interactive payload builders for each step (year/sub-cat are built dynamically)
// ---------------------------------------------------------------------------
const STEP_INTERACTIVE: Record<string, InteractivePayload> = {
  audit_year: {
    type: 'list',
    body: FLOW_MESSAGES.audit_year,
    buttonText: 'Select Year',
    sections: [],
  },
  financial_year: {
    type: 'list',
    body: FLOW_MESSAGES.financial_year,
    buttonText: 'Select Year',
    sections: [],
  },
  gst_year: {
    type: 'list',
    body: FLOW_MESSAGES.gst_year,
    buttonText: 'Select Year',
    sections: [],
  },
  gst_type: {
    type: 'list',
    body: FLOW_MESSAGES.gst_type,
    buttonText: 'Select Type',
    sections: [],
  },
  income_tax_year: {
    type: 'list',
    body: FLOW_MESSAGES.income_tax_year,
    buttonText: 'Select Year',
    sections: [],
  },
  income_tax_type: {
    type: 'list',
    body: FLOW_MESSAGES.income_tax_type,
    buttonText: 'Select Type',
    sections: [],
  },
}

/**
 * Build client selection menu for multiple clients
 */
function buildClientSelection(clients: Array<{ id: string; name: string }>): InteractivePayload {
  const rows = clients.map(client => ({
    id: client.id,
    title: truncate(client.name, 24),
  }))

  // Use buttons for 2-3 clients, list for 4+
  if (clients.length <= 3) {
    return {
      type: 'button',
      body: FLOW_MESSAGES.client_selection,
      buttons: rows.slice(0, 3).map(r => ({ id: r.id, title: r.title })),
    }
  }

  return {
    type: 'list',
    body: FLOW_MESSAGES.client_selection,
    buttonText: 'Select Client',
    sections: [
      {
        title: 'Clients',
        rows,
      },
    ],
  }
}

/**
 * Build dynamic category selection menu from Firestore categories
 */
async function buildCategorySelection(): Promise<InteractivePayload> {
  const categories = await getCategories()
  const rows = Object.keys(categories).map((name, index) => ({
    id: String(index + 1),
    title: truncate(name, 24),
  }))

  return {
    type: 'list',
    body: FLOW_MESSAGES.category_selection,
    buttonText: 'Select Category',
    sections: [
      {
        title: 'Categories',
        rows,
      },
    ],
  }
}

/**
 * Build dynamic year selection menu for a category
 */
async function buildYearSelection(
  step: string,
  category: string,
  fiscalYears: string[]
): Promise<InteractivePayload> {
  // WhatsApp allows max 10 rows total across all sections.
  // Reserve 2 rows for navigation (Back + Main Menu), so cap at 8 FY rows.
  const cappedYears = fiscalYears.slice(0, 8)
  const rows = cappedYears.map((year, index) => ({
    id: String(index + 1),
    title: year,
  }))

  return {
    type: 'list',
    body: FLOW_MESSAGES[step as keyof typeof FLOW_MESSAGES] || `You selected: ${category}\n\nPlease select Financial Year:`,
    buttonText: 'Select Year',
    sections: [
      {
        title: 'Financial Years',
        rows,
      },
      NAV_SECTION,
    ],
  }
}

/**
 * Build dynamic sub-category selection menu for a category
 */
async function buildSubCategorySelection(
  step: string,
  subCategories: string[]
): Promise<InteractivePayload> {
  const rows = subCategories.map((sub, index) => ({
    id: String(index + 1),
    title: sub,
  }))

  // Add Download All when there are multiple subcategories
  if (subCategories.length > 1) {
    rows.unshift({ id: 'download_all', title: 'Download All' })
  }

  return {
    type: 'list',
    body: FLOW_MESSAGES[step as keyof typeof FLOW_MESSAGES] || 'Please select document type:',
    buttonText: 'Select Type',
    sections: [
      {
        title: 'Document Types',
        rows,
      },
      NAV_SECTION,
    ],
  }
}

// Category mapping is now built dynamically from Firestore categories
// Format: { '1': { step, category, hasSubCategories } }

/**
 * Build category map from Firestore categories
 * Returns a mapping from numeric IDs to category configs
 */
async function buildCategoryMap(): Promise<
  Record<string, { step: string; category: string; hasFiscalYears: boolean; hasSubCategories: boolean }>
> {
  const categories = await getCategories()
  const categoryNames = Object.keys(categories)
  console.log('[buildCategoryMap] Categories from cache/DB:', categoryNames)

  const map: Record<string, { step: string; category: string; hasFiscalYears: boolean; hasSubCategories: boolean }> = {}

  categoryNames.forEach((name, index) => {
    const id = String(index + 1)
    const config = categories[name]
    const hasFiscalYears = config.fiscalYears.length > 0
    const hasSubCategories = config.subCategories.length > 0

    console.log(`[buildCategoryMap] Category ${id}: ${name} (FY: ${hasFiscalYears}, Sub: ${hasSubCategories})`)

    // Determine the next step based on configuration
    let step: string
    if (!hasFiscalYears && !hasSubCategories) {
      // No year or sub-category selection needed - fetch directly
      step = 'fetch_documents_direct'
    } else if (hasFiscalYears && !hasSubCategories) {
      // Has fiscal years but no sub-categories
      step = `${id}_year_selection` // Unique step per category
    } else if (hasFiscalYears && hasSubCategories) {
      // Has both fiscal years and sub-categories
      step = `${id}_year_selection`
    } else {
      // No fiscal years but has sub-categories (unlikely but handle it)
      step = `${id}_sub_selection`
    }

    map[id] = {
      step,
      category: name,
      hasFiscalYears,
      hasSubCategories,
    }
  })

  console.log('[buildCategoryMap] Built map:', Object.keys(map))
  return map
}

/**
 * Build year map for a specific category
 */
function buildYearMapForCategory(
  categoryId: string,
  fiscalYears: string[],
  hasSubCategories: boolean
): Record<string, { year: string; nextStep: string }> {
  const map: Record<string, { year: string; nextStep: string }> = {}

  fiscalYears.forEach((year, index) => {
    const id = String(index + 1)
    map[id] = {
      year,
      nextStep: hasSubCategories ? `${categoryId}_sub_selection` : 'fetch_documents',
    }
  })

  return map
}

/**
 * Build sub-category map for a specific category
 */
function buildSubCategoryMapForCategory(subCategories: string[]): Record<string, string> {
  const map: Record<string, string> = {}

  subCategories.forEach((sub, index) => {
    const id = String(index + 1)
    map[id] = sub
  })

  return map
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
 * @param phone - The user's phone number
 * @param text - The message text
 * @param session - The current bot session
 * @param interactiveReplyId - The button/list reply ID from an interactive message tap
 * @param availableClients - Array of clients associated with this phone number
 */
export async function processMessage(
  phone: string,
  text: string,
  session: BotSession | null,
  interactiveReplyId?: string,
  availableClients?: Array<{ id: string; name: string }>
): Promise<FlowResult> {
  // If an interactive reply ID is present, use it as the effective input.
  // "back" maps to "#" so the existing back-handling logic works.
  let input: string
  if (interactiveReplyId) {
    input = interactiveReplyId === 'back' ? '#' : interactiveReplyId.trim()
  } else {
    input = text.toLowerCase().trim()
  }

  // Ensure stepHistory exists for legacy sessions
  if (session && !session.stepHistory) {
    session = { ...session, stepHistory: [] }
  }

  // "hi" / "hello" → check if client selection is needed
  if (input === 'hi' || input === 'hello') {
    // If multiple clients available, show client selection
    if (availableClients && availableClients.length > 1) {
      const clientSelection = buildClientSelection(availableClients)
      const newSession = createSession('client_selection')
      newSession.availableClients = availableClients
      return {
        message: clientSelection.body,
        interactive: clientSelection,
        session: newSession,
      }
    }

    // Single client or no availableClients passed - proceed to category selection
    const categorySelection = await buildCategorySelection()
    const newSession = createSession('category_selection')

    // If single client, auto-select it
    if (availableClients && availableClients.length === 1) {
      newSession.selectedClientId = availableClients[0].id
      newSession.selectedClientName = availableClients[0].name
    }

    return {
      message: categorySelection.body,
      interactive: categorySelection,
      session: newSession,
    }
  }

  // Handle client selection response
  if (session?.currentStep === 'client_selection' && session.availableClients) {
    const selectedClient = session.availableClients.find(c => c.id === input)

    if (selectedClient) {
      const categorySelection = await buildCategorySelection()
      const newSession = createSession('category_selection')
      newSession.selectedClientId = selectedClient.id
      newSession.selectedClientName = selectedClient.name

      return {
        message: `Selected: ${selectedClient.name}\n\n${categorySelection.body}`,
        interactive: categorySelection,
        session: newSession,
      }
    }

    // Invalid client selection
    const clientSelection = buildClientSelection(session.availableClients)
    return {
      message: FLOW_MESSAGES.invalid_input,
      interactive: clientSelection,
      session,
    }
  }

  // "0" / "main_menu" / "select_category" → restart to category menu (NOT client selection)
  if ((input === '0' || input === 'main_menu' || input === 'select_category') && session) {
    const categorySelection = await buildCategorySelection()
    const newSession = createSession('category_selection')
    // Preserve selected client
    newSession.selectedClientId = session.selectedClientId
    newSession.selectedClientName = session.selectedClientName
    return {
      message: FLOW_MESSAGES.restart,
      interactive: categorySelection,
      session: newSession,
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

    // If going back to a dynamic step, rebuild the interactive payload
    if (backStep === 'category_selection') {
      const categorySelection = await buildCategorySelection()
      return {
        message: FLOW_MESSAGES.back,
        interactive: categorySelection,
        session: backSession,
      }
    }

    // Handle dynamic year selection steps
    if (backStep.endsWith('_year_selection')) {
      const categoryId = backStep.replace('_year_selection', '')
      const categories = await getCategories()
      const categoryName = Object.keys(categories)[parseInt(categoryId) - 1]
      const config = categories[categoryName]
      const yearSelection = await buildYearSelection('category_year', categoryName, config.fiscalYears)
      return {
        message: yearSelection.body,
        interactive: yearSelection,
        session: backSession,
      }
    }

    // Handle dynamic sub-category selection steps
    if (backStep.endsWith('_sub_selection')) {
      const categoryId = backStep.replace('_sub_selection', '')
      const categories = await getCategories()
      const categoryName = Object.keys(categories)[parseInt(categoryId) - 1]
      const config = categories[categoryName]
      const subSelection = await buildSubCategorySelection('category_sub', config.subCategories)
      return {
        message: subSelection.body,
        interactive: subSelection,
        session: backSession,
      }
    }

    // For other known steps, use STEP_INTERACTIVE
    if (STEP_INTERACTIVE[backStep]) {
      return buildStepResult(backStep, backSession, FLOW_MESSAGES.back)
    }

    // Fallback: go to category selection
    const categorySelection = await buildCategorySelection()
    return {
      message: FLOW_MESSAGES.back,
      interactive: categorySelection,
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

  // Category selection - dynamic
  if (step === 'category_selection') {
    const categoryMap = await buildCategoryMap()
    const selected = categoryMap[input]

    if (!selected) {
      return { message: FLOW_MESSAGES.invalid_input, session }
    }

    const categories = await getCategories()
    const config = categories[selected.category]

    // If no fiscal years and no sub-categories, fetch documents directly
    if (!config.fiscalYears.length && !config.subCategories.length) {
      return fetchAndListDocuments(phone, {
        ...pushStep(session, 'category_direct'),
        category: selected.category,
      })
    }

    // If has fiscal years, show year selection
    if (config.fiscalYears.length > 0) {
      const newSession = pushStep(session, selected.step)
      newSession.category = selected.category
      newSession.categoryId = input // Store the category ID for later lookup
      const yearSelection = await buildYearSelection('category_year', selected.category, config.fiscalYears)
      return {
        message: yearSelection.body,
        interactive: yearSelection,
        session: newSession,
      }
    }

    // If no fiscal years but has sub-categories, show sub-category selection
    if (config.subCategories.length > 0) {
      const newSession = pushStep(session, selected.step.replace('_year_selection', '_sub_selection'))
      newSession.category = selected.category
      newSession.categoryId = input
      const subSelection = await buildSubCategorySelection('category_sub', config.subCategories)
      return {
        message: subSelection.body,
        interactive: subSelection,
        session: newSession,
      }
    }

    // Fallback
    return { message: FLOW_MESSAGES.invalid_input, session }
  }

  // Dynamic year selection steps
  if (step.endsWith('_year_selection')) {
    const categoryId = step.replace('_year_selection', '')
    const categories = await getCategories()
    const categoryName = Object.keys(categories)[parseInt(categoryId) - 1]
    const config = categories[categoryName]

    const yearMap = buildYearMapForCategory(categoryId, config.fiscalYears, config.subCategories.length > 0)
    const yearEntry = yearMap[input]

    if (!yearEntry) {
      return { message: FLOW_MESSAGES.invalid_input, session }
    }

    const updatedSession = pushStep(session, yearEntry.nextStep)
    updatedSession.fiscalYear = yearEntry.year
    updatedSession.categoryId = categoryId

    // If next step is fetch_documents, query and list
    if (yearEntry.nextStep === 'fetch_documents') {
      return fetchAndListDocuments(phone, updatedSession)
    }

    // Otherwise show sub-category menu
    const subSelection = await buildSubCategorySelection('category_sub', config.subCategories)
    return {
      message: subSelection.body,
      interactive: subSelection,
      session: updatedSession,
    }
  }

  // Dynamic sub-category selection steps
  if (step.endsWith('_sub_selection')) {
    const categoryId = session.categoryId || step.replace('_sub_selection', '')
    const categories = await getCategories()
    const categoryName = Object.keys(categories)[parseInt(categoryId) - 1]
    const config = categories[categoryName]

    // Download All for sub-category steps with download_all option
    if (input === 'download_all') {
      try {
        const documents = await getFilteredDocuments(phone, categoryName, session.fiscalYear)

        if (documents.length === 0) {
          const categorySelection = await buildCategorySelection()
          return {
            message: FLOW_MESSAGES.no_documents,
            interactive: categorySelection,
            session: createSession('category_selection'),
          }
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
        console.error('Error fetching all documents:', error)
        return {
          message: 'Something went wrong while fetching your documents. Please try again later.',
          session: createSession('category_selection'),
        }
      }
    }

    const subMap = buildSubCategoryMapForCategory(config.subCategories)
    const subCat = subMap[input]

    if (!subCat) {
      return { message: FLOW_MESSAGES.invalid_input, session }
    }

    const updatedSession = pushStep(session, 'fetch_documents')
    updatedSession.subCategory = subCat

    return fetchAndListDocuments(phone, updatedSession)
  }

  // Handle legacy static steps (for backward compatibility with existing sessions)
  if (STEP_INTERACTIVE[step]) {
    // Legacy handling - would need migration but keeping for backward compat
    // This handles old sessions that might still be using the old step names
  }

  // Document list — user picks a number to download
  if (step === 'list_documents' && session.documentList) {
    // Download All documents in the current list
    if (input === 'download_all_docs') {
      try {
        const docs = session.fullDocumentList || session.documentList
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
      session.subCategory,
      session.selectedClientId
    )

    if (documents.length === 0) {
      const categorySelection = await buildCategorySelection()
      const newSession = createSession('category_selection')
      // Preserve selected client
      newSession.selectedClientId = session.selectedClientId
      newSession.selectedClientName = session.selectedClientName
      return {
        message: FLOW_MESSAGES.no_documents,
        interactive: categorySelection,
        session: newSession,
      }
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
        fullDocumentList: documents,
      },
    }
  } catch (error) {
    console.error('Error fetching documents:', error)
    const categorySelection = await buildCategorySelection()
    return {
      message: 'Something went wrong while fetching your documents. Please try again later.',
      interactive: categorySelection,
      session: createSession('category_selection'),
    }
  }
}
