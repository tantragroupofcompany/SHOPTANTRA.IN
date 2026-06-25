import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit2, MessageSquare, Trash2, CheckCircle, XCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  source: 'website' | 'email' | 'referral' | 'social' | 'other';
  status: 'new' | 'contacted' | 'qualified' | 'won' | 'lost';
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
  follow_up_date?: string;
  notes?: string;
}

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter, priorityFilter, sourceFilter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = [...leads];

    if (searchTerm) {
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.phone.includes(searchTerm)
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter((lead) => lead.status === statusFilter.toLowerCase());
    }

    if (priorityFilter !== 'All') {
      filtered = filtered.filter((lead) => lead.priority === priorityFilter.toLowerCase());
    }

    if (sourceFilter !== 'All') {
      filtered = filtered.filter((lead) => lead.source === sourceFilter.toLowerCase());
    }

    setFilteredLeads(filtered);
  };

  const handleAddLead = async () => {
    try {
      if (!formData.name || !formData.email || !formData.phone) {
        alert('Please fill in all required fields');
        return;
      }

      const { error } = await supabase
        .from('leads')
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company || '',
          source: formData.source || 'other',
          status: formData.status || 'new',
          priority: formData.priority || 'medium',
          assigned_to: formData.assigned_to || '',
          follow_up_date: formData.follow_up_date || null,
        }]);

      if (error) throw error;

      fetchLeads();
      setShowAddModal(false);
      setFormData({});
    } catch (error) {
      console.error('Error adding lead:', error);
    }
  };

  const handleUpdateLead = async () => {
    try {
      if (!selectedLead) return;

      const { error } = await supabase
        .from('leads')
        .update({
          name: formData.name || selectedLead.name,
          email: formData.email || selectedLead.email,
          phone: formData.phone || selectedLead.phone,
          company: formData.company || selectedLead.company,
          status: formData.status || selectedLead.status,
          priority: formData.priority || selectedLead.priority,
          assigned_to: formData.assigned_to || selectedLead.assigned_to,
          follow_up_date: formData.follow_up_date || selectedLead.follow_up_date,
        })
        .eq('id', selectedLead.id);

      if (error) throw error;

      fetchLeads();
      setShowEditModal(false);
      setSelectedLead(null);
      setFormData({});
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const handleAddNote = async () => {
    try {
      if (!selectedLead || !newNote.trim()) return;

      const updatedNotes = `${selectedLead.notes || ''}\n${new Date().toLocaleString()}: ${newNote}`.trim();

      const { error } = await supabase
        .from('leads')
        .update({ notes: updatedNotes })
        .eq('id', selectedLead.id);

      if (error) throw error;

      setLeads(leads.map((l) =>
        l.id === selectedLead.id ? { ...l, notes: updatedNotes } : l
      ));

      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleConvertLead = async (leadId: string, status: 'won' | 'lost') => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', leadId);

      if (error) throw error;

      setLeads(leads.map((l) =>
        l.id === leadId ? { ...l, status } : l
      ));
    } catch (error) {
      console.error('Error converting lead:', error);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      setLeads(leads.filter((l) => l.id !== leadId));
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-purple-100 text-purple-800';
      case 'qualified':
        return 'bg-yellow-100 text-yellow-800';
      case 'won':
        return 'bg-green-100 text-green-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading leads...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
          <p className="text-gray-600 mt-2">Track and manage sales leads</p>
        </div>
        <Button onClick={() => {
          setFormData({});
          setShowAddModal(true);
        }} icon={<Plus className="w-4 h-4" />}>
          Add New Lead
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>All</option>
              <option>New</option>
              <option>Contacted</option>
              <option>Qualified</option>
              <option>Won</option>
              <option>Lost</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option>All</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
            <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
              <option>All</option>
              <option>Website</option>
              <option>Email</option>
              <option>Referral</option>
              <option>Social</option>
              <option>Other</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setPriorityFilter('All');
                setSourceFilter('All');
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Leads Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Company</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Source</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Priority</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Follow-up</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{lead.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lead.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lead.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lead.company || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{lead.source}</td>
                  <td className="px-6 py-4">
                    <Badge className={getStatusColor(lead.status)}>
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getPriorityColor(lead.priority)}>
                      {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedLead(lead);
                          setFormData(lead);
                          setShowEditModal(true);
                        }}
                        icon={<Edit2 className="w-4 h-4" />}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedLead(lead);
                          setShowNotesModal(true);
                        }}
                        icon={<MessageSquare className="w-4 h-4" />}
                      />
                      {lead.status !== 'won' && lead.status !== 'lost' && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleConvertLead(lead.id, 'won')}
                            icon={<CheckCircle className="w-4 h-4" />}
                          />
                          <Button
                            variant="error"
                            size="sm"
                            onClick={() => handleConvertLead(lead.id, 'lost')}
                            icon={<XCircle className="w-4 h-4" />}
                          />
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLead(lead.id)}
                        icon={<Trash2 className="w-4 h-4" />}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No leads found matching your criteria.</p>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600 border-t pt-4">
          Showing {filteredLeads.length} of {leads.length} leads
        </div>
      </Card>

      {/* Add Lead Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormData({});
        }}
        title="Add New Lead"
      >
        <div className="space-y-4">
          <Input
            label="Name *"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Lead name"
          />
          <Input
            label="Email *"
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Email address"
          />
          <Input
            label="Phone *"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Phone number"
          />
          <Input
            label="Company"
            value={formData.company || ''}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="Company name"
          />
          <Select
            label="Source"
            value={formData.source || 'other'}
            onChange={(e) => setFormData({ ...formData, source: e.target.value as any })}
          >
            <option value="website">Website</option>
            <option value="email">Email</option>
            <option value="referral">Referral</option>
            <option value="social">Social Media</option>
            <option value="other">Other</option>
          </Select>
          <Select
            label="Priority"
            value={formData.priority || 'medium'}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
          <div className="flex gap-3 mt-6 border-t pt-4">
            <Button variant="secondary" onClick={() => {
              setShowAddModal(false);
              setFormData({});
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddLead}>Add Lead</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Lead Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedLead(null);
          setFormData({});
        }}
        title="Edit Lead"
      >
        {selectedLead && (
          <div className="space-y-4">
            <Input
              label="Name"
              value={formData.name || selectedLead.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email || selectedLead.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={formData.phone || selectedLead.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Select
              label="Status"
              value={formData.status || selectedLead.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </Select>
            <Select
              label="Priority"
              value={formData.priority || selectedLead.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
            <div className="flex gap-3 mt-6 border-t pt-4">
              <Button variant="secondary" onClick={() => {
                setShowEditModal(false);
                setSelectedLead(null);
                setFormData({});
              }}>
                Cancel
              </Button>
              <Button onClick={handleUpdateLead}>Update Lead</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Notes Modal */}
      <Modal
        isOpen={showNotesModal}
        onClose={() => {
          setShowNotesModal(false);
          setSelectedLead(null);
          setNewNote('');
        }}
        title="Lead Notes"
      >
        {selectedLead && (
          <div className="space-y-4">
            <div className="bg-gray-50 border rounded-lg p-4 h-48 overflow-y-auto">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {selectedLead.notes || 'No notes yet'}
              </p>
            </div>
            <Textarea
              label="Add Note"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Type your note here..."
              rows={3}
            />
            <div className="flex gap-3 mt-6 border-t pt-4">
              <Button variant="secondary" onClick={() => {
                setShowNotesModal(false);
                setSelectedLead(null);
                setNewNote('');
              }}>
                Close
              </Button>
              <Button onClick={handleAddNote}>Add Note</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Leads;
