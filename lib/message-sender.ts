/**
 * Sends a WhatsApp message using the WhatsApp Cloud API.
 * @param to - The recipient's phone number
 * @param text - The message text to send
 */
export async function sendMessage(to: string, text: string): Promise<void> {
  const whatsappToken = process.env.WHATSAPP_TOKEN
  const phoneNumberId = process.env.PHONE_NUMBER_ID

  if (!whatsappToken) {
    throw new Error('WHATSAPP_TOKEN environment variable is required')
  }
  if (!phoneNumberId) {
    throw new Error('PHONE_NUMBER_ID environment variable is required')
  }

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${whatsappToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        body: text,
      },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('WhatsApp API error:', errorBody)
    throw new Error(`WhatsApp API returned status ${response.status}`)
  }
}
