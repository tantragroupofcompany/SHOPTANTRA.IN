import { useEffect, useState } from 'react';
import { Plus, MessageCircle, Eye } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge, statusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { SupportTicket } from '../../types';

const SupportTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    message: '',
    priority: 'medium' as const,
  });

  const categories = [
    'General Inquiry',
    'Order Issue',
    'Payment Problem',
    'Delivery Issue',
    'Product Quality',
    'Return/Refund',
    'Account Issue',
    'Other',
  ];

  const priorities = ['low', 'medium', 'high', 'urgent'];

  useEffect(() => {
    if (!user?.id) return;
    fetchTickets();
  }, [user?.id]);

  const fetchTickets = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data as SupportTicket[]);
    } catch (err) {
      console.error('Error fetching support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      const ticketNumber = `TKT-${Date.now()}`;

      const { error } = await supabase
        .from('support_tickets')
        .insert([
          {
            user_id: user.id,
            ticket_number: ticketNumber,
            subject: formData.subject,
            category: formData.category,
            message: formData.message,
            priority: formData.priority,
            status: 'open',
          },
        ]);

      if (error) throw error;

      await fetchTickets();
      setFormData({
        subject: '',
        category: '',
        message: '',
        priority: 'medium',
      });
      setIsNewTicketOpen(false);
    } catch (err) {
      console.error('Error creating support ticket:', err);
    }
  };

  const columns = [
    {
      key: 'ticket_number',
      header: 'Ticket #',
      render: (row: SupportTicket) => (
        <span className="font-medium text-[#1B3A6B]">
          {row.ticket_number}
        </span>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (row: SupportTicket) => (
        <div>
          <p className="font-medium text-gray-900">{row.subject}</p>
          <p className="text-sm text-gray-500">{row.category}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: SupportTicket) => {
        const badge = statusBadge(row.status);
        return <Badge label={badge.label} variant={badge.variant} size="sm" />;
      },
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row: SupportTicket) => {
        const priorityColors: Record<string, string> = {
          low: 'default',
          medium: 'info',
          high: 'warning',
          urgent: 'danger',
        };
        return (
          <Badge
            label={row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}
            variant={priorityColors[row.priority] as any}
            size="sm"
          />
        );
      },
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (row: SupportTicket) =>
        new Date(row.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: SupportTicket) => (
        <Button
          size="sm"
          variant="ghost"
          icon={<Eye className="w-4 h-4" />}
          onClick={() => {
            setSelectedTicket(row);
            setIsViewDetailsOpen(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 mt-2">
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          icon={<Plus className="w-5 h-5" />}
          onClick={() => setIsNewTicketOpen(true)}
        >
          New Ticket
        </Button>
      </div>

      {/* Tickets Table */}
      <Card>
        <Table
          columns={columns}
          data={tickets}
          loading={loading}
          keyExtractor={(row) => row.id}
          emptyMessage="No support tickets yet"
        />
      </Card>

      {/* New Ticket Modal */}
      <Modal
        isOpen={isNewTicketOpen}
        onClose={() => {
          setIsNewTicketOpen(false);
          setFormData({
            subject: '',
            category: '',
            message: '',
            priority: 'medium',
          });
        }}
        title="Create New Support Ticket"
        size="lg"
      >
        <form onSubmit={handleCreateTicket} className="space-y-6">
          <Input
            label="Subject"
            placeholder="Brief description of your issue"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
          />

          <Select
            label="Category"
            options={[
              { value: '', label: 'Select Category' },
              ...categories.map((cat) => ({ value: cat, label: cat })),
            ]}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          />

          <Select
            label="Priority"
            options={priorities.map((p) => ({
              value: p,
              label: p.charAt(0).toUpperCase() + p.slice(1),
            }))}
            value={formData.priority}
            onChange={(e) =>
              setFormData({ ...formData, priority: e.target.value as any })
            }
          />

          <Textarea
            label="Message"
            placeholder="Describe your issue in detail"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={6}
            required
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsNewTicketOpen(false);
                setFormData({
                  subject: '',
                  category: '',
                  message: '',
                  priority: 'medium',
                });
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Create Ticket</Button>
          </div>
        </form>
      </Modal>

      {/* View Ticket Details Modal */}
      <Modal
        isOpen={isViewDetailsOpen}
        onClose={() => setIsViewDetailsOpen(false)}
        title={selectedTicket ? `Ticket ${selectedTicket.ticket_number}` : 'Ticket Details'}
        size="lg"
      >
        {selectedTicket && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                  Status
                </p>
                <Badge
                  label={
                    statusBadge(selectedTicket.status).label
                  }
                  variant={statusBadge(selectedTicket.status).variant}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                  Priority
                </p>
                <Badge
                  label={selectedTicket.priority.charAt(0).toUpperCase() + selectedTicket.priority.slice(1)}
                  variant={
                    selectedTicket.priority === 'urgent'
                      ? 'danger'
                      : selectedTicket.priority === 'high'
                        ? 'warning'
                        : 'info'
                  }
                />
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                Subject
              </p>
              <p className="text-lg font-bold text-gray-900">
                {selectedTicket.subject}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                Category
              </p>
              <p className="text-gray-700">{selectedTicket.category}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                Message
              </p>
              <p className="text-gray-700 whitespace-pre-wrap">
                {selectedTicket.message}
              </p>
            </div>

            <div className="flex justify-between text-xs text-gray-500 pt-4 border-t">
              <span>
                Created: {new Date(selectedTicket.created_at).toLocaleString()}
              </span>
              <span>
                Updated: {new Date(selectedTicket.updated_at).toLocaleString()}
              </span>
            </div>

            {selectedTicket.status !== 'closed' && (
              <div className="pt-4 border-t">
                <Button size="sm" variant="ghost" className="w-full justify-center">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Add Reply
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SupportTickets;
