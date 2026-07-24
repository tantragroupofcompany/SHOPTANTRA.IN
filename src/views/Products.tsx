import { useState, useMemo, useEffect } from 'react';
import { Heart, Star, Search, ChevronDown, Sparkles } from 'lucide-react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { mockProducts, CATEGORIES_LIST, Product } from '../data/products';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toggleWishlist, isInWishlist } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPrice, setSelectedPrice] = useState<{ min: number; max: number } | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDbProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*');

        if (data && !error) {
          const formatted: Product[] = [];
          for (const item of data) {
            let imagesArray: string[] = [];
            if (item.images) {
              try {
                const parsed = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
                imagesArray = Array.isArray(parsed) 
                  ? parsed.map((img: any) => typeof img === 'string' ? img : (img.url || '')) 
                  : [];
              } catch (e) {
                console.warn('Failed to parse catalog product images:', e);
              }
            }
            if (imagesArray.length === 0) {
              imagesArray = ['https://images.unsplash.com/photo-1578500494198-246f612d3b3d'];
            }

            let variants = { colors: [], sizes: [] };
            if (item.variants) {
              try {
                variants = typeof item.variants === 'string' ? JSON.parse(item.variants) : item.variants;
              } catch (e) {
                console.warn('Failed to parse catalog product variants:', e);
              }
            }

            let specifications = {};
            if (item.specifications) {
              try {
                specifications = typeof item.specifications === 'string' ? JSON.parse(item.specifications) : item.specifications;
              } catch (e) {
                console.warn('Failed to parse catalog product specifications:', e);
              }
            }

            // Get seller store name
            let sellerName = 'Tantra Store';
            try {
              const { data: sellerData } = await supabase
                .from('sellers')
                .select('store_name')
                .eq('id', item.sellerId || item.seller_id)
                .single();
              if (sellerData?.store_name) {
                sellerName = sellerData.store_name;
              }
            } catch (e) {
              console.warn('Failed to fetch catalog product seller:', e);
            }

            const price = Number(item.price);
            const comparePrice = Number(item.comparePrice || item.compare_price || price * 1.3);
            const discount = comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

            formatted.push({
              id: item.id,
              title: item.title,
              seller: sellerName,
              sellerId: item.sellerId || item.seller_id,
              price: price,
              originalPrice: comparePrice,
              discount: discount,
              rating: Number(item.rating || 4.5),
              reviewsCount: Number(item.reviewsCount || item.reviews_count || 0),
              category: item.category || 'General',
              images: imagesArray,
              description: item.description || '',
              stockStatus: item.stock > 5 ? 'In Stock' : item.stock > 0 ? 'Low Stock' : 'Out of Stock',
              stockCount: item.stock || 0,
              variants: variants || { colors: [], sizes: [] },
              specifications: specifications || {},
              reviews: []
            });
          }
          setDbProducts(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch products from DB:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDbProducts();
  }, []);

  // Sync category and search query from URL search parameters
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory('All');
    }

    if (searchParam) {
      setSearchQuery(searchParam);
    } else {
      setSearchQuery('');
    }
    setCurrentPage(1);
  }, [searchParams]);

  const priceRanges = [
    { label: 'Under ₹1,000', min: 0, max: 1000 },
    { label: '₹1,000 - ₹3,000', min: 1000, max: 3000 },
    { label: '₹3,000 - ₹10,000', min: 3000, max: 10000 },
    { label: '₹10,000+', min: 10000, max: Infinity }
  ];

  const ratingFilters = [
    { label: '4★ & above', rating: 4 },
    { label: '3★ & above', rating: 3 },
    { label: '2★ & above', rating: 2 }
  ];

  // Filters calculation
  const allProducts = useMemo(() => {
    return [...mockProducts, ...dbProducts];
  }, [dbProducts]);

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.seller.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    // Category
    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Price
    if (selectedPrice) {
      result = result.filter(
        (p) => p.price >= selectedPrice.min && p.price <= selectedPrice.max
      );
    }

    // Rating
    if (selectedRating) {
      result = result.filter((p) => p.rating >= selectedRating);
    }

    // Sorting
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [allProducts, searchQuery, selectedCategory, selectedPrice, selectedRating, sortBy]);

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredProducts, currentPage]);

  const ratingStars = (rating: number) => (
    <div className="flex items-center gap-0.5 text-brand-gold">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < Math.floor(rating) ? 'fill-brand-gold text-brand-gold' : 'text-gray-200 dark:text-gray-700'}
        />
      ))}
    </div>
  );

  const clearAllFilters = () => {
    setSearchParams({});
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedPrice(null);
    setSelectedRating(null);
    setSortBy('newest');
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
      
      {/* Page Title & Counter */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy dark:text-white border-l-4 border-brand-orange pl-3">
            Product Catalog
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Showing {filteredProducts.length} premium items derived from Indian manufacturers
          </p>
        </div>

        {/* Sorting selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white dark:bg-brand-navy border border-gray-200 dark:border-brand-navy-light/25 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange"
          >
            <option value="newest">Featured Arrivals</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Customer Rating</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1">
        {/* Products Grid - Full Width */}
        <div className="space-y-6">
          {paginatedProducts.length === 0 ? (
            <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 rounded-2xl p-12 text-center shadow-sm">
              <p className="text-base text-gray-500 dark:text-gray-400 font-bold">No Products Match Your Filters</p>
              <button
                onClick={clearAllFilters}
                className="bg-brand-orange text-white font-bold py-2.5 px-6 rounded-lg text-xs mt-4 hover:bg-brand-orange-hover transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {paginatedProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/product/${p.id}`)}
                    className="group bg-white dark:bg-brand-navy rounded-2xl border border-gray-100 dark:border-brand-navy-light/10 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-full relative cursor-pointer"
                  >
                    
                    {/* Wishlist toggle */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(p); }}
                      className={`absolute top-3 right-3 z-10 p-2 rounded-full shadow-md bg-white/90 dark:bg-brand-navy/85 hover:scale-110 active:scale-90 transition-all ${isInWishlist(p.id) ? 'text-brand-orange' : 'text-gray-400'}`}
                    >
                      <Heart size={16} className={isInWishlist(p.id) ? 'fill-brand-orange' : ''} />
                    </button>

                    {/* Image */}
                    <div className="aspect-square bg-gray-50 dark:bg-brand-navy-dark overflow-hidden relative">
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {p.discount > 0 && (
                        <span className="absolute bottom-2 left-2 bg-brand-orange text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                          -{p.discount}% OFF
                        </span>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="p-3.5 sm:p-5 flex-grow flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <span className="font-extrabold text-gray-800 dark:text-gray-100 text-xs sm:text-sm line-clamp-2 leading-tight block">
                          {p.title}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 block">Seller: {p.seller}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          {ratingStars(p.rating)}
                          <span className="text-[9.5px] text-gray-450 font-bold">({p.reviewsCount})</span>
                        </div>
                      </div>

                      <div className="flex items-baseline justify-between border-t border-gray-50 dark:border-brand-navy-light/5 pt-3">
                        <span className="font-extrabold text-sm sm:text-base text-brand-navy dark:text-brand-orange">
                          ₹{p.price.toLocaleString('en-IN')}
                        </span>
                        {p.discount > 0 && (
                          <span className="text-[10px] text-gray-400 line-through">₹{p.originalPrice.toLocaleString('en-IN')}</span>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-1.5 pt-6 border-t border-gray-100 dark:border-brand-navy-light/10">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="px-3 py-1.5 border border-gray-250 dark:border-brand-navy-light/20 text-xs font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-brand-navy-light/25 disabled:opacity-50 transition-colors"
                  >
                    Prev
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 text-xs font-extrabold rounded-lg transition-all ${currentPage === i + 1 ? 'bg-brand-orange text-white' : 'border border-gray-200 dark:border-brand-navy-light/10 text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-brand-navy-light'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="px-3 py-1.5 border border-gray-250 dark:border-brand-navy-light/20 text-xs font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-brand-navy-light/25 disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
