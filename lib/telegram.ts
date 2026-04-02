export async function sendTelegramOrderNotification(order: {
  order_number: string
  customer_name: string
  customer_phone: string
  shipping_address: string
  total_amount: number
  items: Array<{ title: string; price: number; condition?: string }>
}): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  const itemLines = order.items
    .map(i => `  - ${i.title}${i.condition ? ` (${i.condition})` : ''}: ${i.price.toLocaleString()} THB`)
    .join('\n')

  const message = [
    `New Order: ${order.order_number}`,
    ``,
    `Customer: ${order.customer_name}`,
    `Phone: ${order.customer_phone}`,
    `Address: ${order.shipping_address}`,
    ``,
    `Items:`,
    itemLines,
    ``,
    `Total: ${order.total_amount.toLocaleString()} THB`,
  ].join('\n')

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message }),
  })
}
