import React, { useState, useDeferredValue } from 'react';
import {
  useProcurement,
  useCreateProcurement,
  useUpdateProcurement,
  useDeleteProcurement,
  type ProcurementItem,
} from '@/api/procurement';
import { useProjects } from '@/api/projects';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { formatCurrency } from '@/lib/utils';
import {
  createProcurementSchema,
  updateProcurementSchema,
  type ProcurementStatus,
} from '@scb/shared';
import {
  Plus,
  Search,
  AlertTriangle,
  Package,
  Truck,
  DollarSign,
  Edit2,
  Trash2,
} from 'lucide-react';

export const ProcurementPage: React.FC = () => {
  const { isAdmin } = useAuth();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const [statusFilter, setStatusFilter] = useState<ProcurementStatus | 'ALL'>('ALL');
  const [atRiskOnly, setAtRiskOnly] = useState(false);

  // Queries & Mutations
  const { data: procurementData, isLoading } = useProcurement({
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    atRisk: atRiskOnly ? true : undefined,
    limit: 100,
  });

  const { data: projectsData } = useProjects({ limit: 100 });
  const projectMap = React.useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();
    (projectsData?.data || []).forEach((p) => {
      map.set(p.id, { code: p.code, name: p.name });
    });
    return map;
  }, [projectsData]);

  const createMutation = useCreateProcurement();
  const updateMutation = useUpdateProcurement();
  const deleteMutation = useDeleteProcurement();

  // Add Item Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    projectId: '',
    itemName: '',
    description: '',
    tenderQuantity: '',
    allocatedQuantity: '0',
    deliveredQuantity: '0',
    unitCost: '',
    status: 'PENDING' as ProcurementStatus,
  });
  const [addFormErrors, setAddFormErrors] = useState<Record<string, string>>({});

  // Edit Item Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProcurementItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    itemName: '',
    tenderQuantity: 0,
    allocatedQuantity: 0,
    deliveredQuantity: 0,
    unitCost: 0,
    status: 'PENDING' as ProcurementStatus,
  });
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});

  const allItems = procurementData?.data || [];

  // Filter with client search
  const filteredItems = React.useMemo(() => {
    if (!deferredSearch) return allItems;
    const term = deferredSearch.toLowerCase();
    return allItems.filter(
      (item) =>
        item.itemName.toLowerCase().includes(term) ||
        (projectMap.get(item.projectId)?.code.toLowerCase().includes(term) ?? false) ||
        (projectMap.get(item.projectId)?.name.toLowerCase().includes(term) ?? false)
    );
  }, [allItems, deferredSearch, projectMap]);

  // Aggregate Metrics
  const totalItems = allItems.length;
  const atRiskCount = allItems.filter((i) => i.remainingQuantity <= 0).length;
  const totalValuation = allItems.reduce(
    (sum, i) => sum + i.tenderQuantity * parseFloat(i.unitCost),
    0
  );
  const totalDelivered = allItems.filter((i) => i.status === 'DELIVERED').length;

  // Submit Add
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddFormErrors({});

    const payload = {
      projectId: addFormData.projectId,
      itemName: addFormData.itemName.trim(),
      description: addFormData.description.trim() || undefined,
      tenderQuantity: parseInt(addFormData.tenderQuantity, 10),
      allocatedQuantity: parseInt(addFormData.allocatedQuantity, 10) || 0,
      deliveredQuantity: parseInt(addFormData.deliveredQuantity, 10) || 0,
      unitCost: parseFloat(addFormData.unitCost),
      status: addFormData.status,
    };

    const validation = createProcurementSchema.safeParse(payload);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errors[String(err.path[0])] = err.message;
      });
      setAddFormErrors(errors);
      return;
    }

    try {
      await createMutation.mutateAsync(validation.data);
      setIsAddModalOpen(false);
      setAddFormData({
        projectId: '',
        itemName: '',
        description: '',
        tenderQuantity: '',
        allocatedQuantity: '0',
        deliveredQuantity: '0',
        unitCost: '',
        status: 'PENDING',
      });
    } catch (err) {
      // Handled
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setEditFormErrors({});

    const payload = {
      itemName: editFormData.itemName.trim(),
      tenderQuantity: editFormData.tenderQuantity,
      allocatedQuantity: editFormData.allocatedQuantity,
      deliveredQuantity: editFormData.deliveredQuantity,
      unitCost: editFormData.unitCost,
      status: editFormData.status,
    };

    const validation = updateProcurementSchema.safeParse(payload);
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
        id: editingItem.id,
        data: validation.data,
      });
      setIsEditModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      // Handled
    }
  };

  const openEditModal = (item: ProcurementItem) => {
    setEditingItem(item);
    setEditFormData({
      itemName: item.itemName,
      tenderQuantity: item.tenderQuantity,
      allocatedQuantity: item.allocatedQuantity,
      deliveredQuantity: item.deliveredQuantity,
      unitCost: parseFloat(item.unitCost),
      status: item.status,
    });
    setIsEditModalOpen(true);
  };

  const columns: Column<ProcurementItem>[] = [
    {
      key: 'itemName',
      header: 'Material / Equipment',
      sortable: true,
      render: (row) => {
        const proj = projectMap.get(row.projectId);
        return (
          <div className="flex flex-col">
            <span className="font-bold text-scb-dark text-xs">{row.itemName}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-[10px] font-bold text-scb-blue bg-scb-blue-light/80 px-1.5 py-0.2 rounded border border-scb-blue/20">
                {proj?.code || 'PROJECT'}
              </span>
              <span className="text-[10px] text-scb-dark-muted truncate max-w-xs">{proj?.name}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'tenderQuantity',
      header: 'Tender Qty',
      align: 'center',
      sortable: true,
      render: (row) => <span className="font-mono font-bold text-xs">{row.tenderQuantity}</span>,
    },
    {
      key: 'allocatedQuantity',
      header: 'Allocated',
      align: 'center',
      render: (row) => <span className="font-mono text-xs text-scb-dark">{row.allocatedQuantity}</span>,
    },
    {
      key: 'deliveredQuantity',
      header: 'Delivered',
      align: 'center',
      render: (row) => <span className="font-mono text-xs text-scb-dark">{row.deliveredQuantity}</span>,
    },
    {
      key: 'remainingQuantity',
      header: 'Remaining (Generated)',
      align: 'center',
      sortable: true,
      render: (row) => {
        const isDepleted = row.remainingQuantity <= 0;
        return (
          <span
            className={`font-mono font-black text-xs px-2.5 py-0.5 rounded-full ${
              isDepleted
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {row.remainingQuantity}
          </span>
        );
      },
    },
    {
      key: 'unitCost',
      header: 'Unit Cost',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-scb-dark">{formatCurrency(row.unitCost)}</span>
      ),
    },
    {
      key: 'totalValue',
      header: 'Total Value (EGP)',
      align: 'right',
      render: (row) => {
        const total = row.tenderQuantity * parseFloat(row.unitCost);
        return <span className="font-mono font-bold text-xs text-scb-dark">{formatCurrency(total)}</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-scb-offwhite border border-scb-warm text-scb-dark">
          {row.status.replace('_', ' ')}
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
              onClick={() => openEditModal(row)}
              className="p-1 rounded text-scb-dark-muted hover:text-scb-blue hover:bg-scb-blue-light/50 transition-colors"
              title="Edit quantities"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete procurement item "${row.itemName}"?`)) {
                  deleteMutation.mutate(row.id);
                }
              }}
              className="p-1 rounded text-scb-dark-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ),
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-scb-warm/60 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-scb-blue uppercase tracking-widest bg-scb-blue-light px-2 py-0.5 rounded border border-scb-blue/20">
              Procurement & Inventory
            </span>
          </div>
          <h1 className="text-2xl font-black text-scb-dark tracking-tight">
            Material & Equipment Procurement Control
          </h1>
          <p className="text-xs text-scb-dark-muted mt-0.5">
            Cross-portfolio long-lead item tracking with automated PostgreSQL generated remaining stock calculation.
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
            <span>New Procurement Item</span>
          </Button>
        )}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-l-scb-blue">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-scb-dark-muted tracking-wider">Total Items</span>
              <p className="text-2xl font-black font-mono text-scb-dark mt-1">{totalItems}</p>
              <span className="text-[11px] text-scb-dark-muted">Across all branches</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-scb-blue-light text-scb-blue flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-rose-500">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-scb-dark-muted tracking-wider">Depleted / At Risk</span>
              <p className="text-2xl font-black font-mono text-rose-700 mt-1">{atRiskCount}</p>
              <span className="text-[11px] text-rose-600 font-semibold">Remaining &le; 0 items</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-scb-dark">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-scb-dark-muted tracking-wider">Total Tender Value</span>
              <p className="text-2xl font-black font-mono text-scb-dark mt-1">{formatCurrency(totalValuation)}</p>
              <span className="text-[11px] text-scb-dark-muted">Committed materials</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-scb-offwhite text-scb-dark flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-scb-dark-muted tracking-wider">Delivered to Site</span>
              <p className="text-2xl font-black font-mono text-emerald-700 mt-1">{totalDelivered}</p>
              <span className="text-[11px] text-emerald-600 font-semibold">Fully received</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter & Search */}
      <Card className="p-4 bg-white shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-scb-dark-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search items or project codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-scb-offwhite border border-scb-warm rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-scb-blue"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
            <label className="flex items-center gap-2 text-xs font-semibold text-scb-dark cursor-pointer select-none bg-scb-offwhite px-3 py-1.5 rounded-md border border-scb-warm">
              <input
                type="checkbox"
                checked={atRiskOnly}
                onChange={(e) => setAtRiskOnly(e.target.checked)}
                className="rounded border-scb-warm text-scb-blue focus:ring-scb-blue"
              />
              <span>At-Risk Only (&le; 0 Remaining)</span>
            </label>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-scb-dark-muted font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="h-8 text-xs bg-scb-offwhite border border-scb-warm rounded-md px-2 font-medium focus:outline-none focus:ring-2 focus:ring-scb-blue"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="TENDERED">Tendered</option>
                <option value="ALLOCATED">Allocated</option>
                <option value="PARTIALLY_DELIVERED">Partially Delivered</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Procurement Table */}
      <DataTable
        columns={columns}
        data={filteredItems}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="No procurement records match your criteria."
        pageSize={10}
        rowHighlight={(row) => (row.remainingQuantity <= 0 ? 'red' : null)}
      />

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Material / Equipment Procurement"
        description="Register a new long-lead purchase order linked to a project."
        maxWidth="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-scb-dark">Assign to Project</label>
            <select
              value={addFormData.projectId}
              onChange={(e) => setAddFormData({ ...addFormData, projectId: e.target.value })}
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
          </div>

          <Input
            label="Item Name & Specification"
            placeholder="e.g. Cisco Catalyst 9300 Switches"
            value={addFormData.itemName}
            onChange={(e) => setAddFormData({ ...addFormData, itemName: e.target.value })}
            error={addFormErrors.itemName}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Tender Qty"
              type="number"
              value={addFormData.tenderQuantity}
              onChange={(e) => setAddFormData({ ...addFormData, tenderQuantity: e.target.value })}
              error={addFormErrors.tenderQuantity}
              required
            />
            <Input
              label="Allocated Qty"
              type="number"
              value={addFormData.allocatedQuantity}
              onChange={(e) => setAddFormData({ ...addFormData, allocatedQuantity: e.target.value })}
              error={addFormErrors.allocatedQuantity}
              required
            />
            <Input
              label="Delivered Qty"
              type="number"
              value={addFormData.deliveredQuantity}
              onChange={(e) => setAddFormData({ ...addFormData, deliveredQuantity: e.target.value })}
              error={addFormErrors.deliveredQuantity}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Unit Cost (EGP)"
              type="number"
              placeholder="4500"
              value={addFormData.unitCost}
              onChange={(e) => setAddFormData({ ...addFormData, unitCost: e.target.value })}
              error={addFormErrors.unitCost}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-scb-dark">Status</label>
              <select
                value={addFormData.status}
                onChange={(e) => setAddFormData({ ...addFormData, status: e.target.value as ProcurementStatus })}
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
            <Button type="button" variant="outline" size="md" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={createMutation.isPending}>
              Create Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        title="Update Procurement Quantities"
        description="Update allocation and delivery counts. Remaining quantity updates automatically."
        maxWidth="lg"
      >
        {editingItem && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <Input
              label="Item Description"
              value={editFormData.itemName}
              onChange={(e) => setEditFormData({ ...editFormData, itemName: e.target.value })}
              error={editFormErrors.itemName}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Tender Qty"
                type="number"
                value={editFormData.tenderQuantity}
                onChange={(e) => setEditFormData({ ...editFormData, tenderQuantity: Number(e.target.value) })}
                required
              />
              <Input
                label="Allocated Qty"
                type="number"
                value={editFormData.allocatedQuantity}
                onChange={(e) => setEditFormData({ ...editFormData, allocatedQuantity: Number(e.target.value) })}
                required
              />
              <Input
                label="Delivered Qty"
                type="number"
                value={editFormData.deliveredQuantity}
                onChange={(e) => setEditFormData({ ...editFormData, deliveredQuantity: Number(e.target.value) })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Unit Cost (EGP)"
                type="number"
                value={editFormData.unitCost}
                onChange={(e) => setEditFormData({ ...editFormData, unitCost: Number(e.target.value) })}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-scb-dark">Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as ProcurementStatus })}
                  className="w-full h-9 rounded-md border border-scb-warm bg-white px-3 text-xs text-scb-dark focus:outline-none focus:ring-2 focus:ring-scb-blue"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="TENDERED">TENDERED</option>
                  <option value="ALLOCATED">ALLOCATED</option>
                  <option value="PARTIALLY_DELIVERED">PARTIALLY_DELIVERED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-scb-warm/60">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingItem(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" isLoading={updateMutation.isPending}>
                Save Quantities
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
