import { useState, useEffect } from 'react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { Eye, CheckCircle, XCircle, Star, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import * as messesApi from '../api/messes';

export default function MessesPage() {
  const [messes, setMesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [selectedMess, setSelectedMess] = useState(null);
  const [approving, setApproving] = useState(null); // { id, isApproved }

  const fetchMesses = async () => {
    try {
      const res = await messesApi.getAll();
      setMesses(res.data);
    } catch (err) {
      toast.error('Failed to load messes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMesses(); }, []);

  const handleApprove = async () => {
    try {
      await messesApi.approve(approving.id, approving.isApproved);
      toast.success(approving.isApproved ? 'Mess approved!' : 'Mess approval revoked');
      setApproving(null);
      fetchMesses();
    } catch (err) {
      toast.error('Approval update failed');
    }
  };

  const filtered = tab === 'all' ? messes
    : tab === 'approved' ? messes.filter(m => m.isApproved)
    : tab === 'pending' ? messes.filter(m => !m.isApproved)
    : messes.filter(m => !m.isActive);

  const columns = [
    {
      key: 'name', label: 'Mess',
      render: (v, row) => (
        <div className="user-cell-info">
          <span className="user-cell-name">{v}</span>
          <span className="user-cell-phone"><MapPin size={11} style={{ display: 'inline', verticalAlign: '-1px' }} /> {row.address || row.city || '—'}</span>
        </div>
      ),
    },
    { key: 'ownerName', label: 'Owner', render: (v, row) => v || row.vendorName || '—' },
    {
      key: 'avgRating', label: 'Rating',
      render: v => {
        const r = parseFloat(v || 0);
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Star size={13} style={{ color: '#fbbf24' }} />
            <span style={{ fontWeight: 600 }}>{r > 0 ? r.toFixed(1) : 'N/A'}</span>
          </span>
        );
      },
    },
    {
      key: 'isApproved', label: 'Approval',
      render: v => <StatusBadge status={v ? 'active' : 'pending'} />,
    },
    {
      key: 'isActive', label: 'Status',
      render: v => <StatusBadge status={v ? 'active' : 'inactive'} />,
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="table-actions">
          <button className="btn btn-sm" onClick={() => setSelectedMess(row)}><Eye size={13} /> View</button>
          {!row.isApproved ? (
            <button className="btn btn-sm btn-success" onClick={() => setApproving({ id: row.id, isApproved: true })}>
              <CheckCircle size={13} /> Approve
            </button>
          ) : (
            <button className="btn btn-sm btn-danger" onClick={() => setApproving({ id: row.id, isApproved: false })}>
              <XCircle size={13} /> Revoke
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Messes</h1>
          <p className="page-subtitle">{messes.length} registered messes</p>
        </div>
      </div>

      <div className="tabs">
        {['all', 'approved', 'pending', 'inactive'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No messes found" />

      {/* Mess Detail Modal */}
      <Modal open={!!selectedMess} onClose={() => setSelectedMess(null)} title={selectedMess?.name || 'Mess Details'}>
        {selectedMess && (
          <div className="form">
            <div className="form-row">
              <div className="form-group"><label>Name</label><input value={selectedMess.name} readOnly /></div>
              <div className="form-group"><label>Owner</label><input value={selectedMess.ownerName || selectedMess.vendorName || '—'} readOnly /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Address</label><input value={selectedMess.address || '—'} readOnly /></div>
              <div className="form-group"><label>City</label><input value={selectedMess.city || '—'} readOnly /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Rating</label><input value={parseFloat(selectedMess.avgRating || 0).toFixed(1)} readOnly /></div>
              <div className="form-group"><label>Type</label><input value={selectedMess.messType || '—'} readOnly /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Veg Only</label><input value={selectedMess.isVegOnly ? 'Yes' : 'No'} readOnly /></div>
              <div className="form-group"><label>Approved</label><input value={selectedMess.isApproved ? 'Yes' : 'No'} readOnly /></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Approve Confirm */}
      <ConfirmDialog
        open={!!approving}
        title={approving?.isApproved ? 'Approve Mess?' : 'Revoke Approval?'}
        message={approving?.isApproved ? 'This mess will become visible to customers.' : 'This mess will be hidden from customers.'}
        confirmLabel={approving?.isApproved ? 'Approve' : 'Revoke'}
        onConfirm={handleApprove}
        onCancel={() => setApproving(null)}
      />
    </div>
  );
}
