import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Cpu, ShoppingBag, Home, Sparkles, Carrot, BookOpen, Trophy, Car, Sofa, 
  Search, ArrowRight, Store, ChevronRight, Layers, Tag
} from 'lucide-react';
import { mockProducts, CATEGORIES_LIST } from '../data/products';

// Map icons to categories
const CATEGORY_ICONS: Record<string, any> = {
  'Electronics': Cpu,
  'Fashion': ShoppingBag,
  'Home & Kitchen': Home,
  'Beauty': Sparkles,
  'Grocery': Carrot,
  'Books': BookOpen,
  'Sports': Trophy,
  'Automotive': Car,
  'Furniture': Sofa,
};

// Default icon fallback
const DefaultIcon = Layers;

export default function Categories() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'high_stock' | 'many_sellers'>('all');

  // Generate category stats dynamically
  const categoriesData = useMemo(() => {
    return CATEGORIES_LIST.map(categoryName => {
      const categoryProducts = mockProducts.filter(p => p.category === categoryName);
      const uniqueSellers = Array.from(new Set(categoryProducts.map(p => p.sellerId)));
      const featuredProduct = categoryProducts[0] || null;
      
      return {
        name: categoryName,
        productCount: categoryProducts.length,
        sellerCount: uniqueSellers.length,
        featuredProduct,
        icon: CATEGORY_ICONS[categoryName] || DefaultIcon,
      };
    });
  }, []);

  // Filter and search logic
  const filteredCategories = useMemo(() => {
    return categoriesData.filter(cat => {
      const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (activeFilter === 'high_stock') {
        return matchesSearch && cat.productCount > 0;
      }
      if (activeFilter === 'many_sellers') {
        return matchesSearch && cat.sellerCount > 0;
      }
      return matchesSearch;
    });
  }, [categoriesData, searchQuery, activeFilter]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-navy-dark text-gray-800 dark:text-gray-200 py-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <span className="bg-brand-orange/15 text-brand-orange text-xs font-black uppercase px-3 py-1 rounded-full tracking-wider mb-2 inline-block">
              Product Categories
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-navy dark:text-white">
              Browse by Category
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Discover local Indian brands, micro-vendors, and high-quality manufactured products.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-brand-navy border border-gray-200 dark:border-brand-navy-light/10 text-gray-800 dark:text-gray-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
            />
            <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-gray-400" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeFilter === 'all' ? 'bg-brand-orange text-white' : 'bg-white dark:bg-brand-navy text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-brand-navy-light/10'}`}
          >
            All Categories
          </button>
          <button
            onClick={() => setActiveFilter('high_stock')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeFilter === 'high_stock' ? 'bg-brand-orange text-white' : 'bg-white dark:bg-brand-navy text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-brand-navy-light/10'}`}
          >
            With Active Products ({categoriesData.filter(c => c.productCount > 0).length})
          </button>
          <button
            onClick={() => setActiveFilter('many_sellers')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeFilter === 'many_sellers' ? 'bg-brand-orange text-white' : 'bg-white dark:bg-brand-navy text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-brand-navy-light/10'}`}
          >
            With Registered Sellers ({categoriesData.filter(c => c.sellerCount > 0).length})
          </button>
        </div>

        {/* Categories Grid */}
        {filteredCategories.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-brand-navy rounded-3xl border border-gray-150/40 dark:border-brand-navy-light/10">
            <p className="text-gray-500 dark:text-gray-400">No categories found matching your query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredCategories.map((cat) => {
              const IconComp = cat.icon;
              return (
                <div 
                  key={cat.name} 
                  className="bg-white dark:bg-brand-navy border border-gray-150/40 dark:border-brand-navy-light/10 rounded-3xl p-6 shadow-xs hover:shadow-md hover:border-brand-orange/30 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row with Icon and Stats */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-brand-orange/10 rounded-2xl text-brand-orange group-hover:scale-105 transition-transform duration-300">
                        <IconComp size={24} />
                      </div>
                      <div className="flex gap-3 text-[10.5px] font-bold text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Tag size={12} className="text-brand-orange" />
                          {cat.productCount} Items
                        </span>
                        <span className="flex items-center gap-1">
                          <Store size={12} className="text-brand-orange" />
                          {cat.sellerCount} Sellers
                        </span>
                      </div>
                    </div>

                    {/* Category Title */}
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-brand-orange transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-6">
                      Explore verified Swadeshi products and hot deals in the {cat.name} category.
                    </p>
                  </div>

                  {/* Featured Product Preview */}
                  {cat.featuredProduct ? (
                    <div className="bg-gray-50 dark:bg-brand-navy-dark/40 rounded-2xl p-3 border border-gray-100 dark:border-brand-navy-light/5 flex items-center gap-3 mb-4">
                      <img 
                        src={cat.featuredProduct.images[0]} 
                        alt={cat.featuredProduct.title} 
                        className="w-10 h-10 object-cover rounded-lg"
                      />
                      <div className="min-w-0 flex-grow">
                        <span className="text-[9px] uppercase font-black tracking-wide text-brand-orange block">Featured Product</span>
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 block truncate leading-tight">
                          {cat.featuredProduct.title}
                        </span>
                      </div>
                      <ChevronRight size={14} className="text-gray-400 shrink-0" />
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-brand-navy-dark/30 rounded-2xl py-4 border border-dashed border-gray-200 dark:border-brand-navy-light/10 text-center text-xs text-gray-400 mb-4">
                      No products active
                    </div>
                  )}

                  {/* View Products button */}
                  <Link
                    to={`/products?category=${encodeURIComponent(cat.name)}`}
                    className="w-full bg-gray-50 dark:bg-brand-navy-light/20 hover:bg-brand-orange hover:text-white dark:hover:bg-brand-orange text-gray-800 dark:text-gray-200 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  >
                    Browse Category
                    <ArrowRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
