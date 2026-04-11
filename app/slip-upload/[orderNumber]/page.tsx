import { Metadata } from 'next'
import SlipUploadClient from './SlipUploadClient'

export const metadata: Metadata = {
  title: 'Upload Payment Slip | OBS Books',
  description: 'Upload your payment slip to complete your OBS Books order.',
  robots: { index: false, follow: false },
}

export default function SlipUploadPage({ params }: { params: { orderNumber: string } }) {
  return <SlipUploadClient orderNumber={params.orderNumber} />
}
