/**
 * Normalizes a phone number by stripping all non-numeric characters.
 * @param raw - The raw phone number string
 * @returns A string containing only digits
 */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '')
}
