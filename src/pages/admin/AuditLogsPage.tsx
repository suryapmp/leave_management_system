import React, { useState, useEffect } from 'react';
import { auditApi } from '../../services/api';
import { AuditLogItem } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { ShieldCheck, UserCheck, Clock, FileText } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const res = await auditApi.getLogs({ limit: 100 });
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => {
    if (actionFilter !== 'ALL' && l.action !== actionFilter) return false;
    return true;
  });

  const columns: Column<AuditLogItem>[] = [
    {
      header: 'Timestamp',
      accessor: l => (
        <div>
          <p className="font-bold text-slate-800">{new Date(l.created_at).toLocaleDateString()}</p>
          <p className="text-[10px] text-slate-400 font-mono">
            {new Date(l.created_at).toLocaleTimeString()}
          </p>
        </div>
      ),
      sortable: true,
      sortKey: 'created_at',
    },
    {
      header: 'User',
      accessor: l => (
        <div>
          <p className="font-semibold text-slate-900">{l.user_email || 'System'}</p>
          <p className="text-[10px] text-slate-400 font-mono">IP: {l.ip_address || '127.0.0.1'}</p>
        </div>
      ),
    },
    {
      header: 'Action',
      accessor: l => (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
          {l.action}
        </span>
      ),
      sortable: true,
      sortKey: 'action',
    },
    {
      header: 'Details & Changes',
      accessor: l => (
        <div className="max-w-md">
          <p className="text-xs text-slate-700">{l.details}</p>
          {l.metadata && Object.keys(l.metadata).length > 0 && (
            <pre className="mt-1 text-[10px] bg-slate-50 p-1.5 rounded border border-slate-100 text-slate-600 font-mono overflow-x-auto">
              {JSON.stringify(l.metadata, null, 2)}
            </pre>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Audit Trails</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable compliance log of all leave submissions, approvals, rejections, and quota adjustments
          </p>
        </div>

        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-semibold text-slate-800"
        >
          <option value="ALL">All Actions</option>
          <option value="LOGIN">LOGIN</option>
          <option value="APPLY_LEAVE">APPLY_LEAVE</option>
          <option value="APPROVE_LEAVE">APPROVE_LEAVE</option>
          <option value="REJECT_LEAVE">REJECT_LEAVE</option>
          <option value="CANCEL_LEAVE">CANCEL_LEAVE</option>
          <option value="ADJUST_BALANCE">ADJUST_BALANCE</option>
          <option value="UPDATE_EMPLOYEE">UPDATE_EMPLOYEE</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filteredLogs}
        isLoading={isLoading}
        searchPlaceholder="Search audit trails by user, action, or details..."
        searchKey={l => `${l.action} ${l.user_email} ${l.details}`}
      />
    </div>
  );
};
