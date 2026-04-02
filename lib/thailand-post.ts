export interface TrackingEvent {
  datetime: string
  location: string
  status: string
  description: string
}

export async function getThailandPostTracking(trackingNumber: string): Promise<TrackingEvent[] | null> {
  const token = process.env.THAILAND_POST_TOKEN
  if (!token) return null

  try {
    // Step 1: Get access token
    const authRes = await fetch('https://trackapi.thailandpost.co.th/post/security/getToken?token=' + token + '&grant_type=client_credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
    })
    if (!authRes.ok) return null
    const authData = await authRes.json()
    const accessToken = authData?.expire?.token

    if (!accessToken) return null

    // Step 2: Get tracking events
    const trackRes = await fetch('https://trackapi.thailandpost.co.th/post/api/v1/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${accessToken}`,
      },
      body: JSON.stringify({
        status: 'all',
        language: 'EN',
        barcode: [trackingNumber],
      }),
    })
    if (!trackRes.ok) return null
    const data = await trackRes.json()

    // Parse response
    const items = data?.response?.items?.[trackingNumber] || []
    if (!Array.isArray(items) || items.length === 0) return null

    return items.map((e: Record<string, string>) => ({
      datetime: e.status_date || e.event_datetime || '',
      location: e.location || e.office_name || '',
      status: e.status || e.delivery_status || '',
      description: e.status_description || e.description || e.status || '',
    }))
  } catch {
    return null
  }
}
