/**
 * Shipping + contact memory for the checkout flow.
 *
 * We use ONE shape for both logged-in customers and guests so the checkout
 * prefill logic stays simple:
 *
 *   { firstName, lastName, phone, email,
 *     addressLine1, addressLine2, city, province, postalCode, country }
 *
 * Logged-in customers have their name/phone/email on the profiles row, and
 * the richer address fields in `profiles.shipping_address` (a JSONB column).
 * We extended the JSON shape to carry addressLine2, city, province, postalCode.
 * Existing profiles with the old `{address, country}` shape still work — the
 * reader falls back gracefully.
 *
 * Guests get the same shape stashed in localStorage under 'obs-saved-address'.
 * This is per-device, which is fine: 95% of repeat purchases happen on the
 * same browser a customer used last time.
 *
 * Nothing sensitive goes into localStorage beyond what the customer just
 * typed into a form they submitted. No card numbers, no passwords, no auth
 * tokens. Still worth a 180-day expiry so stale data rotates out.
 */

export interface SavedAddress {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  province?: string
  postalCode?: string
  country?: string
}

interface StoredAddress extends SavedAddress {
  savedAt: number
}

const STORAGE_KEY = 'obs-saved-address'
const TTL_MS = 180 * 24 * 60 * 60 * 1000 // 180 days

/**
 * Read the guest's last-used checkout details from localStorage.
 * Returns null if nothing is stored, the data is expired, or we're SSR.
 */
export function getSavedAddress(): SavedAddress | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredAddress
    if (!parsed || typeof parsed !== 'object') return null
    if (typeof parsed.savedAt === 'number' && Date.now() - parsed.savedAt > TTL_MS) {
      // Expired — clear it
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }
    // Strip the savedAt stamp on return
    const { savedAt: _unused, ...address } = parsed
    void _unused
    return address
  } catch {
    return null
  }
}

/**
 * Merge the newly-entered fields into whatever's currently stored and
 * write it back. Called after a successful checkout so the next visit
 * pre-fills. Only persists non-empty fields (we don't want to wipe a
 * real address with blanks if the next form only touched some fields).
 */
export function saveAddress(next: SavedAddress): void {
  if (typeof window === 'undefined') return
  try {
    const existing = getSavedAddress() || {}
    const merged: StoredAddress = {
      ...existing,
      ...pickNonEmpty(next),
      savedAt: Date.now(),
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  } catch {
    // localStorage full or disabled — nothing to do
  }
}

export function clearSavedAddress(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

/**
 * Convert the rich shipping_address JSON stored on profiles into our
 * canonical SavedAddress shape. Supports both the new {addressLine1,
 * addressLine2, city, province, postalCode, country} shape and the old
 * {address, country} shape — old rows keep working.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function shippingJsonToSaved(json: any): SavedAddress {
  if (!json || typeof json !== 'object') return {}
  return {
    addressLine1: json.addressLine1 || json.address || '',
    addressLine2: json.addressLine2 || '',
    city: json.city || '',
    province: json.province || '',
    postalCode: json.postalCode || '',
    country: json.country || 'TH',
  }
}

/**
 * Produce the JSON shape we want to store in profiles.shipping_address.
 * Keeps the legacy 'address' key populated for any code that still reads
 * the old shape.
 */
export function savedToShippingJson(addr: SavedAddress): Record<string, string> {
  return {
    address: addr.addressLine1 || '',
    addressLine1: addr.addressLine1 || '',
    addressLine2: addr.addressLine2 || '',
    city: addr.city || '',
    province: addr.province || '',
    postalCode: addr.postalCode || '',
    country: addr.country || 'TH',
  }
}

function pickNonEmpty(obj: SavedAddress): SavedAddress {
  const out: SavedAddress = {}
  const keys: (keyof SavedAddress)[] = [
    'firstName', 'lastName', 'phone', 'email',
    'addressLine1', 'addressLine2', 'city', 'province', 'postalCode', 'country',
  ]
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'string' && v.trim()) {
      out[k] = v.trim()
    }
  }
  return out
}
