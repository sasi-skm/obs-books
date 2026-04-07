import { resend, FROM_EMAIL } from './resend'

// ── Base HTML template ────────────────────────────────────────────────────────
function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>OBS Books</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e6;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e6;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#faf7f2;border:1px solid #d6cdb8;">
        <!-- Header -->
        <tr>
          <td style="background:#2c2416;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-family:'Georgia',serif;font-size:13px;letter-spacing:4px;color:#eee8d8;text-transform:uppercase;">OBS Books</p>
            <p style="margin:4px 0 0;font-family:'Georgia',serif;font-size:10px;letter-spacing:2px;color:#8a7d65;text-transform:uppercase;">The Book Itself Is a Treasure</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 36px 28px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 36px 32px;border-top:1px solid #d6cdb8;text-align:center;">
            <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#8a7d65;">
              OBS Books — Bangkok, Thailand<br/>
              <a href="https://www.obsbooks.com" style="color:#4a6741;text-decoration:none;">www.obsbooks.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 8px;font-family:'Georgia',serif;font-size:26px;font-weight:400;color:#2c2416;">${text}</h1>`
}
function divider(): string {
  return `<p style="margin:8px 0 20px;font-family:'Georgia',serif;font-size:13px;color:#8a7d65;text-align:center;">— ✦ —</p>`
}
function p(text: string): string {
  return `<p style="margin:0 0 14px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.7;color:#4a3f32;">${text}</p>`
}
function benefitRow(icon: string, text: string): string {
  return `<tr><td style="padding:6px 0;"><span style="color:#4a6741;">${icon}</span> <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4a3f32;">${text}</span></td></tr>`
}
function ctaButton(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#4a6741;color:#f5f0e6;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;letter-spacing:1px;text-decoration:none;text-transform:uppercase;">${text}</a>`
}

// ── Welcome email ─────────────────────────────────────────────────────────────
export async function sendWelcomeEmail({
  to, name, plan, expiresAt, subscriberType,
}: {
  to: string
  name: string
  plan: string
  expiresAt: Date
  subscriberType: 'thai' | 'international'
}) {
  const planLabel = plan === 'monthly' ? 'Monthly' : plan === '6months' ? '6-Month' : 'Annual'
  const expiry = expiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const letterNote = subscriberType === 'thai'
    ? 'Your first botanical letter will arrive by post within the month.'
    : 'Your first PDF flower letter will arrive by email within the month.'

  const content = `
    ${h1(`Welcome to The Flower Letter, ${name} 🌸`)}
    ${divider()}
    ${p(`Thank you so much for subscribing. You are now part of a small, thoughtful community of book lovers who receive a monthly botanical letter — curated with care, sent with love.`)}
    ${p(`<strong>Your plan:</strong> ${planLabel} — active until ${expiry}`)}
    <table cellpadding="0" cellspacing="0" style="margin:20px 0;padding:20px;background:#eef3ec;border-left:3px solid #4a6741;width:100%;">
      <tr><td><p style="margin:0 0 10px;font-family:'Georgia',serif;font-size:13px;color:#4a6741;letter-spacing:2px;text-transform:uppercase;">Your Member Benefits</p></td></tr>
      ${benefitRow('🌸', `${letterNote}`)}
      ${benefitRow('✦', `5% discount on all orders over ฿1,000 — applied automatically when you are logged in`)}
      ${benefitRow('🎂', `A 10% birthday discount sent to you at the start of your birthday month`)}
      ${benefitRow('🎁', `Monthly lottery entry — once we reach 50 subscribers, one lucky member wins a curated gift`)}
    </table>
    ${p(`Your member discount is applied automatically at checkout — no code needed. Just make sure you are logged in.`)}
    ${ctaButton('Browse the Collection', 'https://www.obsbooks.com/shop')}
    <p style="margin:24px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#8a7d65;font-style:italic;">With love from Bangkok — Sasi at OBS Books 🌿</p>
  `
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to The Flower Letter 🌸',
    html: baseTemplate(content),
  })
}

// ── Birthday discount email ───────────────────────────────────────────────────
export async function sendBirthdayEmail({
  to, name, code, expiresEnd,
}: {
  to: string
  name: string
  code: string
  expiresEnd: string
}) {
  const content = `
    ${h1(`Happy Birthday, ${name}! 🌸`)}
    ${divider()}
    ${p(`From all of us at OBS Books — wishing you a wonderful birthday filled with beautiful books and botanical discoveries.`)}
    ${p(`As a subscriber, you have a special birthday gift waiting:`)}
    <table cellpadding="0" cellspacing="0" style="margin:20px 0;width:100%;text-align:center;">
      <tr><td style="padding:24px;background:#fdf8f0;border:1px dashed #d6cdb8;">
        <p style="margin:0 0 6px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;letter-spacing:2px;color:#8a7d65;text-transform:uppercase;">Your Birthday Code</p>
        <p style="margin:0;font-family:'Georgia',serif;font-size:28px;letter-spacing:4px;color:#4a6741;font-weight:400;">${code}</p>
        <p style="margin:8px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#8a7d65;">10% off — valid until ${expiresEnd}</p>
      </td></tr>
    </table>
    ${p(`Use this code at checkout for <strong>10% off any order</strong> — valid for the whole of your birthday month. Treat yourself to something beautiful.`)}
    ${ctaButton('Shop Now', 'https://www.obsbooks.com/shop')}
    <p style="margin:24px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#8a7d65;font-style:italic;">With love from Bangkok — Sasi 🌿</p>
  `
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Happy Birthday from OBS Books 🌸 Your gift is inside',
    html: baseTemplate(content),
  })
}

// ── Renewal reminder email ────────────────────────────────────────────────────
export async function sendRenewalReminderEmail({
  to, name, expiresAt, daysLeft,
}: {
  to: string
  name: string
  expiresAt: string
  daysLeft: number
}) {
  const urgent = daysLeft === 1
  const subject = urgent
    ? 'Last day — your Flower Letter subscription expires tomorrow'
    : 'Your Flower Letter subscription expires soon 🌿'

  const content = `
    ${h1(urgent ? `${name}, your subscription expires tomorrow` : `Your subscription is ending soon, ${name}`)}
    ${divider()}
    ${urgent
      ? p(`This is a friendly reminder that your Flower Letter subscription expires <strong>tomorrow, ${expiresAt}</strong>.`)
      : p(`Your Flower Letter subscription expires on <strong>${expiresAt}</strong> — that is just ${daysLeft} days away.`)}
    ${p(`Renew now to keep receiving your monthly botanical letter and all your member benefits: 5% shop discount, birthday gift, and monthly lottery entries.`)}
    ${ctaButton('Renew My Subscription', 'https://www.obsbooks.com/subscribe')}
    <p style="margin:24px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#8a7d65;font-style:italic;">Thank you for being part of our little botanical world — Sasi 🌿</p>
  `
  await resend.emails.send({ from: FROM_EMAIL, to, subject, html: baseTemplate(content) })
}

// ── Expiry email ──────────────────────────────────────────────────────────────
export async function sendExpiryEmail({ to, name }: { to: string; name: string }) {
  const content = `
    ${h1(`Your subscription has ended, ${name}`)}
    ${divider()}
    ${p(`Your Flower Letter subscription has come to an end. Thank you so much for being part of our little botanical community — it has meant the world to us.`)}
    ${p(`We hope the letters and member benefits brought some joy. Whenever you are ready, you are always welcome to come back.`)}
    ${ctaButton('Resubscribe', 'https://www.obsbooks.com/subscribe')}
    <p style="margin:24px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#8a7d65;font-style:italic;">With warmth from Bangkok — Sasi at OBS Books 🌿</p>
  `
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Your Flower Letter subscription has ended',
    html: baseTemplate(content),
  })
}

// ── Order confirmation email (to customer) ───────────────────────────────────
export async function sendOrderConfirmationEmail({
  to, customerName, orderNumber, items, totalAmount, paymentMethod, shippingAddress,
}: {
  to: string
  customerName: string
  orderNumber: string
  items: { title: string; price: number; quantity: number; condition?: string }[]
  totalAmount: number
  paymentMethod: 'promptpay' | 'transfer'
  shippingAddress: string
}) {
  const itemRows = items.map(item =>
    `<tr>
      <td style="padding:6px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4a3f32;">${item.title}${item.condition ? ` <span style="color:#4a6741;font-size:11px;">(${item.condition})</span>` : ''}${item.quantity > 1 ? ` ×${item.quantity}` : ''}</td>
      <td style="padding:6px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4a3f32;text-align:right;">฿${(item.price * item.quantity).toLocaleString()}</td>
    </tr>`
  ).join('')

  const paymentInstructions = paymentMethod === 'promptpay'
    ? `<div style="margin:20px 0;padding:16px;background:#eef3ec;border-left:3px solid #4a6741;">
        <p style="margin:0 0 6px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;letter-spacing:2px;color:#4a6741;text-transform:uppercase;">Pay via PromptPay</p>
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4a3f32;">Scan the PromptPay QR code in your account Orders tab, or log in and go to Orders to find the QR code for this order.</p>
        <p style="margin:8px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:bold;color:#4a3f32;">Amount: ฿${totalAmount.toLocaleString()} — Name: ศศิวิมล แก้วกมล</p>
      </div>`
    : `<div style="margin:20px 0;padding:16px;background:#eef3ec;border-left:3px solid #4a6741;">
        <p style="margin:0 0 10px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;letter-spacing:2px;color:#4a6741;text-transform:uppercase;">Pay via Bank Transfer</p>
        <p style="margin:0 0 4px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4a3f32;"><strong>KBank:</strong> 021-3-24417-5 — ศศิวิมล แก้วกมล</p>
        <p style="margin:0 0 12px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4a3f32;"><strong>Krungsri:</strong> 719-1-26847-2 — ศศิวิมล แก้วกมล</p>
        <p style="margin:0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:bold;color:#4a3f32;">Amount: ฿${totalAmount.toLocaleString()}</p>
      </div>`

  const content = `
    ${h1(`Thank you, ${customerName} 🌿`)}
    ${divider()}
    ${p(`Your order has been placed successfully. Please complete your payment to confirm the order.`)}
    <p style="margin:0 0 6px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;letter-spacing:2px;color:#8a7d65;text-transform:uppercase;">Order Reference</p>
    <p style="margin:0 0 20px;font-family:'Georgia',serif;font-size:22px;color:#4a6741;font-weight:400;">${orderNumber}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4px;">
      ${itemRows}
      <tr><td colspan="2" style="padding-top:10px;border-top:1px solid #d6cdb8;"></td></tr>
      <tr>
        <td style="font-family:'Georgia',serif;font-size:15px;color:#2c2416;font-weight:600;">Total</td>
        <td style="font-family:'Georgia',serif;font-size:15px;color:#2c2416;font-weight:600;text-align:right;">฿${totalAmount.toLocaleString()}</td>
      </tr>
    </table>
    ${paymentInstructions}
    ${p(`<strong>Shipping to:</strong> ${shippingAddress.replace(/\n/g, ', ')}`)}
    ${p(`Once we receive your payment, we will confirm your order and begin packing your books with care.`)}
    ${ctaButton('View My Orders', `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.obsbooks.com'}/account`)}
    <p style="margin:24px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#8a7d65;font-style:italic;">With love from Bangkok — Sasi at OBS Books 🌿</p>
  `
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Order confirmed — ${orderNumber} 🌿`,
    html: baseTemplate(content),
  })
}

// ── Admin notification: new order ─────────────────────────────────────────────
export async function sendAdminNewOrderEmail({
  orderNumber, customerName, customerPhone, customerEmail, totalAmount, items, paymentMethod,
}: {
  orderNumber: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  totalAmount: number
  items: { title: string; price: number; quantity: number; condition?: string }[]
  paymentMethod: string
}) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return

  const itemList = items.map(i =>
    `<tr><td style="padding:4px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4a3f32;">${i.title}${i.condition ? ` (${i.condition})` : ''}${i.quantity > 1 ? ` ×${i.quantity}` : ''}</td><td style="padding:4px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4a3f32;text-align:right;">฿${(i.price * i.quantity).toLocaleString()}</td></tr>`
  ).join('')

  const content = `
    ${h1(`New Order: ${orderNumber}`)}
    ${divider()}
    <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;padding:16px;background:#fdf8f2;border:1px solid #d6cdb8;width:100%;">
      <tr><td style="padding:4px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4a3f32;"><strong>Customer:</strong> ${customerName}</td></tr>
      <tr><td style="padding:4px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4a3f32;"><strong>Phone:</strong> ${customerPhone}</td></tr>
      ${customerEmail ? `<tr><td style="padding:4px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4a3f32;"><strong>Email:</strong> ${customerEmail}</td></tr>` : ''}
      <tr><td style="padding:4px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4a3f32;"><strong>Payment:</strong> ${paymentMethod === 'promptpay' ? 'PromptPay' : 'Bank Transfer'}</td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">${itemList}
      <tr><td colspan="2" style="padding-top:8px;border-top:1px solid #d6cdb8;"></td></tr>
      <tr><td style="font-family:'Georgia',serif;font-size:15px;color:#2c2416;font-weight:600;">Total</td><td style="font-family:'Georgia',serif;font-size:15px;color:#2c2416;font-weight:600;text-align:right;">฿${totalAmount.toLocaleString()}</td></tr>
    </table>
    ${ctaButton('View in Admin', `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.obsbooks.com'}/admin/orders`)}
  `
  await resend.emails.send({
    from: FROM_EMAIL,
    to: adminEmail,
    subject: `New order ${orderNumber} — ฿${totalAmount.toLocaleString()} (${paymentMethod === 'promptpay' ? 'PromptPay' : 'Transfer'})`,
    html: baseTemplate(content),
  })
}

// ── Admin notification: slip uploaded ────────────────────────────────────────
export async function sendAdminSlipUploadedEmail({
  orderNumber, customerName, customerPhone, totalAmount, slipUrl,
}: {
  orderNumber: string
  customerName: string
  customerPhone: string
  totalAmount: number
  slipUrl: string
}) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return

  const content = `
    ${h1(`Payment Slip Received`)}
    ${divider()}
    ${p(`A customer has uploaded their payment slip. Please verify and confirm the order.`)}
    <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;padding:16px;background:#fdf8f2;border:1px solid #d6cdb8;width:100%;">
      <tr><td style="padding:4px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4a3f32;"><strong>Order:</strong> ${orderNumber}</td></tr>
      <tr><td style="padding:4px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4a3f32;"><strong>Customer:</strong> ${customerName}</td></tr>
      <tr><td style="padding:4px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4a3f32;"><strong>Phone:</strong> ${customerPhone}</td></tr>
      <tr><td style="padding:4px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4a3f32;"><strong>Amount:</strong> ฿${totalAmount.toLocaleString()}</td></tr>
    </table>
    <p style="margin:0 0 16px;"><a href="${slipUrl}" style="color:#4a6741;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;">View Payment Slip</a></p>
    ${ctaButton('Confirm in Admin', `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.obsbooks.com'}/admin/orders`)}
  `
  await resend.emails.send({
    from: FROM_EMAIL,
    to: adminEmail,
    subject: `Payment slip uploaded — ${orderNumber} (฿${totalAmount.toLocaleString()})`,
    html: baseTemplate(content),
  })
}

// ── Order status update email (to customer) ───────────────────────────────────
export async function sendOrderStatusEmail({
  to, customerName, orderNumber, status, trackingNumber, courier, totalAmount,
}: {
  to: string
  customerName: string
  orderNumber: string
  status: 'paid' | 'shipped' | 'delivered'
  trackingNumber?: string
  courier?: string
  totalAmount: number
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.obsbooks.com'

  const courierNames: Record<string, string> = {
    'thailand-post': 'Thailand Post',
    'kerry': 'Kerry Express',
    'flash': 'Flash Express',
    'jt': 'J&T Express',
    'dhl': 'DHL Express',
  }

  const subjects: Record<string, string> = {
    paid: `Your payment is confirmed — ${orderNumber} 🌿`,
    shipped: `Your order is on its way — ${orderNumber} 📦`,
    delivered: `Your books have arrived — ${orderNumber} 🌸`,
  }

  const bodies: Record<string, string> = {
    paid: `
      ${h1(`Payment confirmed, ${customerName} 🌿`)}
      ${divider()}
      ${p(`Great news — we have received your payment for order <strong>${orderNumber}</strong> (฿${totalAmount.toLocaleString()}). We are now carefully packing your books.`)}
      ${p(`We will send you another email as soon as your order is shipped.`)}
      ${ctaButton('View My Order', `${siteUrl}/account`)}
      <p style="margin:24px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#8a7d65;font-style:italic;">With love from Bangkok — Sasi at OBS Books 🌿</p>
    `,
    shipped: `
      ${h1(`Your order is on its way, ${customerName}! 📦`)}
      ${divider()}
      ${p(`Your books have been packed with care and handed over to the courier. Here are your shipping details:`)}
      <table cellpadding="0" cellspacing="0" style="margin:20px 0;padding:16px;background:#eef3ec;border-left:3px solid #4a6741;width:100%;">
        <tr><td style="padding:4px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4a3f32;"><strong>Order:</strong> ${orderNumber}</td></tr>
        <tr><td style="padding:4px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4a3f32;"><strong>Courier:</strong> ${courierNames[courier || ''] || courier || 'Standard shipping'}</td></tr>
        ${trackingNumber ? `<tr><td style="padding:4px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#4a3f32;"><strong>Tracking:</strong> <span style="font-family:monospace;">${trackingNumber}</span></td></tr>` : ''}
      </table>
      ${p(`You can track your order anytime from your account page.`)}
      ${ctaButton('Track My Order', `${siteUrl}/track?order=${orderNumber}`)}
      <p style="margin:24px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#8a7d65;font-style:italic;">With love from Bangkok — Sasi at OBS Books 🌿</p>
    `,
    delivered: `
      ${h1(`Your books have arrived, ${customerName}! 🌸`)}
      ${divider()}
      ${p(`We hope your books arrived safely and bring you much joy. Thank you so much for supporting OBS Books.`)}
      ${p(`If you enjoyed your purchase, we would love to hear your thoughts — reviews help other book lovers discover these treasures.`)}
      ${ctaButton('Leave a Review', `${siteUrl}/account`)}
      <p style="margin:24px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#8a7d65;font-style:italic;">With warmth from Bangkok — Sasi at OBS Books 🌿</p>
    `,
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: subjects[status],
    html: baseTemplate(bodies[status]),
  })
}

// ── PDF flower letter delivery email ─────────────────────────────────────────
export async function sendFlowerLetterEmail({
  to, name, month, year, pdfUrl,
}: {
  to: string
  name: string
  month: string
  year: number
  pdfUrl: string
}) {
  const content = `
    ${h1(`Your Flower Letter is here, ${name} 🌸`)}
    ${divider()}
    ${p(`Your <strong>${month} ${year}</strong> botanical letter is ready — hand-designed with care, just for you.`)}
    ${p(`<a href="${pdfUrl}" style="color:#4a6741;font-weight:600;">Click here to open your letter</a> — or download it to keep forever.`)}
    ${p(`Thank you for being part of our little botanical world. Your support makes these letters possible.`)}
    ${ctaButton('Open Your Letter', pdfUrl)}
    <p style="margin:24px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#8a7d65;font-style:italic;">With love from Bangkok — Sasi 🌿</p>
  `
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Your Flower Letter is here 🌸 — ${month} ${year}`,
    html: baseTemplate(content),
  })
}
