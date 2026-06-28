import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Star, ShoppingCart, Share2, Shield, Truck, RotateCcw, AlertTriangle, Check, ArrowRight } from 'lucide-react';
import { mockProducts, Product } from '../data/products';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist, addNotification } = useApp();

  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);

  const [activeImage, setActiveImage] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({ display: 'none' });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      display: 'block',
      backgroundImage: `url(${activeImage})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: '200%'
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: 'none' });
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images[0],
        seller: product.seller,
        sellerId: product.sellerId
      }, quantity, selectedColor, selectedSize);
      addNotification('Added to Cart', `${product.title} has been added to your cart.`, 'success');
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addToCart({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images[0],
        seller: product.seller,
        sellerId: product.sellerId
      }, quantity, selectedColor, selectedSize);
      navigate('/cart');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    addNotification('Link Copied', 'Product link copied to clipboard.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const getProduct = async () => {
      setLoadingProduct(true);
      // Try mockProducts first
      const mock = mockProducts.find((p) => p.id === id);
      if (mock) {
        setProduct(mock);
        setLoadingProduct(false);
        return;
      }

      // Try database query
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (data && !error) {
          // Parse images
          let imagesArray: string[] = [];
          if (data.images) {
            try {
              const parsed = typeof data.images === 'string' ? JSON.parse(data.images) : data.images;
              imagesArray = Array.isArray(parsed) 
                ? parsed.map((img: any) => typeof img === 'string' ? img : (img.url || '')) 
                : [];
            } catch (e) {
              console.warn('Failed to parse product images:', e);
            }
          }
          if (imagesArray.length === 0) {
            imagesArray = ['https://images.unsplash.com/photo-1578500494198-246f612d3b3d'];
          }

          // Parse variants
          let variants = { colors: [], sizes: [] };
          if (data.variants) {
            try {
              variants = typeof data.variants === 'string' ? JSON.parse(data.variants) : data.variants;
            } catch (e) {
              console.warn('Failed to parse product variants:', e);
            }
          }

          // Parse specifications
          let specifications = {};
          if (data.specifications) {
            try {
              specifications = typeof data.specifications === 'string' ? JSON.parse(data.specifications) : data.specifications;
            } catch (e) {
              console.warn('Failed to parse product specs:', e);
            }
          }

          // Fetch seller store name
          let sellerName = 'Tantra Store';
          try {
            const { data: sellerData } = await supabase
              .from('sellers')
              .select('store_name')
              .eq('id', data.sellerId || data.seller_id)
              .single();
            if (sellerData?.store_name) {
              sellerName = sellerData.store_name;
            }
          } catch (e) {
            console.warn('Failed to fetch seller store name:', e);
          }

          const price = Number(data.price);
          const comparePrice = Number(data.comparePrice || data.compare_price || price * 1.3);
          const discount = comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

          const dbProduct: Product = {
            id: data.id,
            title: data.title,
            seller: sellerName,
            sellerId: data.sellerId || data.seller_id,
            price: price,
            originalPrice: comparePrice,
            discount: discount,
            rating: Number(data.rating || 4.5),
            reviewsCount: Number(data.reviewsCount || data.reviews_count || 0),
            category: data.category || 'General',
            images: imagesArray,
            description: data.description || '',
            stockStatus: data.stock > 5 ? 'In Stock' : data.stock > 0 ? 'Low Stock' : 'Out of Stock',
            stockCount: data.stock || 0,
            variants: variants || { colors: [], sizes: [] },
            specifications: specifications || {},
            reviews: []
          };
          setProduct(dbProduct);
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error('Error fetching product from DB:', err);
        setProduct(null);
      } finally {
        setLoadingProduct(false);
      }
    };

    if (id) {
      getProduct();
    } else {
      setProduct(null);
      setLoadingProduct(false);
    }
  }, [id]);

  useEffect(() => {
    if (product) {
      setActiveImage(product.images[0]);
      setSelectedColor(product.variants?.colors?.[0] ?? '');
      setSelectedSize(product.variants?.sizes?.[0] ?? '');
    }
  }, [product]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return mockProducts
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  }, [product]);

  if (loadingProduct) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-semibold animate-pulse">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <AlertTriangle className="mx-auto text-brand-orange w-16 h-16 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Product Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">The product you are looking for does not exist or has been removed.</p>
        <Link to="/products" className="mt-6 inline-flex items-center gap-2 bg-brand-navy text-white px-6 py-2.5 rounded-lg hover:bg-brand-navy-light transition-colors">
          Browse Products
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const ratingStars = (rating: number) => (
    <div className="flex items-center gap-0.5 text-brand-gold">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={16}
          className={i < Math.floor(rating) ? 'fill-brand-gold' : 'text-gray-300 dark:text-gray-600'}
        />
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
      
      {/* Breadcrumbs */}
      <nav className="text-xs text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-1.5">
        <Link to="/" className="hover:text-brand-orange">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-brand-orange">Products</Link>
        <span>/</span>
        <Link to={`/products?category=${product.category}`} className="hover:text-brand-orange">{product.category}</Link>
        <span>/</span>
        <span className="text-gray-800 dark:text-gray-300 truncate max-w-[200px]">{product.title}</span>
      </nav>

      {/* Main product block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white dark:bg-brand-navy rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-brand-navy-light/10">
        
        {/* Left Column: Image Gallery + Zoom */}
        <div className="space-y-4">
          <div
            className="relative border border-gray-100 dark:border-brand-navy-light/10 rounded-2xl overflow-hidden aspect-square bg-gray-50 dark:bg-brand-navy-dark cursor-zoom-in"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <img
              src={activeImage}
              alt={product.title}
              className="w-full h-full object-contain"
            />
            {/* Zoom panel overlay */}
            <div
              className="absolute inset-0 pointer-events-none border-2 border-brand-orange/20"
              style={{
                ...zoomStyle,
                backgroundRepeat: 'no-repeat',
                zIndex: 10
              }}
            />
          </div>

          {/* Thumbnails row */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 bg-gray-50 dark:bg-brand-navy-dark ${activeImage === img ? 'border-brand-orange' : 'border-gray-100 dark:border-brand-navy-light/10'}`}
                >
                  <img src={img} alt={product.title} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
              {product.title}
            </h1>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs font-semibold bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded">
                Seller: <Link to={`/store/${product.sellerId}`} className="underline font-bold">{product.seller}</Link>
              </span>
              <div className="flex items-center gap-1.5 border-l border-gray-200 dark:border-brand-navy-light/20 pl-3">
                {ratingStars(product.rating)}
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  {product.rating} ({product.reviewsCount} reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gray-50 dark:bg-brand-navy-dark/40 rounded-xl p-4 flex items-center justify-between border border-gray-100 dark:border-brand-navy-light/5">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-brand-navy dark:text-brand-orange">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {product.discount > 0 && (
                  <span className="text-sm text-gray-400 line-through">
                    ₹{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Inclusive of all taxes (GST Support Enabled)</p>
            </div>
            {product.discount > 0 && (
              <span className="bg-green-100 text-green-700 text-sm font-extrabold px-3 py-1.5 rounded-lg">
                Save {product.discount}%
              </span>
            )}
          </div>

          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            {product.description}
          </p>

          {/* Variants selectors */}
          <div className="space-y-4 pt-2">
            {product.variants?.colors && (
              <div>
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Select Color:</span>
                <div className="flex gap-2.5 mt-2">
                  {product.variants.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg border-2 transition-all ${selectedColor === color ? 'border-brand-orange bg-brand-orange/5 text-brand-orange' : 'border-gray-200 dark:border-brand-navy-light/20 text-gray-700 dark:text-gray-300 bg-white dark:bg-brand-navy'}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.variants?.sizes && (
              <div>
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Select Size:</span>
                <div className="flex gap-2.5 mt-2">
                  {product.variants.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-11 h-11 flex items-center justify-center rounded-lg border-2 text-sm font-extrabold transition-all ${selectedSize === size ? 'border-brand-orange bg-brand-orange/5 text-brand-orange' : 'border-gray-200 dark:border-brand-navy-light/20 text-gray-700 dark:text-gray-300 bg-white dark:bg-brand-navy'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stock and Quantity */}
          <div className="flex items-center gap-6 pt-2">
            <div>
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200 block mb-2">Quantity:</span>
              <div className="flex items-center border border-gray-200 dark:border-brand-navy-light/20 rounded-lg overflow-hidden w-28 bg-white dark:bg-brand-navy">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-brand-navy-light flex items-center justify-center"
                >
                  -
                </button>
                <span className="flex-grow text-center font-bold text-sm text-gray-800 dark:text-gray-100">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                  className="w-9 h-9 font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-brand-navy-light flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
            
            <div>
              <span className="text-xs text-gray-400 dark:text-gray-500 block mb-1">Availability Status</span>
              <span className={`inline-flex items-center gap-1 text-sm font-bold ${product.stockStatus === 'In Stock' ? 'text-green-600' : 'text-amber-600'}`}>
                <Check size={16} />
                {product.stockStatus} ({product.stockCount} left)
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3.5 pt-4">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-brand-navy text-white hover:bg-brand-navy-light font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2.5 shadow-md transition-colors"
            >
              <ShoppingCart size={18} />
              Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 bg-brand-orange text-white hover:bg-brand-orange-hover font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              Buy Now
            </button>
            <button
              onClick={() => toggleWishlist(product)}
              className={`p-3 rounded-xl border-2 flex items-center justify-center transition-all ${isInWishlist(product.id) ? 'border-brand-orange bg-brand-orange/5 text-brand-orange' : 'border-gray-200 dark:border-brand-navy-light/20 text-gray-400 hover:bg-gray-50 dark:hover:bg-brand-navy-light/30'}`}
              title="Add to Wishlist"
            >
              <Heart size={20} className={isInWishlist(product.id) ? 'fill-brand-orange' : ''} />
            </button>
            <button
              onClick={handleShare}
              className="p-3 rounded-xl border-2 border-gray-200 dark:border-brand-navy-light/20 text-gray-400 hover:bg-gray-50 dark:hover:bg-brand-navy-light/30 flex items-center justify-center transition-all"
              title="Copy Link"
            >
              <Share2 size={20} />
            </button>
          </div>

          {/* Value Highlights */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-brand-navy-light/10">
            <div className="flex flex-col items-center gap-1">
              <Shield size={18} className="text-brand-orange" />
              <span className="font-semibold text-gray-800 dark:text-gray-300">100% Genuine</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Truck size={18} className="text-brand-orange" />
              <span className="font-semibold text-gray-800 dark:text-gray-300">Fast Shiprocket</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <RotateCcw size={18} className="text-brand-orange" />
              <span className="font-semibold text-gray-800 dark:text-gray-300">7 Days Returns</span>
            </div>
          </div>

        </div>
      </div>

      {/* Specifications & Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        
        {/* Specs Table */}
        <div className="lg:col-span-2 bg-white dark:bg-brand-navy rounded-2xl p-6 border border-gray-100 dark:border-brand-navy-light/10 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-brand-navy-light/10 pb-2.5">
            Technical Specifications
          </h3>
          <div className="overflow-hidden border border-gray-100 dark:border-brand-navy-light/10 rounded-xl">
            <table className="w-full text-left text-sm">
              <tbody>
                {Object.entries(product.specifications).map(([key, val], idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-gray-50 dark:border-brand-navy-light/5 ${idx % 2 === 0 ? 'bg-gray-50/50 dark:bg-brand-navy-dark/30' : 'bg-white dark:bg-brand-navy'}`}
                  >
                    <td className="px-4 py-3 font-bold text-gray-600 dark:text-gray-400 w-2/5">{key}</td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Reviews */}
        <div className="bg-white dark:bg-brand-navy rounded-2xl p-6 border border-gray-100 dark:border-brand-navy-light/10 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-brand-navy-light/10 pb-2.5">
            Customer Reviews
          </h3>
          <div className="space-y-4">
            {product.reviews.map((rev) => (
              <div key={rev.id} className="border-b border-gray-50 dark:border-brand-navy-light/5 pb-3.5 last:border-0 last:pb-0">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-800 dark:text-gray-200">{rev.userName}</span>
                  <span className="text-gray-400">{rev.date}</span>
                </div>
                <div className="mt-1">{ratingStars(rev.rating)}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <div className="mt-12 space-y-6">
          <h3 className="text-xl font-extrabold text-brand-navy dark:text-white border-l-4 border-brand-orange pl-3">
            Related Products you may like
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                className="group bg-white dark:bg-brand-navy rounded-xl border border-gray-100 dark:border-brand-navy-light/10 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-full"
              >
                <div className="aspect-square bg-gray-50 dark:bg-brand-navy-dark overflow-hidden relative">
                  <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute top-2 right-2 text-xs font-extrabold bg-brand-orange text-white px-2 py-0.5 rounded">
                    -{p.discount}%
                  </div>
                </div>
                <div className="p-3.5 flex-grow flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 leading-tight group-hover:text-brand-orange transition-colors">
                      {p.title}
                    </h4>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 block">{p.seller}</span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-sm font-extrabold text-brand-navy dark:text-brand-orange">
                      ₹{p.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-gray-400 line-through">₹{p.originalPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
