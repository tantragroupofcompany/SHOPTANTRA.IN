import React, { useEffect, useState } from 'react';
import { Search, Eye, CheckCircle, XCircle, Star, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';

interface Product {
  id: string;
  title: string;
  seller_id: string;
  seller_name?: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
  approval_status: 'pending' | 'approved' | 'rejected';
  image_url?: string;
  is_featured: boolean;
  description?: string;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [approvalFilter, setApprovalFilter] = useState<string>('Pending Approval');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, approvalFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          title,
          seller_id,
          category,
          price,
          stock,
          status,
          approval_status,
          image_url,
          is_featured,
          description,
          sellers(store_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map((product: any) => ({
        ...product,
        seller_name: product.sellers?.store_name || 'Unknown',
      }));

      setProducts(formattedData);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.seller_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (approvalFilter === 'Pending Approval') {
      filtered = filtered.filter((product) => product.approval_status === 'pending');
    } else if (approvalFilter === 'All') {
      // No filter
    } else if (approvalFilter === 'Active') {
      filtered = filtered.filter((product) => product.status === 'active');
    } else if (approvalFilter === 'Rejected') {
      filtered = filtered.filter((product) => product.approval_status === 'rejected');
    }

    setFilteredProducts(filtered);
  };

  const handleApproveProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ approval_status: 'approved', status: 'active' })
        .eq('id', productId);

      if (error) throw error;

      setProducts(
        products.map((p) =>
          p.id === productId
            ? { ...p, approval_status: 'approved', status: 'active' }
            : p
        )
      );
    } catch (error) {
      console.error('Error approving product:', error);
    }
  };

  const handleRejectProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ approval_status: 'rejected', status: 'inactive' })
        .eq('id', productId);

      if (error) throw error;

      setProducts(
        products.map((p) =>
          p.id === productId
            ? { ...p, approval_status: 'rejected', status: 'inactive' }
            : p
        )
      );
    } catch (error) {
      console.error('Error rejecting product:', error);
    }
  };

  const handleToggleFeatured = async (productId: string, currentFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_featured: !currentFeatured })
        .eq('id', productId);

      if (error) throw error;

      setProducts(
        products.map((p) =>
          p.id === productId ? { ...p, is_featured: !currentFeatured } : p
        )
      );
    } catch (error) {
      console.error('Error toggling featured:', error);
    }
  };

  const handleBulkApprove = async () => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ approval_status: 'approved', status: 'active' })
        .in('id', selectedProducts);

      if (error) throw error;

      setProducts(
        products.map((p) =>
          selectedProducts.includes(p.id)
            ? { ...p, approval_status: 'approved', status: 'active' }
            : p
        )
      );
      setSelectedProducts([]);
    } catch (error) {
      console.error('Error bulk approving products:', error);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
      );
  };

  const toggleAllSelection = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
        <p className="text-gray-600 mt-2">Approve, reject, and manage product listings</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter</label>
            <Select value={approvalFilter} onChange={(e) => setApprovalFilter(e.target.value)}>
              <option>Pending Approval</option>
              <option>All</option>
              <option>Active</option>
              <option>Rejected</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setSearchTerm('');
                setApprovalFilter('Pending Approval');
              }}
            >
              Reset Filters
            </Button>
          </div>
          {selectedProducts.length > 0 && (
            <div className="flex items-end">
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600"
                onClick={handleBulkApprove}
              >
                Approve {selectedProducts.length}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Products Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={toggleAllSelection}
                    className="rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Seller</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Price</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Stock</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Approval</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
                        <span className="text-xs font-semibold text-gray-600">IMG</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.title}</p>
                        <p className="text-xs text-gray-500">{product.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">{product.seller_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{product.category}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-semibold text-gray-900">${product.price.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-medium text-gray-900">{product.stock}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getApprovalStatusColor(product.approval_status)}>
                      {product.approval_status.charAt(0).toUpperCase() + product.approval_status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowDetailsModal(true);
                        }}
                        icon={<Eye className="w-4 h-4" />}
                      />
                      {product.approval_status === 'pending' && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleApproveProduct(product.id)}
                            icon={<CheckCircle className="w-4 h-4" />}
                          />
                          <Button
                            variant="error"
                            size="sm"
                            onClick={() => handleRejectProduct(product.id)}
                            icon={<XCircle className="w-4 h-4" />}
                          />
                        </>
                      )}
                      <Button
                        variant={product.is_featured ? 'warning' : 'ghost'}
                        size="sm"
                        onClick={() => handleToggleFeatured(product.id, product.is_featured)}
                        icon={<Star className="w-4 h-4" />}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No products found matching your criteria.</p>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600 border-t pt-4">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </Card>

      {/* Product Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Product Details"
      >
        {selectedProduct && (
          <div className="space-y-4">
            <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
              <span className="text-gray-600">Product Image</span>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900">{selectedProduct.title}</h3>
              <p className="text-gray-600 mt-1">{selectedProduct.seller_name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Price</label>
                <p className="text-gray-900 mt-1 font-semibold">${selectedProduct.price.toFixed(2)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Stock</label>
                <p className="text-gray-900 mt-1">{selectedProduct.stock} units</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Category</label>
                <p className="text-gray-900 mt-1">{selectedProduct.category}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <p className="text-gray-900 mt-1 capitalize">{selectedProduct.status}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <p className="text-gray-600 mt-1 text-sm">{selectedProduct.description || 'No description provided'}</p>
            </div>

            <div className="flex gap-3 mt-6 border-t pt-4">
              <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Products;
