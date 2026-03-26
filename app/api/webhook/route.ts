import { NextRequest, NextResponse } from 'next/server'
import { validateSignature } from '@/lib/validate-signature'
import {
  parseWebhookPayload,
  sanitizeMessageBody,
  findUser,
  getDocuments,
  storeSession,
  getSession,
  generateSignedUrl,
} from '@/lib/simple-storage'
import { normalizePhone } from '@/lib/phone'
import { sendMessage } from '@/lib/message-sender'

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

    const { from, text } = parsed
    const normalizedPhone = normalizePhone(from)
    const sanitizedText = sanitizeMessageBody(text).toLowerCase().trim()

    // Look up user
    const user = await findUser(normalizedPhone)

    if (!user) {
      await sendMessage(from, 'You are not registered')
      return NextResponse.json({ status: 'ok' }, { status: 200 })
    }

    // Handle "hi" greeting
    if (sanitizedText === 'hi') {
      const documents = await getDocuments(normalizedPhone)

      if (documents.length === 0) {
        await sendMessage(from, 'You have no documents available.')
        return NextResponse.json({ status: 'ok' }, { status: 200 })
      }

      // Store session
      storeSession(normalizedPhone, documents)

      // Build numbered list
      const lines = documents.map((doc, index) => `${index + 1}. ${doc.title}`)
      lines.push('Reply with a number to get the document link.')
      const message = lines.join('\n')

      await sendMessage(from, message)
      return NextResponse.json({ status: 'ok' }, { status: 200 })
    }

    // Handle number selection
    const numberMatch = sanitizedText.match(/^(\d+)$/)
    if (numberMatch) {
      const selectedNumber = parseInt(numberMatch[1], 10)
      const session = getSession(normalizedPhone)

      if (!session) {
        await sendMessage(from, "Please send 'Hi' to start.")
        return NextResponse.json({ status: 'ok' }, { status: 200 })
      }

      if (selectedNumber < 1 || selectedNumber > session.length) {
        await sendMessage(from, 'Invalid selection. Please reply with a number from the list.')
        return NextResponse.json({ status: 'ok' }, { status: 200 })
      }

      const document = session[selectedNumber - 1]

      try {
        const signedUrl = await generateSignedUrl(document.filePath)
        await sendMessage(from, signedUrl)
      } catch (error) {
        console.error('Error generating signed URL:', error)
        await sendMessage(from, 'Unable to retrieve document. Please try again later.')
      }

      return NextResponse.json({ status: 'ok' }, { status: 200 })
    }

    // Unknown message - no response
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  }
}
