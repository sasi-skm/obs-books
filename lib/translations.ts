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
  { id: 'embroidery-fabric', en: 'Embroidery Fabric', th: 'ผ้าปักและงานปักเย็บ', icon: '🧵' },
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

  // Categories
  catTitle: { en: 'Browse by Category', th: 'เลือกซื้อตามหมวดหมู่' },

  // Shop
  shopTitle: { en: 'Shop Our Collection', th: 'เลือกซื้อหนังสือ' },
  shopSub: { en: 'All books are used, in good to very good condition. Shipped every Monday.', th: 'หนังสือมือสองทุกเล่ม สภาพดีถึงดีมาก จัดส่งทุกวันจันทร์' },

  // About
  aboutTitle: { en: 'Our Story', th: 'เรื่องราวของเรา' },
  aboutP1: { en: 'OBS Books was born in 2023 from a simple obsession: the breathtaking beauty of vintage illustrated books about flowers, nature, and the natural world.', th: 'OBS Books เกิดขึ้นในปี 2023 จากความหลงใหลในความงามของหนังสือภาพประกอบวินเทจเกี่ยวกับดอกไม้และธรรมชาติ' },
  aboutP2: { en: 'We curate used English-language books - from Victorian botanical guides to whimsical illustrated cookbooks and fairy tale collections.', th: 'เราคัดสรรหนังสือมือสองภาษาอังกฤษ - ตั้งแต่คู่มือพฤกษศาสตร์ไปจนถึงตำราอาหารและนิทานแฟนตาซี' },
  aboutQuote: { en: '"The Book Itself Is a Treasure"', th: '"The Book Itself Is a Treasure"' },

  // Contact
  contactTitle: { en: 'Get in Touch', th: 'ติดต่อเรา' },
  contactSub: { en: 'DM us to order or ask about any book!', th: 'DM มาสั่งซื้อหรือสอบถามได้เลย!' },
  shipNote: { en: 'Shipping every Monday - Free shipping on all orders', th: 'จัดส่งทุกวันจันทร์ - ส่งฟรีทุกออเดอร์' },
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

  // --- NEW KEYS ---

  // Homepage
  heroSubtitle: { en: 'A curated collection of rare vintage books on flowers, nature, and the botanical world — each one beautiful enough to display, meaningful enough to keep.', th: 'คัดสรรหนังสือเก่าหายากเกี่ยวกับดอกไม้ ธรรมชาติ และพฤกษศาสตร์ — สวยงามพอที่จะตั้งโชว์ มีคุณค่าพอที่จะเก็บรักษาไว้' },
  welcomeText: { en: 'Welcome to OBS Books — a small, carefully tended bookshop born from a love of beautiful things. We search for illustrated books that carry history in their pages: field guides, botanical prints, nature journals, and garden books that feel like stepping into another world. Every title we offer has been chosen with care, not just for what it says, but for how it makes you feel.', th: 'ยินดีต้อนรับสู่ OBS Books — ร้านหนังสือเล็กๆ ที่ถูกสร้างขึ้นจากความรักในสิ่งสวยงาม เราออกตามหาหนังสือภาพประกอบที่ซ่อนประวัติศาสตร์ไว้ในทุกหน้า ทุกเล่มที่เราเลือกมานั้น มาจากใจ — ไม่เพียงแค่เนื้อหา แต่รวมถึงความรู้สึกที่มันมอบให้' },
  newArrivalsTitle: { en: 'Newly Found', th: 'คัดมาใหม่' },
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
  catEmbroideryFabric: { en: 'Needlework, textile arts, and the quiet craft of making things by hand. A collection of embroidery pattern books, fabric guides, and illustrated craft volumes for those who find beauty in thread, cloth, and the meditative rhythm of the stitch.', th: 'งานปักเข็ม ศิลปะสิ่งทอ และความงดงามของงานทำมือ คอลเลคชันหนังสือลายปัก คู่มือผ้า และหนังสืองานฝีมือภาพประกอบ สำหรับผู้ที่เห็นความงามในด้าย ผ้า และจังหวะสงบของการปัก' },
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
  aboutStory: { en: 'OBS Books began in 2023 with a simple belief: that some books are too beautiful to be forgotten. We search for vintage and used illustrated books — nature guides, botanical volumes, fairy tales, cookbooks — that deserve a second life and a reader who will truly appreciate them.\n\nWe are based in Bangkok, but our books come from all corners of the world. Each one passes through our hands before it reaches yours. We check every page, note every mark, and choose only what we would be proud to own ourselves.\n\nOur tagline says it simply: The Book Itself Is a Treasure. We believe that. And we hope you will too.', th: 'OBS Books เริ่มต้นในปี 2566 ด้วยความเชื่อง่ายๆ ว่า หนังสือบางเล่มสวยเกินกว่าจะถูกลืม เราออกตามหาหนังสือเก่าและหนังสือมือสองพร้อมภาพประกอบที่สมควรได้รับชีวิตที่สองและผู้อ่านที่จะรักมันอย่างแท้จริง\n\nเราตั้งอยู่ที่กรุงเทพฯ แต่หนังสือของเรามาจากทั่วทุกมุมโลก ทุกเล่มผ่านมือเราก่อนที่จะไปถึงมือคุณ เราตรวจสอบทุกหน้า บันทึกทุกรอย และเลือกเฉพาะสิ่งที่เราภูมิใจจะเป็นเจ้าของเอง\n\nคำโปรยของเรากล่าวไว้อย่างเรียบง่ายว่า หนังสือเล่มนี้คือสมบัติ เราเชื่อในสิ่งนี้ และหวังว่าคุณจะเชื่อเช่นกัน' },
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
}

export function t(key: string, lang: Lang): string {
  return TX[key]?.[lang] || TX[key]?.en || key
}
