import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Tag, ArrowRight, ArrowLeft, ShieldCheck, Ticket } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Cart() {
  const navigate = useNavigate();
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    couponCode,
    couponDiscount,
    applyCoupon
  } = useApp();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    
    if (!couponInput.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    const success = applyCoupon(couponInput.trim());
    if (success) {
      setCouponSuccess(`Success! Coupon applied.`);
      setCouponInput('');
    } else {
      setCouponError('Invalid coupon code. Try WELCOME or SHOPTANTRA10.');
    }
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discountAmount = Math.round(subtotal * (couponDiscount / 100));
  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Tax (18% GST split: 9% CGST + 9% SGST)
  const gstRate = 0.18;
  const gstAmount = Math.round((subtotal - discountAmount) * gstRate);
  const cgst = Math.round(gstAmount / 2);
  const sgst = Math.round(gstAmount / 2);

  // Shipping (Free above ₹999, else ₹99)
  const shippingCharges = subtotal > 999 || subtotal === 0 ? 0 : 99;
   
  // Grand total
  const grandTotal = subtotal - discountAmount + gstAmount + shippingCharges;

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart size={36} className="text-brand-orange" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-800 dark:text-gray-200">Your Cart is Empty</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">Looks like you haven't added anything to your cart yet. Browse our products to start shopping!</p>
        <Link to="/products" className="mt-8 inline-flex items-center gap-2 bg-brand-orange text-white font-semibold px-6 py-3 rounded-lg hover:bg-brand-orange-hover transition-colors shadow-sm">
          <ArrowLeft size={16} />
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy dark:text-white mb-8 border-l-4 border-brand-orange pl-3">
        Shopping Cart
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="hidden sm:grid grid-cols-12 gap-4 bg-gray-50 dark:bg-brand-navy-dark px-6 py-3 border-b border-gray-100 dark:border-brand-navy-light/10 text-xs font-bold text-gray-500 uppercase">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-brand-navy-light/5">
              {cart.map((item) => (
                <div key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`} className="grid grid-cols-1 sm:grid-cols-12 gap-4 px-6 py-5 items-center">
                  
                  {/* Image & Title */}
                  <div className="col-span-6 flex gap-4">
                    <img src={item.product.images?.[0]} alt={item.product.title} className="w-16 h-16 rounded-xl object-cover border border-gray-100 dark:border-brand-navy-light/10 bg-gray-100" />
                    <div className="flex-grow min-w-0">
                      <Link to={`/product/${item.product.id}`} className="font-bold text-gray-900 dark:text-gray-100 text-sm hover:text-brand-orange line-clamp-2 leading-tight">
                        {item.product.title}
                      </Link>
                      <p className="text-xs text-gray-400 mt-1">Seller: {item.product.seller}</p>
                      
                      {/* Variants indicators */}
                      {(item.selectedColor || item.selectedSize) && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.selectedColor && (
                            <span className="text-[10px] bg-gray-100 dark:bg-brand-navy-light/30 text-gray-600 dark:text-gray-300 font-semibold px-2 py-0.5 rounded">
                              Color: {item.selectedColor}
                            </span>
                          )}
                          {item.selectedSize && (
                            <span className="text-[10px] bg-gray-100 dark:bg-brand-navy-light/30 text-gray-600 dark:text-gray-300 font-semibold px-2 py-0.5 rounded">
                              Size: {item.selectedSize}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="col-span-2 flex justify-center">
                    <div className="flex items-center border border-gray-200 dark:border-brand-navy-light/20 rounded-lg overflow-hidden bg-white dark:bg-brand-navy">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1, item.selectedColor, item.selectedSize)}
                        className="w-7 h-7 font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-brand-navy-light flex items-center justify-center text-xs"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-gray-800 dark:text-gray-100">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1, item.selectedColor, item.selectedSize)}
                        className="w-7 h-7 font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-brand-navy-light flex items-center justify-center text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-span-2 text-right sm:text-right flex sm:block justify-between items-center text-sm">
                    <span className="sm:hidden text-xs text-gray-400">Unit Price:</span>
                    <span className="font-semibold text-gray-600 dark:text-gray-300">₹{item.product.price.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Line Total & Remove */}
                  <div className="col-span-2 text-right flex sm:block justify-between items-center text-sm">
                    <span className="sm:hidden text-xs text-gray-400">Total:</span>
                    <div className="flex items-center justify-end gap-3">
                      <span className="font-extrabold text-brand-navy dark:text-brand-orange">
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.product.id, item.selectedColor, item.selectedSize)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 p-1.5 rounded-lg transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Continue shopping button */}
          <Link to="/products" className="inline-flex items-center gap-2 text-brand-orange font-bold text-sm hover:underline">
            <ArrowLeft size={16} />
            Continue Shopping
          </Link>
        </div>

        {/* Right: Coupon + Price Summary */}
        <div className="space-y-6">
          
          {/* Coupon Code Block */}
          <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
              <Ticket className="text-brand-orange" size={18} />
              Have a Promo Coupon?
            </h3>
            
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Code (e.g. WELCOME)"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                className="flex-grow bg-gray-50 dark:bg-brand-navy-dark border border-gray-200 dark:border-brand-navy-light/20 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
              />
              <button
                type="submit"
                className="bg-brand-navy hover:bg-brand-navy-light text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Apply
              </button>
            </form>

            {couponError && <p className="text-xs text-red-500 font-semibold">{couponError}</p>}
            {couponSuccess && <p className="text-xs text-green-600 font-semibold">{couponSuccess}</p>}
            
            {couponCode && (
              <div className="bg-green-50 dark:bg-green-950/15 border border-green-200 dark:border-green-900/30 rounded-lg px-3 py-2 flex items-center justify-between text-xs text-green-700 dark:text-green-400">
                <span className="flex items-center gap-1.5 font-bold">
                  <Tag size={12} />
                  Active Code: {couponCode}
                </span>
                <span className="font-extrabold">({couponDiscount}% OFF)</span>
              </div>
            )}
          </div>

          {/* Pricing summary breakdown */}
          <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs border-b border-gray-100 dark:border-brand-navy-light/10 pb-2.5">
              Invoice Summary
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Subtotal ({cartItemsCount} items)</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({couponDiscount}%)</span>
                  <span className="font-bold">-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>CGST (9%)</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">₹{cgst.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>SGST (9%)</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">₹{sgst.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Shipping Fee</span>
                {shippingCharges === 0 ? (
                  <span className="text-green-600 font-bold">FREE</span>
                ) : (
                  <span className="font-semibold text-gray-800 dark:text-gray-200">₹{shippingCharges}</span>
                )}
              </div>

              <div className="border-t border-gray-100 dark:border-brand-navy-light/10 pt-3 flex justify-between items-center text-base font-extrabold text-gray-900 dark:text-white">
                <span>Total Amount</span>
                <span className="text-lg text-brand-navy dark:text-brand-orange">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors text-sm"
            >
              Proceed to Checkout
              <ArrowRight size={16} />
            </button>

            <div className="flex justify-center items-center gap-1.5 text-[11px] text-gray-400 text-center">
              <ShieldCheck size={14} className="text-brand-orange" />
              Secure payments powered by Razorpay & Cashfree
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
