export const SUBSCRIPTION_PRICING = {
  thai: {
    monthly:  { price: 149,  currency: 'THB', months: 1  },
    '6months':{ price: 799,  currency: 'THB', months: 6  },
    yearly:   { price: 1490, currency: 'THB', months: 12 },
  },
  international: {
    monthly:  { price: 5,  currency: 'USD', months: 1  },
    '6months':{ price: 27, currency: 'USD', months: 6  },
    yearly:   { price: 49, currency: 'USD', months: 12 },
  },
}

export const SUBSCRIPTION_BENEFITS = {
  discount_percent: 5,
  minimum_order_thb: 1000,
  birthday_discount_percent: 10,
  lottery_threshold: 50,
}

export type Plan = 'monthly' | '6months' | 'yearly'
export type SubscriberType = 'thai' | 'international'

export function getPlanLabel(plan: Plan): string {
  return plan === 'monthly' ? 'Monthly' : plan === '6months' ? '6 Months' : '1 Year'
}

export function getPlanBadge(plan: Plan): string | null {
  if (plan === '6months') return 'Save 11%'
  if (plan === 'yearly') return 'Best Value'
  return null
}

export function calcExpiresAt(plan: Plan): Date {
  const d = new Date()
  const months = SUBSCRIPTION_PRICING.thai[plan].months
  d.setMonth(d.getMonth() + months)
  return d
}
