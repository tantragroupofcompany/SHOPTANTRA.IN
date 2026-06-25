import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  parent_name?: string;
  products_count: number;
  status: 'active' | 'inactive';
  sort_order: number;
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    slug: '',
    description: '',
    parent_id: '',
    status: 'active',
    sort_order: 0,
  });
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_categories')
        .select(`
          id,
          name,
          slug,
          description,
          parent_id,
          products_count,
          status,
          sort_order,
          parent:product_categories!parent_id(name)
        `)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const formatted = (data || []).map((cat: any) => ({
        ...cat,
        parent_name: cat.parent?.name || null,
      }));

      setAllCategories(formatted);
      setCategories(formatted.filter((c) => !c.parent_id));
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleAddCategory = async () => {
    try {
      if (!formData.name) {
        alert('Please enter category name');
        return;
      }

      const slug = formData.slug || generateSlug(formData.name);

      if (editingId) {
        // Update
        const { error } = await supabase
          .from('product_categories')
          .update({
            name: formData.name,
            slug,
            description: formData.description,
            parent_id: formData.parent_id || null,
            status: formData.status,
            sort_order: formData.sort_order,
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('product_categories')
          .insert([{
            name: formData.name,
            slug,
            description: formData.description,
            parent_id: formData.parent_id || null,
            status: formData.status || 'active',
            sort_order: formData.sort_order || 0,
            products_count: 0,
          }]);

        if (error) throw error;
      }

      fetchCategories();
      setShowModal(false);
      setEditingId(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        parent_id: '',
        status: 'active',
        sort_order: 0,
      });
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleEditCategory = (category: Category) => {
    setFormData(category);
    setEditingId(category.id);
    setShowModal(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('product_categories')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      fetchCategories();
    } catch (error) {
      console.error('Error updating category status:', error);
    }
  };

  const handleReorderCategories = async (sourceId: string, targetId: string) => {
    try {
      const sourceCategory = allCategories.find((c) => c.id === sourceId);
      const targetCategory = allCategories.find((c) => c.id === targetId);

      if (!sourceCategory || !targetCategory) return;

      const tempOrder = sourceCategory.sort_order;
      sourceCategory.sort_order = targetCategory.sort_order;
      targetCategory.sort_order = tempOrder;

      await supabase
        .from('product_categories')
        .update({ sort_order: sourceCategory.sort_order })
        .eq('id', sourceId);

      await supabase
        .from('product_categories')
        .update({ sort_order: targetCategory.sort_order })
        .eq('id', targetId);

      fetchCategories();
    } catch (error) {
      console.error('Error reordering categories:', error);
    }
  };

  const getChildCategories = (parentId: string) => {
    return allCategories.filter((c) => c.parent_id === parentId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-600 mt-2">Manage product categories and hierarchy</p>
        </div>
        <Button
          onClick={() => {
            setFormData({
              name: '',
              slug: '',
              description: '',
              parent_id: '',
              status: 'active',
              sort_order: 0,
            });
            setEditingId(null);
            setShowModal(true);
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Category
        </Button>
      </div>

      {/* Categories Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Order</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Slug</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Parent</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Products</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <React.Fragment key={category.id}>
                  <tr
                    className="border-b hover:bg-gray-50 transition-colors"
                    draggable
                    onDragStart={() => setDraggedId(category.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedId && draggedId !== category.id) {
                        handleReorderCategories(draggedId, category.id);
                      }
                    }}
                  >
                    <td className="px-6 py-4">
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{category.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                        {category.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{category.parent_name || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-900">{category.products_count}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={category.status === 'active' ? 'success' : 'secondary'}>
                        {category.status.charAt(0).toUpperCase() + category.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(category.id, category.status)}
                          icon={category.status === 'active' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                          icon={<Edit2 className="w-4 h-4" />}
                        />
                        <Button
                          variant="error"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                          icon={<Trash2 className="w-4 h-4" />}
                        />
                      </div>
                    </td>
                  </tr>

                  {/* Child Categories */}
                  {getChildCategories(category.id).map((child) => (
                    <tr key={child.id} className="border-b hover:bg-gray-50 transition-colors bg-gray-50">
                      <td className="px-6 py-4">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                      </td>
                      <td className="px-6 py-4 pl-12">
                        <p className="font-medium text-gray-900">↳ {child.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-white px-2 py-1 rounded text-gray-700">
                          {child.slug}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{category.name}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-gray-900">{child.products_count}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={child.status === 'active' ? 'success' : 'secondary'}>
                          {child.status.charAt(0).toUpperCase() + child.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(child.id, child.status)}
                            icon={child.status === 'active' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCategory(child)}
                            icon={<Edit2 className="w-4 h-4" />}
                          />
                          <Button
                            variant="error"
                            size="sm"
                            onClick={() => handleDeleteCategory(child.id)}
                            icon={<Trash2 className="w-4 h-4" />}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No categories found. Create your first category to get started.</p>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600 border-t pt-4">
          Total categories: {allCategories.length}
        </div>
      </Card>

      {/* Add/Edit Category Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingId(null);
          setFormData({
            name: '',
            slug: '',
            description: '',
            parent_id: '',
            status: 'active',
            sort_order: 0,
          });
        }}
        title={editingId ? 'Edit Category' : 'Add New Category'}
      >
        <div className="space-y-4">
          <Input
            label="Category Name *"
            value={formData.name || ''}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (!editingId) {
                setFormData((prev) => ({
                  ...prev,
                  slug: generateSlug(e.target.value),
                }));
              }
            }}
            placeholder="E.g., Electronics"
          />

          <Input
            label="Slug *"
            value={formData.slug || ''}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            placeholder="E.g., electronics"
          />

          <Textarea
            label="Description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Category description"
            rows={3}
          />

          <Select
            label="Parent Category"
            value={formData.parent_id || ''}
            onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
          >
            <option value="">None (Top Level)</option>
            {allCategories
              .filter((c) => !c.parent_id && c.id !== editingId)
              .map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Sort Order"
              type="number"
              value={formData.sort_order || 0}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
            />

            <Select
              label="Status"
              value={formData.status || 'active'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>

          <div className="flex gap-3 mt-6 border-t pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                setEditingId(null);
                setFormData({
                  name: '',
                  slug: '',
                  description: '',
                  parent_id: '',
                  status: 'active',
                  sort_order: 0,
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddCategory}>
              {editingId ? 'Update Category' : 'Add Category'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Categories;
