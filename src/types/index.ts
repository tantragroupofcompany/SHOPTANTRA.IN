export type UserRole = 'buyer' | 'seller' | 'admin';

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Seller {
  id: string;
  user_id: string;
  store_name: string;
  store_description: string | null;
  store_logo_url: string | null;
  store_banner_url: string | null;
  business_type: string | null;
  gst_number: string | null;
  pan_number: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_account_name: string | null;
  category_id: string | null;
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  is_verified: boolean;
  commission_rate: number;
  total_earnings: number;
  pending_payout: number;
  total_orders: number;
  total_products: number;
  rating: number;
  rating_count: number;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  icon: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  category_id: string | null;
  title: string;
  slug: string | null;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_price: number | null;
  sku: string | null;
  barcode: string | null;
  stock: number;
  low_stock_alert: number;
  weight: number | null;
  dimensions: string | null;
  status: 'draft' | 'pending' | 'active' | 'rejected' | 'archived';
  is_approved: boolean;
  is_featured: boolean;
  tags: string[] | null;
  total_sales: number;
  total_views: number;
  rating: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
  product_images?: ProductImage[];
  product_categories?: ProductCategory;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  value: string;
  price_adjustment: number;
  stock: number;
  sku: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  full_name: string | null;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  is_default: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
  seller_id: string;
  seller_name?: string;
  seller_logo_url?: string | null;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string | null;
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  tax_amount: number;
  total_amount: number;
  shipping_address: Record<string, string> | null;
  notes: string | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  title: string;
  price: number;
  quantity: number;
  total: number;
  image_url: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  seller_id: string;
  buyer_id: string;
  order_id: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[] | null;
  status: 'pending' | 'approved' | 'rejected';
  seller_response: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: 'website' | 'referral' | 'social' | 'email' | 'phone' | 'other';
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  priority: 'low' | 'medium' | 'high';
  assigned_to: string | null;
  notes: string | null;
  follow_up_date: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  author_id: string;
  note: string;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  max_products: number;
  max_orders: number;
  commission_rate: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  seller_id: string;
  plan_id: string;
  billing_cycle: 'monthly' | 'yearly';
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  start_date: string;
  end_date: string | null;
  amount_paid: number;
  payment_method: string | null;
  transaction_id: string | null;
  created_at: string;
  subscription_plans?: SubscriptionPlan;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'order' | 'payment' | 'review';
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  subject: string;
  message: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payout {
  id: string;
  seller_id: string;
  amount: number;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  payment_method: string | null;
  transaction_id: string | null;
  notes: string | null;
  requested_at: string;
  processed_at: string | null;
  created_at: string;
}

export interface Commission {
  id: string;
  order_id: string;
  seller_id: string;
  order_amount: number;
  commission_rate: number;
  commission_amount: number;
  seller_payout: number;
  status: 'pending' | 'processed' | 'paid';
  created_at: string;
}
