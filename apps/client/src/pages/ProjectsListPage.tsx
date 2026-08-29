import React, { useState, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects, useCreateProject, type Project } from '@/api/projects';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';
import { createProjectSchema, type RAGStatus, type ProjectStatus } from '@scb/shared';
import {
  Plus,
  Search,
  ArrowRight,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export const ProjectsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const [ragFilter, setRagFilter] = useState<RAGStatus | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL');

  // Modal State for New Project (Admin)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    status: 'PLANNING' as ProjectStatus,
    startDate: '',
    endDate: '',
    contractValue: '',
    finalCost: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Queries & Mutations
  const { data: projectsData, isLoading } = useProjects({
    search: deferredSearch || undefined,
    rag: ragFilter !== 'ALL' ? ragFilter : undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    limit: 50,
  });

  const createProjectMutation = useCreateProject();

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitError(null);

    const payload = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      status: formData.status,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      contractValue: parseFloat(formData.contractValue),
      finalCost: formData.finalCost ? parseFloat(formData.finalCost) : null,
    };

    const validation = createProjectSchema.safeParse(payload);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errors[String(err.path[0])] = err.message;
      });
      setFormErrors(errors);
      return;
    }

    try {
      await createProjectMutation.mutateAsync(validation.data);
      setIsCreateModalOpen(false);
      setFormData({
        code: '',
        name: '',
        description: '',
        status: 'PLANNING',
        startDate: '',
        endDate: '',
        contractValue: '',
        finalCost: '',
      });
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to create project.');
    }
  };

  const columns: Column<Project>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-scb-blue bg-scb-blue-light/70 px-2 py-0.5 rounded text-xs border border-scb-blue/20">
          {row.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Project / Facility Name',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-scb-dark text-xs">{row.name}</span>
          {row.description && (
            <span className="text-[11px] text-scb-dark-muted line-clamp-1 max-w-sm">
              {row.description}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'timeline',
      header: 'Timeline',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-scb-dark font-mono">
          <Calendar className="w-3.5 h-3.5 text-scb-dark-muted" />
          <span>{formatDate(row.startDate)}</span>
          <span className="text-scb-dark-muted">→</span>
          <span>{formatDate(row.endDate)}</span>
        </div>
      ),
    },
    {
      key: 'contractValue',
      header: 'Contract Value',
      sortable: true,
      align: 'right',
      render: (row) => (
        <div className="flex flex-col text-right font-mono">
          <span className="font-bold text-scb-dark text-xs">{formatCurrency(row.contractValue)}</span>
          {row.finalCost && (
            <span className="text-[10px] text-scb-dark-muted">
              Actual: {formatCurrency(row.finalCost)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'ragStatus',
      header: 'RAG Health',
      align: 'center',
      render: (row) => <Badge rag={row.ragStatus} size="sm" />,
    },
    {
      key: 'status',
      header: 'Lifecycle Status',
      align: 'center',
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-scb-offwhite border border-scb-warm text-scb-dark">
          {row.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <button
          onClick={() => navigate(`/projects/${row.id}`)}
          className="inline-flex items-center gap-1 text-xs font-bold text-scb-blue hover:text-scb-blue-hover p-1"
        >
          <span>Open</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  const projectsList = projectsData?.data || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-scb-warm/60 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-scb-blue uppercase tracking-widest bg-scb-blue-light px-2 py-0.5 rounded border border-scb-blue/20">
              Portfolio Directory
            </span>
          </div>
          <h1 className="text-2xl font-black text-scb-dark tracking-tight">
            Engineering Projects Portfolio
          </h1>
          <p className="text-xs text-scb-dark-muted mt-0.5">
            Overview of all capital facility developments, renovations, and technological infrastructure projects.
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            className="shadow-sm font-semibold gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </Button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-white shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-scb-dark-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by code or project name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-scb-offwhite border border-scb-warm rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-scb-blue focus:border-scb-blue transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
            {/* RAG Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-scb-dark-muted font-medium mr-1">RAG:</span>
              {(['ALL', 'GREEN', 'AMBER', 'RED'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRagFilter(r)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    ragFilter === r
                      ? 'bg-scb-blue text-white shadow-xs'
                      : 'bg-scb-offwhite text-scb-dark hover:bg-scb-warm/40'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Status Dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-scb-dark-muted font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="h-8 text-xs bg-scb-offwhite border border-scb-warm rounded-md px-2 font-medium focus:outline-none focus:ring-2 focus:ring-scb-blue"
              >
                <option value="ALL">All Statuses</option>
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Projects Data Table */}
      <DataTable
        columns={columns}
        data={projectsList}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="No engineering projects match your search or filter criteria."
        pageSize={10}
        onRowClick={(row) => navigate(`/projects/${row.id}`)}
      />

      {/* Create Project Modal (Admin Only) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Engineering Project"
        description="Register a new capital development project with strict contract valuation."
        maxWidth="xl"
      >
        {submitError && (
          <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Project Code (Unique, e.g. ENG-006)"
              placeholder="ENG-006"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              error={formErrors.code}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-scb-dark">Lifecycle Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                className="w-full h-9 rounded-md border border-scb-warm bg-white px-3 text-xs text-scb-dark focus:outline-none focus:ring-2 focus:ring-scb-blue"
              >
                <option value="PLANNING">PLANNING</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON_HOLD">ON_HOLD</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
          </div>

          <Input
            label="Project / Facility Name"
            placeholder="e.g. Alexandria Regional Branch Modernization"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-scb-dark">Scope Description (Optional)</label>
            <textarea
              placeholder="Brief summary of engineering works and objectives..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-scb-warm bg-white p-3 text-xs text-scb-dark focus:outline-none focus:ring-2 focus:ring-scb-blue"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              error={formErrors.startDate}
              required
            />

            <Input
              label="Committed Target End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              error={formErrors.endDate}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contract Value (EGP)"
              type="number"
              placeholder="5000000"
              value={formData.contractValue}
              onChange={(e) => setFormData({ ...formData, contractValue: e.target.value })}
              error={formErrors.contractValue}
              required
            />

            <Input
              label="Final / Actual Cost (Optional)"
              type="number"
              placeholder="Leave blank if in-progress"
              value={formData.finalCost}
              onChange={(e) => setFormData({ ...formData, finalCost: e.target.value })}
              error={formErrors.finalCost}
              helperText="Null final cost defaults RAG financial health to GREEN."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-scb-warm/60">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={createProjectMutation.isPending}
            >
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
