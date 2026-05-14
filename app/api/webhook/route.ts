import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { validateSignature } from '@/lib/validate-signature'

export const dynamic = 'force-dynamic'
import {
  parseWebhookPayload,
  sanitizeMessageBody,
  findAllUsersByPhone,
  getBotSession,
  saveBotSession,
} from '@/lib/document-service'
import { normalizePhone } from '@/lib/phone'
import { sendMessage, sendDocument, sendInteractiveButtons, sendInteractiveList, sleep } from '@/lib/message-sender'
import { processMessage } from '@/lib/bot-flow'

// In-memory deduplication cache to prevent processing the same message twice
// (WhatsApp retries webhooks if 200 isn't received fast enough)
const processedMessages = new Map<string, number>()
const DEDUP_TTL_MS = 5 * 60 * 1000 // 5 minutes

function isDuplicate(messageId: string): boolean {
  // Clean up old entries
  const now = Date.now()
  for (const [id, timestamp] of processedMessages) {
    if (now - timestamp > DEDUP_TTL_MS) {
      processedMessages.delete(id)
    }
  }

  if (processedMessages.has(messageId)) {
    return true
  }

  processedMessages.set(messageId, now)
  return false
}

/**
 * GET handler for WhatsApp webhook verification challenge.
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN

  if (!verifyToken) {
    console.error('WEBHOOK_VERIFY_TOKEN environment variable is missing')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  if (mode === 'subscribe' && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

/**
 * POST handler for incoming WhatsApp messages.
 * Returns 200 immediately and processes the message in the background.
 */
export async function POST(req: NextRequest) {
  try {
    // Read raw body for signature validation
    const rawBody = await req.text()
    const signature = req.headers.get('x-hub-signature-256')
    const appSecret = process.env.APP_SECRET

    if (!appSecret) {
      console.error('APP_SECRET environment variable is missing')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    if (!signature) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate signature
    if (!validateSignature(rawBody, signature, appSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse payload
    const body = JSON.parse(rawBody)
    const parsed = parseWebhookPayload(body)

    // If no messages, return 200 without processing
    if (!parsed) {
      return NextResponse.json({ status: 'ok' }, { status: 200 })
    }

    // Deduplicate — skip if we've already seen this message
    if (isDuplicate(parsed.messageId)) {
      console.log(`Skipping duplicate message: ${parsed.messageId}`)
      return NextResponse.json({ status: 'ok' }, { status: 200 })
    }

    // Return 200 IMMEDIATELY — process the message in the background
    // This is critical: WhatsApp expects a fast 200 or it stops sending messages
    waitUntil(handleMessage(parsed))

    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  }
}

/**
 * Process the incoming message in the background (after 200 is returned).
 */
async function handleMessage(parsed: {
  from: string
  text: string
  messageId: string
  interactiveReplyId?: string
}) {
  try {
    const { from, text, interactiveReplyId } = parsed
    const normalizedPhone = normalizePhone(from)
    const sanitizedText = sanitizeMessageBody(text)

    // Look up all users associated with this phone number
    const users = await findAllUsersByPhone(normalizedPhone)

    if (users.length === 0) {
      await sendMessage(
        from,
        'Hello \u{1F44B}\n\nWe could not find your account in our system.\n\nPlease contact support or register to access your documents.'
      )
      return
    }

    // Get existing session
    const session = await getBotSession(normalizedPhone)

    // Prepare available clients for bot flow
    const availableClients = users.map(u => ({ id: u.id, name: u.name }))

    // Process message through bot flow engine
    const result = await processMessage(normalizedPhone, sanitizedText, session, interactiveReplyId, availableClients)

    // Save updated session
    if (result.session) {
      await saveBotSession(normalizedPhone, result.session)
    }

    // Send response — prioritise interactive, then documents, then document, then plain text
    if (result.interactive) {
      if (result.interactive.type === 'button') {
        await sendInteractiveButtons(from, result.interactive.body, result.interactive.buttons)
      } else if (result.interactive.type === 'list') {
        await sendInteractiveList(from, result.interactive.body, result.interactive.buttonText, result.interactive.sections)
      }
    } else if (result.documents && result.documents.length > 0) {
      for (let i = 0; i < result.documents.length; i++) {
        if (i > 0) await sleep(1000)
        const doc = result.documents[i]
        await sendDocument(from, doc.url, doc.filename, doc.caption)
      }
    } else if (result.document) {
      await sendDocument(from, result.document.url, result.document.filename, result.document.caption)
    } else if (result.message) {
      await sendMessage(from, result.message)
    }

    // Send follow-up interactive message after document(s) if present
    if (result.followUp) {
      await sleep(1500)
      if (result.followUp.type === 'button') {
        await sendInteractiveButtons(from, result.followUp.body, result.followUp.buttons)
      } else if (result.followUp.type === 'list') {
        await sendInteractiveList(from, result.followUp.body, result.followUp.buttonText, result.followUp.sections)
      }
    }
  } catch (error) {
    console.error('Error processing message:', error)
    // Send a fallback message so the user isn't left without a response
    try {
      await sendMessage(
        parsed.from,
        'Something went wrong. Please try again by sending "Hi".'
      )
    } catch (sendError) {
      console.error('Failed to send error fallback message:', sendError)
    }
  }
}
