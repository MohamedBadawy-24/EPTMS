import React, { useState, useDeferredValue } from 'react';
import {
  useContractors,
  useCreateContractor,
  useUpdateContractor,
  useDeleteContractor,
  type ContractorScore,
} from '@/api/contractors';
import { useProjects } from '@/api/projects';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  createContractorSchema,
  updateContractorSchema,
} from '@scb/shared';
import {
  HardHat,
  Plus,
  Search,
  Edit2,
  Trash2,
  Award,
} from 'lucide-react';

export const ContractorsPage: React.FC = () => {
  const { isAdmin } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);

  const { data: contractorsData, isLoading } = useContractors({
    search: deferredSearch || undefined,
    limit: 50,
  });

  const { data: projectsData } = useProjects({ limit: 100 });
  const projectMap = React.useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();
    (projectsData?.data || []).forEach((p) => {
      map.set(p.id, { code: p.code, name: p.name });
    });
    return map;
  }, [projectsData]);

  const createMutation = useCreateContractor();
  const updateMutation = useUpdateContractor();
  const deleteMutation = useDeleteContractor();

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    contractorName: '',
    projectId: '',
    schedule: 80,
    quality: 85,
    resources: 75,
    safety: 90,
    coordination: 80,
    docs: 70,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState<ContractorScore | null>(null);
  const [editFormData, setEditFormData] = useState({
    contractorName: '',
    schedule: 80,
    quality: 85,
    resources: 75,
    safety: 90,
    coordination: 80,
    docs: 70,
  });
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});

  const contractorsList = contractorsData?.data || [];

  // Calculate Average Portfolio Score
  const avgOverall =
    contractorsList.length > 0
      ? (
          contractorsList.reduce((sum, c) => sum + c.overallScore, 0) / contractorsList.length
        ).toFixed(1)
      : '0.0';

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const payload = {
      contractorName: formData.contractorName.trim(),
      projectId: formData.projectId,
      schedule: Number(formData.schedule),
      quality: Number(formData.quality),
      resources: Number(formData.resources),
      safety: Number(formData.safety),
      coordination: Number(formData.coordination),
      docs: Number(formData.docs),
    };

    const validation = createContractorSchema.safeParse(payload);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errors[String(err.path[0])] = err.message;
      });
      setFormErrors(errors);
      return;
    }

    try {
      await createMutation.mutateAsync(validation.data);
      setIsAddModalOpen(false);
      setFormData({
        contractorName: '',
        projectId: '',
        schedule: 80,
        quality: 85,
        resources: 75,
        safety: 90,
        coordination: 80,
        docs: 70,
      });
    } catch (err) {
      // Handled
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContractor) return;
    setEditFormErrors({});

    const payload = {
      contractorName: editFormData.contractorName.trim(),
      schedule: Number(editFormData.schedule),
      quality: Number(editFormData.quality),
      resources: Number(editFormData.resources),
      safety: Number(editFormData.safety),
      coordination: Number(editFormData.coordination),
      docs: Number(editFormData.docs),
    };

    const validation = updateContractorSchema.safeParse(payload);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errors[String(err.path[0])] = err.message;
      });
      setEditFormErrors(errors);
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: editingContractor.id,
        data: validation.data,
      });
      setIsEditModalOpen(false);
      setEditingContractor(null);
    } catch (err) {
      // Handled
    }
  };

  const openEditModal = (c: ContractorScore) => {
    setEditingContractor(c);
    setEditFormData({
      contractorName: c.contractorName,
      schedule: c.schedule,
      quality: c.quality,
      resources: c.resources,
      safety: c.safety,
      coordination: c.coordination,
      docs: c.docs,
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-scb-warm/60 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-scb-blue uppercase tracking-widest bg-scb-blue-light px-2 py-0.5 rounded border border-scb-blue/20">
              Vendor Governance
            </span>
          </div>
          <h1 className="text-2xl font-black text-scb-dark tracking-tight">
            Contractor & Consultant Performance Scorecards
          </h1>
          <p className="text-xs text-scb-dark-muted mt-0.5">
            Objective vendor performance tracking across 6 critical operational criteria with database-generated overall ratings.
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsAddModalOpen(true)}
            className="shadow-sm font-semibold gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Evaluation</span>
          </Button>
        )}
      </div>

      {/* KPI & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3 border-l-4 border-l-scb-blue">
          <div className="w-10 h-10 rounded-lg bg-scb-blue-light text-scb-blue flex items-center justify-center shrink-0">
            <HardHat className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-scb-dark-muted tracking-wider">Evaluated Contractors</span>
            <p className="text-xl font-black text-scb-dark">{contractorsList.length}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-l-4 border-l-amber-500">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-scb-dark-muted tracking-wider">Portfolio Average Score</span>
            <p className="text-xl font-black font-mono text-scb-dark">{avgOverall} / 100</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center bg-white shadow-sm">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-scb-dark-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search contractor or vendor name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-scb-offwhite border border-scb-warm rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-scb-blue"
            />
          </div>
        </Card>
      </div>

      {/* Contractor Scorecards Grid */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-2 border-scb-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs font-semibold text-scb-dark-muted">Loading vendor evaluations...</span>
        </div>
      ) : contractorsList.length === 0 ? (
        <Card className="p-12 text-center text-xs text-scb-dark-muted">
          No contractor evaluations found.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contractorsList.map((c) => {
            const project = projectMap.get(c.projectId);
            const scoreColorClass =
              c.overallScore >= 80
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : c.overallScore >= 60
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200';

            return (
              <Card key={c.id} className="p-5 flex flex-col justify-between hover:shadow-card-hover transition-all border-t-4 border-t-scb-blue">
                <div className="space-y-4">
                  {/* Top Name & Overall Rating */}
                  <div className="flex items-start justify-between gap-2 border-b border-scb-warm/40 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-scb-dark leading-tight">{c.contractorName}</h3>
                      {project && (
                        <span className="text-[10px] font-mono text-scb-blue font-semibold mt-0.5 block">
                          {project.code} — {project.name}
                        </span>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-black font-mono border ${scoreColorClass}`}>
                        {c.overallScore} / 100
                      </span>
                    </div>
                  </div>

                  {/* 6 Sub-Scores */}
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-scb-dark mb-0.5">
                        <span>1. Schedule Adherence</span>
                        <span className="font-mono">{c.schedule}%</span>
                      </div>
                      <ProgressBar value={c.schedule} size="sm" />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-scb-dark mb-0.5">
                        <span>2. Quality of Work</span>
                        <span className="font-mono">{c.quality}%</span>
                      </div>
                      <ProgressBar value={c.quality} size="sm" />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-scb-dark mb-0.5">
                        <span>3. Resource Adequacy</span>
                        <span className="font-mono">{c.resources}%</span>
                      </div>
                      <ProgressBar value={c.resources} size="sm" />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-scb-dark mb-0.5">
                        <span>4. Safety & HSE Compliance</span>
                        <span className="font-mono">{c.safety}%</span>
                      </div>
                      <ProgressBar value={c.safety} size="sm" />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-scb-dark mb-0.5">
                        <span>5. Site Coordination</span>
                        <span className="font-mono">{c.coordination}%</span>
                      </div>
                      <ProgressBar value={c.coordination} size="sm" />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-scb-dark mb-0.5">
                        <span>6. Documentation & Submittals</span>
                        <span className="font-mono">{c.docs}%</span>
                      </div>
                      <ProgressBar value={c.docs} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                {isAdmin && (
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-scb-warm/40 text-xs">
                    <span className="text-[10px] text-scb-dark-muted">Database-Generated Mean</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1 rounded text-scb-dark-muted hover:text-scb-blue hover:bg-scb-blue-light/50 transition-colors"
                        title="Edit score"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete evaluation for "${c.contractorName}"?`)) {
                            deleteMutation.mutate(c.id);
                          }
                        }}
                        className="p-1 rounded text-scb-dark-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete score"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="New Contractor Performance Evaluation"
        description="Score vendor performance across the 6 mandatory engineering criteria."
        maxWidth="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input
            label="Contractor / Vendor Name"
            placeholder="e.g. Arab Contractors (Osman Ahmed Osman & Co.)"
            value={formData.contractorName}
            onChange={(e) => setFormData({ ...formData, contractorName: e.target.value })}
            error={formErrors.contractorName}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-scb-dark">Assign to Project</label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full h-9 rounded-md border border-scb-warm bg-white px-3 text-xs text-scb-dark focus:outline-none focus:ring-2 focus:ring-scb-blue"
              required
            >
              <option value="">Select Project...</option>
              {(projectsData?.data || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
            {formErrors.projectId && (
              <p className="text-[11px] text-rose-600 font-medium">{formErrors.projectId}</p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Input
              label="Schedule (0-100)"
              type="number"
              min="0"
              max="100"
              value={formData.schedule}
              onChange={(e) => setFormData({ ...formData, schedule: Number(e.target.value) })}
              required
            />
            <Input
              label="Quality (0-100)"
              type="number"
              min="0"
              max="100"
              value={formData.quality}
              onChange={(e) => setFormData({ ...formData, quality: Number(e.target.value) })}
              required
            />
            <Input
              label="Resources (0-100)"
              type="number"
              min="0"
              max="100"
              value={formData.resources}
              onChange={(e) => setFormData({ ...formData, resources: Number(e.target.value) })}
              required
            />
            <Input
              label="Safety (0-100)"
              type="number"
              min="0"
              max="100"
              value={formData.safety}
              onChange={(e) => setFormData({ ...formData, safety: Number(e.target.value) })}
              required
            />
            <Input
              label="Coordination (0-100)"
              type="number"
              min="0"
              max="100"
              value={formData.coordination}
              onChange={(e) => setFormData({ ...formData, coordination: Number(e.target.value) })}
              required
            />
            <Input
              label="Docs (0-100)"
              type="number"
              min="0"
              max="100"
              value={formData.docs}
              onChange={(e) => setFormData({ ...formData, docs: Number(e.target.value) })}
              required
            />
          </div>

          <div className="p-3 bg-blue-50 text-[11px] text-scb-dark-muted rounded border border-blue-100">
            Overall score is calculated strictly as a PostgreSQL generated column: average of the 6 sub-scores.
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-scb-warm/60">
            <Button type="button" variant="outline" size="md" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={createMutation.isPending}>
              Create Scorecard
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingContractor(null);
        }}
        title="Update Contractor Performance"
        description="Re-evaluate scores. Overall score recalculates automatically in the database."
        maxWidth="lg"
      >
        {editingContractor && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input
              label="Contractor / Vendor Name"
              value={editFormData.contractorName}
              onChange={(e) => setEditFormData({ ...editFormData, contractorName: e.target.value })}
              error={editFormErrors.contractorName}
              required
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Input
                label="Schedule (0-100)"
                type="number"
                min="0"
                max="100"
                value={editFormData.schedule}
                onChange={(e) => setEditFormData({ ...editFormData, schedule: Number(e.target.value) })}
                required
              />
              <Input
                label="Quality (0-100)"
                type="number"
                min="0"
                max="100"
                value={editFormData.quality}
                onChange={(e) => setEditFormData({ ...editFormData, quality: Number(e.target.value) })}
                required
              />
              <Input
                label="Resources (0-100)"
                type="number"
                min="0"
                max="100"
                value={editFormData.resources}
                onChange={(e) => setEditFormData({ ...editFormData, resources: Number(e.target.value) })}
                required
              />
              <Input
                label="Safety (0-100)"
                type="number"
                min="0"
                max="100"
                value={editFormData.safety}
                onChange={(e) => setEditFormData({ ...editFormData, safety: Number(e.target.value) })}
                required
              />
              <Input
                label="Coordination (0-100)"
                type="number"
                min="0"
                max="100"
                value={editFormData.coordination}
                onChange={(e) => setEditFormData({ ...editFormData, coordination: Number(e.target.value) })}
                required
              />
              <Input
                label="Docs (0-100)"
                type="number"
                min="0"
                max="100"
                value={editFormData.docs}
                onChange={(e) => setEditFormData({ ...editFormData, docs: Number(e.target.value) })}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-scb-warm/60">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingContractor(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" isLoading={updateMutation.isPending}>
                Save Scores
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
