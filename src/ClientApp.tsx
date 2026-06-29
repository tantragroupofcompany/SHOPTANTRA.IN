'use client';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';

import { PublicLayout } from './layouts/PublicLayout';
import { SellerLayout } from './layouts/SellerLayout';
import { BuyerLayout } from './layouts/BuyerLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Public pages
import Home from './views/Home';
import About from './views/About';
import Contact from './views/Contact';
import Privacy from './views/Privacy';
import Terms from './views/Terms';
import Products from './views/Products';
import Sellers from './views/Sellers';
import Plans from './views/Plans';
import NotFound from './views/NotFound';
import ProductDetail from './views/ProductDetail';
import Cart from './views/Cart';
import Checkout from './views/Checkout';
import MobilePreview from './views/MobilePreview';
import Careers from './views/Careers';
import Blog from './views/Blog';
import RefundPolicy from './views/RefundPolicy';
import SellerPolicy from './views/SellerPolicy';
import ShippingPolicy from './views/ShippingPolicy';
import Leadership from './views/Leadership';
import Introduction from './views/Introduction';
import Categories from './views/Categories';
import Deals from './views/Deals';
import Tracking from './views/Tracking';

// Auth pages
import Login from './views/auth/Login';
import Register from './views/auth/Register';
import BuyerRegister from './views/auth/BuyerRegister';
import SellerRegister from './views/auth/SellerRegister';
import ForgotPassword from './views/auth/ForgotPassword';
import ResetPassword from './views/auth/ResetPassword';
import VerifyEmail from './views/auth/VerifyEmail';
import AdminLogin from './views/auth/AdminLogin';

// Vendor store
import StorePage from './views/vendor/StorePage';

// Seller dashboard pages
import SellerDashboard from './views/seller/Dashboard';
import SellerProfile from './views/seller/Profile';
import StoreSettings from './views/seller/StoreSettings';
import SellerProducts from './views/seller/Products';
import ProductUpload from './views/seller/ProductUpload';
import Inventory from './views/seller/Inventory';
import SellerOrders from './views/seller/Orders';
import SellerShipments from './views/seller/Shipments';
import Earnings from './views/seller/Earnings';
import SalesReports from './views/seller/SalesReports';
import SellerAnalytics from './views/seller/Analytics';
import Reviews from './views/seller/Reviews';
import SellerNotifications from './views/seller/Notifications';
import SellerSettings from './views/seller/Settings';
import SellerCoupons from './views/seller/Coupons';

// Buyer dashboard pages
import BuyerDashboard from './views/buyer/Dashboard';
import BuyerProfile from './views/buyer/Profile';
import OrderHistory from './views/buyer/OrderHistory';
import Wishlist from './views/buyer/Wishlist';
import Addresses from './views/buyer/Addresses';
import BuyerNotifications from './views/buyer/Notifications';
import SupportTickets from './views/buyer/SupportTickets';
import Invoices from './views/buyer/Invoices';
import BuyerSettings from './views/buyer/Settings';

// Admin panel pages
import AdminDashboard from './views/admin/Dashboard';
import AdminAnalytics from './views/admin/Analytics';
import AdminRevenue from './views/admin/Revenue';
import AdminUsers from './views/admin/Users';
import AdminSellers from './views/admin/Sellers';
import AdminBuyers from './views/admin/Buyers';
import AdminProducts from './views/admin/Products';
import AdminOrders from './views/admin/Orders';
import AdminShipments from './views/admin/Shipments';
import AdminCategories from './views/admin/Categories';
import AdminLeads from './views/admin/Leads';
import AdminSubscriptions from './views/admin/Subscriptions';
import AdminCMS from './views/admin/CMS';
import AdminRoles from './views/admin/Roles';
import AdminSettings from './views/admin/Settings';
import BlogManagement from './views/admin/BlogManagement';
import AdminReports from './views/admin/Reports';
import AdminSecurityLogs from './views/admin/SecurityLogs';

export default function ClientApp() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route element={<ErrorBoundary><PublicLayout /></ErrorBoundary>}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="products" element={<Products />} />
              <Route path="sellers" element={<Sellers />} />
              <Route path="plans" element={<Plans />} />
              <Route path="store/:sellerId" element={<StorePage />} />
              <Route path="product/:id" element={<ProductDetail />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="mobile-preview" element={<MobilePreview />} />
              <Route path="careers" element={<Careers />} />
              <Route path="blog" element={<Blog />} />
              <Route path="refund-policy" element={<RefundPolicy />} />
              <Route path="seller-policy" element={<SellerPolicy />} />
              <Route path="shipping-policy" element={<ShippingPolicy />} />
              <Route path="leadership" element={<Leadership />} />
              <Route path="introduction" element={<Introduction />} />
              <Route path="categories" element={<Categories />} />
              <Route path="deals" element={<Deals />} />
              <Route path="tracking" element={<Tracking />} />
            </Route>

            {/* Auth routes */}
            <Route path="login" element={<Login />} />
            <Route path="admin-login" element={<AdminLogin />} />
            <Route path="register" element={<Register />} />
            <Route path="register/buyer" element={<BuyerRegister />} />
            <Route path="register/seller" element={<SellerRegister />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/seller/verify-email" element={<VerifyEmail />} />
            <Route path="/about" element={<About />} />

            {/* Seller dashboard routes */}
            <Route path="seller" element={<ErrorBoundary><SellerLayout /></ErrorBoundary>}>
              <Route index element={<SellerDashboard />} />
              <Route path="profile" element={<SellerProfile />} />
              <Route path="profiles" element={<SellerProfile />} />
              <Route path="store" element={<StoreSettings />} />
              <Route path="store-settings" element={<StoreSettings />} />
              <Route path="store-setting" element={<StoreSettings />} />
              <Route path="store_settings" element={<StoreSettings />} />
              <Route path="store settings" element={<StoreSettings />} />
              <Route path="store setting" element={<StoreSettings />} />
              <Route path="products" element={<SellerProducts />} />
              <Route path="product" element={<SellerProducts />} />
              <Route path="products/new" element={<ProductUpload />} />
              <Route path="products-new" element={<ProductUpload />} />
              <Route path="add-product" element={<ProductUpload />} />
              <Route path="products/add" element={<ProductUpload />} />
              <Route path="add product" element={<ProductUpload />} />
              <Route path="add_product" element={<ProductUpload />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="orders" element={<SellerOrders />} />
              <Route path="order" element={<SellerOrders />} />
              <Route path="shipments" element={<SellerShipments />} />
              <Route path="earnings" element={<Earnings />} />
              <Route path="earning" element={<Earnings />} />
              <Route path="earing" element={<Earnings />} />
              <Route path="reports" element={<SalesReports />} />
              <Route path="report" element={<SalesReports />} />
              <Route path="sales-report" element={<SalesReports />} />
              <Route path="sales-reports" element={<SalesReports />} />
              <Route path="sales report" element={<SalesReports />} />
              <Route path="sales reports" element={<SalesReports />} />
              <Route path="analytics" element={<SellerAnalytics />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="review" element={<Reviews />} />
              <Route path="notifications" element={<SellerNotifications />} />
              <Route path="settings" element={<SellerSettings />} />
              <Route path="setting" element={<SellerSettings />} />
              <Route path="coupons" element={<SellerCoupons />} />
              <Route path="coupon" element={<SellerCoupons />} />
            </Route>

            {/* Buyer dashboard routes */}
            <Route path="buyer" element={<ErrorBoundary><BuyerLayout /></ErrorBoundary>}>
              <Route index element={<BuyerDashboard />} />
              <Route path="profile" element={<BuyerProfile />} />
              <Route path="orders" element={<OrderHistory />} />
              <Route path="wishlist" element={<Wishlist />} />
              <Route path="addresses" element={<Addresses />} />
              <Route path="notifications" element={<BuyerNotifications />} />
              <Route path="tickets" element={<SupportTickets />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="settings" element={<BuyerSettings />} />
            </Route>

            {/* Admin panel routes */}
            <Route path="admin" element={<ErrorBoundary><AdminLayout /></ErrorBoundary>}>
              <Route index element={<AdminDashboard />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="revenue" element={<AdminRevenue />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="sellers" element={<AdminSellers />} />
              <Route path="buyers" element={<AdminBuyers />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="shipments" element={<AdminShipments />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="leads" element={<AdminLeads />} />
              <Route path="subscriptions" element={<AdminSubscriptions />} />
              <Route path="cms" element={<AdminCMS />} />
              <Route path="roles" element={<AdminRoles />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="blog-management" element={<BlogManagement />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="security-logs" element={<AdminSecurityLogs />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
