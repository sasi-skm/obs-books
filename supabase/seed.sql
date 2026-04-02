-- ============================================================
-- OBS Books - Supabase Setup Script
-- Run this ONCE in your Supabase SQL Editor
-- ============================================================

-- 1. Create tables
-- ============================================================

CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text DEFAULT '',
  price integer NOT NULL,
  category text NOT NULL,
  condition text DEFAULT 'Good',
  copies integer DEFAULT 1,
  status text DEFAULT 'available',
  image_url text DEFAULT '',
  description text,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  shipping_address text NOT NULL,
  payment_method text NOT NULL DEFAULT 'promptpay',
  payment_status text DEFAULT 'pending',
  order_status text DEFAULT 'new',
  slip_url text,
  total_amount integer NOT NULL,
  note text,
  courier text,
  tracking_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  book_id uuid REFERENCES books(id),
  title text NOT NULL,
  author text DEFAULT '',
  price integer NOT NULL,
  image_url text
);

-- 2. Create function to decrement book copies
-- ============================================================

CREATE OR REPLACE FUNCTION decrement_book_copies(book_id_param uuid)
RETURNS void AS $$
BEGIN
  UPDATE books
  SET copies = GREATEST(copies - 1, 0),
      status = CASE WHEN copies <= 1 THEN 'sold' ELSE status END,
      updated_at = now()
  WHERE id = book_id_param;
END;
$$ LANGUAGE plpgsql;

-- 3. Row Level Security
-- ============================================================

ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Books: anyone can read, only service role can write
CREATE POLICY "Books are viewable by everyone" ON books FOR SELECT USING (true);
CREATE POLICY "Books are editable by service role" ON books FOR ALL USING (auth.role() = 'service_role');

-- Orders: anon can insert (checkout), can read own order by order_number
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Orders viewable by service role" ON orders FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Orders updatable by service role" ON orders FOR UPDATE USING (auth.role() = 'service_role');

-- Order items: insert with orders, readable by service role
CREATE POLICY "Anyone can create order items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Order items viewable by service role" ON order_items FOR SELECT USING (auth.role() = 'service_role');

-- 4. Create storage buckets
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('book-images', 'book-images', true)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('payment-slips', 'payment-slips', false)
ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Book images are public" ON storage.objects FOR SELECT USING (bucket_id = 'book-images');
CREATE POLICY "Service role can upload book images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'book-images');
CREATE POLICY "Service role can update book images" ON storage.objects FOR UPDATE USING (bucket_id = 'book-images');

CREATE POLICY "Anyone can upload payment slips" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-slips');
CREATE POLICY "Service role can view payment slips" ON storage.objects FOR SELECT USING (bucket_id = 'payment-slips' AND auth.role() = 'service_role');

-- 5. Seed initial book data (32 books from prototype)
-- ============================================================

INSERT INTO books (title, author, price, category, condition, copies, status, image_url, featured) VALUES
('The Concise British Flora in Colour', 'W. Keble Martin', 1200, 'wildflowers', 'Very Good', 3, 'available', '/images/british-flora.jpeg', true),
('Wild Flowers by Colour', 'Marjorie Blamey', 950, 'wildflowers', 'Good', 2, 'available', '/images/blamey-guides.jpeg', false),
('Wild Flowers of the Mediterranean', 'Marjorie Blamey', 1100, 'wildflowers', 'Very Good', 1, 'available', '/images/wildflower-guide.jpeg', false),
('The Illustrated Book of Wild Flowers', 'Various', 850, 'wildflowers', 'Good', 1, 'available', '/images/wildflower-plate.jpeg', false),
('Painting Flowers', 'Marjorie Blamey', 950, 'garden-roses', 'Very Good', 1, 'available', '/images/painting-flowers.jpeg', true),
('Old Cottage Garden Flowers', 'Roger Banks', 780, 'garden-roses', 'Good', 1, 'available', '/images/roses-collection.jpeg', false),
('Garden Flowers - A Concise Guide', 'Various', 650, 'garden-roses', 'Good', 2, 'available', '/images/garden-flowers.jpeg', false),
('Garden Plants in Colour', 'Various', 700, 'garden-roses', 'Good', 1, 'available', '/images/garden-plants.jpeg', false),
('The Trees of Britain & N. Europe', 'Alan Mitchell', 680, 'trees-plants', 'Good', 5, 'available', '/images/trees-collection.jpeg', false),
('Living in a Wild Garden', 'Roger Banks', 750, 'trees-plants', 'Very Good', 1, 'available', '/images/wild-garden.jpeg', false),
('Dragonfly, Beetle, Butterfly, Bee', 'Maryjo Koch', 890, 'butterflies', 'Very Good', 1, 'available', '/images/butterfly-book.jpeg', true),
('A Field Guide to Butterflies & Moths', 'David Carter', 750, 'butterflies', 'Good', 2, 'available', '/images/pantry-butterflies.jpeg', false),
('A Basket of Berries', 'Val Archer', 850, 'cookbooks', 'Very Good', 1, 'available', '/images/berries-book.jpeg', true),
('A Basket of Apples', 'Val Archer', 850, 'cookbooks', 'Very Good', 1, 'available', '/images/apples-book.jpeg', false),
('Recipes to Relish', 'Joan Wolfenden', 750, 'cookbooks', 'Very Good', 1, 'available', '/images/summer-recipes.jpeg', false),
('A Table in Tuscany', 'Various', 680, 'cookbooks', 'Good', 1, 'available', '/images/tuscan-soup.jpeg', false),
('Summer Pudding & Country Recipes', 'Various', 620, 'cookbooks', 'Good', 1, 'available', '/images/summer-pudding.jpeg', false),
('Time for Tea', 'Mary Engelbreit', 550, 'tea-country', 'Good', 1, 'available', '/images/teatime-books.jpeg', false),
('The English Book of Teas', 'Rosa Mashiter', 480, 'tea-country', 'Good', 1, 'available', '/images/cookbook-spread.jpeg', false),
('The Secret Book of Gnomes', 'David the Gnome', 550, 'fairytale', 'Good', 1, 'available', '/images/fairytale-gnomes.jpeg', false),
('Art Forms in Nature', 'Ernst Haeckel - TASCHEN', 1500, 'art-nature', 'Very Good', 2, 'available', '/images/haeckel-art.jpeg', true),
('Janet Marsh''s Nature Diary', 'Janet Marsh', 650, 'art-nature', 'Good', 1, 'available', '/images/nature-diary.jpeg', false),
('Island - Diary of a Year', 'Garth & Vicky Waite', 580, 'art-nature', 'Good', 1, 'available', '/images/island-diary.jpeg', false),
('A Contemplation upon Flowers', 'Henry King', 720, 'art-nature', 'Very Good', 1, 'available', '/images/flower-poetry.jpeg', false),
('Flos Solis Maior - Botanical Prints', 'Historical Plates', 1800, 'art-nature', 'Like New', 1, 'available', '/images/hero-botanical.jpeg', true),
('Blackberry Muffins & Country Baking', 'Val Archer', 620, 'cookbooks', 'Good', 1, 'available', '/images/blackberry-muffins.jpeg', false),
('Flora - An Illustrated History', 'Brent Elliott', 980, 'trees-plants', 'Very Good', 1, 'available', '/images/nature-field-guides.jpeg', false),
('Richard Bell''s Britain', 'Richard Bell', 550, 'art-nature', 'Good', 1, 'available', '/images/cornflowers.jpeg', false),
('Poppies, Tulips & Pansies', 'W. Keble Martin', 1100, 'wildflowers', 'Very Good', 1, 'available', '/images/poppy-tulips.jpeg', false),
('Pansies & Dahlias', 'Various', 750, 'garden-roses', 'Good', 1, 'available', '/images/pansies-dahlias.jpeg', false),
('Strawberries, Pears & Crab Apples', 'Marjorie Blamey', 950, 'trees-plants', 'Very Good', 1, 'available', '/images/strawberry-detail.jpeg', false),
('Recording & Painting Flowers', 'Marjorie Blamey', 880, 'art-nature', 'Good', 1, 'available', '/images/painting-flowers.jpeg', false);
