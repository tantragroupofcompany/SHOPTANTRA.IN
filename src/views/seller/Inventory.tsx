import { useState, useEffect } from 'react';
import { Package, AlertCircle } from 'lucide-react';
import { Card, StatCard } from '../../components/ui/Card';
import { Badge, statusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';

interface InventoryItem {
  id: string;
  title: string;
  sku: string;
  category: string;
  stock: number;
  low_stock_alert: number;
  status: string;
}

const Inventory = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [updatingStock, setUpdatingStock] = useState<string | null>(null);
  const [stockUpdates, setStockUpdates] = useState<Record<string, number>>({});

  const stats = {
    total: items.length,
    inStock: items.filter(item => item.stock > 0).length,
    lowStock: items.filter(item => item.stock > 0 && item.stock <= item.low_stock_alert).length,
    outOfStock: items.filter(item => item.stock === 0).length,
  };

  useEffect(() => {
    fetchInventory();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [items, filterStatus]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;
      const res = await fetch(`/api/seller/inventory?userId=${user.id}`);
      if (res.ok) {
        const resData = await res.json();
        if (resData.success && resData.data) {
          const formattedData = resData.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            sku: item.sku || 'N/A',
            category: item.category || 'Uncategorized',
            stock: item.stock || 0,
            low_stock_alert: 10,
            status: item.status,
          }));
          setItems(formattedData);
        }
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...items];

    if (filterStatus === 'in-stock') {
      filtered = filtered.filter(item => item.stock > 0);
    } else if (filterStatus === 'low-stock') {
      filtered = filtered.filter(item => item.stock > 0 && item.stock <= item.low_stock_alert);
    } else if (filterStatus === 'out-of-stock') {
      filtered = filtered.filter(item => item.stock === 0);
    }

    setFilteredItems(filtered);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, id]);
    } else {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    }
  };

  const handleStockChange = (id: string, value: string) => {
    setStockUpdates({
      ...stockUpdates,
      [id]: parseInt(value) || 0,
    });
  };

  const handleSaveStock = async (id: string) => {
    try {
      setUpdatingStock(id);
      const newStock = stockUpdates[id];

      const res = await fetch('/api/seller/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, stock: newStock })
      });

      if (!res.ok) throw new Error('Failed to update stock');

      const updatedItems = items.map(item =>
        item.id === id ? { ...item, stock: newStock } : item
      );
      setItems(updatedItems);
      setStockUpdates({ ...stockUpdates, [id]: undefined });
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock');
    } finally {
      setUpdatingStock(null);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedItems.length === 0) {
      alert('Please select at least one product');
      return;
    }

    try {
      setLoading(true);
      
      await Promise.all(
        selectedItems.map(id =>
          fetch('/api/seller/products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: newStatus })
          })
        )
      );

      const updatedItems = items.map(item =>
        selectedItems.includes(item.id) ? { ...item, status: newStatus } : item
      );
      setItems(updatedItems);
      setSelectedItems([]);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (stock: number, alert: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'red' };
    if (stock <= alert) return { label: 'Low Stock', color: 'yellow' };
    return { label: 'In Stock', color: 'green' };
  };

  if (loading) {
    return <div className="text-center py-12">Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600 mt-2">Track and manage your product inventory</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={stats.total}
          icon={Package}
          color="navy"
        />
        <StatCard
          title="In Stock"
          value={stats.inStock}
          icon={Package}
          color="green"
        />
        <StatCard
          title="Low Stock"
          value={stats.lowStock}
          icon={AlertCircle}
          color="yellow"
        />
        <StatCard
          title="Out of Stock"
          value={stats.outOfStock}
          icon={Package}
          color="red"
        />
      </div>

      {/* Filters and Bulk Actions */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="w-full md:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Products</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </Select>
          </div>

          {selectedItems.length > 0 && (
            <div className="flex gap-2">
              <span className="text-sm text-gray-600 py-2">{selectedItems.length} selected</span>
              <Button
                onClick={() => handleBulkStatusUpdate('active')}
                size="sm"
                variant="outline"
              >
                Mark Active
              </Button>
              <Button
                onClick={() => handleBulkStatusUpdate('inactive')}
                size="sm"
                variant="outline"
              >
                Mark Inactive
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Inventory Table */}
      <Card className="p-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Product</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">SKU</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Category</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900">Stock</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900">Low Stock Alert</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">Status</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              filteredItems.map(item => {
                const stockStatus = getStockStatus(item.stock, item.low_stock_alert);
                return (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{item.title}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.sku}</td>
                    <td className="px-4 py-3 text-gray-600">{item.category}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-gray-900">{item.stock}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{item.low_stock_alert}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={stockStatus.color as any}
                        className="w-fit"
                      >
                        {stockStatus.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={stockUpdates[item.id] ?? item.stock}
                          onChange={(e) => handleStockChange(item.id, e.target.value)}
                          className="w-20"
                          min="0"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveStock(item.id)}
                          disabled={updatingStock === item.id || stockUpdates[item.id] === undefined}
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          {updatingStock === item.id ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default function SafeInventory() {
  return (
    <ErrorBoundary>
      <Inventory />
    </ErrorBoundary>
  );
}
