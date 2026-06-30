import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Plus } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';

interface Image {
  url: string;
  isPrimary: boolean;
}

interface Variant {
  name: string;
  value: string;
  priceAdjustment: number;
  stock: number;
}

const ProductUpload = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    category: '',
    tags: '',
    price: '',
    comparePrice: '',
    sku: '',
    barcode: '',
    stock: '',
    lowStockAlert: '10',
    weight: '',
    weightUnit: 'kg',
    dimensionLength: '',
    dimensionWidth: '',
    dimensionHeight: '',
    packageType: 'box',
    shippingClass: 'standard',
    fragile: 'false',
    dangerousGoods: 'false',
    countryOfOrigin: 'India',
    hsnCode: '',
    estimatedPackingTime: '24',
    status: 'draft',
  });

  const [images, setImages] = useState<Image[]>([
    { url: '', isPrimary: true },
    { url: '', isPrimary: false },
    { url: '', isPrimary: false },
    { url: '', isPrimary: false },
    { url: '', isPrimary: false },
  ]);

  const [variants, setVariants] = useState<Variant[]>([]);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [newVariant, setNewVariant] = useState<Variant>({
    name: '',
    value: '',
    priceAdjustment: 0,
    stock: 0,
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const defaultCategories = [
          { id: 'electronics', name: 'Electronics' },
          { id: 'fashion', name: 'Fashion & Apparel' },
          { id: 'home', name: 'Home & Kitchen' },
          { id: 'beauty', name: 'Beauty & Personal Care' },
          { id: 'books', name: 'Books & Stationery' },
          { id: 'sports', name: 'Sports & Outdoors' },
          { id: 'toys', name: 'Toys & Games' },
          { id: 'health', name: 'Health & Wellness' },
          { id: 'grocery', name: 'Grocery & Gourmet' }
        ];
        setCategories(defaultCategories);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setCategoryLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...images];
    newImages[index].url = value;
    setImages(newImages);
  };

  const handleSetPrimary = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    setImages(newImages);
  };

  const handleAddVariant = () => {
    if (newVariant.name && newVariant.value) {
      setVariants([...variants, { ...newVariant }]);
      setNewVariant({ name: '', value: '', priceAdjustment: 0, stock: 0 });
      setShowVariantForm(false);
    }
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) throw new Error('User not authenticated');
      if (!formData.title || !formData.price || !formData.category) {
        throw new Error('Please fill in all required fields');
      }

      // Phase 13 Requirement: Prevent publishing product without shipping information
      if (!formData.weight || !formData.dimensionLength || !formData.dimensionWidth || !formData.dimensionHeight) {
        throw new Error('Mandatory shipping details (Product Weight, Package Length, Package Width, Package Height) are required to publish the product.');
      }

      // Filter and prepare images JSON array
      const validImages = images
        .filter(img => img.url.trim() !== '')
        .map(img => ({ url: img.url.trim(), isPrimary: img.isPrimary }));

      // Call local API to create product
      const res = await fetch('/api/seller/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: formData.title,
          price: formData.price,
          comparePrice: formData.comparePrice,
          stock: formData.stock,
          category: formData.category,
          shortDescription: formData.shortDescription,
          description: formData.description,
          sku: formData.sku,
          barcode: formData.barcode,
          status: formData.status,
          images: validImages,
          variants: variants,
          tags: formData.tags,
          weight: parseFloat(formData.weight),
          weightUnit: formData.weightUnit,
          dimensionLength: parseFloat(formData.dimensionLength),
          dimensionWidth: parseFloat(formData.dimensionWidth),
          dimensionHeight: parseFloat(formData.dimensionHeight),
          packageType: formData.packageType,
          shippingClass: formData.shippingClass,
          fragile: formData.fragile === 'true',
          dangerousGoods: formData.dangerousGoods === 'true',
          countryOfOrigin: formData.countryOfOrigin,
          hsnCode: formData.hsnCode || null,
          estimatedPackingTime: parseInt(formData.estimatedPackingTime)
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to upload product');
      }

      alert('Product created successfully!');
      navigate('/seller/inventory');
    } catch (error: any) {
      console.error('Error uploading product:', error);
      alert(error.message || 'Failed to upload product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
        <p className="text-gray-600 mt-2">Create and list a new product in your store</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Title *</label>
              <Input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter product title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
              <Input
                type="text"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleInputChange}
                placeholder="Brief description for listings"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Detailed product description"
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  disabled={categoryLoading}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                <Input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g., summer, sale, trending"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Pricing */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pricing</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <Input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compare Price (Sale)</label>
              <Input
                type="number"
                name="comparePrice"
                value={formData.comparePrice}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <Input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                placeholder="Stock Keeping Unit"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
              <Input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleInputChange}
                placeholder="Barcode number"
              />
            </div>
          </div>
        </Card>

        {/* Inventory */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Inventory</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
              <Input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert</label>
              <Input
                type="number"
                name="lowStockAlert"
                value={formData.lowStockAlert}
                onChange={handleInputChange}
                placeholder="10"
              />
            </div>
          </div>
        </Card>

        {/* Shipping */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Weight *</label>
                <Input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight Unit *</label>
                <Select
                  name="weightUnit"
                  value={formData.weightUnit}
                  onChange={handleInputChange}
                  required
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="g">Grams (g)</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Package Dimensions (L x W x H in cm) *</label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  name="dimensionLength"
                  value={formData.dimensionLength}
                  onChange={handleInputChange}
                  placeholder="Length"
                  step="0.01"
                  required
                />
                <Input
                  type="number"
                  name="dimensionWidth"
                  value={formData.dimensionWidth}
                  onChange={handleInputChange}
                  placeholder="Width"
                  step="0.01"
                  required
                />
                <Input
                  type="number"
                  name="dimensionHeight"
                  value={formData.dimensionHeight}
                  onChange={handleInputChange}
                  placeholder="Height"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Package Type *</label>
                <Select
                  name="packageType"
                  value={formData.packageType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="box">Cardboard Box</option>
                  <option value="flyer">Courier Flyer Sleeve</option>
                  <option value="packet">Small Packet Enclosure</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Class *</label>
                <Select
                  name="shippingClass"
                  value={formData.shippingClass}
                  onChange={handleInputChange}
                  required
                >
                  <option value="standard">Standard Shipping</option>
                  <option value="heavy">Heavy Weight Package</option>
                  <option value="express">Express Delivery Class</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fragile Content *</label>
                <Select
                  name="fragile"
                  value={formData.fragile}
                  onChange={handleInputChange}
                  required
                >
                  <option value="false">No (Not Fragile)</option>
                  <option value="true">Yes (Handle With Care)</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dangerous Goods (Hazmat) *</label>
                <Select
                  name="dangerousGoods"
                  value={formData.dangerousGoods}
                  onChange={handleInputChange}
                  required
                >
                  <option value="false">No (Standard Item)</option>
                  <option value="true">Yes (Hazmat Regulations Apply)</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Country of Origin *</label>
                <Input
                  type="text"
                  name="countryOfOrigin"
                  value={formData.countryOfOrigin}
                  onChange={handleInputChange}
                  placeholder="e.g. India"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Packing Time *</label>
                <Select
                  name="estimatedPackingTime"
                  value={formData.estimatedPackingTime}
                  onChange={handleInputChange}
                  required
                >
                  <option value="12">12 Hours</option>
                  <option value="24">24 Hours (1 Day)</option>
                  <option value="48">48 Hours (2 Days)</option>
                  <option value="72">72 Hours (3 Days)</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code (Optional)</label>
              <Input
                type="text"
                name="hsnCode"
                value={formData.hsnCode}
                onChange={handleInputChange}
                placeholder="e.g. 84713010"
              />
            </div>
          </div>
        </Card>

        {/* Images */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Images</h2>
          <div className="space-y-3">
            {images.map((image, index) => (
              <div key={index} className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL {index + 1}</label>
                  <Input
                    type="url"
                    value={image.url}
                    onChange={(e) => handleImageChange(index, e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                {image.url && (
                  <Button
                    type="button"
                    onClick={() => handleSetPrimary(index)}
                    variant={image.isPrimary ? 'default' : 'outline'}
                    size="sm"
                  >
                    {image.isPrimary ? 'Primary' : 'Set Primary'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Variants */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Product Variants</h2>
            <Button
              type="button"
              onClick={() => setShowVariantForm(!showVariantForm)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Plus size={16} />
              Add Variant
            </Button>
          </div>

          {showVariantForm && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="text"
                  placeholder="Variant name (e.g., Size)"
                  value={newVariant.name}
                  onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                />
                <Input
                  type="text"
                  placeholder="Value (e.g., XL)"
                  value={newVariant.value}
                  onChange={(e) => setNewVariant({ ...newVariant, value: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  placeholder="Price adjustment"
                  value={newVariant.priceAdjustment}
                  onChange={(e) => setNewVariant({ ...newVariant, priceAdjustment: parseFloat(e.target.value) })}
                />
                <Input
                  type="number"
                  placeholder="Stock"
                  value={newVariant.stock}
                  onChange={(e) => setNewVariant({ ...newVariant, stock: parseInt(e.target.value) })}
                />
              </div>

              <Button type="button" onClick={handleAddVariant} className="w-full">
                Add Variant
              </Button>
            </div>
          )}

          {variants.length > 0 && (
            <div className="space-y-2">
              {variants.map((variant, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{variant.name}: {variant.value}</p>
                    <p className="text-sm text-gray-600">Price Adj: +${variant.priceAdjustment} | Stock: {variant.stock}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Status */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Status</h2>
          <Select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
          >
            <option value="draft">Draft</option>
            <option value="pending">Pending Review</option>
          </Select>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/seller/products')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="gap-2"
          >
            <Upload size={18} />
            {loading ? 'Publishing...' : 'Publish Product'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default function SafeProductUpload() {
  return (
    <ErrorBoundary>
      <ProductUpload />
    </ErrorBoundary>
  );
}
