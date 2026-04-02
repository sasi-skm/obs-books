import { Category, Lang } from '@/types'

export const CATEGORIES: Category[] = [
  { id: 'wildflowers', en: 'Wild Flowers', th: 'ดอกไม้ป่า', icon: '🌸' },
  { id: 'garden-roses', en: 'Garden & Roses', th: 'สวนและกุหลาบ', icon: '🌹' },
  { id: 'trees-plants', en: 'Trees & Plants', th: 'ต้นไม้และพืช', icon: '🌳' },
  { id: 'butterflies', en: 'Butterflies & Insects', th: 'ผีเสื้อและแมลง', icon: '🦋' },
  { id: 'cookbooks', en: 'Illustrated Cookbooks', th: 'ตำราอาหารวาดมือ', icon: '🍓' },
  { id: 'tea-country', en: 'Tea & Country Life', th: 'ชาและวิถีชนบท', icon: '☕' },
  { id: 'fairytale', en: 'Fairy Tales & Fantasy', th: 'นิทานและแฟนตาซี', icon: '🧚' },
  { id: 'art-nature', en: 'Art & Nature Journals', th: 'ศิลปะและสมุดธรรมชาติ', icon: '🎨' },
]

export function getCategoryName(cat: Category, lang: Lang): string {
  return lang === 'th' ? cat.th : cat.en
}

export const TX: Record<string, Record<Lang, string>> = {
  // Nav
  nFeatured: { en: 'Featured', th: 'แนะนำ' },
  nCategories: { en: 'Categories', th: 'หมวดหมู่' },
  nShop: { en: 'Shop', th: 'ร้านค้า' },
  nAbout: { en: 'About', th: 'เกี่ยวกับ' },
  nContact: { en: 'Contact', th: 'ติดต่อ' },

  // Hero
  tagline: { en: 'the book itself is a treasure', th: 'หนังสือคือสมบัติล้ำค่า' },
  heroTitle: { en: 'The Book Itself Is a Treasure', th: 'หนังสือคือสมบัติล้ำค่า' },
  heroSub: { en: 'Curated vintage & used illustrated books - especially flowers & nature', th: 'หนังสือวินเทจและมือสอง ภาพประกอบสวยงาม - โดยเฉพาะดอกไม้และธรรมชาติ' },
  browse: { en: 'Browse Collection', th: 'เลือกซื้อหนังสือ' },
  story: { en: 'Our Story', th: 'เรื่องราวของเรา' },

  // Featured
  featTitle: { en: 'Featured Books', th: 'หนังสือแนะนำ' },
  featSub: { en: 'Hand-selected treasures from our collection', th: 'คัดสรรอย่างดีจากคอลเลคชันของเรา' },

  // Categories
  catTitle: { en: 'Browse by Category', th: 'เลือกซื้อตามหมวดหมู่' },

  // Shop
  shopTitle: { en: 'Shop Our Collection', th: 'เลือกซื้อหนังสือ' },
  shopSub: { en: 'All books are used, in good to very good condition. Shipped every Monday.', th: 'หนังสือมือสองทุกเล่ม สภาพดีถึงดีมาก จัดส่งทุกวันจันทร์' },

  // About
  aboutTitle: { en: 'Our Story', th: 'เรื่องราวของเรา' },
  aboutP1: { en: 'OBS Books was born in 2023 from a simple obsession: the breathtaking beauty of vintage illustrated books about flowers, nature, and the natural world.', th: 'OBS Books เกิดขึ้นในปี 2023 จากความหลงใหลในความงามของหนังสือภาพประกอบวินเทจเกี่ยวกับดอกไม้และธรรมชาติ' },
  aboutP2: { en: 'We curate used English-language books - from Victorian botanical guides to whimsical illustrated cookbooks and fairy tale collections.', th: 'เราคัดสรรหนังสือมือสองภาษาอังกฤษ - ตั้งแต่คู่มือพฤกษศาสตร์ไปจนถึงตำราอาหารและนิทานแฟนตาซี' },
  aboutQuote: { en: '"The Book Itself Is a Treasure"', th: '"หนังสือคือสมบัติล้ำค่า"' },

  // Contact
  contactTitle: { en: 'Get in Touch', th: 'ติดต่อเรา' },
  contactSub: { en: 'DM us to order or ask about any book!', th: 'DM มาสั่งซื้อหรือสอบถามได้เลย!' },
  shipNote: { en: 'Shipping every Monday - Free shipping on all orders', th: 'จัดส่งทุกวันจันทร์ - ส่งฟรีทุกออเดอร์' },
  trackOrder: { en: 'Track Order', th: 'ติดตามพัสดุ' },

  // Cart
  cart: { en: 'Cart', th: 'ตะกร้า' },
  cartEmpty: { en: 'Your cart is empty', th: 'ยังไม่มีสินค้าในตะกร้า' },
  total: { en: 'Total', th: 'รวม' },
  checkout: { en: 'Proceed to Checkout', th: 'ดำเนินการสั่งซื้อ' },
  remove: { en: 'Remove', th: 'ลบ' },
  addToCart: { en: 'Add to Cart', th: 'เพิ่มลงตะกร้า' },
  inCart: { en: 'In Cart', th: 'อยู่ในตะกร้า' },
  sold: { en: 'SOLD', th: 'ขายแล้ว' },
  books: { en: 'books', th: 'เล่ม' },

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
  statusConfirmed: { en: 'Payment Confirmed', th: 'ยืนยันชำระเงินแล้ว' },
  statusPacking: { en: 'Packing', th: 'กำลังแพ็คสินค้า' },
  statusShipped: { en: 'Shipped', th: 'จัดส่งแล้ว' },
  statusDelivered: { en: 'Delivered', th: 'ได้รับสินค้าแล้ว' },

  // PromptPay
  promptpayTitle: { en: 'Scan to Pay with PromptPay', th: 'สแกนจ่ายด้วยพร้อมเพย์' },
  promptpayAmount: { en: 'Amount', th: 'จำนวนเงิน' },
  promptpayInstructions: { en: 'Open your banking app, scan the QR code, and confirm the transfer.', th: 'เปิดแอพธนาคาร สแกน QR แล้วยืนยันการโอน' },

  // Bank Transfer
  bankTitle: { en: 'Bank Transfer Details', th: 'รายละเอียดการโอนเงิน' },
  bankName: { en: 'Bank', th: 'ธนาคาร' },
  bankAccount: { en: 'Account Number', th: 'เลขบัญชี' },
  bankHolder: { en: 'Account Name', th: 'ชื่อบัญชี' },

  // Misc
  viewAll: { en: 'View All', th: 'ดูทั้งหมด' },
  allCategories: { en: 'All Categories', th: 'ทุกหมวดหมู่' },
  search: { en: 'Search books...', th: 'ค้นหาหนังสือ...' },
  noResults: { en: 'No books found', th: 'ไม่พบหนังสือ' },
  condition: { en: 'Condition', th: 'สภาพ' },
  copies: { en: 'copies left', th: 'เหลือ' },
  bookDetails: { en: 'Book Details', th: 'รายละเอียดหนังสือ' },
}

export function t(key: string, lang: Lang): string {
  return TX[key]?.[lang] || TX[key]?.en || key
}
