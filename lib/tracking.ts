export const COURIERS: Record<string, { name: string; nameTh: string; trackUrl: (n: string) => string }> = {
  'thailand-post': {
    name: 'Thailand Post',
    nameTh: 'ไปรษณีย์ไทย',
    trackUrl: (n: string) => `https://track.thailandpost.co.th/?trackNumber=${n}`,
  },
  kerry: {
    name: 'Kerry Express',
    nameTh: 'เคอรี่ เอ็กซ์เพรส',
    trackUrl: () => `https://th.kerryexpress.com/en/track/`,
  },
  flash: {
    name: 'Flash Express',
    nameTh: 'แฟลช เอ็กซ์เพรส',
    trackUrl: () => `https://flashexpress.com/fle/tracking`,
  },
  jt: {
    name: 'J&T Express',
    nameTh: 'เจแอนด์ที เอ็กซ์เพรส',
    trackUrl: () => `https://www.jtexpress.co.th/trajectoryQuery`,
  },
}

export function getCourierName(courierId: string, lang: 'en' | 'th'): string {
  const c = COURIERS[courierId]
  return c ? (lang === 'th' ? c.nameTh : c.name) : courierId
}
