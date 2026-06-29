import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Shield, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Seller {
  id: string;
  store_name: string;
  store_logo: string | null;
  store_logo_url?: string | null;
  category: string;
  city: string;
  state: string;
  rating: number;
  is_verified: boolean;
  _product_count?: number;
}

interface Filters {
  searchQuery: string;
  category: string;
  minRating: number | null;
  verifiedOnly: boolean;
  sortBy: 'rating' | 'newest' | 'products';
}

const SkeletonCard = () => (
  <div className="bg-white rounded-lg shadow animate-pulse">
    <div className="h-32 bg-gray-300 rounded-t-lg"></div>
    <div className="p-4 space-y-3">
      <div className="h-6 bg-gray-300 rounded w-3/4"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      <div className="h-4 bg-gray-300 rounded w-2/3"></div>
      <div className="h-8 bg-gray-300 rounded"></div>
    </div>
  </div>
);

const SellerCard = ({ seller }: { seller: Seller }) => (
  <Link to={`/store/${seller.id}`}>
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 overflow-hidden h-full flex flex-col">
      {/* Store Logo/Avatar Section */}
      <div className="h-32 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
        {seller.store_logo_url || seller.store_logo ? (
          <img
            src={seller.store_logo_url || seller.store_logo || ''}
            alt={seller.store_name}
            loading="lazy"
            className="w-24 h-24 rounded-full object-cover border-4 border-white"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-2xl font-bold text-orange-500">
            {seller.store_name.charAt(0)}
          </div>
        )}
      </div>

      {/* Store Info */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-lg text-gray-900 line-clamp-2">
            {seller.store_name}
          </h3>
          {seller.is_verified && (
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
          )}
        </div>

        <p className="text-sm text-gray-600 mb-2">{seller.category}</p>
        <p className="text-xs text-gray-500 mb-3">
          {seller.city}, {seller.state}
        </p>

        {/* Rating and Products */}
        <div className="flex items-center justify-between mb-3 text-sm">
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.round(seller.rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-600 ml-1">{seller.rating.toFixed(1)}</span>
          </div>
          <span className="text-gray-600">
            {seller._product_count || 0} products
          </span>
        </div>

        {/* Visit Store Button */}
        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 group">
          Visit Store
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  </Link>
);

export default function Sellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [filteredSellers, setFilteredSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    searchQuery: '',
    category: '',
    minRating: null,
    verifiedOnly: false,
    sortBy: 'rating',
  });

  const itemsPerPage = 12;

  useEffect(() => {
    fetchSellers();
  }, []);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1);
  }, [sellers, filters]);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const { data: sellersData, error: sellersError } = await supabase
        .from('sellers')
        .select('*')
        .eq('status', 'active')
        .order('rating', { ascending: false });

      if (sellersError) throw sellersError;

      // Fetch product counts
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('seller_id');

      if (productsError) throw productsError;

      const productCounts: Record<string, number> = {};
      productsData?.forEach((p) => {
        productCounts[p.seller_id] = (productCounts[p.seller_id] || 0) + 1;
      });

      const enrichedSellers = (sellersData || []).map((seller) => ({
        ...seller,
        _product_count: productCounts[seller.id] || 0,
      }));

      setSellers(enrichedSellers);

      // Extract unique categories
      const uniqueCategories = [
        ...new Set(enrichedSellers.map((s) => s.category).filter(Boolean)),
      ] as string[];
      setCategories(uniqueCategories.sort());
    } catch (error) {
      console.error('Error fetching sellers:', error);
      setSellers([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...sellers];

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (seller) =>
          seller.store_name.toLowerCase().includes(query) ||
          seller.category?.toLowerCase().includes(query) ||
          seller.city?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filters.category) {
      result = result.filter((seller) => seller.category === filters.category);
    }

    // Rating filter
    if (filters.minRating) {
      result = result.filter((seller) => seller.rating >= filters.minRating!);
    }

    // Verified only
    if (filters.verifiedOnly) {
      result = result.filter((seller) => seller.is_verified);
    }

    // Sorting
    switch (filters.sortBy) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'products':
        result.sort((a, b) => (b._product_count || 0) - (a._product_count || 0));
        break;
      case 'newest':
        // Assuming sellers have a created_at field
        result.sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
        );
        break;
    }

    setFilteredSellers(result);
  };

  const totalPages = Math.ceil(filteredSellers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSellers = filteredSellers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2d5a9f] text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Discover Our Sellers
          </h1>
          <p className="text-orange-200 text-lg">
            Explore trusted vendors and find exactly what you're looking for
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="font-bold text-lg text-gray-900 mb-6">Filters</h2>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters({ ...filters, category: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Minimum Rating
                </label>
                <div className="space-y-2">
                  {[
                    { label: 'Any Rating', value: null },
                    { label: '4+ Stars', value: 4 },
                    { label: '3+ Stars', value: 3 },
                  ].map((option) => (
                    <label key={String(option.value)} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        value={String(option.value)}
                        checked={filters.minRating === option.value}
                        onChange={() =>
                          setFilters({ ...filters, minRating: option.value })
                        }
                        className="w-4 h-4 text-orange-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Verified Only Toggle */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.verifiedOnly}
                    onChange={(e) =>
                      setFilters({ ...filters, verifiedOnly: e.target.checked })
                    }
                    className="w-4 h-4 text-orange-500 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Verified Sellers Only
                  </span>
                </label>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      sortBy: e.target.value as 'rating' | 'newest' | 'products',
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="rating">Highest Rating</option>
                  <option value="newest">Newest</option>
                  <option value="products">Most Products</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sellers, categories, or locations..."
                  value={filters.searchQuery}
                  onChange={(e) =>
                    setFilters({ ...filters, searchQuery: e.target.value })
                  }
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                Showing {paginatedSellers.length > 0 ? startIndex + 1 : 0} -{' '}
                {Math.min(startIndex + itemsPerPage, filteredSellers.length)} of{' '}
                {filteredSellers.length} sellers
              </p>
            </div>

            {/* Sellers Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {[...Array(8)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : paginatedSellers.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  {paginatedSellers.map((seller) => (
                    <SellerCard key={seller.id} seller={seller} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 py-8">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`px-4 py-2 rounded-lg ${
                          currentPage === i + 1
                            ? 'bg-orange-500 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Empty State */
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🏪</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  No sellers found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or search query
                </p>
                <button
                  onClick={() =>
                    setFilters({
                      searchQuery: '',
                      category: '',
                      minRating: null,
                      verifiedOnly: false,
                      sortBy: 'rating',
                    })
                  }
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
