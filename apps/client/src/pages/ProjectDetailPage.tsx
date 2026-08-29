import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useProject,
  useUpdateProject,
  useDeleteProject,
  useCreateStoppage,
  useUpdateStoppage,
  useDeleteStoppage,
} from '@/api/projects';
import {
  useMilestones,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
  type Milestone,
} from '@/api/milestones';
import {
  useProjectProcurement,
  useCreateProcurement,
  type ProcurementItem,
} from '@/api/procurement';
import {
  useContractors,
  useCreateContractor,
} from '@/api/contractors';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { TimelineCharts } from '@/components/charts/TimelineCharts';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  updateProjectSchema,
  createMilestoneSchema,
  updateMilestoneSchema,
  createProcurementSchema,
  createContractorSchema,
  createStoppageSchema,
  updateStoppageSchema,
  type MilestoneStatus,
  type ProcurementStatus,
  type ProjectStatus,
  type ProjectStoppage,
  type UpdateProjectInput,
} from '@scb/shared';
import {
  ArrowLeft,
  DollarSign,
  Lock,
  Plus,
  Edit2,
  Edit3,
  Trash2,
  AlertTriangle,
  Info,
} from 'lucide-react';

type TabType = 'schedule' | 'overview' | 'financials' | 'procurement' | 'contractors';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('schedule');

  // Query Data
  const { data: project, isLoading: isProjectLoading, refetch: refetchProject } = useProject(id);
  const { data: milestones = [], isLoading: isMilestonesLoading } = useMilestones(id);
  const { data: procurementItems = [], isLoading: isProcurementLoading } = useProjectProcurement(id);
  const { data: contractorsData } = useContractors();

  // Filter linked contractors for this project
  const linkedContractors = (contractorsData?.data || []).filter((c) => c.projectId === id);

  // Mutations
  const updateProjectMutation = useUpdateProject(id || '');
  const deleteProjectMutation = useDeleteProject();
  const createMilestoneMutation = useCreateMilestone(id || '');
  const updateMilestoneMutation = useUpdateMilestone(id);
  const deleteMilestoneMutation = useDeleteMilestone(id);
  const createProcurementMutation = useCreateProcurement(id);
  const createContractorMutation = useCreateContractor();
  const createStoppageMutation = useCreateStoppage(id || '');
  const updateStoppageMutation = useUpdateStoppage(id || '');
  const deleteStoppageMutation = useDeleteStoppage(id || '');

  // Edit Project Modal State
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [editProjectFormData, setEditProjectFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE' as ProjectStatus,
    startDate: '',
    endDate: '',
    contractValue: '',
    finalCost: '',
  });
  const [editProjectFormErrors, setEditProjectFormErrors] = useState<Record<string, string>>({});

  // Delete Project Modal State
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [deleteConfirmationCode, setDeleteConfirmationCode] = useState('');

  // Stoppage Add Modal State
  const [isAddStoppageOpen, setIsAddStoppageOpen] = useState(false);
  const [stoppageFormData, setStoppageFormData] = useState({
    reason: '',
    startDate: '',
    endDate: '',
  });
  const [stoppageFormErrors, setStoppageFormErrors] = useState<Record<string, string>>({});

  // Stoppage Edit Modal State
  const [isEditStoppageOpen, setIsEditStoppageOpen] = useState(false);
  const [editingStoppage, setEditingStoppage] = useState<ProjectStoppage | null>(null);
  const [editStoppageFormData, setEditStoppageFormData] = useState({
    reason: '',
    startDate: '',
    endDate: '',
  });
  const [editStoppageFormErrors, setEditStoppageFormErrors] = useState<Record<string, string>>({});

  // Milestone Add Modal
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [milestoneFormData, setMilestoneFormData] = useState({
    name: '',
    description: '',
    baselineDate: '',
    forecastDate: '',
    status: 'NOT_STARTED' as MilestoneStatus,
  });
  const [milestoneFormErrors, setMilestoneFormErrors] = useState<Record<string, string>>({});

  // Milestone Edit Modal (LAYER 1 IMMUTABILITY: baselineDate is EXCLUDED)
  const [isEditMilestoneOpen, setIsEditMilestoneOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [editMilestoneFormData, setEditMilestoneFormData] = useState({
    name: '',
    description: '',
    forecastDate: '',
    actualDate: '',
    status: 'NOT_STARTED' as MilestoneStatus,
  });
  const [editMilestoneFormErrors, setEditMilestoneFormErrors] = useState<Record<string, string>>({});

  // Procurement Add Modal
  const [isAddProcurementOpen, setIsAddProcurementOpen] = useState(false);
  const [procurementFormData, setProcurementFormData] = useState({
    itemName: '',
    description: '',
    tenderQuantity: '',
    allocatedQuantity: '0',
    deliveredQuantity: '0',
    unitCost: '',
    status: 'PENDING' as ProcurementStatus,
  });
  const [procurementFormErrors, setProcurementFormErrors] = useState<Record<string, string>>({});

  // Contractor Add Modal
  const [isAddContractorOpen, setIsAddContractorOpen] = useState(false);
  const [contractorFormData, setContractorFormData] = useState({
    contractorName: '',
    schedule: 80,
    quality: 85,
    resources: 80,
    safety: 90,
    coordination: 80,
    docs: 75,
  });
  const [contractorFormErrors, setContractorFormErrors] = useState<Record<string, string>>({});

  // Financial Quick Edit Modal
  const [isFinancialEditOpen, setIsFinancialEditOpen] = useState(false);
  const [financialForm, setFinancialForm] = useState({
    contractValue: '',
    finalCost: '',
  });

  if (isProjectLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-scb-blue border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-scb-dark">Loading project details...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-scb-dark">Project Not Found</h2>
        <p className="text-xs text-scb-dark-muted">The requested project ID does not exist.</p>
        <Button variant="primary" size="sm" onClick={() => navigate('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────

  // Edit Project Handlers
  const openEditProjectModal = () => {
    setEditProjectFormData({
      name: project.name,
      description: project.description || '',
      status: project.status,
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
      contractValue: project.contractValue,
      finalCost: project.finalCost || '',
    });
    setEditProjectFormErrors({});
    setIsEditProjectOpen(true);
  };

  const handleEditProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditProjectFormErrors({});

    const payload: UpdateProjectInput = {
      name: editProjectFormData.name.trim(),
      description: editProjectFormData.description.trim() || undefined,
      status: editProjectFormData.status,
      startDate: editProjectFormData.startDate ? new Date(editProjectFormData.startDate) : undefined,
      endDate: editProjectFormData.endDate ? new Date(editProjectFormData.endDate) : undefined,
      contractValue: editProjectFormData.contractValue ? parseFloat(editProjectFormData.contractValue) : undefined,
      finalCost: editProjectFormData.finalCost ? parseFloat(editProjectFormData.finalCost) : null,
    };

    const validation = updateProjectSchema.safeParse(payload);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errors[String(err.path[0])] = err.message;
      });
      setEditProjectFormErrors(errors);
      return;
    }

    try {
      await updateProjectMutation.mutateAsync(validation.data);
      toast.success('Project Updated', 'Project master metadata and timeline updated successfully.');
      setIsEditProjectOpen(false);
      refetchProject();
    } catch (err: any) {
      toast.error('Update Failed', err?.response?.data?.error?.message || 'Could not update project.');
    }
  };

  // Delete Project Handlers
  const handleDeleteProjectConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmationCode.trim() !== project.code) {
      toast.error('Confirmation Failed', `Please type the exact project code "${project.code}" to confirm deletion.`);
      return;
    }

    try {
      await deleteProjectMutation.mutateAsync(project.id);
      toast.success('Project Deleted', `Project ${project.code} and all linked records have been removed.`);
      setIsDeleteProjectOpen(false);
      navigate('/projects');
    } catch (err: any) {
      toast.error('Deletion Failed', err?.response?.data?.error?.message || 'Could not delete project.');
    }
  };

  // Add Stoppage / Extension Submit
  const handleAddStoppageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStoppageFormErrors({});

    const payload = {
      reason: stoppageFormData.reason.trim(),
      startDate: new Date(stoppageFormData.startDate),
      endDate: stoppageFormData.endDate ? new Date(stoppageFormData.endDate) : null,
    };

    const validation = createStoppageSchema.safeParse(payload);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errors[String(err.path[0])] = err.message;
      });
      setStoppageFormErrors(errors);
      return;
    }

    try {
      await createStoppageMutation.mutateAsync(validation.data);
      toast.success(
        'Stoppage Extension Recorded',
        validation.data.endDate
          ? 'Adjusted baseline updated with resolved delay.'
          : 'Ongoing stoppage registered; dynamic daily calculation active.'
      );
      setIsAddStoppageOpen(false);
      setStoppageFormData({
        reason: '',
        startDate: '',
        endDate: '',
      });
      refetchProject();
    } catch (err: any) {
      toast.error('Failed to add stoppage extension', err?.response?.data?.error?.message);
    }
  };

  // Edit Stoppage Modal Open
  const openEditStoppage = (stoppage: ProjectStoppage) => {
    setEditingStoppage(stoppage);
    setEditStoppageFormData({
      reason: stoppage.reason,
      startDate: stoppage.startDate ? stoppage.startDate.split('T')[0] : '',
      endDate: stoppage.endDate ? stoppage.endDate.split('T')[0] : '',
    });
    setEditStoppageFormErrors({});
    setIsEditStoppageOpen(true);
  };

  // Edit Stoppage Submit
  const handleEditStoppageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStoppage) return;
    setEditStoppageFormErrors({});

    const payload = {
      reason: editStoppageFormData.reason.trim(),
      startDate: editStoppageFormData.startDate ? new Date(editStoppageFormData.startDate) : undefined,
      endDate: editStoppageFormData.endDate ? new Date(editStoppageFormData.endDate) : null,
    };

    const validation = updateStoppageSchema.safeParse(payload);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errors[String(err.path[0])] = err.message;
      });
      setEditStoppageFormErrors(errors);
      return;
    }

    try {
      await updateStoppageMutation.mutateAsync({
        stoppageId: editingStoppage.id,
        data: validation.data,
      });
      toast.success(
        'Stoppage Updated',
        validation.data.endDate
          ? 'Delay resolved with official completion date.'
          : 'Stoppage details updated.'
      );
      setIsEditStoppageOpen(false);
      setEditingStoppage(null);
      refetchProject();
    } catch (err: any) {
      toast.error('Failed to update stoppage', err?.response?.data?.error?.message);
    }
  };

  const handleDeleteStoppage = async (stoppageId: string) => {
    if (!confirm('Are you sure you want to remove this contract extension? The adjusted baseline will recalculate immediately.')) {
      return;
    }

    try {
      await deleteStoppageMutation.mutateAsync(stoppageId);
      toast.info('Stoppage Extension Removed', 'Adjusted baseline schedule updated.');
      refetchProject();
    } catch (err: any) {
      toast.error('Failed to delete stoppage', err?.response?.data?.error?.message);
    }
  };

  // Add Milestone Submit
  const handleAddMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMilestoneFormErrors({});

    const payload = {
      projectId: id!,
      name: milestoneFormData.name.trim(),
      description: milestoneFormData.description.trim() || undefined,
      baselineDate: new Date(milestoneFormData.baselineDate),
      forecastDate: milestoneFormData.forecastDate ? new Date(milestoneFormData.forecastDate) : undefined,
      status: milestoneFormData.status,
    };

    const validation = createMilestoneSchema.safeParse(payload);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errors[String(err.path[0])] = err.message;
      });
      setMilestoneFormErrors(errors);
      return;
    }

    try {
      await createMilestoneMutation.mutateAsync(validation.data);
      toast.success('Milestone Created', `Committed baseline locked for "${validation.data.name}".`);
      setIsAddMilestoneOpen(false);
      setMilestoneFormData({
        name: '',
        description: '',
        baselineDate: '',
        forecastDate: '',
        status: 'NOT_STARTED',
      });
      refetchProject();
    } catch (err: any) {
      toast.error('Failed to create milestone', err?.response?.data?.error?.message);
    }
  };

  // Edit Milestone Submit (LAYER 1 IMMUTABILITY: baselineDate is EXCLUDED)
  const handleEditMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone) return;
    setEditMilestoneFormErrors({});

    // Payload intentionally does NOT include baselineDate
    const payload = {
      name: editMilestoneFormData.name.trim(),
      description: editMilestoneFormData.description.trim() || undefined,
      forecastDate: editMilestoneFormData.forecastDate ? new Date(editMilestoneFormData.forecastDate) : undefined,
      actualDate: editMilestoneFormData.actualDate ? new Date(editMilestoneFormData.actualDate) : null,
      status: editMilestoneFormData.status,
    };

    const validation = updateMilestoneSchema.safeParse(payload);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errors[String(err.path[0])] = err.message;
      });
      setEditMilestoneFormErrors(errors);
      return;
    }

    try {
      await updateMilestoneMutation.mutateAsync({
        id: editingMilestone.id,
        data: validation.data,
      });
      toast.success('Milestone Updated', 'Target forecast and progress status saved.');
      setIsEditMilestoneOpen(false);
      setEditingMilestone(null);
      refetchProject();
    } catch (err: any) {
      toast.error('Update Failed', err?.response?.data?.error?.message);
    }
  };

  const openEditMilestone = (m: Milestone) => {
    setEditingMilestone(m);
    setEditMilestoneFormData({
      name: m.name,
      description: m.description || '',
      forecastDate: m.forecastDate ? m.forecastDate.split('T')[0] : '',
      actualDate: m.actualDate ? m.actualDate.split('T')[0] : '',
      status: m.status,
    });
    setIsEditMilestoneOpen(true);
  };

  // Add Procurement Submit
  const handleAddProcurementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcurementFormErrors({});

    const payload = {
      projectId: id!,
      itemName: procurementFormData.itemName.trim(),
      description: procurementFormData.description.trim() || undefined,
      tenderQuantity: parseInt(procurementFormData.tenderQuantity, 10),
      allocatedQuantity: parseInt(procurementFormData.allocatedQuantity, 10) || 0,
      deliveredQuantity: parseInt(procurementFormData.deliveredQuantity, 10) || 0,
      unitCost: parseFloat(procurementFormData.unitCost),
      status: procurementFormData.status,
    };

    const validation = createProcurementSchema.safeParse(payload);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errors[String(err.path[0])] = err.message;
      });
      setProcurementFormErrors(errors);
      return;
    }

    try {
      await createProcurementMutation.mutateAsync(validation.data);
      toast.success('Procurement Item Allocated', `Generated remaining quantity updated.`);
      setIsAddProcurementOpen(false);
      setProcurementFormData({
        itemName: '',
        description: '',
        tenderQuantity: '',
        allocatedQuantity: '0',
        deliveredQuantity: '0',
        unitCost: '',
        status: 'PENDING',
      });
    } catch (err: any) {
      toast.error('Allocation Failed', err?.response?.data?.error?.message);
    }
  };

  // Add Contractor Submit
  const handleAddContractorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContractorFormErrors({});

    const payload = {
      contractorName: contractorFormData.contractorName.trim(),
      projectId: id!,
      schedule: Number(contractorFormData.schedule),
      quality: Number(contractorFormData.quality),
      resources: Number(contractorFormData.resources),
      safety: Number(contractorFormData.safety),
      coordination: Number(contractorFormData.coordination),
      docs: Number(contractorFormData.docs),
    };

    const validation = createContractorSchema.safeParse(payload);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errors[String(err.path[0])] = err.message;
      });
      setContractorFormErrors(errors);
      return;
    }

    try {
      await createContractorMutation.mutateAsync(validation.data);
      toast.success('Contractor Evaluation Saved', '6-score arithmetic mean derived.');
      setIsAddContractorOpen(false);
    } catch (err: any) {
      toast.error('Evaluation Failed', err?.response?.data?.error?.message);
    }
  };

  // Financial Update Submit
  const handleFinancialUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProjectMutation.mutateAsync({
        contractValue: financialForm.contractValue ? parseFloat(financialForm.contractValue) : undefined,
        finalCost: financialForm.finalCost ? parseFloat(financialForm.finalCost) : null,
      });
      toast.success('Financials Updated', 'Settlement cost and budget variance saved.');
      setIsFinancialEditOpen(false);
      refetchProject();
    } catch (err: any) {
      toast.error('Update Failed', err?.response?.data?.error?.message);
    }
  };

  // ─── Financial Calculations ───────────────────────────────────────────────
  const contractValNum = parseFloat(project.contractValue);
  const finalCostNum = project.finalCost ? parseFloat(project.finalCost) : null;
  const variance = finalCostNum !== null ? finalCostNum - contractValNum : 0;
  const variancePct = finalCostNum !== null && contractValNum > 0 ? (variance / contractValNum) * 100 : 0;

  // ─── Columns for Milestones Table ─────────────────────────────────────────
  const milestoneColumns: Column<Milestone>[] = [
    {
      key: 'name',
      header: 'Milestone Task',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-scb-dark text-xs">{row.name}</span>
          {row.description && <span className="text-[11px] text-scb-dark-muted">{row.description}</span>}
        </div>
      ),
    },
    {
      key: 'baselineDate',
      header: 'Baseline Date (Locked)',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-scb-dark font-mono bg-scb-warm/20 px-2 py-1 rounded border border-scb-warm/40 w-fit">
          <Lock className="w-3 h-3 text-scb-blue shrink-0" />
          <span className="font-semibold">{formatDate(row.baselineDate)}</span>
        </div>
      ),
    },
    {
      key: 'forecastDate',
      header: 'Target / Forecast',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-mono font-medium text-scb-dark">
          {formatDate(row.forecastDate)}
        </span>
      ),
    },
    {
      key: 'actualDate',
      header: 'Actual Completion',
      render: (row) => (
        <span className="text-xs font-mono text-scb-dark">
          {row.actualDate ? formatDate(row.actualDate) : '—'}
        </span>
      ),
    },
    {
      key: 'delayDays',
      header: 'Schedule Slippage',
      sortable: true,
      align: 'right',
      render: (row) => {
        if (row.delayDays > 0) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
              +{row.delayDays}d Delay
            </span>
          );
        }
        if (row.delayDays < 0) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {Math.abs(row.delayDays)}d Ahead
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            On Track
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
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
      render: (row) =>
        isAdmin && (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => openEditMilestone(row)}
              className="p-1 rounded text-scb-dark-muted hover:text-scb-blue hover:bg-scb-blue-light/50 transition-colors"
              title="Edit milestone (forecast/status only)"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete milestone "${row.name}"?`)) {
                  deleteMilestoneMutation.mutate(row.id);
                  toast.info('Milestone Deleted', `Removed milestone "${row.name}".`);
                }
              }}
              className="p-1 rounded text-scb-dark-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete milestone"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ),
    },
  ];

  // ─── Columns for Project Procurement Table ────────────────────────────────
  const procurementColumns: Column<ProcurementItem>[] = [
    {
      key: 'itemName',
      header: 'Material / Equipment',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-scb-dark text-xs">{row.itemName}</span>
          {row.description && <span className="text-[11px] text-scb-dark-muted">{row.description}</span>}
        </div>
      ),
    },
    {
      key: 'tenderQuantity',
      header: 'Tender Qty',
      align: 'center',
      render: (row) => <span className="font-mono font-semibold text-xs">{row.tenderQuantity}</span>,
    },
    {
      key: 'allocatedQuantity',
      header: 'Allocated',
      align: 'center',
      render: (row) => <span className="font-mono text-xs">{row.allocatedQuantity}</span>,
    },
    {
      key: 'deliveredQuantity',
      header: 'Delivered',
      align: 'center',
      render: (row) => <span className="font-mono text-xs">{row.deliveredQuantity}</span>,
    },
    {
      key: 'remainingQuantity',
      header: 'Remaining (Generated)',
      align: 'center',
      render: (row) => (
        <span
          className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
            row.remainingQuantity <= 0
              ? 'bg-rose-100 text-rose-800'
              : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {row.remainingQuantity}
        </span>
      ),
    },
    {
      key: 'unitCost',
      header: 'Unit Cost',
      align: 'right',
      render: (row) => <span className="font-mono text-xs">{formatCurrency(row.unitCost)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-scb-offwhite border border-scb-warm text-scb-dark">
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Back Button & Header */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-scb-blue hover:text-scb-blue-hover self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects Portfolio</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl border border-scb-warm shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm text-scb-blue bg-scb-blue-light px-2.5 py-0.5 rounded border border-scb-blue/20">
                {project.code}
              </span>
              <Badge rag={project.ragStatus} size="md" />
              <span className="text-xs px-2.5 py-0.5 rounded font-semibold bg-scb-offwhite border border-scb-warm text-scb-dark">
                {project.status}
              </span>
            </div>
            <h1 className="text-2xl font-black text-scb-dark tracking-tight">{project.name}</h1>
            {project.description && (
              <p className="text-xs text-scb-dark-muted max-w-2xl">{project.description}</p>
            )}
          </div>

          {/* Quick Metrics & Administrative Controls */}
          <div className="flex flex-wrap items-center gap-5 border-t md:border-t-0 md:border-l border-scb-warm/60 pt-4 md:pt-0 md:pl-6">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-scb-dark-muted tracking-wider">Contract Budget</span>
              <p className="text-lg font-black font-mono text-scb-dark">{formatCurrency(project.contractValue)}</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-scb-dark-muted tracking-wider">Target Finish</span>
              <p className="text-sm font-bold font-mono text-scb-dark">{formatDate(project.endDate)}</p>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 pl-2 border-l border-scb-warm/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openEditProjectModal}
                  className="gap-1.5 font-semibold text-xs shadow-sm hover:border-scb-blue hover:text-scb-blue"
                >
                  <Edit3 className="w-3.5 h-3.5 text-scb-blue" />
                  <span>Edit Project</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setDeleteConfirmationCode('');
                    setIsDeleteProjectOpen(true);
                  }}
                  className="gap-1.5 font-semibold text-xs shadow-sm bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-scb-warm/70 overflow-x-auto pb-px">
        {[
          { id: 'schedule', label: 'Timeline & Stoppages', count: milestones.length },
          { id: 'overview', label: 'Overview & Metadata' },
          { id: 'financials', label: 'Financial Controls & Variance' },
          { id: 'procurement', label: 'Allocated Procurement', count: procurementItems.length },
          { id: 'contractors', label: 'Contractor Scorecards', count: linkedContractors.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-scb-blue text-scb-blue bg-white/60'
                : 'border-transparent text-scb-dark-muted hover:text-scb-dark hover:border-scb-warm'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                  activeTab === tab.id ? 'bg-scb-blue-light text-scb-blue' : 'bg-scb-warm/40 text-scb-dark'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── TAB 1: SCHEDULE & TIMELINE CHARTS ────────────────────────────── */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {/* Dynamic Stoppage & Timeline Visualization Component */}
          <TimelineCharts
            timeline={project.timeline}
            isAdmin={isAdmin}
            onAddStoppage={() => setIsAddStoppageOpen(true)}
            onEditStoppage={openEditStoppage}
            onDeleteStoppage={handleDeleteStoppage}
            isDeletingStoppage={deleteStoppageMutation.isPending}
          />

          {/* Milestones Data Table with Baseline Immutability */}
          <div className="space-y-4 pt-4 border-t border-scb-warm/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-blue-50/50 p-4 rounded-lg border border-blue-200/60">
              <div className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-scb-blue mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-scb-dark">Three-Layer Baseline Immutability Active</h4>
                  <p className="text-[11px] text-scb-dark-muted">
                    Milestone baseline dates are committed at creation and locked across Zod schema validation, Express service checks, and PostgreSQL BEFORE UPDATE triggers.
                  </p>
                </div>
              </div>

              {isAdmin && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddMilestoneOpen(true)}
                  className="gap-1.5 shadow-sm font-semibold shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Milestone</span>
                </Button>
              )}
            </div>

            <DataTable
              columns={milestoneColumns}
              data={milestones}
              keyExtractor={(row) => row.id}
              isLoading={isMilestonesLoading}
              emptyMessage="No milestones registered for this project yet."
              pageSize={10}
              rowHighlight={(row) => (row.delayDays > 0 ? 'red' : 'green')}
            />
          </div>
        </div>
      )}

      {/* ─── TAB 2: OVERVIEW ──────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Master Details</CardTitle>
              <CardDescription>Official engineering registry metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex justify-between py-2 border-b border-scb-warm/40">
                <span className="text-scb-dark-muted font-medium">Project Code</span>
                <span className="font-mono font-bold text-scb-blue">{project.code}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-scb-warm/40">
                <span className="text-scb-dark-muted font-medium">Lifecycle Status</span>
                <span className="font-semibold text-scb-dark">{project.status}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-scb-warm/40">
                <span className="text-scb-dark-muted font-medium">Commencement Date</span>
                <span className="font-mono font-semibold text-scb-dark">{formatDate(project.startDate)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-scb-warm/40">
                <span className="text-scb-dark-muted font-medium">Target Completion Date</span>
                <span className="font-mono font-semibold text-scb-dark">{formatDate(project.endDate)}</span>
              </div>
              {project.timeline && (
                <div className="flex justify-between py-2 border-b border-scb-warm/40">
                  <span className="text-scb-dark-muted font-medium">Adjusted Finish (w/ Stoppages)</span>
                  <span className="font-mono font-bold text-amber-700">{formatDate(project.timeline.adjustedEndDate)}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-scb-dark-muted font-medium">System Registered Date</span>
                <span className="font-mono text-scb-dark-muted">{formatDate(project.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>RAG Health Summary</CardTitle>
              <CardDescription>Pure function auto-derivation breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-scb-offwhite border border-scb-warm/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-scb-dark-muted tracking-wider block">Derived Project Health</span>
                  <p className="text-sm font-bold text-scb-dark mt-0.5">Automated Risk Status</p>
                </div>
                <Badge rag={project.ragStatus} size="md" />
              </div>

              <div className="text-xs text-scb-dark-muted space-y-2 leading-relaxed bg-blue-50/40 p-3.5 rounded border border-blue-100">
                <div className="flex items-center gap-1.5 font-bold text-scb-dark">
                  <Info className="w-3.5 h-3.5 text-scb-blue" />
                  <span>Derivation Rules Applied:</span>
                </div>
                <p>• Schedule Risk: Worst milestone slippage across all active tasks (≤7d Green, ≤21d Amber, &gt;21d Red).</p>
                <p>• Cost Risk: Evaluates Final Cost vs. Contract Budget. If project is in-progress (null final cost), cost defaults to GREEN.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── TAB 3: FINANCIALS ────────────────────────────────────────────── */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5 border-l-4 border-l-scb-blue">
              <span className="text-[11px] font-bold uppercase text-scb-dark-muted tracking-wider">Approved Contract Budget</span>
              <p className="text-2xl font-black font-mono text-scb-dark mt-1">{formatCurrency(project.contractValue)}</p>
              <p className="text-[11px] text-scb-dark-muted mt-1">Committed contract valuation</p>
            </Card>

            <Card className="p-5 border-l-4 border-l-amber-500">
              <span className="text-[11px] font-bold uppercase text-scb-dark-muted tracking-wider">Actual / Final Cost</span>
              <p className="text-2xl font-black font-mono text-scb-dark mt-1">
                {finalCostNum !== null ? formatCurrency(finalCostNum) : 'In-Progress (TBD)'}
              </p>
              <p className="text-[11px] text-scb-dark-muted mt-1">
                {finalCostNum !== null ? 'Final settlement cost' : 'Cost defaults to GREEN while in execution'}
              </p>
            </Card>

            <Card
              className={`p-5 border-l-4 ${
                variance > 0 ? 'border-l-rose-500 bg-rose-50/20' : 'border-l-emerald-500'
              }`}
            >
              <span className="text-[11px] font-bold uppercase text-scb-dark-muted tracking-wider">Budget Variance</span>
              <p
                className={`text-2xl font-black font-mono mt-1 ${
                  variance > 0 ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                {finalCostNum !== null ? `${variance > 0 ? '+' : ''}${formatCurrency(variance)}` : '0 EGP'}
              </p>
              <p className="text-[11px] text-scb-dark-muted mt-1">
                {finalCostNum !== null
                  ? `${variancePct.toFixed(1)}% overrun from approved contract`
                  : 'Zero variance recorded'}
              </p>
            </Card>
          </div>

          {isAdmin && (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-scb-dark">Update Financial Settlement</h4>
                  <p className="text-xs text-scb-dark-muted">Record actual expenditures or revise approved contract valuation.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFinancialForm({
                      contractValue: project.contractValue,
                      finalCost: project.finalCost || '',
                    });
                    setIsFinancialEditOpen(true);
                  }}
                  className="gap-1.5"
                >
                  <DollarSign className="w-3.5 h-3.5 text-scb-blue" />
                  <span>Edit Financials</span>
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ─── TAB 4: PROCUREMENT ───────────────────────────────────────────── */}
      {activeTab === 'procurement' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-scb-dark">Project Materials & Equipment</h3>
              <p className="text-xs text-scb-dark-muted">Items allocated and delivered to this engineering site.</p>
            </div>
            {isAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddProcurementOpen(true)}
                className="gap-1.5 shadow-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                <span>Allocate Material</span>
              </Button>
            )}
          </div>

          <DataTable
            columns={procurementColumns}
            data={procurementItems}
            keyExtractor={(row) => row.id}
            isLoading={isProcurementLoading}
            emptyMessage="No procurement items allocated to this project."
            pageSize={10}
          />
        </div>
      )}

      {/* ─── TAB 5: CONTRACTORS ───────────────────────────────────────────── */}
      {activeTab === 'contractors' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-scb-dark">Linked Contractor Scorecards</h3>
              <p className="text-xs text-scb-dark-muted">Performance evaluations across the 6 mandatory engineering criteria.</p>
            </div>
            {isAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddContractorOpen(true)}
                className="gap-1.5 shadow-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                <span>Add Evaluation</span>
              </Button>
            )}
          </div>

          {linkedContractors.length === 0 ? (
            <Card className="p-10 text-center text-xs text-scb-dark-muted">
              No contractor evaluations linked to this project yet.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {linkedContractors.map((c) => (
                <Card key={c.id} className="p-5 space-y-4 border-t-4 border-t-scb-blue">
                  <div className="flex items-center justify-between border-b border-scb-warm/40 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-scb-dark">{c.contractorName}</h4>
                      <span className="text-[10px] text-scb-dark-muted">Site Vendor / Contractor</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-scb-dark-muted block">Overall Score</span>
                      <span className="text-lg font-black font-mono text-scb-blue">{c.overallScore} / 100</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <div className="flex justify-between font-semibold text-scb-dark text-[11px] mb-1">
                        <span>Schedule Adherence</span>
                        <span>{c.schedule}%</span>
                      </div>
                      <ProgressBar value={c.schedule} size="sm" />
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-scb-dark text-[11px] mb-1">
                        <span>Quality of Workmanship</span>
                        <span>{c.quality}%</span>
                      </div>
                      <ProgressBar value={c.quality} size="sm" />
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-scb-dark text-[11px] mb-1">
                        <span>Resource Adequacy</span>
                        <span>{c.resources}%</span>
                      </div>
                      <ProgressBar value={c.resources} size="sm" />
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-scb-dark text-[11px] mb-1">
                        <span>HSE / Safety Compliance</span>
                        <span>{c.safety}%</span>
                      </div>
                      <ProgressBar value={c.safety} size="sm" />
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-scb-dark text-[11px] mb-1">
                        <span>Site Coordination</span>
                        <span>{c.coordination}%</span>
                      </div>
                      <ProgressBar value={c.coordination} size="sm" />
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold text-scb-dark text-[11px] mb-1">
                        <span>Documentation & Submittals</span>
                        <span>{c.docs}%</span>
                      </div>
                      <ProgressBar value={c.docs} size="sm" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── MODALS ───────────────────────────────────────────────────────── */}

      {/* Edit Project Master Modal */}
      <Modal
        isOpen={isEditProjectOpen}
        onClose={() => setIsEditProjectOpen(false)}
        title="Edit Project Details & Timeline (تعديل بيانات المشروع)"
        description="Update project name, description, lifecycle status, approved budget, or contractual dates."
        maxWidth="lg"
      >
        <form onSubmit={handleEditProjectSubmit} className="space-y-4">
          <Input
            label="Project Name / Branch Designation"
            placeholder="e.g. Cairo Main Branch Modernization"
            value={editProjectFormData.name}
            onChange={(e) => setEditProjectFormData({ ...editProjectFormData, name: e.target.value })}
            error={editProjectFormErrors.name}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-scb-dark">Project Scope / Description</label>
            <textarea
              rows={2}
              value={editProjectFormData.description}
              onChange={(e) => setEditProjectFormData({ ...editProjectFormData, description: e.target.value })}
              className="w-full rounded-md border border-scb-warm bg-white p-2.5 text-xs text-scb-dark focus:outline-none focus:ring-2 focus:ring-scb-blue"
              placeholder="High-level summary of the engineering scope..."
            />
            {editProjectFormErrors.description && (
              <span className="text-[11px] text-rose-600 font-medium">{editProjectFormErrors.description}</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-scb-dark">Lifecycle Status</label>
              <select
                value={editProjectFormData.status}
                onChange={(e) =>
                  setEditProjectFormData({ ...editProjectFormData, status: e.target.value as ProjectStatus })
                }
                className="w-full h-9 rounded-md border border-scb-warm bg-white px-3 text-xs text-scb-dark focus:outline-none focus:ring-2 focus:ring-scb-blue"
              >
                <option value="PLANNING">PLANNING</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON_HOLD">ON_HOLD</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <Input
              label="Contract Budget (EGP)"
              type="number"
              min="1"
              step="any"
              value={editProjectFormData.contractValue}
              onChange={(e) => setEditProjectFormData({ ...editProjectFormData, contractValue: e.target.value })}
              error={editProjectFormErrors.contractValue}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Commencement / Start Date"
              type="date"
              value={editProjectFormData.startDate}
              onChange={(e) => setEditProjectFormData({ ...editProjectFormData, startDate: e.target.value })}
              error={editProjectFormErrors.startDate}
              required
            />

            <Input
              label="Target Completion / End Date"
              type="date"
              value={editProjectFormData.endDate}
              onChange={(e) => setEditProjectFormData({ ...editProjectFormData, endDate: e.target.value })}
              error={editProjectFormErrors.endDate}
              required
            />
          </div>

          <Input
            label="Actual / Settlement Cost (EGP, Leave blank if in progress)"
            type="number"
            min="0"
            step="any"
            placeholder="e.g. 3450000"
            value={editProjectFormData.finalCost}
            onChange={(e) => setEditProjectFormData({ ...editProjectFormData, finalCost: e.target.value })}
            error={editProjectFormErrors.finalCost}
            helperText="Clear to null while project is in progress to preserve green financial status."
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-scb-warm/60">
            <Button type="button" variant="outline" size="md" onClick={() => setIsEditProjectOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={updateProjectMutation.isPending}>
              Save Project Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Project Confirmation Modal */}
      <Modal
        isOpen={isDeleteProjectOpen}
        onClose={() => setIsDeleteProjectOpen(false)}
        title="Delete Project Confirmation (حذف المشروع نهائياً)"
        description="Permanent and irreversible administrative action."
        maxWidth="md"
      >
        <form onSubmit={handleDeleteProjectConfirm} className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-rose-900">High Risk Action</p>
              <p className="leading-relaxed text-rose-800">
                Are you sure you want to delete this project? This will permanently remove all linked milestones, procurement allocations, contractor scorecards, and stoppages.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-scb-dark block">
              To confirm deletion, please type <strong className="text-rose-600 font-mono select-all font-bold">{project.code}</strong> below:
            </label>
            <Input
              value={deleteConfirmationCode}
              onChange={(e) => setDeleteConfirmationCode(e.target.value)}
              placeholder={project.code}
              className="font-mono text-center tracking-widest font-bold"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-scb-warm/60">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => {
                setDeleteConfirmationCode('');
                setIsDeleteProjectOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="md"
              disabled={deleteConfirmationCode.trim() !== project.code || deleteProjectMutation.isPending}
              isLoading={deleteProjectMutation.isPending}
              className="font-bold"
            >
              Delete Project Permanently
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Stoppage / Extension Modal */}
      <Modal
        isOpen={isAddStoppageOpen}
        onClose={() => setIsAddStoppageOpen(false)}
        title="Add Contract Stoppage / Extension (التوقفات والتمديدات)"
        description="Register an official contractual stoppage or ongoing delay. The adjusted baseline will dynamically expand without modifying locked milestones."
        maxWidth="lg"
      >
        <form onSubmit={handleAddStoppageSubmit} className="space-y-4">
          <Input
            label="Extension Reason / Official Justification"
            placeholder="e.g. Civil Defense Authority permit delay or Vault redesign"
            value={stoppageFormData.reason}
            onChange={(e) => setStoppageFormData({ ...stoppageFormData, reason: e.target.value })}
            error={stoppageFormErrors.reason}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Stoppage Start Date"
              type="date"
              value={stoppageFormData.startDate}
              onChange={(e) => setStoppageFormData({ ...stoppageFormData, startDate: e.target.value })}
              error={stoppageFormErrors.startDate}
              required
            />

            <Input
              label="Stoppage End Date (Optional)"
              type="date"
              value={stoppageFormData.endDate}
              onChange={(e) => setStoppageFormData({ ...stoppageFormData, endDate: e.target.value })}
              error={stoppageFormErrors.endDate}
              helperText="Leave blank for ongoing delays. The system will calculate days automatically up to today."
            />
          </div>

          <div className="p-3 bg-amber-50/70 text-[11px] text-amber-900 rounded border border-amber-200 leading-relaxed">
            <strong>Dynamic Timeline Invariant:</strong> For ongoing stoppages (empty end date), the system automatically expands the adjusted baseline by 1 day every 24 hours until resolved.
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-scb-warm/60">
            <Button type="button" variant="outline" size="md" onClick={() => setIsAddStoppageOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={createStoppageMutation.isPending}>
              Register Extension
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Stoppage Modal */}
      <Modal
        isOpen={isEditStoppageOpen}
        onClose={() => {
          setIsEditStoppageOpen(false);
          setEditingStoppage(null);
        }}
        title="Edit Stoppage / Resolve Delay (تعديل أو إنهاء التوقف)"
        description="Update delay justification, adjust commencement date, or set an end date when the delay is resolved."
        maxWidth="lg"
      >
        {editingStoppage && (
          <form onSubmit={handleEditStoppageSubmit} className="space-y-4">
            <Input
              label="Extension Reason / Official Justification"
              value={editStoppageFormData.reason}
              onChange={(e) => setEditStoppageFormData({ ...editStoppageFormData, reason: e.target.value })}
              error={editStoppageFormErrors.reason}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Stoppage Start Date"
                type="date"
                value={editStoppageFormData.startDate}
                onChange={(e) => setEditStoppageFormData({ ...editStoppageFormData, startDate: e.target.value })}
                error={editStoppageFormErrors.startDate}
                required
              />

              <Input
                label="Stoppage End Date (Leave blank if still ongoing)"
                type="date"
                value={editStoppageFormData.endDate}
                onChange={(e) => setEditStoppageFormData({ ...editStoppageFormData, endDate: e.target.value })}
                error={editStoppageFormErrors.endDate}
                helperText="Leave blank for ongoing delays. Setting a date resolves and locks this delay."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-scb-warm/60">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  setIsEditStoppageOpen(false);
                  setEditingStoppage(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" isLoading={updateStoppageMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Milestone Modal */}
      <Modal
        isOpen={isAddMilestoneOpen}
        onClose={() => setIsAddMilestoneOpen(false)}
        title="Add Project Milestone"
        description="Define a delivery milestone. Note: Baseline date becomes permanently locked upon creation."
        maxWidth="lg"
      >
        <form onSubmit={handleAddMilestoneSubmit} className="space-y-4">
          <Input
            label="Milestone Task Name"
            placeholder="e.g. Electrical Main Board Commissioning"
            value={milestoneFormData.name}
            onChange={(e) => setMilestoneFormData({ ...milestoneFormData, name: e.target.value })}
            error={milestoneFormErrors.name}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Committed Baseline Date (Immutable Once Saved)"
              type="date"
              value={milestoneFormData.baselineDate}
              onChange={(e) => setMilestoneFormData({ ...milestoneFormData, baselineDate: e.target.value })}
              error={milestoneFormErrors.baselineDate}
              required
            />

            <Input
              label="Forecast / Target Date (Optional)"
              type="date"
              value={milestoneFormData.forecastDate}
              onChange={(e) => setMilestoneFormData({ ...milestoneFormData, forecastDate: e.target.value })}
              error={milestoneFormErrors.forecastDate}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-scb-dark">Milestone Status</label>
            <select
              value={milestoneFormData.status}
              onChange={(e) => setMilestoneFormData({ ...milestoneFormData, status: e.target.value as MilestoneStatus })}
              className="w-full h-9 rounded-md border border-scb-warm bg-white px-3 text-xs text-scb-dark focus:outline-none focus:ring-2 focus:ring-scb-blue"
            >
              <option value="NOT_STARTED">NOT_STARTED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="ON_HOLD">ON_HOLD</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-scb-warm/60">
            <Button type="button" variant="outline" size="md" onClick={() => setIsAddMilestoneOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={createMilestoneMutation.isPending}>
              Commit Milestone
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Milestone Modal — LAYER 1 IMMUTABILITY: baselineDate is EXCLUDED from form & schema */}
      <Modal
        isOpen={isEditMilestoneOpen}
        onClose={() => {
          setIsEditMilestoneOpen(false);
          setEditingMilestone(null);
        }}
        title="Update Milestone Schedule"
        description="Revise forecast target date or mark completion. The original baseline date is permanently locked."
        maxWidth="lg"
      >
        {editingMilestone && (
          <form onSubmit={handleEditMilestoneSubmit} className="space-y-4">
            {/* Locked Baseline Display (Read-Only) */}
            <div className="p-3.5 rounded-lg bg-scb-offwhite border border-scb-warm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-scb-blue" />
                <div>
                  <span className="text-[11px] font-bold text-scb-dark block">Committed Baseline Date (Locked)</span>
                  <span className="text-xs font-mono font-bold text-scb-blue">
                    {formatDate(editingMilestone.baselineDate)}
                  </span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold text-scb-dark-muted px-2 py-0.5 bg-scb-warm/40 rounded">
                Immutable
              </span>
            </div>

            <Input
              label="Milestone Task Name"
              value={editMilestoneFormData.name}
              onChange={(e) => setEditMilestoneFormData({ ...editMilestoneFormData, name: e.target.value })}
              error={editMilestoneFormErrors.name}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Forecast / Revised Date"
                type="date"
                value={editMilestoneFormData.forecastDate}
                onChange={(e) => setEditMilestoneFormData({ ...editMilestoneFormData, forecastDate: e.target.value })}
                error={editMilestoneFormErrors.forecastDate}
              />

              <Input
                label="Actual Completion Date (If Finished)"
                type="date"
                value={editMilestoneFormData.actualDate}
                onChange={(e) => setEditMilestoneFormData({ ...editMilestoneFormData, actualDate: e.target.value })}
                error={editMilestoneFormErrors.actualDate}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-scb-dark">Milestone Status</label>
              <select
                value={editMilestoneFormData.status}
                onChange={(e) => setEditMilestoneFormData({ ...editMilestoneFormData, status: e.target.value as MilestoneStatus })}
                className="w-full h-9 rounded-md border border-scb-warm bg-white px-3 text-xs text-scb-dark focus:outline-none focus:ring-2 focus:ring-scb-blue"
              >
                <option value="NOT_STARTED">NOT_STARTED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="ON_HOLD">ON_HOLD</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-scb-warm/60">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  setIsEditMilestoneOpen(false);
                  setEditingMilestone(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" isLoading={updateMilestoneMutation.isPending}>
                Save Updates
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Procurement Modal */}
      <Modal
        isOpen={isAddProcurementOpen}
        onClose={() => setIsAddProcurementOpen(false)}
        title="Allocate Procurement Item"
        description="Add long-lead material or equipment for this project."
        maxWidth="lg"
      >
        <form onSubmit={handleAddProcurementSubmit} className="space-y-4">
          <Input
            label="Item Description"
            placeholder="e.g. 42U Server Rack Units"
            value={procurementFormData.itemName}
            onChange={(e) => setProcurementFormData({ ...procurementFormData, itemName: e.target.value })}
            error={procurementFormErrors.itemName}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Tender Qty"
              type="number"
              value={procurementFormData.tenderQuantity}
              onChange={(e) => setProcurementFormData({ ...procurementFormData, tenderQuantity: e.target.value })}
              error={procurementFormErrors.tenderQuantity}
              required
            />
            <Input
              label="Allocated Qty"
              type="number"
              value={procurementFormData.allocatedQuantity}
              onChange={(e) => setProcurementFormData({ ...procurementFormData, allocatedQuantity: e.target.value })}
              error={procurementFormErrors.allocatedQuantity}
              required
            />
            <Input
              label="Delivered Qty"
              type="number"
              value={procurementFormData.deliveredQuantity}
              onChange={(e) => setProcurementFormData({ ...procurementFormData, deliveredQuantity: e.target.value })}
              error={procurementFormErrors.deliveredQuantity}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Unit Cost (EGP)"
              type="number"
              placeholder="12500"
              value={procurementFormData.unitCost}
              onChange={(e) => setProcurementFormData({ ...procurementFormData, unitCost: e.target.value })}
              error={procurementFormErrors.unitCost}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-scb-dark">Procurement Status</label>
              <select
                value={procurementFormData.status}
                onChange={(e) => setProcurementFormData({ ...procurementFormData, status: e.target.value as ProcurementStatus })}
                className="w-full h-9 rounded-md border border-scb-warm bg-white px-3 text-xs text-scb-dark focus:outline-none focus:ring-2 focus:ring-scb-blue"
              >
                <option value="PENDING">PENDING</option>
                <option value="TENDERED">TENDERED</option>
                <option value="ALLOCATED">ALLOCATED</option>
                <option value="PARTIALLY_DELIVERED">PARTIALLY_DELIVERED</option>
                <option value="DELIVERED">DELIVERED</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-scb-warm/60">
            <Button type="button" variant="outline" size="md" onClick={() => setIsAddProcurementOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={createProcurementMutation.isPending}>
              Add Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Contractor Modal */}
      <Modal
        isOpen={isAddContractorOpen}
        onClose={() => setIsAddContractorOpen(false)}
        title="Add Contractor Scorecard"
        description="Score contractor performance across the 6 mandatory engineering metrics."
        maxWidth="lg"
      >
        <form onSubmit={handleAddContractorSubmit} className="space-y-4">
          <Input
            label="Contractor / Vendor Name"
            placeholder="e.g. Nile Engineering & Construction"
            value={contractorFormData.contractorName}
            onChange={(e) => setContractorFormData({ ...contractorFormData, contractorName: e.target.value })}
            error={contractorFormErrors.contractorName}
            required
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Input
              label="Schedule (0-100)"
              type="number"
              min="0"
              max="100"
              value={contractorFormData.schedule}
              onChange={(e) => setContractorFormData({ ...contractorFormData, schedule: Number(e.target.value) })}
              required
            />
            <Input
              label="Quality (0-100)"
              type="number"
              min="0"
              max="100"
              value={contractorFormData.quality}
              onChange={(e) => setContractorFormData({ ...contractorFormData, quality: Number(e.target.value) })}
              required
            />
            <Input
              label="Resources (0-100)"
              type="number"
              min="0"
              max="100"
              value={contractorFormData.resources}
              onChange={(e) => setContractorFormData({ ...contractorFormData, resources: Number(e.target.value) })}
              required
            />
            <Input
              label="Safety (0-100)"
              type="number"
              min="0"
              max="100"
              value={contractorFormData.safety}
              onChange={(e) => setContractorFormData({ ...contractorFormData, safety: Number(e.target.value) })}
              required
            />
            <Input
              label="Coordination (0-100)"
              type="number"
              min="0"
              max="100"
              value={contractorFormData.coordination}
              onChange={(e) => setContractorFormData({ ...contractorFormData, coordination: Number(e.target.value) })}
              required
            />
            <Input
              label="Docs (0-100)"
              type="number"
              min="0"
              max="100"
              value={contractorFormData.docs}
              onChange={(e) => setContractorFormData({ ...contractorFormData, docs: Number(e.target.value) })}
              required
            />
          </div>

          <div className="p-3 bg-blue-50 text-[11px] text-scb-dark-muted rounded border border-blue-100">
            Overall score will be auto-derived by the database engine as the exact arithmetic mean of all 6 sub-scores.
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-scb-warm/60">
            <Button type="button" variant="outline" size="md" onClick={() => setIsAddContractorOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={createContractorMutation.isPending}>
              Save Scorecard
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Financials Modal */}
      <Modal
        isOpen={isFinancialEditOpen}
        onClose={() => setIsFinancialEditOpen(false)}
        title="Revise Project Financials"
        description="Update approved contract budget or record final settlement cost."
        maxWidth="md"
      >
        <form onSubmit={handleFinancialUpdateSubmit} className="space-y-4">
          <Input
            label="Contract Budget (EGP)"
            type="number"
            value={financialForm.contractValue}
            onChange={(e) => setFinancialForm({ ...financialForm, contractValue: e.target.value })}
            required
          />

          <Input
            label="Actual / Final Cost (EGP, Leave blank if in-progress)"
            type="number"
            placeholder="e.g. 5200000"
            value={financialForm.finalCost}
            onChange={(e) => setFinancialForm({ ...financialForm, finalCost: e.target.value })}
            helperText="Clear to null if project is still in progress."
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-scb-warm/60">
            <Button type="button" variant="outline" size="md" onClick={() => setIsFinancialEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={updateProjectMutation.isPending}>
              Update Financials
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
