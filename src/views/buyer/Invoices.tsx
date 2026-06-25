import { useEffect, useState } from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Order, OrderItem } from '../../types';

interface InvoiceData {
  order: Order;
  itemCount: number;
}

const Invoices = () => {
  const { user, profile } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetchInvoices();
  }, [user?.id]);

  const fetchInvoices = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const invoiceData = (data as any[]).map((order) => ({
        order: order as Order,
        itemCount: (order.order_items as OrderItem[])?.length || 0,
      }));

      setInvoices(invoiceData);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = (invoice: InvoiceData) => {
    const { order } = invoice;
    const content = generateInvoiceContent(invoice);

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `invoice-${order.order_number}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const generateInvoiceContent = (invoice: InvoiceData): string => {
    const { order, itemCount } = invoice;
    return `
╔═══════════════════════════════════════════════════╗
║                   SHOPTANTRA                      ║
║          Multi-Vendor E-Commerce Platform         ║
╚═══════════════════════════════════════════════════╝

INVOICE DETAILS
═══════════════════════════════════════════════════

Invoice Number:    ${order.order_number}
Invoice Date:      ${new Date(order.created_at).toLocaleDateString()}
Status:            ${order.status.toUpperCase()}
Payment Status:    ${order.payment_status.toUpperCase()}

CUSTOMER INFORMATION
═══════════════════════════════════════════════════

Name:              ${profile?.full_name || 'N/A'}
Email:             ${profile?.user_id || 'N/A'}

ITEMS (${itemCount} item${itemCount !== 1 ? 's' : ''})
═══════════════════════════════════════════════════

${order.order_items
  ?.map((item: OrderItem) => `
Product:           ${item.title}
Quantity:          ${item.quantity}
Unit Price:        ₹${(item.price).toFixed(2)}
Total:             ₹${item.total.toFixed(2)}
`)
  .join('─────────────────────────────────────────────────────\n') || 'No items'}

BILLING SUMMARY
═══════════════════════════════════════════════════

Subtotal:          ₹${order.subtotal.toFixed(2)}
Discount:          ₹${order.discount_amount.toFixed(2)}
Shipping:          ₹${order.shipping_amount.toFixed(2)}
Tax (GST):         ₹${order.tax_amount.toFixed(2)}
─────────────────────────────────────────────────────
TOTAL AMOUNT:      ₹${order.total_amount.toFixed(2)}

PAYMENT METHOD
═══════════════════════════════════════════════════

Method:            ${order.payment_method || 'Not specified'}
Status:            ${order.payment_status.toUpperCase()}

SHIPPING ADDRESS
═══════════════════════════════════════════════════

${order.shipping_address ? Object.entries(order.shipping_address)
  .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
  .join('\n') : 'Address not provided'}

═══════════════════════════════════════════════════

Thank you for your purchase!
For support, visit: www.shoptantra.com/support

Generated on: ${new Date().toLocaleString()}
    `;
  };

  const columns = [
    {
      key: 'order_number',
      header: 'Order #',
      render: (row: InvoiceData) => (
        <span className="font-medium text-[#1B3A6B]">
          #{row.order.order_number}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
      render: (row: InvoiceData) =>
        new Date(row.order.created_at).toLocaleDateString(),
    },
    {
      key: 'itemCount',
      header: 'Items',
      render: (row: InvoiceData) => `${row.itemCount} item${row.itemCount !== 1 ? 's' : ''}`,
    },
    {
      key: 'total_amount',
      header: 'Amount',
      render: (row: InvoiceData) => (
        <span className="font-semibold text-gray-900">
          ₹{row.order.total_amount.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: InvoiceData) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => {
              setSelectedInvoice(row);
              setIsPreviewOpen(true);
            }}
          >
            Preview
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<Download className="w-4 h-4" />}
            onClick={() => downloadInvoice(row)}
          >
            Download
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
        <p className="text-gray-600 mt-2">Download and view your invoices</p>
      </div>

      {/* Invoices Table */}
      <Card>
        <Table
          columns={columns}
          data={invoices}
          loading={loading}
          keyExtractor={(row) => row.order.id}
          emptyMessage="No invoices available"
        />
      </Card>

      {/* Invoice Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Invoice Preview"
        size="xl"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            {/* Invoice Template */}
            <div className="bg-white p-8 border-2 border-gray-100 rounded-lg font-mono text-sm">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[#1B3A6B]">SHOPTANTRA</h2>
                <p className="text-gray-600 text-xs">Multi-Vendor E-Commerce Platform</p>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-2">BILL TO</p>
                  <div className="text-sm text-gray-900">
                    <p className="font-semibold">{profile?.full_name || 'Customer'}</p>
                    <p className="text-xs text-gray-600">{profile?.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-semibold mb-2">INVOICE DETAILS</p>
                  <div className="text-sm text-gray-900">
                    <p>Invoice: #{selectedInvoice.order.order_number}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(selectedInvoice.order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full mb-8 border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-2 text-xs font-semibold text-gray-600">
                      DESCRIPTION
                    </th>
                    <th className="text-center py-2 text-xs font-semibold text-gray-600">
                      QTY
                    </th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-600">
                      UNIT PRICE
                    </th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-600">
                      AMOUNT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.order.order_items?.map((item: OrderItem) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-3 text-sm text-gray-900">{item.title}</td>
                      <td className="py-3 text-sm text-gray-900 text-center">{item.quantity}</td>
                      <td className="py-3 text-sm text-gray-900 text-right">
                        ₹{item.price.toFixed(2)}
                      </td>
                      <td className="py-3 text-sm text-gray-900 text-right font-semibold">
                        ₹{item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-64">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="text-sm font-semibold">₹{selectedInvoice.order.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.order.discount_amount > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Discount</span>
                      <span className="text-sm font-semibold text-green-600">
                        -₹{selectedInvoice.order.discount_amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Shipping</span>
                    <span className="text-sm font-semibold">₹{selectedInvoice.order.shipping_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b-2 border-gray-300">
                    <span className="text-sm text-gray-600">Tax (GST)</span>
                    <span className="text-sm font-semibold">₹{selectedInvoice.order.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-3 bg-gray-50 px-3 rounded">
                    <span className="font-bold text-gray-900">TOTAL</span>
                    <span className="text-lg font-bold text-[#1B3A6B]">
                      ₹{selectedInvoice.order.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-gray-500 border-t pt-4">
                <p>Thank you for your business!</p>
              </div>
            </div>

            {/* Download Button */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsPreviewOpen(false)}
              >
                Close
              </Button>
              <Button
                icon={<Download className="w-4 h-4" />}
                onClick={() => {
                  downloadInvoice(selectedInvoice);
                  setIsPreviewOpen(false);
                }}
              >
                Download Invoice
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Invoices;
