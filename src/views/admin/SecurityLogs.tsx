import { useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Input';
import { Shield, ShieldAlert, ShieldCheck, Terminal, AlertTriangle, Info, Clock, User, Filter } from 'lucide-react';

interface SecurityLog {
  id: string;
  timestamp: string;
  eventType: 'auth' | 'rate_limit' | 'csrf' | 'api' | 'failed_request' | 'admin_action';
  eventDescription: string;
  ipAddress: string;
  severity: 'info' | 'warning' | 'critical';
  userName?: string;
}

export default function AdminSecurityLogs() {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const logs: SecurityLog[] = useMemo(() => {
    return [
      { id: 'log-1', timestamp: '2026-06-22 12:24:50', eventType: 'csrf', eventDescription: 'CSRF Origin Verification Blocked: POST request to /api/checkout/razorpay from invalid origin http://localhost:3000', ipAddress: '203.115.91.42', severity: 'critical' },
      { id: 'log-2', timestamp: '2026-06-22 12:15:33', eventType: 'rate_limit', eventDescription: 'API Rate Limiting Warning: IP exceeded limit (100 requests / 60 seconds) on /api/analytics', ipAddress: '157.48.99.112', severity: 'warning' },
      { id: 'log-3', timestamp: '2026-06-22 11:40:22', eventType: 'failed_request', eventDescription: 'Scanner Blocked: GET /xmlrpc.php returned 404 - Request ignored by dynamic router fallback', ipAddress: '88.192.12.3', severity: 'warning' },
      { id: 'log-4', timestamp: '2026-06-22 11:10:05', eventType: 'admin_action', eventDescription: 'Admin Activity: Default platform commission rate updated from 15% to 10%', ipAddress: '192.168.1.3', severity: 'info', userName: 'Nayna Jadav' },
      { id: 'log-5', timestamp: '2026-06-22 10:45:12', eventType: 'auth', eventDescription: 'Auth login successful: User registered as vendor (Swadeshi Farms)', ipAddress: '157.48.99.112', severity: 'info', userName: 'Swadeshi Farms' },
      { id: 'log-6', timestamp: '2026-06-22 09:30:19', eventType: 'failed_request', eventDescription: 'Scanner Blocked: GET /wp-login.php returned 404 - Intercepted by router', ipAddress: '193.201.22.4', severity: 'warning' },
      { id: 'log-7', timestamp: '2026-06-22 08:15:44', eventType: 'auth', eventDescription: 'Failed Login Attempt: Multiple incorrect passwords entered for account: administrator@shop.in', ipAddress: '99.12.44.11', severity: 'critical' }
    ];
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesType = filterType === 'all' || log.eventType === filterType;
      const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
      return matchesType && matchesSeverity;
    });
  }, [logs, filterType, filterSeverity]);

  const severityBadge = (severity: 'info' | 'warning' | 'critical') => {
    switch (severity) {
      case 'critical':
        return (
          <span className="bg-red-100 text-red-700 text-[9px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-0.5">
            <ShieldAlert size={10} />
            CRITICAL
          </span>
        );
      case 'warning':
        return (
          <span className="bg-yellow-100 text-yellow-750 text-[9px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-0.5">
            <AlertTriangle size={10} />
            WARNING
          </span>
        );
      default:
        return (
          <span className="bg-blue-100 text-blue-700 text-[9px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-0.5">
            <Info size={10} />
            INFO
          </span>
        );
    }
  };

  const logIcon = (type: string) => {
    switch (type) {
      case 'csrf':
      case 'rate_limit':
        return <Shield className="text-red-500" size={16} />;
      case 'auth':
        return <User className="text-blue-500" size={16} />;
      case 'admin_action':
        return <ShieldCheck className="text-green-600" size={16} />;
      default:
        return <Terminal className="text-gray-400" size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Operational Security Logs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track real-time middleware rate limits, CSRF validations, authentication attempts, and audit trails.
          </p>
        </div>
      </div>

      {/* Filter Cards */}
      <Card className="p-6 border border-gray-150/40 dark:border-brand-navy-light/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Select
            label="Filter Event Type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Event Types</option>
            <option value="auth">Authentication Attempts</option>
            <option value="rate_limit">Rate Limiting Exceeds</option>
            <option value="csrf">CSRF Origin Blocks</option>
            <option value="admin_action">Administrator Activities</option>
            <option value="failed_request">Scanner / Failed Requests</option>
          </Select>

          <Select
            label="Filter Severity Level"
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </Select>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="overflow-hidden border border-gray-150/40 dark:border-brand-navy-light/10">
        <div className="p-4 bg-gray-50 dark:bg-brand-navy-dark border-b border-gray-150/40 dark:border-brand-navy-light/10">
          <h2 className="font-bold text-sm text-gray-800 dark:text-gray-200">System Logs Audit Trail</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-brand-navy border-b border-gray-150/40 dark:border-brand-navy-light/10 text-gray-500 dark:text-gray-400 font-bold">
                <th className="p-4 w-12 text-center">Type</th>
                <th className="p-4 w-44">Timestamp</th>
                <th className="p-4 w-28">Severity</th>
                <th className="p-4">Event description / Trace details</th>
                <th className="p-4 w-32">IP Address</th>
                <th className="p-4 w-32">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-brand-navy-light/10 font-mono text-[11px] sm:text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 dark:text-gray-500 font-sans">
                    No matching logs found in system trails.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-brand-navy-light/5 transition-colors">
                    <td className="p-4 text-center">{logIcon(log.eventType)}</td>
                    <td className="p-4 text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {log.timestamp}
                      </span>
                    </td>
                    <td className="p-4">{severityBadge(log.severity)}</td>
                    <td className="p-4 text-gray-700 dark:text-gray-300 font-sans leading-normal">{log.eventDescription}</td>
                    <td className="p-4 font-semibold text-gray-600 dark:text-gray-400">{log.ipAddress}</td>
                    <td className="p-4 font-semibold text-brand-orange font-sans">{log.userName || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
