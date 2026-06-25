import { useState } from 'react';
import { Heart, ShoppingCart, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function Wishlist() {
  const { wishlist, toggleWishlist, addToCart } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWishlist = wishlist.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 transition-colors duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy dark:text-white border-l-4 border-brand-orange pl-3">My Wishlist</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{filteredWishlist.length} saved items in your catalog</p>
      </div>

      {/* Search Input */}
      {wishlist.length > 0 && (
        <div className="relative max-w-sm">
          <input
            type="text"
            placeholder="Search wishlist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-brand-navy border border-gray-200 dark:border-brand-navy-light/25 text-gray-800 dark:text-gray-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange"
          />
          <Search size={14} className="absolute left-3 top-3 text-gray-400" />
        </div>
      )}

      {/* Empty State */}
      {filteredWishlist.length === 0 ? (
        <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 rounded-2xl py-14 text-center shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-brand-orange" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Your Wishlist is Empty</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Explore products and click the heart icon to save items here!</p>
          <Link
            to="/products"
            className="bg-brand-navy hover:bg-brand-navy-light text-white font-semibold px-5 py-2.5 rounded-lg text-xs transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredWishlist.map((item) => (
            <div key={item.id} className="group bg-white dark:bg-brand-navy rounded-2xl border border-gray-100 dark:border-brand-navy-light/10 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full relative">
              
              {/* Remove heart button */}
              <button
                onClick={() => toggleWishlist(item)}
                className="absolute top-2.5 right-2.5 z-10 p-2 rounded-full shadow-md bg-white/90 dark:bg-brand-navy/85 hover:scale-110 text-brand-orange transition-all"
                title="Remove from Wishlist"
              >
                <Heart size={15} className="fill-brand-orange" />
              </button>

              {/* Product Image */}
              <div className="aspect-square bg-gray-50 dark:bg-brand-navy-dark overflow-hidden">
                <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-103 transition-transform" />
              </div>

              {/* Meta details */}
              <div className="p-4 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <Link
                    to={`/product/${item.id}`}
                    className="font-bold text-gray-800 dark:text-gray-100 text-xs hover:text-brand-orange truncate block"
                  >
                    {item.title}
                  </Link>
                  <span className="text-[10px] text-gray-400 block">Category: {item.category}</span>
                  <span className="font-extrabold text-xs text-brand-navy dark:text-brand-orange block pt-1">
                    ₹{item.price.toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  onClick={() => addToCart(item, 1)}
                  className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white font-bold py-2 rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ShoppingCart size={13} />
                  Add to Cart
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
