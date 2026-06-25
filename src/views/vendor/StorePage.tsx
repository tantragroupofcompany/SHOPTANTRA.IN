import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Shield, Heart, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Seller {
  id: string;
  store_name: string;
  store_logo: string | null;
  banner_image: string | null;
  category: string;
  city: string;
  state: string;
  rating: number;
  is_verified: boolean;
  about: string | null;
  created_at: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  rating: number;
}

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-64 bg-gray-300"></div>
    <div className="max-w-6xl mx-auto px-4 -mt-16">
      <div className="flex gap-6 mb-8">
        <div className="w-32 h-32 bg-gray-300 rounded-lg border-4 border-white"></div>
        <div className="flex-1 space-y-3">
          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  </div>
);

const ProductCard = ({ product }: { product: Product }) => (
  <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 overflow-hidden">
    <img
      src={product.image_url || 'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg'}
      alt={product.title}
      className="w-full h-48 object-cover bg-gray-200"
    />
    <div className="p-4">
      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
        {product.title}
      </h3>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xl font-bold text-orange-500">
          ${product.price.toFixed(2)}
        </p>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium text-gray-700">
            {product.rating.toFixed(1)}
          </span>
        </div>
      </div>
      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors duration-200">
        Add to Cart
      </button>
    </div>
  </div>
);

const ReviewCard = ({ review }: { review: Review }) => (
  <div className="border-b border-gray-200 py-6">
    <div className="flex items-start justify-between mb-2">
      <div>
        <p className="font-semibold text-gray-900">{review.reviewer_name}</p>
        <div className="flex items-center gap-1 mt-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${
                i < review.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
      <p className="text-sm text-gray-500">
        {new Date(review.created_at).toLocaleDateString()}
      </p>
    </div>
    <p className="text-gray-700">{review.comment}</p>
  </div>
);

export default function StorePage() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!sellerId) return;
    fetchStoreData();
  }, [sellerId]);

  const fetchStoreData = async () => {
    try {
      setLoading(true);

      // Fetch seller
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', sellerId)
        .single();

      if (sellerError || !sellerData) {
        setSeller(null);
        return;
      }

      setSeller(sellerData);

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, title, price, image_url, rating')
        .eq('seller_id', sellerId)
        .eq('status', 'active');

      if (!productsError) {
        setProducts(productsData || []);
      }

      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!reviewsError) {
        setReviews(reviewsData || []);

        // Calculate average rating
        if (reviewsData && reviewsData.length > 0) {
          const avgRating =
            reviewsData.reduce((sum, r) => sum + r.rating, 0) /
            reviewsData.length;
          setAverageRating(avgRating);
        }
      }
    } catch (error) {
      console.error('Error fetching store data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Store Not Found
          </h1>
          <p className="text-gray-600 mb-8">
            The store you're looking for doesn't exist or is no longer available.
          </p>
          <Link
            to="/sellers"
            className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
          >
            Browse All Sellers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner Section */}
      <div className="relative">
        <div
          className="h-64 bg-gradient-to-r from-[#1B3A6B] to-[#2d5a9f] bg-cover bg-center"
          style={{
            backgroundImage: seller.banner_image
              ? `url(${seller.banner_image})`
              : undefined,
          }}
        ></div>

        {/* Store Header */}
        <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-10 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            {/* Logo */}
            <div className="flex-shrink-0">
              {seller.store_logo ? (
                <img
                  src={seller.store_logo}
                  alt={seller.store_name}
                  className="w-40 h-40 rounded-lg object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-40 h-40 rounded-lg bg-orange-500 flex items-center justify-center text-white text-5xl font-bold border-4 border-white shadow-lg">
                  {seller.store_name.charAt(0)}
                </div>
              )}
            </div>

            {/* Store Info */}
            <div className="flex-1 bg-white rounded-lg shadow-lg p-6 w-full md:w-auto">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    {seller.store_name}
                  </h1>
                  <p className="text-gray-600 text-lg mt-1">{seller.category}</p>
                </div>
                {seller.is_verified && (
                  <Shield className="w-8 h-8 text-blue-600 flex-shrink-0" />
                )}
              </div>

              {/* Rating and Stats */}
              <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.round(seller.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-gray-900">
                    {seller.rating.toFixed(1)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {products.length} Products
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {reviews.length} Reviews
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={() => setIsFollowing(!isFollowing)}
                className={`flex-1 md:flex-none px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
                  isFollowing
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${isFollowing ? 'fill-current' : ''}`}
                />
                {isFollowing ? 'Following' : 'Follow Store'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Store Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">About Store</h2>
              {seller.about ? (
                <p className="text-gray-700 mb-6">{seller.about}</p>
              ) : (
                <p className="text-gray-500 italic mb-6">
                  No description available
                </p>
              )}

              {/* Info Items */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold text-gray-900">
                      {seller.city}, {seller.state}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Member Since</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(seller.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Button */}
              <button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors duration-200">
                Contact Seller
              </button>
            </div>
          </div>

          {/* Products Section */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Products</h2>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-4xl mb-3">📦</div>
                <p className="text-gray-600">No products available yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-lg shadow p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Customer Reviews
          </h2>
          {reviews.length > 0 ? (
            <>
              <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-200">
                <div>
                  <div className="text-4xl font-bold text-gray-900">
                    {averageRating.toFixed(1)}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(averageRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Based on {reviews.length} reviews
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>

              {reviews.length < 5 && (
                <p className="text-sm text-gray-500 mt-8">
                  Showing the most recent reviews
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-3xl mb-3">⭐</div>
              <p className="text-gray-600">No reviews yet. Be the first to review!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
