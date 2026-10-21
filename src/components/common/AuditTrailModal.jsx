import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import Badge from './Badge';
import { auditService } from '../../services/audit/auditService';
import { formatDate } from '../../utils/formatters';
import {
  Shield,
  RefreshCw,
  Download,
  Trash2,
  Filter,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  User,
} from 'lucide-react';

export default function AuditTrailModal({ isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterEntity, setFilterEntity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const allLogs = await auditService.getAuditLogs(100);
      setLogs(allLogs);
    } catch (err) {
      console.warn('Failed to load audit logs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  const filteredLogs = logs.filter((log) => {
    if (filterEntity !== 'all' && log.entity !== filterEntity) return false;
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();
    return (
      log.entity?.toLowerCase().includes(term) ||
      log.operation?.toLowerCase().includes(term) ||
      log.actor?.toLowerCase().includes(term) ||
      log.details?.toLowerCase().includes(term) ||
      log.entityId?.toLowerCase().includes(term)
    );
  });

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `TenderFlow_AuditTrail_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Divisional Security Audit Trail"
      subtitle="Immutable audit log of all create, update, delete, restore, and cloud synchronization operations"
      size="xl"
      footer={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full">
          <div className="text-[11px] text-slate-500">
            Total Logged Events: <strong className="text-slate-800">{logs.length}</strong> (Stored locally in IndexedDB)
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
              Close
            </Button>
            <Button
              variant="outline"
              icon={Download}
              onClick={handleExportJson}
              disabled={logs.length === 0}
              className="w-full sm:w-auto text-xs"
            >
              Export Audit JSON
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Controls: Search, Entity Filter, Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              placeholder="Search by action, actor, ID, details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:border-blue-600 flex-1"
            />
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:border-blue-600"
            >
              <option value="all">All Modules ({logs.length})</option>
              <option value="workOrders">Work Orders</option>
              <option value="agreements">Agreements</option>
              <option value="billing">Billing Records</option>
              <option value="fmdSd">FMD / SD Security</option>
              <option value="subdivisions">Subdivisions</option>
              <option value="database">Backup & Restore</option>
            </select>
          </div>

          <Button
            size="sm"
            variant="outline"
            icon={RefreshCw}
            onClick={loadLogs}
            disabled={loading}
            className="shrink-0"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Audit Log Entries List */}
        <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
          {filteredLogs.map((entry) => {
            const isFailed = entry.status === 'FAILED';
            return (
              <div
                key={entry.id}
                className={`p-3 rounded-xl border transition-all text-xs ${
                  isFailed ? 'bg-rose-50/70 border-rose-300' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1.5 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        isFailed
                          ? 'bg-rose-600 text-white'
                          : entry.operation === 'DELETE'
                          ? 'bg-rose-100 text-rose-800'
                          : entry.operation === 'CREATE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : entry.operation === 'RESTORE'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {entry.operation}
                    </span>
                    <span className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
                      {entry.entity}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">• ID: {entry.entityId}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 text-slate-400" />
                      {entry.actor || 'Divisional Officer'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {new Date(entry.timestamp).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                <p className="mt-1.5 text-slate-700 text-xs">
                  {entry.details}
                </p>

                {/* Changed Fields Summary */}
                {Array.isArray(entry.changedFields) && entry.changedFields.length > 0 && (
                  <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px] space-y-1">
                    <span className="font-semibold text-slate-600 block text-[10px] uppercase tracking-wider">
                      Changed Fields:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 font-mono text-[10px]">
                      {entry.changedFields.map((cf, idx) => (
                        <div key={idx} className="truncate">
                          <strong className="text-slate-700">{cf.field}:</strong>{' '}
                          <span className="text-rose-600">{cf.from ?? 'null'}</span> →{' '}
                          <span className="text-emerald-700 font-semibold">{cf.to}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredLogs.length === 0 && !loading && (
            <div className="p-8 bg-slate-50 border rounded-xl text-center text-xs text-slate-500">
              No audit logs matched your search or filter.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
