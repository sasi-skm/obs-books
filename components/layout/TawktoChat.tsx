'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// To activate live chat:
// 1. Sign up free at https://www.tawk.to
// 2. Create a property for your website
// 3. Replace 69cccad97a1fd31c39851dcb below with the ID from your Tawk.to dashboard
//    (it looks like: 64abc123def456...)

const TAWKTO_PROPERTY_ID = '69cccad97a1fd31c39851dcb'

export default function TawktoChat() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/checkout' || pathname.startsWith('/checkout/')) return
    // Delay chat widget load so it doesn't compete with page resources
    const timer = setTimeout(() => {
      const script = document.createElement('script')
      script.async = true
      script.src = `https://embed.tawk.to/${TAWKTO_PROPERTY_ID}/default`
      script.charset = 'UTF-8'
      script.setAttribute('crossorigin', '*')
      document.head.appendChild(script)
    }, 4000)

    return () => clearTimeout(timer)
  }, [pathname])

  return null
}
