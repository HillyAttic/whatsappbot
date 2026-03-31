const MAX_RETRIES = 3
const BASE_DELAY_MS = 500

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getWhatsAppConfig() {
  const whatsappToken = process.env.WHATSAPP_TOKEN
  const phoneNumberId = process.env.PHONE_NUMBER_ID

  if (!whatsappToken) {
    throw new Error('WHATSAPP_TOKEN environment variable is required')
  }
  if (!phoneNumberId) {
    throw new Error('PHONE_NUMBER_ID environment variable is required')
  }

  return {
    url: `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
    token: whatsappToken,
  }
}

async function sendWhatsAppRequest(payload: object): Promise<void> {
  const { url, token } = getWhatsAppConfig()
  const body = JSON.stringify(payload)

  let lastError: Error = new Error('Unknown error')

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1))
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body,
      })

      if (response.ok) return

      const errorBody = await response.text()
      console.error(`WhatsApp API error (attempt ${attempt + 1}):`, errorBody)

      // 4xx errors are not transient — don't retry
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`WhatsApp API returned status ${response.status}: ${errorBody}`)
      }

      lastError = new Error(`WhatsApp API returned status ${response.status}`)
    } catch (err) {
      if (err instanceof Error && /status 4\d\d/.test(err.message)) throw err
      lastError = err instanceof Error ? err : new Error(String(err))
    }
  }

  throw lastError
}

/**
 * Sends a text message via WhatsApp Cloud API.
 */
export async function sendMessage(to: string, text: string): Promise<void> {
  await sendWhatsAppRequest({
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text },
  })
}

/**
 * Sends a document (PDF, etc.) via WhatsApp Cloud API using a URL link.
 */
export async function sendDocument(
  to: string,
  documentUrl: string,
  filename: string,
  caption?: string
): Promise<void> {
  await sendWhatsAppRequest({
    messaging_product: 'whatsapp',
    to,
    type: 'document',
    document: {
      link: documentUrl,
      filename,
      ...(caption && { caption }),
    },
  })
}
