import { Category, Lang } from '@/types'

export const CATEGORIES: Category[] = [
  { id: 'wildflowers', en: 'Wild Flowers', th: 'ดอกไม้ป่า', icon: '🌸' },
  { id: 'garden-roses', en: 'Garden & Roses', th: 'สวนและกุหลาบ', icon: '🌹' },
  { id: 'trees-plants', en: 'Trees, Herbs & Fruits', th: 'ต้นไม้ สมุนไพร และผลไม้', icon: '🌿' },
  { id: 'butterflies', en: 'Butterflies & Insects', th: 'ผีเสื้อและแมลง', icon: '🦋' },
  { id: 'wildlife-birds-animals', en: 'Wildlife, Birds & Animals', th: 'สัตว์ป่า นก และสัตว์', icon: '🐿️' },
  { id: 'cookbooks', en: 'Illustrated Cookbooks & Tea', th: 'ตำราอาหารวาดมือและชา', icon: '🫖' },
  { id: 'country-life', en: 'Country Life & Nature Journals', th: 'ชีวิตชนบทและบันทึกธรรมชาติ', icon: '🌾' },
  { id: 'fairytale', en: 'Fairy Tales & Fantasy', th: 'นิทานและแฟนตาซี', icon: '🧚' },
  { id: 'art-illustration', en: 'Art, Sketchbooks & Illustration', th: 'ศิลปะ สมุดสเก็ตช์ และภาพประกอบ', icon: '🎨' },
  { id: 'rare-items', en: 'Rare Items', th: 'Rare Items', icon: '💎' },
  { id: 'embroidery-fabric', en: 'Vintage Linens & Embroidery', th: 'ผ้าปักและงานปักวินเทจ', icon: '🧵' },
  { id: 'sale', en: 'Sale', th: 'ลดราคา', icon: '🏷️' },
]

export function getCategoryName(cat: Category, lang: Lang): string {
  return lang === 'th' ? cat.th : cat.en
}

export const TX: Record<string, Record<Lang, string>> = {
  // Nav
  nFeatured: { en: 'Featured', th: 'แนะนำ' },
  nCategories: { en: 'Categories', th: 'หมวดหมู่' },
  nShop: { en: 'Shop', th: 'ร้านค้า' },
  nShipping: { en: 'Shipping', th: 'จัดส่ง' },
  nAbout: { en: 'About', th: 'เกี่ยวกับ' },
  nContact: { en: 'Contact', th: 'ติดต่อ' },
  nFlowerLetter: { en: 'The Flower Letter', th: 'The Flower Letter' },

  // Hero
  tagline: { en: 'the book itself is a treasure', th: 'the book itself is a treasure' },
  heroTitle: { en: 'The Book Itself Is a Treasure.', th: 'The Book Itself Is a Treasure.' },
  heroSub: { en: 'Curated vintage & used illustrated books - especially flowers & nature', th: 'หนังสือวินเทจและมือสอง ภาพประกอบสวยงาม - โดยเฉพาะดอกไม้และธรรมชาติ' },
  browse: { en: 'Browse Collection', th: 'เลือกซื้อหนังสือ' },
  story: { en: 'Our Story', th: 'เรื่องราวของเรา' },

  // Featured
  featTitle: { en: 'Featured Books', th: 'หนังสือแนะนำ' },
  featSub: { en: 'Hand-selected treasures from our collection', th: 'คัดสรรอย่างดีจากคอลเลคชันของเรา' },
  featEyebrow:        { en: 'On the table this week',                                                                   th: 'หนังสือบนโต๊ะสัปดาห์นี้' },
  featHeadlineMain:   { en: 'What is open in the shop,',                                                                th: 'หนังสือที่เปิดอยู่ในร้าน' },
  featHeadlineAccent: { en: 'right now.',                                                                               th: 'ตอนนี้' },
  featBody:           { en: 'A small selection of what we are currently reading at the counter. Most are imported — when a copy sells, the next one takes a week or two to arrive.', th: 'คัดสรรจากหนังสือที่เราอ่านอยู่หน้าร้านตอนนี้ ส่วนใหญ่เป็นหนังสือนำเข้า — เมื่อขายได้จะใช้เวลาหนึ่งถึงสองสัปดาห์กว่าจะมีเล่มใหม่มา' },
  featAttribution:    { en: 'Sasi, behind the counter',                                                                 th: 'ศศิ ผู้อยู่หลังเคาน์เตอร์' },

  // Categories
  catTitle: { en: 'Browse by Category', th: 'เลือกซื้อตามหมวดหมู่' },
  shelvesEyebrow:  { en: 'Browse by shelf', th: 'เลือกดูตามหมวดหมู่' },
  shelvesHeading:  { en: 'The shelves.', th: 'ชั้นหนังสือ' },
  shelvesSubtitle: { en: 'We do not stock everything. We stock the kinds of books that started this shop — the ones with careful illustrations, slow reading, and pages worth re-reading.', th: 'เราไม่ได้สต็อกทุกอย่าง แต่สต็อกหนังสือที่เป็นจุดเริ่มต้นของร้าน — หนังสือที่มีภาพประกอบอย่างพิถีพิถัน อ่านช้าๆ และมีหน้าที่คู่ควรแก่การอ่านซ้ำ' },

  // Shop
  shopTitle: { en: 'Shop Our Collection', th: 'เลือกซื้อหนังสือ' },
  shopSub: { en: 'All books are used, in good to very good condition. Shipped every Monday.', th: 'หนังสือมือสองทุกเล่ม สภาพดีถึงดีมาก จัดส่งทุกวันจันทร์' },

  // About
  editorNoteEyebrow:     { en: 'A short note from the counter', th: 'บันทึกสั้นๆ จากหน้าร้าน' },
  editorNoteQuote:       { en: 'Both my degrees were in plant science, but nothing in my studies looked like the illustrations in that first book. I have been collecting them ever since.', th: 'ปริญญาทั้งสองของฉันอยู่ในสาขาพืชศาสตร์ แต่ไม่มีอะไรในการเรียนที่มีภาพประกอบสวยงามเหมือนหนังสือเล่มแรกนั้น ฉันจึงเริ่มสะสมมาตั้งแต่นั้น' },
  editorNoteAttribution: { en: 'Sasi · Founder, OBS Books', th: 'ศศิ · ผู้ก่อตั้ง OBS Books' },
  aboutTitle: { en: 'Our Story', th: 'เรื่องราวของเรา' },
  aboutPageEyebrow:    { en: 'Our Story', th: 'เรื่องราวของเรา' },
  aboutHeadlineMain:   { en: 'The shop began with one book,', th: 'ร้านเริ่มต้นจากหนังสือหนึ่งเล่ม' },
  aboutHeadlineAccent: { en: 'found at midnight.', th: 'ที่พบในยามดึก' },
  aboutPageSubtitle:   { en: 'Not a business plan — an obsession. The name says it. OBS stands for Obsessed with Books.', th: 'ไม่ใช่แผนธุรกิจ — แต่เป็นความหลงใหล ชื่อบอกทุกอย่าง OBS ย่อมาจาก Obsessed with Books' },
  aboutSection1Heading: { en: 'How it started.', th: 'จุดเริ่มต้น' },
  aboutSection2Heading: { en: 'The second book.', th: 'หนังสือเล่มที่สอง' },
  aboutPullQuote:       { en: 'That is how OBS Books started. Not with a business plan. With an obsession.', th: 'นั่นคือจุดเริ่มต้นของ OBS Books ไม่ใช่จากแผนธุรกิจ แต่จากความหลงใหล' },
  aboutShelvesHeading:  { en: 'What we keep on the shelves.', th: 'สิ่งที่อยู่บนชั้นของเรา' },
  aboutRulesEyebrow:    { en: 'How we work', th: 'วิธีการทำงาน' },
  aboutRulesHeading:    { en: 'Three small rules,', th: 'กฎสามข้อเล็กๆ' },
  aboutRulesAccent:     { en: 'kept on purpose.', th: 'ที่ยึดถืออย่างตั้งใจ' },
  aboutRule1Title:      { en: 'Read it first.', th: 'อ่านก่อนขาย' },
  aboutRule2Title:      { en: 'Pack it slowly.', th: 'จัดส่งอย่างพิถีพิถัน' },
  aboutRule3Title:      { en: 'Stock what\'s loved, not what sells.', th: 'เก็บสิ่งที่รัก ไม่ใช่สิ่งที่ขายได้' },
  aboutProjectsEyebrow: { en: 'Family', th: 'ครอบครัว' },
  aboutProjectsHeading:  { en: 'Two projects,', th: 'สองโครงการ' },
  aboutProjectsAccent:   { en: 'one counter.', th: 'หนึ่งเคาน์เตอร์' },
  aboutSasiEyebrow:     { en: 'Behind the counter', th: 'หลังเคาน์เตอร์' },
  aboutSasiHeading:     { en: 'Hello — I\'m Sasi.', th: 'สวัสดี — ฉันชื่อศศิ' },
  aboutSasiCTA:         { en: 'Write to Sasi', th: 'เขียนหาศศิ' },
  aboutP1: { en: 'OBS Books was born in 2023 from a simple obsession: the breathtaking beauty of vintage illustrated books about flowers, nature, and the natural world.', th: 'OBS Books เกิดขึ้นในปี 2023 จากความหลงใหลในความงามของหนังสือภาพประกอบวินเทจเกี่ยวกับดอกไม้และธรรมชาติ' },
  aboutP2: { en: 'We curate used English-language books - from Victorian botanical guides to whimsical illustrated cookbooks and fairy tale collections.', th: 'เราคัดสรรหนังสือมือสองภาษาอังกฤษ - ตั้งแต่คู่มือพฤกษศาสตร์ไปจนถึงตำราอาหารและนิทานแฟนตาซี' },
  aboutQuote: { en: '"The Book Itself Is a Treasure"', th: '"The Book Itself Is a Treasure"' },

  // Contact
  contactTitle: { en: 'Get in Touch', th: 'ติดต่อเรา' },
  contactSub: { en: 'DM us to order or ask about any book!', th: 'DM มาสั่งซื้อหรือสอบถามได้เลย!' },
  shipNote: { en: 'Ships in 2–3 days · Free shipping on all orders in Thailand', th: 'จัดส่งภายใน 2–3 วัน · ส่งฟรีทุกออเดอร์ในไทย' },
  trackOrder: { en: 'Track Order', th: 'ติดตามพัสดุ' },

  // Cart
  cart: { en: 'Cart', th: 'ตะกร้า' },
  cartEmpty: { en: 'Your collection is waiting to begin. Browse our books and find something wonderful.', th: 'คอลเลคชันของคุณกำลังรอที่จะเริ่มต้น สำรวจหนังสือของเราและค้นพบบางสิ่งที่วิเศษ' },
  total: { en: 'Total', th: 'รวม' },
  checkout: { en: 'Proceed to Checkout', th: 'ดำเนินการสั่งซื้อ' },
  remove: { en: 'Remove', th: 'ลบ' },
  addToCart: { en: 'Add to Cart', th: 'เพิ่มลงตะกร้า' },
  inCart: { en: 'In Cart', th: 'อยู่ในตะกร้า' },
  sold: { en: 'SOLD', th: 'ขายแล้ว' },
  books: { en: 'items', th: 'ชิ้น' },

  // Checkout
  checkoutTitle: { en: 'Checkout', th: 'ชำระเงิน' },
  checkoutSub: { en: 'Fill in your shipping details', th: 'กรอกข้อมูลสำหรับจัดส่ง' },
  name: { en: 'Name', th: 'ชื่อ-นามสกุล' },
  phone: { en: 'Phone', th: 'เบอร์โทร' },
  email: { en: 'Email (optional)', th: 'อีเมล (ไม่จำเป็น)' },
  address: { en: 'Shipping Address', th: 'ที่อยู่จัดส่ง' },
  payMethod: { en: 'Payment Method', th: 'ช่องทางชำระเงิน' },
  promptpay: { en: 'PromptPay', th: 'พร้อมเพย์' },
  bankTransfer: { en: 'Bank Transfer', th: 'โอนเงิน' },
  slip: { en: 'Upload Payment Slip', th: 'อัพโหลดสลิปโอนเงิน' },
  slipClick: { en: 'Click to upload slip', th: 'คลิกเพื่ออัพโหลดสลิป' },
  slipLater: { en: 'You can send the slip later via DM', th: 'สามารถส่งสลิปทีหลังทาง DM ได้' },
  note: { en: 'Note (optional)', th: 'หมายเหตุ (ไม่จำเป็น)' },
  placeOrder: { en: 'Place Order', th: 'สั่งซื้อ' },
  orderDone: { en: 'Order Placed!', th: 'สั่งซื้อสำเร็จ!' },
  orderRef: { en: 'Your order reference:', th: 'เลขที่คำสั่งซื้อ:' },
  orderSave: { en: 'Please save this number to track your order.', th: 'กรุณาบันทึกเลขนี้ไว้สำหรับติดตามพัสดุ' },
  orderPay: { en: "Don't forget to transfer and send payment slip!", th: 'อย่าลืมโอนเงินและส่งสลิป!' },
  continueBrowse: { en: 'Continue Browsing', th: 'เลือกซื้อต่อ' },
  backHome: { en: 'Back to Home', th: 'กลับหน้าหลัก' },
  comingSoon: { en: 'Coming soon!', th: 'เร็วๆ นี้!' },
  shippedMonday: { en: 'Shipped every Monday', th: 'จัดส่งทุกวันจันทร์' },
  freeShipping: { en: 'Free shipping', th: 'ส่งฟรี' },

  // Tracking
  trackTitle: { en: 'Track Your Order', th: 'ติดตามคำสั่งซื้อ' },
  trackSub: { en: 'Enter your order number to check the status', th: 'กรอกเลขที่คำสั่งซื้อเพื่อตรวจสอบสถานะ' },
  trackBtn: { en: 'Track', th: 'ตรวจสอบ' },
  trackPlaceholder: { en: 'e.g. OBS-ABC123', th: 'เช่น OBS-ABC123' },
  orderNotFound: { en: 'Order not found', th: 'ไม่พบคำสั่งซื้อ' },

  // Order statuses
  statusNew: { en: 'Order Received', th: 'รับคำสั่งซื้อแล้ว' },
  statusPending: { en: 'Awaiting Payment', th: 'รอชำระเงิน' },
  statusUploaded: { en: 'Slip Uploaded', th: 'อัพโหลดสลิปแล้ว' },
  statusPaid: { en: 'Payment Confirmed', th: 'ชำระเงินแล้ว' },
  statusConfirmed: { en: 'Payment Confirmed', th: 'ยืนยันชำระเงินแล้ว' },
  statusPacking: { en: 'Packing', th: 'กำลังแพ็คสินค้า' },
  statusShipped: { en: 'Shipped', th: 'จัดส่งแล้ว' },
  statusDelivered: { en: 'Delivered', th: 'ได้รับสินค้าแล้ว' },

  // 24-hour payment window warnings
  pay24hHeading: { en: 'Complete payment within 24 hours', th: 'กรุณาชำระเงินภายใน 24 ชั่วโมง' },
  pay24hBody: {
    en: 'Orders that are not paid within 24 hours are automatically cancelled and the books return to the shop for other customers.',
    th: 'คำสั่งซื้อที่ไม่ได้รับการชำระเงินภายใน 24 ชั่วโมงจะถูกยกเลิกโดยอัตโนมัติ และหนังสือจะกลับไปอยู่ในร้านให้ลูกค้าท่านอื่นสามารถสั่งซื้อได้',
  },
  pay24hExpired: {
    en: 'This order has expired',
    th: 'คำสั่งซื้อนี้หมดเวลาแล้ว',
  },
  pay24hRemaining: {
    en: 'Time remaining',
    th: 'เวลาที่เหลือ',
  },

  // PromptPay
  promptpayTitle: { en: 'Scan to Pay with PromptPay', th: 'สแกนจ่ายด้วยพร้อมเพย์' },
  promptpayAmount: { en: 'Amount', th: 'จำนวนเงิน' },
  promptpayInstructions: { en: 'Open your banking app, scan the QR code, and confirm the transfer.', th: 'เปิดแอพธนาคาร สแกน QR แล้วยืนยันการโอน' },

  // Bank Transfer
  bankTitle: { en: 'Bank Transfer Details', th: 'รายละเอียดการโอนเงิน' },
  bankName: { en: 'Bank', th: 'ธนาคาร' },
  bankAccount: { en: 'Account Number', th: 'เลขบัญชี' },
  bankHolder: { en: 'Account Name', th: 'ชื่อบัญชี' },

  // Card (third payment option for TH customers; international customers
  // see the same Stripe flow but without the radio selector).
  card: { en: 'Credit/Debit Card', th: 'บัตรเครดิต/เดบิต' },
  cardNoDiscountNote: {
    en: 'Discounts apply to PromptPay and Bank Transfer only.',
    th: 'ส่วนลดใช้ได้กับ PromptPay และโอนเงินผ่านธนาคารเท่านั้น',
  },

  // Stripe (international card payment) — TH translations included for parity
  // even though the Thai checkout path never reaches this branch.
  stripeRedirectHeading: { en: 'Secure checkout', th: 'ชำระเงินอย่างปลอดภัย' },
  stripeRedirectBody: {
    en: 'You will be redirected to Stripe to complete payment with your card. Cards, Apple Pay, Google Pay, and Link are supported.',
    th: 'คุณจะถูกนำไปยังหน้า Stripe เพื่อชำระเงินด้วยบัตร รองรับบัตรเครดิต, Apple Pay, Google Pay และ Link',
  },
  payWithCard: { en: 'Pay {amount} with card', th: 'ชำระ {amount} ด้วยบัตร' },
  stripeRedirecting: { en: 'Redirecting to Stripe...', th: 'กำลังนำไปยัง Stripe...' },
  stripeError: { en: 'Could not start payment. Please try again.', th: 'ไม่สามารถเริ่มการชำระเงินได้ กรุณาลองอีกครั้ง' },
  orderFailed: {
    en: 'We could not place your order and your cart has been kept. If you already transferred the money, please do not transfer again - message us and we will sort it out.',
    th: 'ไม่สามารถสั่งซื้อได้ และเราเก็บสินค้าในตะกร้าไว้ให้แล้ว หากคุณโอนเงินแล้ว กรุณาอย่าโอนซ้ำ - ทักหาเราแล้วเราจะจัดการให้',
  },
  poweredByStripe: { en: 'Powered by Stripe', th: 'ขับเคลื่อนโดย Stripe' },

  // Stripe success / cancelled landing pages
  successHeading: { en: 'Payment received', th: 'ได้รับการชำระเงินแล้ว' },
  successThanks: { en: 'Thank you, {name}.', th: 'ขอบคุณ {name}' },
  successBody: {
    en: "We've received your payment and your order is confirmed.",
    th: 'เราได้รับการชำระเงินของคุณแล้ว คำสั่งซื้อของคุณได้รับการยืนยันเรียบร้อย',
  },
  orderReference: { en: 'Order Reference', th: 'หมายเลขคำสั่งซื้อ' },
  orderRefHint: {
    en: 'Save this — you can use it on /track to follow your shipment.',
    th: 'บันทึกหมายเลขนี้ไว้ คุณสามารถใช้ที่ /track เพื่อติดตามพัสดุได้',
  },
  yourOrder: { en: 'Your order', th: 'คำสั่งซื้อของคุณ' },
  confirmationSentTo: { en: 'Confirmation sent to', th: 'ส่งอีเมลยืนยันไปที่' },
  whatsNext: { en: 'What happens next:', th: 'ขั้นตอนถัดไป:' },
  nextStepPack: {
    en: "We'll carefully pack your books on the next shipping day (Mondays from Bangkok).",
    th: 'เราจะแพ็คหนังสือของคุณอย่างพิถีพิถันในวันจัดส่งครั้งถัดไป (ทุกวันจันทร์จากกรุงเทพฯ)',
  },
  nextStepShip: {
    en: "You'll get a tracking number by email once your parcel ships.",
    th: 'คุณจะได้รับหมายเลขพัสดุทางอีเมลเมื่อพัสดุถูกจัดส่ง',
  },
  processingOrder: { en: 'Processing your order', th: 'กำลังดำเนินการคำสั่งซื้อ' },
  processingBody: {
    en: "Your payment is being verified. We'll send a confirmation email to {email} as soon as it's confirmed — usually within a minute.",
    th: 'เรากำลังตรวจสอบการชำระเงินของคุณ จะส่งอีเมลยืนยันไปที่ {email} ทันทีที่ตรวจสอบเสร็จ - โดยปกติภายในไม่กี่นาที',
  },
  closeSafely: {
    en: 'You can close this page; your order is safe.',
    th: 'คุณสามารถปิดหน้านี้ได้ คำสั่งซื้อของคุณปลอดภัย',
  },
  successNotFoundHeading: { en: "Hmm, we can't find that order", th: 'ไม่พบคำสั่งซื้อนี้' },
  successNotFoundBody: {
    en: "The link you followed may have expired. If you completed payment, you'll receive a confirmation email shortly. If something looks wrong, please reply to that email and we'll sort it out.",
    th: 'ลิงก์ที่คุณเปิดอาจหมดอายุแล้ว หากคุณชำระเงินสำเร็จ คุณจะได้รับอีเมลยืนยันในอีกสักครู่ หากมีอะไรไม่ถูกต้อง กรุณาตอบกลับอีเมลนั้นแล้วเราจะช่วยแก้ไขให้',
  },
  cancelledHeading: { en: 'Payment cancelled', th: 'การชำระเงินถูกยกเลิก' },
  cancelledBody: {
    en: "No worries — your cart is still saved. Whenever you're ready, your books are waiting for you.",
    th: 'ไม่ต้องกังวล - ตะกร้าของคุณยังถูกเก็บไว้ เมื่อคุณพร้อม หนังสือของคุณรออยู่',
  },
  tryAgain: { en: 'Try Again', th: 'ลองใหม่อีกครั้ง' },

  // Shipping
  destinationCountry: { en: 'Destination Country', th: 'ประเทศปลายทาง' },
  shippingEstimate: { en: 'Estimated Shipping (DHL)', th: 'ค่าจัดส่งโดยประมาณ (DHL)' },
  internationalNote: { en: 'International shipping via DHL Express. This is an estimate - Sasi will confirm the final shipping cost.', th: 'จัดส่งต่างประเทศผ่าน DHL Express ราคานี้เป็นราคาโดยประมาณ - ซาซิจะยืนยันค่าจัดส่งจริงอีกครั้ง' },

  // Tracking events
  realTimeTracking: { en: 'Live Tracking Events', th: 'ติดตามสถานะแบบเรียลไทม์' },
  noTrackingEvents: { en: 'Tracking events will appear once your parcel is scanned.', th: 'ข้อมูลการจัดส่งจะแสดงเมื่อพัสดุถูกสแกน' },

  // Misc
  viewAll: { en: 'View All', th: 'ดูทั้งหมด' },
  allCategories: { en: 'All Categories', th: 'ทุกหมวดหมู่' },
  search: { en: 'Search books...', th: 'ค้นหาหนังสือ...' },
  noResults: { en: 'No books found', th: 'ไม่พบหนังสือ' },
  condition: { en: 'Condition', th: 'สภาพ' },
  copies: { en: 'copies left', th: 'เหลือ' },
  bookDetails: { en: 'Book Details', th: 'รายละเอียดหนังสือ' },

  // Textile / linen product page
  linenDetails: { en: 'Linen Details', th: 'รายละเอียดผ้า' },
  aboutThisPiece: { en: 'About this piece', th: 'เกี่ยวกับชิ้นนี้' },
  aboutThisBook: { en: 'About this book', th: 'เกี่ยวกับหนังสือเล่มนี้' },
  readAlongside: { en: 'Read alongside.', th: 'อ่านควบคู่กัน' },
  conditionDetails: { en: 'Condition Note', th: 'รายละเอียดสภาพ' },
  linenHonest: { en: 'All linens honestly graded and carefully photographed', th: 'ผ้าทุกผืนประเมินสภาพตามจริงและถ่ายภาพอย่างละเอียด' },
  specDimensions: { en: 'Dimensions', th: 'ขนาด' },
  specMaterial: { en: 'Material', th: 'วัสดุ' },
  specTechnique: { en: 'Technique', th: 'เทคนิค' },
  specEra: { en: 'Era', th: 'ยุคสมัย' },

  // --- NEW KEYS ---

  // Homepage
  heroSubtitle: { en: 'A curated collection of rare vintage books on flowers, nature, and the botanical world — each one beautiful enough to display, meaningful enough to keep.', th: 'คัดสรรหนังสือเก่าหายากเกี่ยวกับดอกไม้ ธรรมชาติ และพฤกษศาสตร์ — สวยงามพอที่จะตั้งโชว์ มีคุณค่าพอที่จะเก็บรักษาไว้' },
  welcomeText: {
    en: 'OBS Books is a small Bangkok bookshop specialising in illustrated books about the natural world — field guides, botanical prints, fairy tales, nature journals, and cookbooks. We source vintage and secondhand titles, mostly imported, each one chosen because we could not find it anywhere else.',
    th: 'OBS Books เป็นร้านหนังสือเล็กๆ ในกรุงเทพฯ ที่เชี่ยวชาญด้านหนังสือภาพประกอบเกี่ยวกับโลกธรรมชาติ ไม่ว่าจะเป็นคู่มือพรรณไม้ ภาพพิมพ์พฤกษศาสตร์ เทพนิยาย บันทึกธรรมชาติ และตำราอาหาร เราคัดสรรหนังสือเก่าและมือสองที่นำเข้าจากต่างประเทศ โดยแต่ละเล่มได้รับการเลือกเพราะหาไม่ได้จากที่อื่น',
  },
  newArrivalsTitle: { en: 'Newly Found', th: 'คัดมาใหม่' },
  newlyArrivedEyebrow:        { en: 'Newly arrived · this week', th: 'มาใหม่สัปดาห์นี้' },
  newlyArrivedHeadlineMain:   { en: 'Just', th: 'หนังสือ' },
  newlyArrivedHeadlineAccent: { en: 'off the shelf.', th: 'มาใหม่' },
  newlyArrivedBrowseBtn:      { en: 'Browse all →', th: 'ดูทั้งหมด →' },
  shopByCategoryTitle: { en: 'Explore the Collection', th: 'สำรวจคอลเลคชัน' },
  shippingBanner: { en: 'We ship every Monday — Thailand Post, Kerry, Flash Express, and J&T available. Free shipping on all orders.', th: 'จัดส่งทุกวันจันทร์ — ผ่าน ไปรษณีย์ไทย, Kerry, Flash Express และ J&T ส่งฟรีทุกออเดอร์' },

  // Category descriptions
  catWildFlowers: { en: 'Flowers that bloom beyond the garden wall. This collection celebrates the untamed beauty of wildflowers from around the world — through botanical illustration, field guides, and nature writing at its most lyrical.', th: 'ดอกไม้ที่บานนอกรั้วสวน คอลเลคชันนี้เฉลิมฉลองความงามที่ไม่ถูกกักขังของดอกไม้ป่าจากทั่วโลก ผ่านภาพประกอบพฤกษศาสตร์ คู่มือภาคสนาม และงานเขียนธรรมชาติที่เต็มไปด้วยบทกวี' },
  catGardenRoses: { en: 'For those who tend their garden with the same devotion others give to art. Books on English gardens, rose varieties, planting traditions, and the quiet pleasures of cultivated beauty.', th: 'สำหรับผู้ที่ดูแลสวนด้วยใจรักเช่นเดียวกับงานศิลปะ หนังสือเกี่ยวกับสวนอังกฤษ พันธุ์กุหลาบ ประเพณีการปลูก และความสุขเงียบๆ ของความงามที่ถูกบ่มเพาะ' },
  catTreesPlants: { en: 'From ancient forests to the kitchen garden. A collection celebrating trees, herbs, and fruits through botanical illustration, herbal lore, and the rich history of plants that have fed, healed, and inspired us for centuries.', th: 'จากป่าโบราณถึงสวนครัว คอลเลคชันที่เฉลิมฉลองต้นไม้ สมุนไพร และผลไม้ ผ่านภาพประกอบพฤกษศาสตร์ ตำนานสมุนไพร และประวัติศาสตร์อันยาวนานของพืชที่หล่อเลี้ยง รักษา และสร้างแรงบันดาลใจแก่มนุษย์มาตลอดหลายศตวรรษ' },
  catButterflies: { en: 'The world in miniature — illustrated with extraordinary precision. These volumes reveal the hidden wonder of insects and butterflies through the eyes of naturalists who dedicated their lives to looking closely.', th: 'โลกในขนาดจิ๋ว — วาดด้วยความละเอียดอย่างเหลือเชื่อ หนังสือเหล่านี้เผยให้เห็นความมหัศจรรย์ที่ซ่อนอยู่ของแมลงและผีเสื้อ ผ่านสายตาของนักธรรมชาติวิทยาที่อุทิศชีวิตเพื่อการสังเกตอย่างถี่ถ้วน' },
  catWildlifeAnimals: { en: 'From the forest canopy to the open savanna. A collection celebrating birds, mammals, and wild creatures through vintage field guides, natural history illustration, and the timeless art of observing the animal world with wonder and precision.', th: 'จากยอดป่าสู่ทุ่งกว้าง คอลเลคชันที่เฉลิมฉลองนก สัตว์เลี้ยงลูกด้วยนม และสิ่งมีชีวิตในป่า ผ่านคู่มือภาคสนามวินเทจ ภาพประกอบประวัติศาสตร์ธรรมชาติ และศิลปะแห่งการสังเกตโลกสัตว์ด้วยความอัศจรรย์และความละเอียดถี่ถ้วน' },
  catCookbooks: { en: 'Cookbooks as beautiful objects — and the books that celebrate the rituals of tea. Vintage illustrated editions filled with hand-drawn ingredients, painted table settings, and recipes from an era when cooking and taking tea were considered art forms worth documenting.', th: 'หนังสือทำอาหารในฐานะสิ่งของสวยงาม และหนังสือที่เฉลิมฉลองพิธีชงชา ฉบับวินเทจพร้อมภาพประกอบที่เต็มไปด้วยภาพวาดวัตถุดิบและสูตรอาหารจากยุคที่การทำอาหารและการชงชาถือเป็นงานศิลปะที่ควรค่าแก่การบันทึก' },
  catTeaCountry: { en: 'Books that slow the world down. This collection celebrates the unhurried rhythms of country living and the naturalists who documented it — cottage gardens, seasonal walks, hand-illustrated nature journals, and the quiet art of paying attention to the world outside your door.', th: 'หนังสือที่ทำให้โลกช้าลง คอลเลคชันนี้เฉลิมฉลองจังหวะชีวิตชนบทและนักธรรมชาติวิทยาที่บันทึกมันไว้ สวนกระท่อม การเดินตามฤดูกาล บันทึกธรรมชาติวาดด้วยมือ และศิลปะแห่งการใส่ใจโลกรอบตัว' },
  catFairyTales: { en: 'Once upon a time, books were made to enchant. Illustrated fairy tales, folklore, and fantasy editions with artwork that transports you — timeless stories that deserve to be held, not just read.', th: 'กาลครั้งหนึ่ง หนังสือถูกสร้างมาเพื่อมนต์ขลัง นิทานพื้นบ้าน ตำนาน และแฟนตาซีพร้อมภาพประกอบที่พาคุณเดินทาง เรื่องราวเหนือกาลเวลาที่ควรถูกถือในมือ ไม่ใช่แค่อ่านผ่านตา' },
  catArtJournals: { en: 'Books where illustration is the point. From fine art prints and sketchbooks to botanical drawings, whimsical picture books, and artist monographs — a collection for readers who believe a beautiful image is worth a thousand words, and a thousand words still cannot replace it.', th: 'หนังสือที่ภาพประกอบคือจุดหมายปลายทาง ตั้งแต่ภาพพิมพ์ศิลปะและสมุดสเก็ตช์ ไปจนถึงภาพวาดพฤกษศาสตร์ หนังสือภาพที่มีเสน่ห์ และหนังสือศิลปิน สำหรับผู้อ่านที่เชื่อว่าภาพสวยงามหนึ่งภาพมีค่ามากกว่าคำพันคำ' },
  catRareItems: { en: 'The ones that stop you mid-scroll. First editions, out-of-print treasures, and illustrated volumes so beautiful they belong in a collection. Difficult to find, priced to reflect it — and worth every baht.', th: 'หนังสือที่ทำให้คุณหยุดเลื่อนหน้าจอ ฉบับพิมพ์ครั้งแรก สิ่งพิมพ์ที่หาได้ยาก และหนังสือภาพประกอบที่สวยงามจนสมควรอยู่ในคอลเลคชัน หายาก ราคาสะท้อนคุณค่า — และคุ้มค่าทุกบาท' },
  catEmbroideryFabric: { en: 'Vintage linens, hand embroidery, and the quiet craft of making things by hand. A collection of embroidered tablecloths, runners, and textile pieces alongside pattern books and fabric guides — for those who find beauty in thread, cloth, and the meditative rhythm of the stitch.', th: 'ผ้าลินินวินเทจ งานปักมือ และความงดงามของงานทำมือ คอลเลคชันผ้าปูโต๊ะปักมือ ผ้ารองจาน และผ้าปักวินเทจ พร้อมด้วยหนังสือลายปักและคู่มือผ้า สำหรับผู้ที่เห็นความงามในด้าย ผ้า และจังหวะสงบของการปัก' },
  catSale: { en: 'Dead stock clearance — beautiful books at reduced prices. Each title is one of a kind, so once it is gone, it is gone. A good place to look if you are after something special without the wait.', th: 'เคลียร์สต็อก — หนังสือสวยในราคาพิเศษ แต่ละเล่มมีเพียงเล่มเดียว เมื่อหมดแล้วหมดเลย เหมาะสำหรับผู้ที่มองหาของพิเศษในราคาที่เข้าถึงได้' },

  // Product page
  conditionLikeNew: { en: 'Like New — Shows no signs of use. Pages are bright and unmarked, binding is firm, covers are clean. A rare find in this condition.', th: 'เหมือนใหม่ — ไม่มีร่องรอยการใช้งาน หน้ากระดาษสดใสและไม่มีรอยขีด สันหนังสือแน่น ปกสะอาด หาได้ยากมากในสภาพนี้' },
  conditionVeryGood: { en: 'Very Good — Gently used with minimal wear. May show light marks on the cover or faint aging on page edges, but the interior is clean and the book is complete.', th: 'ดีมาก — ผ่านการใช้งานเล็กน้อย อาจมีรอยเล็กน้อยบนปก หรือขอบกระดาษเหลืองตามอายุ แต่ภายในสะอาดและสมบูรณ์' },
  conditionGood: { en: 'Good — A well-loved copy with visible signs of age and use. The story is intact, the illustrations are clear, and the character of time only adds to its charm.', th: 'ดี — หนังสือที่ถูกรัก มีร่องรอยของกาลเวลาและการใช้งาน เนื้อหาสมบูรณ์ ภาพประกอบชัดเจน และเสน่ห์ของความเก่าแก่ก็เป็นส่วนหนึ่งของมัน' },
  outOfStock: { en: 'This title has found its home. Follow us on Instagram @obs_books to be first to know when new titles arrive.', th: 'หนังสือเล่มนี้มีเจ้าของแล้ว ติดตามเราบน Instagram @obs_books เพื่อรู้ก่อนใครเมื่อมีหนังสือใหม่เข้ามา' },

  // Cart & checkout
  cartTitle: { en: 'Your Collection', th: 'คอลเลคชันของคุณ' },
  paymentInstructions: { en: 'We accept payment via PromptPay and bank transfer. Once you\'ve placed your order, please transfer the total amount and send us your payment slip via LINE or Instagram. We\'ll confirm your order and ship the following Monday.', th: 'เรารับชำระผ่าน PromptPay และการโอนเงินผ่านธนาคาร หลังจากสั่งซื้อแล้ว กรุณาโอนเงินตามยอดและส่งสลิปมาให้เราทาง LINE หรือ Instagram เราจะยืนยันออเดอร์และจัดส่งในวันจันทร์ถัดไป' },
  orderConfirmed: { en: 'Your order is confirmed. Thank you for choosing OBS Books — we hope this book brings you as much joy as it brought us to find it. Your parcel will be dispatched this Monday.', th: 'ออเดอร์ของคุณได้รับการยืนยันแล้ว ขอบคุณที่เลือก OBS Books เราหวังว่าหนังสือเล่มนี้จะมอบความสุขให้คุณเท่ากับที่เรามีความสุขในการค้นพบมัน พัสดุของคุณจะถูกจัดส่งในวันจันทร์นี้' },
  shippingNote: { en: 'All orders are carefully wrapped and shipped every Monday. Tracking numbers are provided once your parcel is dispatched. Free shipping on every order.', th: 'ทุกออเดอร์จะถูกห่ออย่างพิถีพิถันและจัดส่งทุกวันจันทร์ เราจะแจ้งเลขพัสดุเมื่อส่งของแล้ว ส่งฟรีทุกออเดอร์' },

  // About page
  aboutStory: {
    en: 'It started with a book I could not stop thinking about. I have two degrees in plant science, but nothing in my studies looked like the illustrations in that first field guide — Marjorie Blamey\'s plates in The Alpine Flowers of Britain and Europe, painted from living specimens with the carefulness of a scientist and the eye of someone who loved what she was looking at. I bought one copy. Then another. Then I started finding them for other people.\n\nOBS Books opened in Bangkok in 2023. Every book passes through our hands before it reaches yours — we check every page, note every mark, and choose only what we would be proud to own ourselves. Most of what we carry is imported, and some titles are the only copy in Thailand. When a copy sells, we look for another one.\n\nWe ship from Bangkok every week. Thailand orders arrive in 2–3 days. International orders in 5–10 days. Books are wrapped in tissue and linen string with a small slip noting the book, illustrator, and year.',
    th: 'มันเริ่มต้นจากหนังสือที่ฉันคิดไม่ออก ฉันมีสองปริญญาด้านพืชศาสตร์ แต่ไม่มีอะไรในการเรียนที่มีภาพประกอบสวยงามเหมือนคู่มือภาคสนามเล่มแรกนั้น แผ่นภาพของ Marjorie Blamey ใน The Alpine Flowers of Britain and Europe วาดจากตัวอย่างที่มีชีวิตด้วยความพิถีพิถันของนักวิทยาศาสตร์และสายตาของคนที่รักสิ่งที่เธอมองอยู่ ฉันซื้อมาหนึ่งเล่ม แล้วก็อีกเล่ม แล้วก็เริ่มหามาให้คนอื่น\n\nOBS Books เปิดในกรุงเทพฯ เมื่อปี 2023 หนังสือทุกเล่มผ่านมือเราก่อนจะถึงมือคุณ เราตรวจสอบทุกหน้า บันทึกทุกรอยตำหนิ และเลือกเฉพาะสิ่งที่เราภูมิใจจะเป็นเจ้าของ หนังสือส่วนใหญ่ที่เราขายเป็นของนำเข้า และบางเล่มเป็นสำเนาเดียวในประเทศไทย เมื่อขายได้เราก็จะหามาอีก\n\nเราจัดส่งจากกรุงเทพฯ ทุกสัปดาห์ ออเดอร์ในไทยได้รับภายใน 2–3 วัน ต่างประเทศ 5–10 วัน หนังสือห่อด้วยกระดาษทิชชูและเชือกลินินพร้อมบันทึกเล็กๆ',
  },
  aboutContact: { en: 'We love hearing from fellow book lovers. Find us on Instagram and TikTok at @obs_books — or send us a message to ask about a title, request something specific, or simply say hello.', th: 'เรายินดีรับฟังเพื่อนนักอ่านทุกคน ติดตามเราบน Instagram และ TikTok ที่ @obs_books หรือส่งข้อความมาเพื่อสอบถามเกี่ยวกับหนังสือ ขอหนังสือที่ต้องการ หรือแค่อยากทักทาย' },

  // Navigation & footer (new aliases)
  navShop: { en: 'Shop', th: 'ช้อป' },
  navCollection: { en: 'Collection', th: 'คอลเลคชัน' },
  navAbout: { en: 'About', th: 'เกี่ยวกับเรา' },
  navContact: { en: 'Contact', th: 'ติดต่อ' },
  navCart: { en: 'Cart', th: 'ตะกร้า' },
  footerTagline: { en: 'The Book Itself Is a Treasure \u273f Bangkok, Thailand. Shipping every Monday.', th: 'The Book Itself Is a Treasure \u273f กรุงเทพฯ จัดส่งทุกวันจันทร์' },

  // Contact section
  findUsTitle: { en: 'Find Us', th: 'ติดตามเรา' },
  findUsSub: { en: 'Follow us for new arrivals, book finds, and a peek behind the shelves.', th: 'ติดตามเราเพื่อรับข่าวหนังสือมาใหม่ ของหายาก และเบื้องหลังร้าน' },
  followUs: { en: 'Follow Us', th: 'ติดตามเรา' },
  emailSupport: { en: 'Email Us', th: 'อีเมลหาเรา' },
  emailSupportSub: { en: 'Customer support', th: 'สอบถามและติดต่อ' },

  // Footer (Phase 5c redesign)
  footerBlurb: {
    en: 'A small bookshop in Bangkok. Curated since 2023 by one obsessed reader. Imported, second-hand, sometimes the only copy in Thailand.',
    th: 'ร้านหนังสือเล็ก ๆ ในกรุงเทพฯ คัดสรรโดยนักอ่านคนหนึ่งตั้งแต่ปี 2023 หนังสือนำเข้า หนังสือมือสอง บางเล่มมีเพียงเล่มเดียวในประเทศไทย',
  },
  footerShop: { en: 'Shop', th: 'เลือกซื้อ' },
  footerTheShop: { en: 'The Shop', th: 'เกี่ยวกับร้าน' },
  footerFamily: { en: 'Family', th: 'ในเครือ' },
  footerAbout: { en: 'About', th: 'เกี่ยวกับเรา' },
  footerShipping: { en: 'Shipping', th: 'การจัดส่ง' },
  footerTrackOrder: { en: 'Track Order', th: 'ติดตามคำสั่งซื้อ' },
  footerContact: { en: 'Contact', th: 'ติดต่อ' },
  footerFlowerLetter: { en: 'The Flower Letter', th: 'The Flower Letter' },
  footerInstagram: { en: 'Instagram @obs_books', th: 'Instagram @obs_books' },
  footerTiktok: { en: 'TikTok @obs_books', th: 'TikTok @obs_books' },
  footerFacebook: { en: 'Facebook', th: 'Facebook' },
  footerOrigin: { en: 'Posted from Bangkok · Worldwide', th: 'ส่งจากกรุงเทพฯ · จัดส่งทั่วโลก' },

  // Flower Letter sister section (Phase 5i)
  flSectionEyebrow: { en: 'A sister project', th: 'โครงการในเครือ' },
  flSectionBody: {
    en: "A monthly envelope from this same shop. Inside: a letter, a postcard, a bookmark, a sticker set, a small painted print, a collectible stamp, a Bloom Note from The Garden of Good Omens, and a real page from a flower book. Eight small pieces, the slowest mail you'll get all month.",
    th: 'ซองจดหมายรายเดือนจากร้านเดียวกัน ภายในประกอบด้วยจดหมายหนึ่งหน้า โปสการ์ดดอกไม้ ที่คั่นหนังสือ ชุดสติกเกอร์ ภาพพิมพ์ใบเล็ก แสตมป์สะสม การ์ด Bloom Note จาก The Garden of Good Omens และหน้าจากหนังสือดอกไม้ของจริง แปดชิ้นเล็ก ๆ จดหมายที่ช้าที่สุดที่คุณจะได้รับในเดือนนี้',
  },
  flSectionCta: { en: 'Visit The Flower Letter', th: 'เยี่ยมชม The Flower Letter' },

  // Hero (Phase 5e full-bleed redesign)
  heroEyebrow: { en: 'A small bookshop in Bangkok', th: 'ร้านหนังสือเล็ก ๆ ในกรุงเทพฯ' },
  heroHeadlineL1: { en: 'The books we', th: 'หนังสือที่หา' },
  heroHeadlineL2: { en: 'could not find', th: 'จากที่ไหน' },
  heroHeadlineAccent: { en: 'anywhere else.', th: 'จากที่อื่นไม่เจอ' },
  heroLead: {
    en: 'Field guides, botanical plates, fairy tales, sketchbooks, cookbooks. Imported, second-hand, sometimes the only copy in Thailand — slowly curated by one obsessed reader.',
    th: 'คู่มือพรรณไม้ ภาพพิมพ์พฤกษศาสตร์ เทพนิยาย สมุดสเก็ตช์ และตำราอาหาร นำเข้าและมือสอง บางเล่มมีเพียงเล่มเดียวในประเทศไทย คัดสรรอย่างช้า ๆ โดยนักอ่านผู้หลงใหลในหนังสือ',
  },
  heroBrowseBtn: { en: 'Browse the shelves', th: 'เลือกชมหนังสือ' },
  heroStoryBtn: { en: 'Our story', th: 'เรื่องราวของเรา' },
  heroStrip: { en: 'Curated in Bangkok since 2023', th: 'คัดสรรในกรุงเทพฯ ตั้งแต่ปี 2023' },

  // Info strip (Phase 5d)
  stripShippingTH:   { en: 'Ships 2–3 days · Thailand',           th: 'จัดส่งภายใน 2–3 วัน · ไทย' },
  stripShippingFree: { en: 'Free shipping on all Thailand orders', th: 'ส่งฟรีทุกออเดอร์ในไทย' },
  stripShippingIntl: { en: 'Worldwide delivery in 5–10 days',     th: 'จัดส่งทั่วโลกภายใน 5–10 วัน' },
}

export function t(key: string, lang: Lang): string {
  return TX[key]?.[lang] || TX[key]?.en || key
}
