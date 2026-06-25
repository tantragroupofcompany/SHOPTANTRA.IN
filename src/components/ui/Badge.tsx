interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
}

const variants = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export function Badge({ label, variant = 'default', size = 'sm' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]}`}>
      {label}
    </span>
  );
}

export function statusBadge(status: string): { label: string; variant: BadgeProps['variant'] } {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    active: { label: 'Active', variant: 'success' },
    pending: { label: 'Pending', variant: 'warning' },
    suspended: { label: 'Suspended', variant: 'danger' },
    rejected: { label: 'Rejected', variant: 'danger' },
    draft: { label: 'Draft', variant: 'default' },
    archived: { label: 'Archived', variant: 'default' },
    confirmed: { label: 'Confirmed', variant: 'info' },
    processing: { label: 'Processing', variant: 'info' },
    shipped: { label: 'Shipped', variant: 'purple' },
    delivered: { label: 'Delivered', variant: 'success' },
    cancelled: { label: 'Cancelled', variant: 'danger' },
    refunded: { label: 'Refunded', variant: 'warning' },
    paid: { label: 'Paid', variant: 'success' },
    failed: { label: 'Failed', variant: 'danger' },
    open: { label: 'Open', variant: 'info' },
    in_progress: { label: 'In Progress', variant: 'warning' },
    resolved: { label: 'Resolved', variant: 'success' },
    closed: { label: 'Closed', variant: 'default' },
    new: { label: 'New', variant: 'info' },
    contacted: { label: 'Contacted', variant: 'warning' },
    qualified: { label: 'Qualified', variant: 'purple' },
    proposal: { label: 'Proposal', variant: 'info' },
    negotiation: { label: 'Negotiation', variant: 'warning' },
    won: { label: 'Won', variant: 'success' },
    lost: { label: 'Lost', variant: 'danger' },
    trial: { label: 'Trial', variant: 'purple' },
    expired: { label: 'Expired', variant: 'danger' },
    approved: { label: 'Approved', variant: 'success' },
    verified: { label: 'Verified', variant: 'success' },
  };
  return map[status] ?? { label: status, variant: 'default' };
}

export default Badge;
