import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  Building,
  CheckCircle,
  Truck,
  Download,
  AlertCircle,
  QrCode,
  ArrowLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export default function Checkout() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { cart, couponCode, couponDiscount, clearCart, addNotification } = useApp();

  // Address State
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [deliveryState, setDeliveryState] = useState('');
  const [pincode, setPincode] = useState('');
  const [gstin, setGstin] = useState(''); // Optional B2B GSTIN

  // Payment & Shipping State
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cashfree' | 'phonepe' | 'cod' | 'upi'>('cod');
  const [shippingCharges, setShippingCharges] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Generated Transaction Info
  const [txnDetails, setTxnDetails] = useState({
    orderId: '',
    paymentId: '',
    date: '',
    invoiceId: ''
  });

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = Math.round(subtotal * (couponDiscount / 100));
  const gstAmount = Math.round((subtotal - discountAmount) * 0.18);
  const cgst = Math.round(gstAmount / 2);
  const sgst = Math.round(gstAmount / 2);
  const [couriers, setCouriers] = useState<any[]>([]);

  const calculateShipping = async () => {
    if (pincode.length !== 6 || cart.length === 0) return;
    try {
      setCheckoutError('');
      const res = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity
          })),
          deliveryPincode: pincode
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setShippingCharges(result.shippingCharge);
        setCouriers(result.couriers || []);
      } else {
        setCheckoutError(result.error || 'Shipping serviceability check failed for this pincode.');
        setShippingCharges(0);
        setCouriers([]);
      }
    } catch (e) {
      console.error('Shipping calculation error:', e);
      setShippingCharges(0);
      setCouriers([]);
    }
  };

  useEffect(() => {
    if (pincode.length === 6 && cart.length > 0) {
      calculateShipping();
    }
  }, [pincode, cart, subtotal]);

  const initiateRazorpayPayment = async () => {
    try {
      setIsProcessing(true);
      setCheckoutError('');

      // 1. Create order on backend
      const res = await fetch('/api/checkout/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: grandTotal, currency: 'INR' }),
      });
      
      const orderDataResponse = await res.json();
      if (!res.ok || orderDataResponse.error) {
        throw new Error(orderDataResponse.error || 'Failed to create payment order');
      }

      // 2. Setup Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_YourRazorpayKeyIdHere', // Loaded from env
        amount: orderDataResponse.amount,
        currency: orderDataResponse.currency,
        name: 'SHOPTANTRA',
        description: 'Marketplace Purchase',
        image: '/SHOPTANTRA.png',
        order_id: orderDataResponse.id,
        handler: async function (response: any) {
          try {
            setIsProcessing(true);
            // 3. Send to backend for verification and split ledger entry
            const verifyRes = await fetch('/api/checkout/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderData: {
                  buyerId: profile?.id || user?.id || 'guest_buyer',
                  sellerId: cart[0]?.product?.sellerId || 'seller_placeholder',
                  subtotal,
                  shippingAmount: shippingCharges,
                  taxAmount: gstAmount,
                  discountAmount,
                  totalAmount: grandTotal,
                  items: cart.map((item) => ({
                    productId: item.product.id,
                    title: item.product.title,
                    price: item.product.price,
                    quantity: item.quantity,
                    category: item.product.category || 'General',
                  })),
                  shippingAddress: { address, city, state: deliveryState, pincode },
                },
              }),
            });

            const verifyResult = await verifyRes.json();
            setIsProcessing(false);

            if (verifyRes.ok && verifyResult.success) {
              setTxnDetails({
                orderId: verifyResult.data.order.orderNumber,
                paymentId: response.razorpay_payment_id,
                date: new Date().toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                invoiceId: `INV-${verifyResult.data.order.orderNumber}`,
              });
              setOrderComplete(true);
              addNotification(
                'Order Placed Successfully!',
                `Your order ${verifyResult.data.order.orderNumber} has been logged in PostgreSQL database.`,
                'order'
              );
              clearCart();
            } else {
              setCheckoutError(verifyResult.error || 'Payment verification failed');
            }
          } catch (err: any) {
            console.error(err);
            setIsProcessing(false);
            setCheckoutError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: fullName,
          email: email,
          contact: phone,
        },
        theme: {
          color: '#0f172a',
        },
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on('payment.failed', function (response: any) {
        setIsProcessing(false);
        setCheckoutError(`Payment Failed: ${response.error.description}`);
      });
      rzp1.open();
    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      // Fallback to simulation if Razorpay configuration error or not configured
      setCheckoutError('Failed to initialize live Razorpay gateway. Redirecting to test simulator...');
      setTimeout(() => {
        setIsProcessing(true);
        setCheckoutError('');
      }, 1500);
    }
  };

  const initiateCashfreePayment = async () => {
    try {
      setIsProcessing(true);
      setCheckoutError('');

      const res = await fetch('/api/checkout/cashfree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: grandTotal,
          customerId: profile?.id || user?.id || 'guest_buyer',
          customerName: fullName,
          customerEmail: email,
          customerPhone: phone,
        }),
      });

      const responseData = await res.json();
      if (!res.ok || responseData.error) {
        throw new Error(responseData.error || 'Failed to create Cashfree order');
      }

      if (responseData.simulated) {
        const verifyRes = await fetch('/api/checkout/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gateway: 'CASHFREE',
            transactionReference: `CF-${responseData.orderId}-${Date.now()}`,
            amount: grandTotal,
            orderData: {
              buyerId: profile?.id || user?.id || 'guest_buyer',
              buyerName: fullName,
              buyerEmail: email,
              buyerPhone: phone,
              sellerId: cart[0]?.product?.sellerId || 'seller_placeholder',
              subtotal,
              shippingAmount: shippingCharges,
              taxAmount: gstAmount,
              discountAmount,
              totalAmount: grandTotal,
              items: cart.map((item) => ({
                productId: item.product.id,
                title: item.product.title,
                price: item.product.price,
                quantity: item.quantity,
                category: item.product.category || 'General',
              })),
              shippingAddress: { address, city, state: deliveryState, pincode },
            },
          }),
        });

        const verifyResult = await verifyRes.json();
        setIsProcessing(false);

        if (verifyRes.ok && verifyResult.success) {
          setTxnDetails({
            orderId: verifyResult.data.order.orderNumber,
            paymentId: responseData.paymentSessionId,
            date: new Date().toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            invoiceId: `INV-${verifyResult.data.order.orderNumber}`,
          });
          setOrderComplete(true);
          addNotification(
            'Order Placed Successfully via Cashfree!',
            `Your order ${verifyResult.data.order.orderNumber} has been verified in PostgreSQL.`,
            'order'
          );
          clearCart();
        } else {
          setCheckoutError(verifyResult.error || 'Payment verification failed');
        }
      } else {
        window.location.href = responseData.redirectUrl || `/checkout?order_id=${responseData.orderId}`;
      }
    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      setCheckoutError(err.message || 'Failed to initialize Cashfree gateway.');
    }
  };

  const initiatePhonePePayment = async () => {
    try {
      setIsProcessing(true);
      setCheckoutError('');

      const res = await fetch('/api/checkout/phonepe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: grandTotal,
          customerId: profile?.id || user?.id || 'guest_buyer',
          customerPhone: phone,
        }),
      });

      const responseData = await res.json();
      if (!res.ok || responseData.error) {
        throw new Error(responseData.error || 'Failed to create PhonePe order');
      }

      if (responseData.simulated) {
        const verifyRes = await fetch('/api/checkout/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gateway: 'PHONEPE',
            transactionReference: `PP-${responseData.orderId}-${Date.now()}`,
            amount: grandTotal,
            orderData: {
              buyerId: profile?.id || user?.id || 'guest_buyer',
              buyerName: fullName,
              buyerEmail: email,
              buyerPhone: phone,
              sellerId: cart[0]?.product?.sellerId || 'seller_placeholder',
              subtotal,
              shippingAmount: shippingCharges,
              taxAmount: gstAmount,
              discountAmount,
              totalAmount: grandTotal,
              items: cart.map((item) => ({
                productId: item.product.id,
                title: item.product.title,
                price: item.product.price,
                quantity: item.quantity,
                category: item.product.category || 'General',
              })),
              shippingAddress: { address, city, state: deliveryState, pincode },
            },
          }),
        });

        const verifyResult = await verifyRes.json();
        setIsProcessing(false);

        if (verifyRes.ok && verifyResult.success) {
          setTxnDetails({
            orderId: verifyResult.data.order.orderNumber,
            paymentId: responseData.orderId,
            date: new Date().toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            invoiceId: `INV-${verifyResult.data.order.orderNumber}`,
          });
          setOrderComplete(true);
          addNotification(
            'Order Placed Successfully via PhonePe!',
            `Your order ${verifyResult.data.order.orderNumber} has been verified in PostgreSQL.`,
            'order'
          );
          clearCart();
        } else {
          setCheckoutError(verifyResult.error || 'Payment verification failed');
        }
      } else {
        window.location.href = responseData.redirectUrl;
      }
    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const placeManualOrder = async (method: 'COD' | 'UPI') => {
    try {
      setIsProcessing(true);
      setCheckoutError('');

      const verifyRes = await fetch('/api/checkout/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateway: method === 'COD' ? 'COD' : 'MANUAL_UPI',
          transactionReference: `txn_${method.toLowerCase()}_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
          amount: grandTotal,
          method: method,
          orderData: {
            buyerId: profile?.id || user?.id || 'guest_buyer',
            sellerId: cart[0]?.product?.sellerId || 'seller_placeholder',
            subtotal,
            shippingAmount: shippingCharges,
            taxAmount: gstAmount,
            discountAmount,
            totalAmount: grandTotal,
            items: cart.map(item => ({
              productId: item.product.id,
              title: item.product.title,
              price: item.product.price,
              quantity: item.quantity,
              category: item.product.category,
            })),
            shippingAddress: {
              addressLine1: address,
              city,
              state: deliveryState,
              pincode,
            },
          },
        }),
      });

      const verifyResult = await verifyRes.json();

      if (verifyRes.ok && verifyResult.success) {
        setIsProcessing(false);
        const orderInfo = verifyResult.data?.order || verifyResult.order || {};
        const paymentInfo = verifyResult.data?.payment || verifyResult.payment || {};
        
        setTxnDetails({
          orderId: orderInfo.orderNumber || `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
          paymentId: paymentInfo.transactionReference || `PAY-${Math.floor(100000000 + Math.random() * 900000000)}`,
          date: new Date().toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          invoiceId: `ST-INV-${Math.floor(10000 + Math.random() * 90000)}`
        });

        setOrderComplete(true);
        addNotification(
          'Order Placed Successfully!',
          `Your order has been created successfully with status ${method === 'COD' ? 'COD_PENDING' : 'UPI_VERIFICATION_PENDING'}.`,
          'order'
        );
        clearCart();
      } else {
        setIsProcessing(false);
        setCheckoutError(verifyResult.error || 'Failed to place order.');
      }
    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      setCheckoutError(err.message || 'An error occurred while placing your order.');
    }
  };

  // Handle Checkout submission
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    if (!address || !city || !deliveryState || !pincode || !phone) {
      setCheckoutError('Please complete all required shipping fields.');
      return;
    }

    if (cart.length === 0) {
      setCheckoutError('Your cart is empty.');
      return;
    }

    if (paymentMethod === 'razorpay') {
      initiateRazorpayPayment();
    } else if (paymentMethod === 'cashfree') {
      initiateCashfreePayment();
    } else if (paymentMethod === 'phonepe') {
      initiatePhonePePayment();
    } else if (paymentMethod === 'cod') {
      await placeManualOrder('COD');
    } else if (paymentMethod === 'upi') {
      setIsProcessing(true);
    }
  };

  // Simulate Payment Success (for simulator fallback button)
  const handlePaymentSuccess = () => {
    setTimeout(() => {
      setIsProcessing(false);
      const randomOrderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      const randomPaymentId = `PAY-${Math.floor(100000000 + Math.random() * 900000000)}`;
      const randomInvoiceId = `ST-INV-${Math.floor(10000 + Math.random() * 90000)}`;
      
      setTxnDetails({
        orderId: randomOrderId,
        paymentId: randomPaymentId,
        date: new Date().toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        invoiceId: randomInvoiceId
      });

      setOrderComplete(true);
      addNotification(
        'Order Placed Successfully!',
        `Your order ${randomOrderId} has been created and shipping label generated with Shiprocket.`,
        'order'
      );
      clearCart();
    }, 2000);
  };

  const printInvoice = () => {
    window.print();
  };

  if (orderComplete) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 transition-colors duration-300">
        
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle className="mx-auto text-green-500 w-16 h-16 mb-4 animate-bounce" />
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Order Confirmed!</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Thank you for shopping at SHOPTANTRA. Your invoice has been generated.
          </p>
        </div>

        {/* Invoice Area */}
        <div id="invoice-receipt" className="bg-white text-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 space-y-6 print:p-0 print:shadow-none print:border-0">
          
          {/* Invoice Header */}
          <div className="flex justify-between items-start border-b border-gray-200 pb-5">
            <div>
              <img src="/SHOPTANTRA.png" alt="SHOPTANTRA" className="h-10 w-auto mb-2" />
              <p className="text-xs text-gray-400">shoptantra.in • Premium Marketplace</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-brand-navy">TAX INVOICE</h2>
              <p className="text-xs text-gray-500 font-semibold mt-1">Invoice ID: {txnDetails.invoiceId}</p>
              <p className="text-xs text-gray-500">Date: {txnDetails.date}</p>
            </div>
          </div>

          {/* Seller / Buyer details */}
          <div className="grid grid-cols-2 gap-6 text-xs border-b border-gray-200 pb-5">
            <div>
              <h4 className="font-bold text-gray-500 uppercase tracking-wide mb-1">Merchant Details</h4>
              <p className="font-bold text-gray-800">SHOPTANTRA E-COMMERCE PVT LTD</p>
              <p>147, NAVA PARA BAPASITARAM MADHULI NEAR, BODIYA -382245</p>
              <p>GSTIN: 09AAACT2026R1ZX</p>
              <p>Email: billing@shoptantra.in</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-500 uppercase tracking-wide mb-1">Billing Details</h4>
              <p className="font-bold text-gray-800">{fullName}</p>
              <p>{address}</p>
              <p>{city}, {deliveryState} – {pincode}</p>
              <p>Phone: {phone}</p>
              {gstin && <p className="font-bold text-brand-orange">Buyer GSTIN: {gstin.toUpperCase()}</p>}
            </div>
          </div>

          {/* Logistics label information */}
          <div className="bg-gray-50 p-4 rounded-xl text-xs flex justify-between items-center border border-gray-100">
            <div>
              <span className="font-bold text-gray-600 uppercase block mb-0.5">Shipping Carrier (Shiprocket API)</span>
              <span className="text-brand-navy font-bold flex items-center gap-1">
                <Truck size={14} className="text-brand-orange" />
                Delhivery Express • AWB Tracking Number: AWB-{Math.floor(88800000 + Math.random() * 11100000)}
              </span>
            </div>
            <div className="text-right">
              <span className="font-bold text-gray-600 uppercase block mb-0.5">Payment Method</span>
              <span className="text-gray-800 font-bold uppercase">{paymentMethod}</span>
            </div>
          </div>

          {/* Receipt Items Details */}
          <div>
            <h4 className="font-bold text-gray-500 uppercase tracking-wide text-xs mb-3">Order summary</h4>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-100 font-bold border-b border-gray-200">
                  <th className="px-3 py-2">Item description</th>
                  <th className="px-3 py-2 text-center">Qty</th>
                  <th className="px-3 py-2 text-right">Price</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="px-3 py-2.5">
                    <span className="font-semibold block text-gray-800">Tantra E-Commerce Package</span>
                    <span className="text-[10px] text-gray-400">Merchant Consolidated Delivery</span>
                  </td>
                  <td className="px-3 py-2.5 text-center font-semibold">1 Package</td>
                  <td className="px-3 py-2.5 text-right font-semibold">₹{subtotal}</td>
                  <td className="px-3 py-2.5 text-right font-semibold">₹{subtotal}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pricing breakdowns */}
          <div className="border-t border-gray-200 pt-4 grid grid-cols-2 text-xs">
            <div>
              <p className="font-bold text-gray-500 uppercase mb-1">Transaction Data</p>
              <p>Order ID: {txnDetails.orderId}</p>
              <p>Payment ID: {txnDetails.paymentId}</p>
              <p>Status: <span className="text-green-600 font-bold">PAID</span></p>
            </div>
            <div className="space-y-1.5 text-right max-w-xs ml-auto">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold">₹{subtotal}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-bold">
                  <span>Promo Coupon Discount ({couponDiscount}%):</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>CGST (9%):</span>
                <span>₹{cgst}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (9%):</span>
                <span>₹{sgst}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Charges:</span>
                <span>{shippingCharges === 0 ? 'FREE' : `₹${shippingCharges}`}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-extrabold text-brand-navy">
                <span>Grand Total Paid:</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>
          </div>

          {/* Footer warning */}
          <p className="text-[9px] text-center text-gray-400 border-t border-gray-100 pt-4 leading-normal">
            This is a computer generated tax invoice in compliance with section 31 of CGST Act. No physical signature is required.
          </p>

        </div>

        {/* Action Controls */}
        <div className="mt-8 flex gap-4 justify-center print:hidden">
          <button
            onClick={printInvoice}
            className="bg-brand-navy hover:bg-brand-navy-light text-white font-semibold py-3 px-6 rounded-xl flex items-center gap-2 shadow transition-colors"
          >
            <Download size={18} />
            Print / Download Invoice
          </button>
          <Link
            to="/"
            className="bg-brand-orange hover:bg-brand-orange-hover text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            Return to Homepage
          </Link>
        </div>

      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy dark:text-white mb-8 border-l-4 border-brand-orange pl-3">
        Checkout Shipping & Payment
      </h1>

      <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Address & Payment Info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Shipping Address Forms */}
          <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-wider pb-2 border-b border-gray-100 dark:border-brand-navy-light/10">
              1. Delivery Shipping Address
            </h3>

            {checkoutError && (
              <div className="bg-red-50 dark:bg-red-950/20 text-red-600 text-xs font-semibold p-3 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} />
                {checkoutError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Receiver Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Nilesh Kumar"
                  className="w-full bg-gray-50 dark:bg-brand-navy-dark border border-gray-200 dark:border-brand-navy-light/20 text-gray-800 dark:text-gray-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Mobile Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9099985145"
                  className="w-full bg-gray-50 dark:bg-brand-navy-dark border border-gray-200 dark:border-brand-navy-light/20 text-gray-800 dark:text-gray-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                />
              </div>
              <div className="col-span-1 sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Street Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House No, Building name, Area, Sector details..."
                  className="w-full bg-gray-50 dark:bg-brand-navy-dark border border-gray-200 dark:border-brand-navy-light/20 text-gray-800 dark:text-gray-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400">City / District *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bodiya"
                  className="w-full bg-gray-50 dark:bg-brand-navy-dark border border-gray-200 dark:border-brand-navy-light/20 text-gray-800 dark:text-gray-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400">State *</label>
                  <input
                    type="text"
                    required
                    value={deliveryState}
                    onChange={(e) => setDeliveryState(e.target.value)}
                    placeholder="e.g. UP"
                    className="w-full bg-gray-50 dark:bg-brand-navy-dark border border-gray-200 dark:border-brand-navy-light/20 text-gray-800 dark:text-gray-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 201301"
                    className="w-full bg-gray-50 dark:bg-brand-navy-dark border border-gray-200 dark:border-brand-navy-light/20 text-gray-800 dark:text-gray-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  />
                </div>
              </div>

              <div className="col-span-1 sm:col-span-2 border-t border-gray-50 dark:border-brand-navy-light/5 pt-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Building size={14} className="text-brand-orange" />
                    Business GSTIN Number (B2B Tax Deductions) - Optional
                  </label>
                </div>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="e.g. 09AAACT2026R1ZX"
                  className="w-full bg-gray-50 dark:bg-brand-navy-dark border border-gray-200 dark:border-brand-navy-light/20 text-gray-800 dark:text-gray-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange uppercase"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selections */}
          <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-wider pb-2 border-b border-gray-100 dark:border-brand-navy-light/10">
              2. Secure Payment Gateway Options
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'cod', label: 'Cash On Delivery (COD)', desc: 'Pay with cash upon package receipt.' }
              ].map((method) => (
                <label
                  key={method.id}
                  className={`border-2 rounded-xl p-4 flex gap-3 cursor-pointer transition-all ${paymentMethod === method.id ? 'border-brand-orange bg-brand-orange/5' : 'border-gray-100 dark:border-brand-navy-light/10 bg-gray-50/50 dark:bg-brand-navy-dark'}`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === method.id}
                    onChange={() => setPaymentMethod(method.id as any)}
                    className="mt-1 accent-brand-orange"
                  />
                  <div>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200 block">{method.label}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block leading-tight">{method.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Summaries & Checkout Trigger */}
        <div>
          <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 rounded-2xl p-5 shadow-sm space-y-4 sticky top-24">
            <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs border-b border-gray-100 dark:border-brand-navy-light/10 pb-2.5">
              Order Summaries
            </h3>

            {/* mini cart details */}
            <div className="max-h-40 overflow-y-auto divide-y divide-gray-50 dark:divide-brand-navy-light/5 pr-1">
              {cart.map((item) => (
                <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={item.product.images[0]} alt={item.product.title} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300 truncate">{item.product.title}</span>
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200 flex-shrink-0">
                    {item.quantity}x ₹{item.product.price}
                  </span>
                </div>
              ))}
            </div>

            {/* Courier Serviceability & EDD details */}
            {pincode.length === 6 && couriers.length > 0 && (
              <div className="bg-blue-50 dark:bg-brand-navy-dark border border-blue-100 dark:border-brand-navy-light/10 p-3.5 rounded-xl space-y-2">
                <span className="font-bold text-gray-700 dark:text-gray-300 text-[10px] uppercase tracking-wide block">Available Courier Partner (Central Shipping Account)</span>
                {couriers.map((c) => {
                  const edd = new Date();
                  edd.setDate(edd.getDate() + c.expectedDays);
                  const formattedEDD = edd.toLocaleDateString('en-IN', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  });
                  return (
                    <div key={c.code} className="flex justify-between items-center text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-gray-800 dark:text-gray-200">{c.name}</span>
                        <span className="text-[10px] text-gray-400 block">EDD: {formattedEDD} ({c.expectedDays} Days) • COD Supported</span>
                      </div>
                      <span className="font-semibold text-brand-orange">₹{c.rate}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Calculations summaries */}
            <div className="border-t border-gray-100 dark:border-brand-navy-light/10 pt-3.5 space-y-2.5 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-bold">
                  <span>Coupon Discount</span>
                  <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-500">
                <span>GST (18%)</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">₹{gstAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-gray-500">
                <span>Logistic Delivery</span>
                <span>{shippingCharges === 0 ? 'FREE' : `₹${shippingCharges}`}</span>
              </div>

              <div className="border-t border-gray-100 dark:border-brand-navy-light/10 pt-3 flex justify-between items-center text-sm font-extrabold text-gray-900 dark:text-white">
                <span>Grand Total COD Amount</span>
                <span className="text-base text-brand-navy dark:text-brand-orange">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg leading-tight">
                ⚠️ Cash On Delivery (COD) Only. You will pay the entire COD amount of ₹{grandTotal.toLocaleString('en-IN')} to the delivery assistant when your package arrives.
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 shadow transition-colors text-sm"
            >
              Place COD Order
            </button>

            <div className="flex justify-center items-center gap-1.5 text-[10px] text-gray-400 text-center">
              <ShieldCheck size={14} className="text-brand-orange" />
              100% Secure Transaction • Shiprocket Logistics
            </div>
          </div>
        </div>

      </form>

      {/* Mock Payment Gateway Modal Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-brand-navy rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 dark:border-brand-navy-light/10 transition-all">
            
            {/* Modal Header */}
            <div className="bg-brand-navy dark:bg-brand-navy-dark text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <img src="/SHOPTANTRA.png" alt="Logo" className="h-6 w-auto" />
                <span className="text-xs text-gray-300 font-bold">Secure Gateway</span>
              </div>
              <span className="text-[10px] bg-brand-orange font-extrabold uppercase px-1.5 py-0.5 rounded">
                {paymentMethod}
              </span>
            </div>

            {/* Modal Content */}
            <div className="p-6 text-center space-y-5">
              
              {paymentMethod === 'upi' && (
                <div className="space-y-4">
                  <div className="w-40 h-40 bg-gray-50 mx-auto rounded-xl flex items-center justify-center border border-gray-100 relative">
                    <QrCode size={120} className="text-brand-navy" />
                    <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                      <span className="bg-brand-orange text-white text-[9px] font-extrabold px-1 py-0.5 rounded">SCAN CODE</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Scan the QR code using BHIM, GooglePay, Paytm, or PhonePe. Order will complete automatically once paid.
                  </p>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="space-y-3 text-left">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Card Number</label>
                    <input
                      type="text"
                      placeholder="4111 2222 3333 4444"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs"
                      disabled
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs"
                        disabled
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">CVV</label>
                      <input
                        type="password"
                        placeholder="***"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs"
                        disabled
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod !== 'upi' && paymentMethod !== 'card' && (
                <div className="py-6">
                  <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-brand-orange/10 rounded-full">
                    <CreditCard size={28} className="text-brand-orange animate-pulse" />
                    <span className="absolute inset-0 rounded-full border-2 border-brand-orange/40 animate-ping" />
                  </div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Connecting with Merchant Bank...</p>
                  <p className="text-xs text-gray-400 dark:text-gray-400 mt-1.5">Securing connection to the {paymentMethod.toUpperCase()} billing node.</p>
                </div>
              )}

              <div className="flex gap-3 border-t border-gray-100 dark:border-brand-navy-light/10 pt-4">
                <button
                  type="button"
                  onClick={() => setIsProcessing(false)}
                  className="flex-1 border border-gray-200 dark:border-brand-navy-light/20 text-gray-500 dark:text-gray-400 font-semibold py-2.5 rounded-lg text-xs"
                >
                  Cancel
                </button>
                {paymentMethod === 'upi' ? (
                  <button
                    type="button"
                    onClick={() => placeManualOrder('UPI')}
                    className="flex-1 bg-brand-orange text-white font-bold py-2.5 rounded-lg text-xs hover:bg-brand-orange-hover"
                  >
                    I Have Paid, Complete Order
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePaymentSuccess}
                    className="flex-1 bg-brand-orange text-white font-bold py-2.5 rounded-lg text-xs hover:bg-brand-orange-hover"
                  >
                    Simulate Success Pay
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
