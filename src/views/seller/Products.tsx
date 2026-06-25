import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit2, Plus } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge, statusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { Product } from '../../types';

interface ProductWithImage extends Product {
  product_images?: Array<{ url: string; is_primary: boolean }>;
}

type ProductStatus = 'all' | 'active' | 'draft' | 'pending';

const Products = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductWithImage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; productId: string | null }>({
    isOpen: false,
    productId: null,
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/seller/products?userId=${user.id}`);
        if (!res.ok) throw new Error('Failed to load products');
        const resData = await res.json();

        if (resData.success && resData.data) {
          setProducts(resData.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddProduct = () => {
    navigate('/seller/products/new');
  };

  const handleEditProduct = (productId: string) => {
    navigate(`/seller/products/${productId}/edit`);
  };

  const handleDeleteClick = (productId: string) => {
    setDeleteModal({ isOpen: true, productId });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.productId) return;

    try {
      setDeleting(true);

      const res = await fetch(`/api/seller/products?id=${deleteModal.productId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete product');

      setProducts((prev) =>
        prev.filter((product) => product.id !== deleteModal.productId)
      );
      setDeleteModal({ isOpen: false, productId: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const getPrimaryImage = (product: ProductWithImage) => {
    if (!product.product_images || product.product_images.length === 0) {
      return '/placeholder.jpg';
    }
    const primaryImage = product.product_images.find((img) => img.is_primary);
    return primaryImage ? primaryImage.url : product.product_images[0].url;
  };

  const statusCounts = {
    all: products.length,
    active: products.filter((p) => p.status === 'active').length,
    draft: products.filter((p) => p.status === 'draft').length,
    pending: products.filter((p) => p.status === 'pending').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">Manage your product listings</p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={handleAddProduct}
          icon={<Plus className="w-5 h-5" />}
        >
          Add Product
        </Button>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 border-b border-gray-100 pb-4">
            {(['all', 'active', 'draft', 'pending'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  statusFilter === status
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} (
                {statusCounts[status]})
              </button>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {filteredProducts.length === 0 && !loading ? (
            <div className="py-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'No products found'
                  : 'No products yet. Create your first product!'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button variant="primary" onClick={handleAddProduct}>
                  Add Your First Product
                </Button>
              )}
            </div>
          ) : (
            <Table<ProductWithImage>
              columns={[
                {
                  key: 'image',
                  header: 'Image',
                  render: (product) => (
                    <img
                      src={getPrimaryImage(product)}
                      alt={product.title}
                      className="w-10 h-10 rounded-lg object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.jpg';
                      }}
                    />
                  ),
                },
                {
                  key: 'title',
                  header: 'Title',
                  render: (product) => (
                    <div className="max-w-xs">
                      <p className="font-medium text-gray-900 truncate">
                        {product.title}
                      </p>
                      <p className="text-xs text-gray-500">SKU: {product.sku || 'N/A'}</p>
                    </div>
                  ),
                },
                {
                  key: 'price',
                  header: 'Price',
                  render: (product) => (
                    <span className="font-medium text-gray-900">
                      ₹{product.price.toFixed(2)}
                    </span>
                  ),
                },
                {
                  key: 'stock',
                  header: 'Stock',
                  render: (product) => (
                    <span
                      className={`font-medium ${
                        product.stock > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {product.stock}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (product) => {
                    const badge = statusBadge(product.status);
                    return <Badge label={badge.label} variant={badge.variant} />;
                  },
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (product) => (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditProduct(product.id)}
                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                        title="Edit product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(product.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={filteredProducts}
              loading={loading}
              keyExtractor={(product) => product.id}
              emptyMessage="No products found"
            />
          )}
        </div>
      </Card>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, productId: null })}
        title="Delete Product"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this product? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false, productId: null })}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              loading={deleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const Package = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20.354 15.354A9 9 0 015.646 5.646 9 9 0 0120.354 15.354z"
    />
  </svg>
);

export default function SafeProducts() {
  return (
    <ErrorBoundary>
      <Products />
    </ErrorBoundary>
  );
}
