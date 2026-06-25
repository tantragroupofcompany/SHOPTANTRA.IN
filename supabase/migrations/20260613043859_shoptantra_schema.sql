
-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role text NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
  full_name text,
  phone text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin_select_all_profiles" ON profiles FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- Product categories
CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  parent_id uuid REFERENCES product_categories(id),
  icon text,
  image_url text,
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_categories" ON product_categories FOR SELECT USING (true);
CREATE POLICY "insert_categories" ON product_categories FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "update_categories" ON product_categories FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "delete_categories" ON product_categories FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- Sellers table
CREATE TABLE IF NOT EXISTS sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  store_name text NOT NULL,
  store_description text,
  store_logo_url text,
  store_banner_url text,
  business_type text,
  gst_number text,
  pan_number text,
  bank_account_number text,
  bank_ifsc text,
  bank_account_name text,
  category_id uuid REFERENCES product_categories(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
  is_verified boolean DEFAULT false,
  commission_rate numeric(5,2) DEFAULT 10.00,
  total_earnings numeric(12,2) DEFAULT 0,
  pending_payout numeric(12,2) DEFAULT 0,
  total_orders int DEFAULT 0,
  total_products int DEFAULT 0,
  rating numeric(3,2) DEFAULT 0,
  rating_count int DEFAULT 0,
  address text,
  city text,
  state text,
  pincode text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_seller" ON sellers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_seller" ON sellers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_seller" ON sellers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete_own_seller" ON sellers FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "public_select_active_sellers" ON sellers FOR SELECT USING (status = 'active');
CREATE POLICY "admin_manage_sellers" ON sellers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
  category_id uuid REFERENCES product_categories(id),
  title text NOT NULL,
  slug text UNIQUE,
  description text,
  short_description text,
  price numeric(10,2) NOT NULL,
  compare_price numeric(10,2),
  sku text,
  barcode text,
  stock int DEFAULT 0,
  low_stock_alert int DEFAULT 5,
  weight numeric(8,2),
  dimensions text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'rejected', 'archived')),
  is_approved boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  tags text[],
  total_sales int DEFAULT 0,
  total_views int DEFAULT 0,
  rating numeric(3,2) DEFAULT 0,
  rating_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_active_products" ON products FOR SELECT USING (status = 'active' AND is_approved = true);
CREATE POLICY "select_own_products" ON products FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM sellers s WHERE s.id = products.seller_id AND s.user_id = auth.uid()));
CREATE POLICY "insert_own_products" ON products FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM sellers s WHERE s.id = seller_id AND s.user_id = auth.uid()));
CREATE POLICY "update_own_products" ON products FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM sellers s WHERE s.id = products.seller_id AND s.user_id = auth.uid()));
CREATE POLICY "delete_own_products" ON products FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM sellers s WHERE s.id = products.seller_id AND s.user_id = auth.uid()));
CREATE POLICY "admin_manage_products" ON products FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- Product images
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text,
  is_primary boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_product_images" ON product_images FOR SELECT USING (true);
CREATE POLICY "insert_product_images" ON product_images FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM products pr JOIN sellers s ON s.id = pr.seller_id WHERE pr.id = product_id AND s.user_id = auth.uid()));
CREATE POLICY "update_product_images" ON product_images FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM products pr JOIN sellers s ON s.id = pr.seller_id WHERE pr.id = product_id AND s.user_id = auth.uid()));
CREATE POLICY "delete_product_images" ON product_images FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM products pr JOIN sellers s ON s.id = pr.seller_id WHERE pr.id = product_id AND s.user_id = auth.uid()));

-- Product variants
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  value text NOT NULL,
  price_adjustment numeric(10,2) DEFAULT 0,
  stock int DEFAULT 0,
  sku text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_variants" ON product_variants FOR SELECT USING (true);
CREATE POLICY "insert_variants" ON product_variants FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM products pr JOIN sellers s ON s.id = pr.seller_id WHERE pr.id = product_id AND s.user_id = auth.uid()));
CREATE POLICY "update_variants" ON product_variants FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM products pr JOIN sellers s ON s.id = pr.seller_id WHERE pr.id = product_id AND s.user_id = auth.uid()));
CREATE POLICY "delete_variants" ON product_variants FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM products pr JOIN sellers s ON s.id = pr.seller_id WHERE pr.id = product_id AND s.user_id = auth.uid()));

-- Addresses
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  label text DEFAULT 'Home',
  full_name text,
  phone text,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  country text DEFAULT 'India',
  pincode text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_addresses" ON addresses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_addresses" ON addresses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_addresses" ON addresses FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete_own_addresses" ON addresses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE DEFAULT 'ST-' || to_char(now(), 'YYYYMMDD') || '-' || floor(random() * 90000 + 10000)::text,
  buyer_id uuid REFERENCES auth.users(id),
  seller_id uuid REFERENCES sellers(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method text,
  subtotal numeric(12,2) NOT NULL,
  discount_amount numeric(12,2) DEFAULT 0,
  shipping_amount numeric(12,2) DEFAULT 0,
  tax_amount numeric(12,2) DEFAULT 0,
  total_amount numeric(12,2) NOT NULL,
  shipping_address jsonb,
  notes text,
  tracking_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_orders_buyer" ON orders FOR SELECT TO authenticated USING (auth.uid() = buyer_id);
CREATE POLICY "select_own_orders_seller" ON orders FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM sellers s WHERE s.id = orders.seller_id AND s.user_id = auth.uid()));
CREATE POLICY "insert_own_orders" ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "update_own_orders" ON orders FOR UPDATE TO authenticated USING (auth.uid() = buyer_id OR EXISTS (SELECT 1 FROM sellers s WHERE s.id = orders.seller_id AND s.user_id = auth.uid()));

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  variant_id uuid REFERENCES product_variants(id),
  title text NOT NULL,
  price numeric(10,2) NOT NULL,
  quantity int NOT NULL,
  total numeric(10,2) NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_order_items_buyer" ON order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.buyer_id = auth.uid()));
CREATE POLICY "select_order_items_seller" ON order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM orders o JOIN sellers s ON s.id = o.seller_id WHERE o.id = order_id AND s.user_id = auth.uid()));
CREATE POLICY "insert_order_items" ON order_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.buyer_id = auth.uid()));
CREATE POLICY "update_order_items" ON order_items FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.buyer_id = auth.uid()));

-- Wishlists
CREATE TABLE IF NOT EXISTS wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_wishlist" ON wishlists FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_wishlist" ON wishlists FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_wishlist" ON wishlists FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete_own_wishlist" ON wishlists FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES sellers(id),
  buyer_id uuid REFERENCES auth.users(id),
  order_id uuid REFERENCES orders(id),
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text,
  images text[],
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  seller_response text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_approved_reviews" ON reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "select_own_reviews_buyer" ON reviews FOR SELECT TO authenticated USING (auth.uid() = buyer_id);
CREATE POLICY "insert_own_reviews" ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "update_own_reviews" ON reviews FOR UPDATE TO authenticated USING (auth.uid() = buyer_id);
CREATE POLICY "delete_own_reviews" ON reviews FOR DELETE TO authenticated USING (auth.uid() = buyer_id);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  company text,
  source text DEFAULT 'website' CHECK (source IN ('website', 'referral', 'social', 'email', 'phone', 'other')),
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to uuid REFERENCES auth.users(id),
  notes text,
  follow_up_date timestamptz,
  converted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_leads" ON leads FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'seller')));
CREATE POLICY "insert_leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "update_leads" ON leads FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'seller')));
CREATE POLICY "delete_leads" ON leads FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- Lead notes
CREATE TABLE IF NOT EXISTS lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id),
  note text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_lead_notes" ON lead_notes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'seller')));
CREATE POLICY "insert_lead_notes" ON lead_notes FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'seller')));
CREATE POLICY "update_lead_notes" ON lead_notes FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "delete_lead_notes" ON lead_notes FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- Subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price_monthly numeric(10,2) NOT NULL DEFAULT 0,
  price_yearly numeric(10,2) NOT NULL DEFAULT 0,
  max_products int DEFAULT 10,
  max_orders int DEFAULT 100,
  commission_rate numeric(5,2) DEFAULT 10,
  features jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_plans" ON subscription_plans FOR SELECT USING (is_active = true);
CREATE POLICY "insert_plans" ON subscription_plans FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "update_plans" ON subscription_plans FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "delete_plans" ON subscription_plans FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES subscription_plans(id),
  billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'trial')),
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  amount_paid numeric(10,2) DEFAULT 0,
  payment_method text,
  transaction_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_subscriptions" ON subscriptions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM sellers s WHERE s.id = subscriptions.seller_id AND s.user_id = auth.uid()));
CREATE POLICY "insert_own_subscriptions" ON subscriptions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM sellers s WHERE s.id = seller_id AND s.user_id = auth.uid()));
CREATE POLICY "update_own_subscriptions" ON subscriptions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM sellers s WHERE s.id = subscriptions.seller_id AND s.user_id = auth.uid()));
CREATE POLICY "delete_own_subscriptions" ON subscriptions FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM sellers s WHERE s.id = subscriptions.seller_id AND s.user_id = auth.uid()));
CREATE POLICY "admin_manage_subscriptions" ON subscriptions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'order', 'payment', 'review')),
  is_read boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE DEFAULT 'TKT-' || floor(random() * 900000 + 100000)::text,
  user_id uuid REFERENCES auth.users(id),
  subject text NOT NULL,
  message text NOT NULL,
  category text DEFAULT 'general',
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_tickets" ON support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_tickets" ON support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_tickets" ON support_tickets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete_own_tickets" ON support_tickets FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admin_manage_tickets" ON support_tickets FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- Commissions
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  seller_id uuid REFERENCES sellers(id),
  order_amount numeric(12,2) NOT NULL,
  commission_rate numeric(5,2) NOT NULL,
  commission_amount numeric(12,2) NOT NULL,
  seller_payout numeric(12,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_commissions" ON commissions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM sellers s WHERE s.id = commissions.seller_id AND s.user_id = auth.uid()));
CREATE POLICY "insert_own_commissions" ON commissions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_own_commissions" ON commissions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_own_commissions" ON commissions FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- Payouts
CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  payment_method text,
  transaction_id text,
  notes text,
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_payouts" ON payouts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM sellers s WHERE s.id = payouts.seller_id AND s.user_id = auth.uid()));
CREATE POLICY "insert_own_payouts" ON payouts FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM sellers s WHERE s.id = seller_id AND s.user_id = auth.uid()));
CREATE POLICY "update_own_payouts" ON payouts FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM sellers s WHERE s.id = payouts.seller_id AND s.user_id = auth.uid()));
CREATE POLICY "delete_own_payouts" ON payouts FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

-- Insert default subscription plans
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, max_products, max_orders, commission_rate, features, sort_order) VALUES
('Free', 'free', 'Perfect for getting started', 0, 0, 10, 50, 15, '["10 Products", "50 Orders/month", "Basic Analytics", "Email Support"]', 1),
('Starter', 'starter', 'For growing businesses', 999, 9999, 100, 500, 12, '["100 Products", "500 Orders/month", "Advanced Analytics", "Priority Support", "Custom Store URL"]', 2),
('Professional', 'professional', 'For established sellers', 2999, 29999, 1000, 5000, 8, '["1000 Products", "5000 Orders/month", "Full Analytics Suite", "24/7 Support", "API Access", "Bulk Upload"]', 3),
('Enterprise', 'enterprise', 'For large scale operations', 9999, 99999, -1, -1, 5, '["Unlimited Products", "Unlimited Orders", "Custom Analytics", "Dedicated Account Manager", "Custom Integration", "White Label"]', 4);

-- Insert default categories
INSERT INTO product_categories (name, slug, description, sort_order) VALUES
('Electronics', 'electronics', 'Electronic devices and accessories', 1),
('Fashion', 'fashion', 'Clothing, shoes and accessories', 2),
('Home & Garden', 'home-garden', 'Home decor and garden items', 3),
('Sports & Outdoors', 'sports-outdoors', 'Sports equipment and outdoor gear', 4),
('Books', 'books', 'Books, magazines and educational material', 5),
('Beauty & Health', 'beauty-health', 'Beauty products and health supplements', 6),
('Food & Beverages', 'food-beverages', 'Food items and beverages', 7),
('Toys & Games', 'toys-games', 'Toys, games and hobby items', 8),
('Automotive', 'automotive', 'Car accessories and automotive parts', 9),
('Industrial', 'industrial', 'Industrial tools and supplies', 10);
