import React, { useState } from 'react';
import { useAuditLogs, type AuditLogEntry } from '@/api/audit';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { formatDate } from '@/lib/utils';
import type { AuditAction, AuditEntity } from '@scb/shared';
import {
  ShieldCheck,
  AlertOctagon,
  Eye,
  PlusCircle,
  Edit,
  Trash,
  LogIn,
} from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const [actionFilter, setActionFilter] = useState<AuditAction | 'ALL'>('ALL');
  const [entityFilter, setEntityFilter] = useState<AuditEntity | 'ALL'>('ALL');

  const { data: auditData, isLoading } = useAuditLogs({
    action: actionFilter !== 'ALL' ? actionFilter : undefined,
    entity: entityFilter !== 'ALL' ? entityFilter : undefined,
    limit: 50,
  });

  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const logsList = auditData?.data || [];

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'BASELINE_ATTEMPT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs animate-pulse">
            <AlertOctagon className="w-3.5 h-3.5" />
            BASELINE ATTEMPT
          </span>
        );
      case 'CREATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <PlusCircle className="w-3 h-3" />
            CREATE
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Edit className="w-3 h-3" />
            UPDATE
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Trash className="w-3 h-3" />
            DELETE
          </span>
        );
      case 'LOGIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <LogIn className="w-3 h-3" />
            LOGIN
          </span>
        );
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const columns: Column<AuditLogEntry>[] = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      sortable: true,
      render: (row) => {
        const d = new Date(row.createdAt);
        const timeStr = d.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        return (
          <div className="flex flex-col font-mono text-xs text-scb-dark">
            <span className="font-semibold">{formatDate(row.createdAt)}</span>
            <span className="text-[10px] text-scb-dark-muted">{timeStr}</span>
          </div>
        );
      },
    },
    {
      key: 'action',
      header: 'Action Type',
      sortable: true,
      render: (row) => getActionBadge(row.action),
    },
    {
      key: 'entity',
      header: 'Target Entity',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-bold text-scb-dark bg-scb-offwhite px-2 py-0.5 rounded border border-scb-warm">
          {row.entity}
        </span>
      ),
    },
    {
      key: 'entityId',
      header: 'Entity UUID',
      render: (row) => (
        <span className="font-mono text-[11px] text-scb-dark-muted">
          {row.entityId ? `${row.entityId.slice(0, 13)}...` : '—'}
        </span>
      ),
    },
    {
      key: 'userId',
      header: 'Actor UUID',
      render: (row) => (
        <span className="font-mono text-[11px] text-scb-dark">
          {row.userId ? `${row.userId.slice(0, 8)}...` : 'System'}
        </span>
      ),
    },
    {
      key: 'inspect',
      header: 'Payload',
      align: 'right',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedEntry(row)}
          className="h-7 text-xs gap-1 font-semibold"
        >
          <Eye className="w-3.5 h-3.5 text-scb-blue" />
          <span>Inspect</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-scb-warm/60 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Admin Governance
            </span>
          </div>
          <h1 className="text-2xl font-black text-scb-dark tracking-tight">
            Institutional Audit Trail Explorer
          </h1>
          <p className="text-xs text-scb-dark-muted mt-0.5">
            Cryptographically sealed and immutable audit trail capturing all system mutations and BASELINE_ATTEMPT violations.
          </p>
        </div>
      </div>

      {/* Security Banner */}
      <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="space-y-0.5 text-xs text-amber-900">
          <h4 className="font-bold">Compliance & Immutability Surveillance</h4>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Any attempt by an administrative user or external client to modify committed baseline dates triggers a critical <span className="font-bold font-mono">BASELINE_ATTEMPT</span> entry with user identity and attempt metadata.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Action Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-scb-dark-muted font-medium">Action:</span>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value as any)}
                className="h-8 text-xs bg-scb-offwhite border border-scb-warm rounded-md px-2 font-medium focus:outline-none focus:ring-2 focus:ring-scb-blue"
              >
                <option value="ALL">All Actions</option>
                <option value="BASELINE_ATTEMPT">🚨 BASELINE_ATTEMPT (Security)</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="LOGIN">LOGIN</option>
              </select>
            </div>

            {/* Entity Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-scb-dark-muted font-medium">Entity:</span>
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value as any)}
                className="h-8 text-xs bg-scb-offwhite border border-scb-warm rounded-md px-2 font-medium focus:outline-none focus:ring-2 focus:ring-scb-blue"
              >
                <option value="ALL">All Entities</option>
                <option value="PROJECT">PROJECT</option>
                <option value="MILESTONE">MILESTONE</option>
                <option value="PROCUREMENT_ITEM">PROCUREMENT_ITEM</option>
                <option value="CONTRACTOR_SCORE">CONTRACTOR_SCORE</option>
                <option value="USER">USER</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-scb-dark-muted font-medium">
            Total Logged Events: <span className="font-bold text-scb-dark">{logsList.length}</span>
          </div>
        </div>
      </Card>

      {/* Audit DataTable */}
      <DataTable
        columns={columns}
        data={logsList}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="No audit trail events matching your filter."
        pageSize={15}
        rowHighlight={(row) => (row.action === 'BASELINE_ATTEMPT' ? 'red' : null)}
      />

      {/* Payload Inspection Modal */}
      <Modal
        isOpen={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
        title="Audit Record Payload Inspection"
        description={`Event ID: ${selectedEntry?.id}`}
        maxWidth="xl"
      >
        {selectedEntry && (
          <div className="space-y-4 text-xs">
            {selectedEntry.action === 'BASELINE_ATTEMPT' && (
              <div className="p-3.5 rounded-lg bg-rose-600 text-white flex items-start gap-2.5 font-semibold">
                <AlertOctagon className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-sm">BASELINE MODIFICATION ATTEMPT RECORDED</p>
                  <p className="text-xs text-rose-100 font-normal mt-0.5">
                    This request was intercepted and rejected by the Service Layer. Milestone baseline remains intact.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 py-2 border-b border-scb-warm/40 font-mono">
              <div>
                <span className="text-scb-dark-muted font-sans text-[11px] block">Action</span>
                <span className="font-bold text-scb-dark">{selectedEntry.action}</span>
              </div>
              <div>
                <span className="text-scb-dark-muted font-sans text-[11px] block">Entity Target</span>
                <span className="font-bold text-scb-dark">{selectedEntry.entity}</span>
              </div>
            </div>

            {selectedEntry.metadata && (
              <div className="space-y-1">
                <span className="font-bold text-scb-dark text-[11px] uppercase tracking-wider">
                  Event Metadata
                </span>
                <pre className="p-3 rounded-lg bg-[#181B20] text-emerald-400 font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedEntry.metadata, null, 2)}
                </pre>
              </div>
            )}

            {selectedEntry.beforeState && (
              <div className="space-y-1">
                <span className="font-bold text-scb-dark text-[11px] uppercase tracking-wider">
                  Before State
                </span>
                <pre className="p-3 rounded-lg bg-[#181B20] text-amber-300 font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedEntry.beforeState, null, 2)}
                </pre>
              </div>
            )}

            {selectedEntry.afterState && (
              <div className="space-y-1">
                <span className="font-bold text-scb-dark text-[11px] uppercase tracking-wider">
                  After State
                </span>
                <pre className="p-3 rounded-lg bg-[#181B20] text-blue-300 font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedEntry.afterState, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-3">
              <Button variant="primary" size="sm" onClick={() => setSelectedEntry(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
