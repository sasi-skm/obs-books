import generatePayload from 'promptpay-qr'
import QRCode from 'qrcode'

export async function generatePromptPayQR(amount: number): Promise<string> {
  const promptPayId = process.env.NEXT_PUBLIC_PROMPTPAY_ID || '0000000000'
  const payload = generatePayload(promptPayId, { amount })
  const qrDataUrl = await QRCode.toDataURL(payload, {
    width: 280,
    margin: 2,
    color: {
      dark: '#2C2418',
      light: '#FFFCF7',
    },
  })
  return qrDataUrl
}
