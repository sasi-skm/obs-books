import { describe, it, expect } from 'vitest'
import { getShippingRate, thbToUsd, DEFAULT_BOOK_WEIGHT } from '@/lib/shipping'

// The DHL bracket lookup prices real international orders; a wrong
// bracket silently over- or under-charges shipping.

describe('getShippingRate', () => {
  it('is null for domestic Thailand (free shipping)', () => {
    expect(getShippingRate('TH', 1000)).toBeNull()
  })

  it('is null for unknown countries', () => {
    expect(getShippingRate('ZZ', 1000)).toBeNull()
  })

  it('is case-insensitive on the country code', () => {
    expect(getShippingRate('sg', 400)).toBe(getShippingRate('SG', 400))
  })

  it('picks the first bracket the weight fits in', () => {
    expect(getShippingRate('SG', 500)).toBe(18) // exactly on the boundary
    expect(getShippingRate('SG', 501)).toBe(22) // just over it
  })

  it('falls back to the heaviest bracket for oversize parcels', () => {
    const heaviest = getShippingRate('SG', 5000)
    expect(getShippingRate('SG', 99999)).toBe(heaviest)
  })

  it('has a sane default book weight', () => {
    expect(DEFAULT_BOOK_WEIGHT).toBeGreaterThan(0)
  })
})

describe('thbToUsd', () => {
  it('rounds to cents', () => {
    expect(thbToUsd(1000)).toBe(28)
    expect(thbToUsd(333)).toBe(9.32) // 9.324 -> 9.32
  })
})
