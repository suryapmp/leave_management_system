import React, { useState, useEffect } from 'react';
import { employeesApi } from '../../services/api';
import { EmployeeListItem } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { RoleBadge } from '../../components/common/Badge';
import { Mail, Phone, Building2, Calendar, UserCheck } from 'lucide-react';

export const TeamMembersPage: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await employeesApi.getTeam();
      if (res.data.success) {
        setMembers(res.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Team Member',
      accessor: m => (
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            {m.name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-900">{m.name}</p>
            <p className="text-[10px] text-slate-400">{m.employee_code}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'name',
    },
    {
      header: 'Department / Role',
      accessor: m => (
        <div>
          <p className="font-semibold text-slate-800">{m.department_name}</p>
          <p className="text-[10px] text-slate-400">{m.designation_title}</p>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: m => (
        <div className="space-y-0.5 text-xs text-slate-600">
          <div className="flex items-center space-x-1">
            <Mail className="w-3 h-3 text-slate-400" />
            <span>{m.email}</span>
          </div>
          {m.phone && (
            <div className="flex items-center space-x-1 text-[11px] text-slate-400">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{m.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Employment',
      accessor: m => (
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
          {m.employment_type || 'FULL_TIME'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: m => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          ACTIVE
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Team Members Directory</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Overview of all direct reporting colleagues under your management
        </p>
      </div>

      <DataTable
        columns={columns}
        data={members}
        isLoading={isLoading}
        searchPlaceholder="Search by team member name or email..."
        searchKey={m => `${m.name} ${m.email} ${m.department_name}`}
        emptyMessage="No team members currently assigned under your direct report."
      />
    </div>
  );
};
