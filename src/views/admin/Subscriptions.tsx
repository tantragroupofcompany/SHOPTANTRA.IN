import React, { useEffect, useState } from 'react';
import { Search, Eye, Plus, Trash2 } from 'lucide-react';
import Card, { StatCard } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';

interface Subscription {
  id: string;
  seller_id: string;
  seller_name?: string;
  plan: string;
  billing_cycle: 'monthly' | 'yearly';
  status: 'active' | 'trial' | 'expired' | 'cancelled';
  start_date: string;
  end_date: string;
  amount: number;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  duration_days: number;
}

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'plans'>('subscriptions');
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [billingFilter, setBillingFilter] = useState<string>('All');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planFormData, setPlanFormData] = useState<Partial<SubscriptionPlan>>({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterSubscriptions();
  }, [subscriptions, searchTerm, planFilter, statusFilter, billingFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch subscriptions
      const { data: subsData } = await supabase
        .from('subscriptions')
        .select(`
          id,
          seller_id,
          plan,
          billing_cycle,
          status,
          start_date,
          end_date,
          amount,
          sellers(store_name)
        `)
        .order('created_at', { ascending: false });

      const formattedSubs = (subsData || []).map((sub: any) => ({
        ...sub,
        seller_name: sub.sellers?.store_name || 'Unknown',
      }));

      setSubscriptions(formattedSubs);

      // Fetch plans
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      setPlans(plansData || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSubscriptions = () => {
    let filtered = [...subscriptions];

    if (searchTerm) {
      filtered = filtered.filter(
        (sub) =>
          sub.seller_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.plan.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (planFilter !== 'All') {
      filtered = filtered.filter((sub) => sub.plan === planFilter);
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter((sub) => sub.status === statusFilter.toLowerCase());
    }

    if (billingFilter !== 'All') {
      filtered = filtered.filter((sub) => sub.billing_cycle === billingFilter.toLowerCase());
    }

    setFilteredSubscriptions(filtered);
  };

  const getStats = () => {
    const active = subscriptions.filter((s) => s.status === 'active').length;
    const trial = subscriptions.filter((s) => s.status === 'trial').length;
    const expired = subscriptions.filter((s) => s.status === 'expired').length;
    const totalRevenue = subscriptions.reduce((sum, s) => sum + s.amount, 0);

    return { active, trial, expired, totalRevenue };
  };

  const handleCancelSubscription = async (subId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subId);

      if (error) throw error;

      setSubscriptions(subscriptions.map((s) =>
        s.id === subId ? { ...s, status: 'cancelled' } : s
      ));
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    }
  };

  const handleSavePlan = async () => {
    try {
      if (!planFormData.name || !planFormData.price) {
        alert('Please fill in required fields');
        return;
      }

      if (planFormData.id) {
        // Update existing plan
        const { error } = await supabase
          .from('subscription_plans')
          .update({
            name: planFormData.name,
            description: planFormData.description,
            price: planFormData.price,
            features: planFormData.features,
            duration_days: planFormData.duration_days,
          })
          .eq('id', planFormData.id);

        if (error) throw error;
      } else {
        // Create new plan
        const { error } = await supabase
          .from('subscription_plans')
          .insert([{
            name: planFormData.name,
            description: planFormData.description,
            price: planFormData.price,
            features: planFormData.features || [],
            duration_days: planFormData.duration_days || 30,
          }]);

        if (error) throw error;
      }

      fetchData();
      setShowPlanModal(false);
      setPlanFormData({});
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      fetchData();
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trial':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading subscriptions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-gray-600 mt-2">Manage seller subscriptions and plans</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'subscriptions'
              ? 'text-orange-600 border-orange-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          Subscriptions
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'plans'
              ? 'text-orange-600 border-orange-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          Plans
        </button>
      </div>

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="Active"
              value={stats.active}
              icon={<span className="text-lg">✓</span>}
            />
            <StatCard
              title="Trial"
              value={stats.trial}
              icon={<span className="text-lg">*</span>}
            />
            <StatCard
              title="Expired"
              value={stats.expired}
              icon={<span className="text-lg">!</span>}
            />
            <StatCard
              title="Total Revenue"
              value={`$${stats.totalRevenue.toLocaleString()}`}
              icon={<span className="text-lg">$</span>}
            />
          </div>

          {/* Filters */}
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <Input
                  placeholder="Search subscriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plan</label>
                <Select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
                  <option>All</option>
                  {[...new Set(subscriptions.map((s) => s.plan))].map((plan) => (
                    <option key={plan}>{plan}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option>All</option>
                  <option>Active</option>
                  <option>Trial</option>
                  <option>Expired</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Billing</label>
                <Select value={billingFilter} onChange={(e) => setBillingFilter(e.target.value)}>
                  <option>All</option>
                  <option>Monthly</option>
                  <option>Yearly</option>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setSearchTerm('');
                    setPlanFilter('All');
                    setStatusFilter('All');
                    setBillingFilter('All');
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </Card>

          {/* Subscriptions Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Seller</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Plan</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Billing</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Start Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">End Date</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.map((sub) => (
                    <tr key={sub.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{sub.seller_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{sub.plan}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 capitalize">{sub.billing_cycle}</td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusColor(sub.status)}>
                          {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(sub.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(sub.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-orange-600">
                        ${sub.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSubscription(sub);
                              setShowDetailsModal(true);
                            }}
                            icon={<Eye className="w-4 h-4" />}
                          />
                          {sub.status !== 'cancelled' && (
                            <Button
                              variant="error"
                              size="sm"
                              onClick={() => handleCancelSubscription(sub.id)}
                              icon={<Trash2 className="w-4 h-4" />}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredSubscriptions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No subscriptions found.</p>
              </div>
            )}
          </Card>
        </>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <>
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {
                setPlanFormData({});
                setShowPlanModal(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Plan
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                <div className="text-3xl font-bold text-orange-600 mb-4">
                  ${plan.price.toFixed(2)}<span className="text-sm text-gray-600">/month</span>
                </div>
                <div className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-orange-500">✓</span>
                      {feature}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 border-t pt-4">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setPlanFormData(plan);
                      setShowPlanModal(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="error"
                    className="flex-1"
                    onClick={() => handleDeletePlan(plan.id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Subscription Details"
      >
        {selectedSubscription && (
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900">{selectedSubscription.seller_name}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Plan</label>
                <p className="text-gray-900 mt-1">{selectedSubscription.plan}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <p className="text-gray-900 mt-1 capitalize">{selectedSubscription.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Billing Cycle</label>
                <p className="text-gray-900 mt-1 capitalize">{selectedSubscription.billing_cycle}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Amount</label>
                <p className="text-orange-600 mt-1 font-semibold">${selectedSubscription.amount.toFixed(2)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Start Date</label>
                <p className="text-gray-900 mt-1">{new Date(selectedSubscription.start_date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">End Date</label>
                <p className="text-gray-900 mt-1">{new Date(selectedSubscription.end_date).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6 border-t pt-4">
              <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Plan Modal */}
      <Modal
        isOpen={showPlanModal}
        onClose={() => {
          setShowPlanModal(false);
          setPlanFormData({});
        }}
        title={planFormData.id ? 'Edit Plan' : 'Add Plan'}
      >
        <div className="space-y-4">
          <Input
            label="Plan Name"
            value={planFormData.name || ''}
            onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
            placeholder="e.g., Professional"
          />
          <Input
            label="Description"
            value={planFormData.description || ''}
            onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
            placeholder="Plan description"
          />
          <Input
            label="Price"
            type="number"
            value={planFormData.price || 0}
            onChange={(e) => setPlanFormData({ ...planFormData, price: parseFloat(e.target.value) })}
            placeholder="0.00"
          />
          <Input
            label="Duration (days)"
            type="number"
            value={planFormData.duration_days || 30}
            onChange={(e) => setPlanFormData({ ...planFormData, duration_days: parseInt(e.target.value) })}
          />
          <div className="flex gap-3 mt-6 border-t pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowPlanModal(false);
                setPlanFormData({});
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePlan}>Save Plan</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Subscriptions;
