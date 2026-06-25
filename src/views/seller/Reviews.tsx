import { useState, useEffect } from 'react';
import { Star, MessageSquare, Send } from 'lucide-react';
import { Card, StatCard } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';

interface Review {
  id: string;
  customer_name: string;
  product_title: string;
  rating: number;
  comment: string;
  status: string;
  seller_response?: string;
  created_at: string;
}

interface RatingDistribution {
  rating: number;
  count: number;
  percentage: number;
}

const Reviews = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [ratingFilter, setRatingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [averageRating, setAverageRating] = useState(4.5);
  const [ratingDistribution, setRatingDistribution] = useState<RatingDistribution[]>([]);

  useEffect(() => {
    fetchReviews();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [reviews, ratingFilter, statusFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      const res = await fetch(`/api/seller/reviews?userId=${user.id}`);
      if (res.ok) {
        const resData = await res.json();
        if (resData.success && resData.data) {
          const formattedReviews = resData.data;
          setReviews(formattedReviews);

          // Calculate rating distribution
          if (formattedReviews.length > 0) {
            const avgRating =
              formattedReviews.reduce((sum: any, r: any) => sum + r.rating, 0) / formattedReviews.length;
            setAverageRating(Math.round(avgRating * 10) / 10);

            const distribution: RatingDistribution[] = [];
            for (let star = 5; star >= 1; star--) {
              const count = formattedReviews.filter((r: any) => r.rating === star).length;
              distribution.push({
                rating: star,
                count,
                percentage: (count / formattedReviews.length) * 100,
              });
            }
            setRatingDistribution(distribution);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reviews];

    if (ratingFilter !== 'all') {
      filtered = filtered.filter(r => r.rating === parseInt(ratingFilter));
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    setFilteredReviews(filtered);
  };

  const handleReplyClick = (review: Review) => {
    setSelectedReview(review);
    setReplyText(review.seller_response || '');
    setShowReplyModal(true);
  };

  const handleSubmitReply = async () => {
    if (!selectedReview || !replyText.trim()) {
      alert('Please enter a response');
      return;
    }

    try {
      setSubmittingReply(true);

      const res = await fetch('/api/seller/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedReview.id,
          seller_response: replyText
        })
      });

      if (!res.ok) throw new Error('Failed to save response');

      const updatedReviews = reviews.map(r =>
        r.id === selectedReview.id ? { ...r, seller_response: replyText } : r
      );
      setReviews(updatedReviews);

      setShowReplyModal(false);
      setReplyText('');
      setSelectedReview(null);
      alert('Response saved successfully');
    } catch (error) {
      console.error('Error saving response:', error);
      alert('Failed to save response');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleUpdateStatus = async (reviewId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/seller/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reviewId,
          status: newStatus
        })
      });

      if (!res.ok) throw new Error('Failed to update status');

      const updatedReviews = reviews.map(r =>
        r.id === reviewId ? { ...r, status: newStatus } : r
      );
      setReviews(updatedReviews);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'md') => {
    const sizeClass = size === 'sm' ? 16 : 20;
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={sizeClass}
            className={
              i < rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-12">Loading reviews...</div>;
  }

  const statusBadgeMap: Record<string, string> = {
    approved: 'green',
    pending: 'yellow',
    rejected: 'red',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Customer Reviews</h1>
        <p className="text-gray-600 mt-2">Manage and respond to customer feedback</p>
      </div>

      {/* Rating Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="p-6 lg:col-span-1">
          <div className="text-center">
            <div className="text-5xl font-bold text-orange-500 mb-2">{averageRating}</div>
            <div className="flex justify-center mb-3">
              {renderStars(Math.round(averageRating))}
            </div>
            <p className="text-sm text-gray-600">
              Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </p>
          </div>
        </Card>

        {/* Rating Distribution */}
        <Card className="p-6 lg:col-span-3">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h2>
          <div className="space-y-3">
            {ratingDistribution.map(dist => (
              <div key={dist.rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-20">
                  <span className="text-sm font-medium text-gray-700">{dist.rating}</span>
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${dist.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600 w-12 text-right">
                  {dist.count}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Rating</label>
            <Select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Reviews</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-gray-500">
              <MessageSquare className="mx-auto mb-2 text-gray-400" size={32} />
              <p>No reviews found</p>
            </div>
          </Card>
        ) : (
          filteredReviews.map(review => (
            <Card key={review.id} className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{review.customer_name}</p>
                  <p className="text-sm text-gray-600">{review.product_title}</p>
                </div>
                <Badge variant={statusBadgeMap[review.status] as any} className="w-fit">
                  {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mb-3">
                {renderStars(review.rating, 'sm')}
                <span className="text-sm text-gray-600">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-gray-700 text-sm">{review.comment}</p>
              </div>

              {review.seller_response && (
                <div className="bg-blue-50 p-3 rounded-lg mb-4 border-l-4 border-blue-500">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Your Response:</p>
                  <p className="text-sm text-blue-800">{review.seller_response}</p>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReplyClick(review)}
                  className="gap-2"
                >
                  <Send size={16} />
                  {review.seller_response ? 'Edit' : 'Reply'}
                </Button>

                {review.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(review.id, 'approved')}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(review.id, 'rejected')}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Reject
                    </Button>
                  </>
                )}

                {review.status !== 'pending' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus(review.id, 'pending')}
                  >
                    Mark Pending
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Reply Modal */}
      <Modal
        isOpen={showReplyModal}
        onClose={() => setShowReplyModal(false)}
        title={`Reply to ${selectedReview?.customer_name}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-1">Review:</p>
            <p className="text-sm text-gray-600">{selectedReview?.comment}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Response *</label>
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Share your response to this review..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {replyText.length} / 500 characters
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowReplyModal(false)}
              disabled={submittingReply}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReply}
              disabled={submittingReply || !replyText.trim()}
              className="bg-orange-500 hover:bg-orange-600 gap-2"
            >
              <Send size={16} />
              {submittingReply ? 'Saving...' : 'Save Response'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default function SafeReviews() {
  return (
    <ErrorBoundary>
      <Reviews />
    </ErrorBoundary>
  );
}
