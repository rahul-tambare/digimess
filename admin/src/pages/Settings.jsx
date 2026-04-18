import { useState, useEffect } from 'react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import * as faqsApi from '../api/faqs';
import * as chargesApi from '../api/charges';
import * as couponsApi from '../api/coupons';
import * as configApi from '../api/config';

const tabs = ['FAQs', 'Charges', 'Coupons', 'App Config'];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('FAQs');

  // FAQ state
  const [faqs, setFaqs] = useState([]);
  const [faqModal, setFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', category: 'general' });
  const [deletingFaqId, setDeletingFaqId] = useState(null);

  // Charges state
  const [charges, setCharges] = useState([]);
  const [chargeModal, setChargeModal] = useState(false);
  const [editingCharge, setEditingCharge] = useState(null);
  const [chargeForm, setChargeForm] = useState({ name: '', type: 'fixed', amount: '', appliesTo: 'order' });
  const [deletingChargeId, setDeletingChargeId] = useState(null);

  // Coupons state
  const [coupons, setCoupons] = useState([]);
  const [couponModal, setCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxDiscount: '', validFrom: '', validTo: '', usageLimit: '' });
  const [deletingCouponId, setDeletingCouponId] = useState(null);

  // Config state
  const [config, setConfig] = useState([]);

  // Loading
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [loadingCharges, setLoadingCharges] = useState(true);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(true);

  /* ─── Data fetching ─── */
  const fetchFaqs = async () => {
    try { const res = await faqsApi.getAll(); setFaqs(res.data); }
    catch { toast.error('Failed to load FAQs'); }
    finally { setLoadingFaqs(false); }
  };
  const fetchCharges = async () => {
    try { const res = await chargesApi.getAll(); setCharges(res.data); }
    catch { toast.error('Failed to load charges'); }
    finally { setLoadingCharges(false); }
  };
  const fetchCoupons = async () => {
    try { const res = await couponsApi.getAll(); setCoupons(res.data); }
    catch { toast.error('Failed to load coupons'); }
    finally { setLoadingCoupons(false); }
  };
  const fetchConfig = async () => {
    try { const res = await configApi.getConfig(); setConfig(res.data); }
    catch { toast.error('Failed to load config'); }
    finally { setLoadingConfig(false); }
  };

  useEffect(() => { fetchFaqs(); fetchCharges(); fetchCoupons(); fetchConfig(); }, []);

  /* ─── FAQ handlers ─── */
  const openFaqCreate = () => { setEditingFaq(null); setFaqForm({ question: '', answer: '', category: 'general' }); setFaqModal(true); };
  const openFaqEdit = (faq) => { setEditingFaq(faq); setFaqForm({ question: faq.question, answer: faq.answer, category: faq.category }); setFaqModal(true); };
  const handleFaqSave = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) return;
    try {
      if (editingFaq) {
        await faqsApi.update(editingFaq.id, { ...faqForm, displayOrder: editingFaq.displayOrder, isActive: editingFaq.isActive });
        toast.success('FAQ updated');
      } else {
        await faqsApi.create({ ...faqForm, displayOrder: faqs.length + 1 });
        toast.success('FAQ created');
      }
      setFaqModal(false);
      fetchFaqs();
    } catch { toast.error('Failed to save FAQ'); }
  };
  const handleFaqDelete = async () => {
    try {
      await faqsApi.remove(deletingFaqId);
      toast.success('FAQ deleted');
      setDeletingFaqId(null);
      fetchFaqs();
    } catch { toast.error('Failed to delete FAQ'); }
  };

  /* ─── Charge handlers ─── */
  const openChargeCreate = () => { setEditingCharge(null); setChargeForm({ name: '', type: 'fixed', amount: '', appliesTo: 'order' }); setChargeModal(true); };
  const openChargeEdit = (c) => { setEditingCharge(c); setChargeForm({ name: c.name, type: c.type, amount: c.amount, appliesTo: c.appliesTo }); setChargeModal(true); };
  const handleChargeSave = async () => {
    if (!chargeForm.name.trim()) return;
    try {
      if (editingCharge) {
        await chargesApi.update(editingCharge.id, { ...chargeForm, amount: parseFloat(chargeForm.amount), isActive: editingCharge.isActive });
        toast.success('Charge updated');
      } else {
        await chargesApi.create({ ...chargeForm, amount: parseFloat(chargeForm.amount) });
        toast.success('Charge created');
      }
      setChargeModal(false);
      fetchCharges();
    } catch { toast.error('Failed to save charge'); }
  };
  const handleChargeDelete = async () => {
    try {
      await chargesApi.remove(deletingChargeId);
      toast.success('Charge deleted');
      setDeletingChargeId(null);
      fetchCharges();
    } catch { toast.error('Failed to delete charge'); }
  };

  /* ─── Coupon handlers ─── */
  const openCouponCreate = () => { setEditingCoupon(null); setCouponForm({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxDiscount: '', validFrom: '', validTo: '', usageLimit: '' }); setCouponModal(true); };
  const openCouponEdit = (c) => {
    setEditingCoupon(c);
    setCouponForm({
      code: c.code, discountType: c.discountType, discountValue: c.discountValue,
      minOrderAmount: c.minOrderAmount, maxDiscount: c.maxDiscount || '',
      validFrom: c.validFrom?.slice(0, 10) || '', validTo: c.validTo?.slice(0, 10) || '',
      usageLimit: c.usageLimit || ''
    });
    setCouponModal(true);
  };
  const handleCouponSave = async () => {
    if (!couponForm.code.trim()) return;
    try {
      const payload = { ...couponForm, discountValue: parseFloat(couponForm.discountValue), minOrderAmount: parseFloat(couponForm.minOrderAmount || 0) };
      if (editingCoupon) {
        await couponsApi.update(editingCoupon.id, { ...payload, isActive: editingCoupon.isActive });
        toast.success('Coupon updated');
      } else {
        await couponsApi.create(payload);
        toast.success('Coupon created');
      }
      setCouponModal(false);
      fetchCoupons();
    } catch { toast.error('Failed to save coupon'); }
  };
  const handleCouponDelete = async () => {
    try {
      await couponsApi.remove(deletingCouponId);
      toast.success('Coupon deleted');
      setDeletingCouponId(null);
      fetchCoupons();
    } catch { toast.error('Failed to delete coupon'); }
  };

  /* ─── Config save ─── */
  const handleConfigSave = async () => {
    try {
      // Send config as key-value object
      const payload = {};
      config.forEach(c => { payload[c.key || c.configKey] = c.value || c.configValue; });
      await configApi.updateConfig(payload);
      toast.success('Configuration saved!');
    } catch { toast.error('Failed to save config'); }
  };

  /* ─── FAQ Columns ─── */
  const faqCols = [
    { key: 'question', label: 'Question', render: v => <span style={{ maxWidth: 280, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span> },
    { key: 'category', label: 'Category', render: v => <StatusBadge status={v === 'ordering' ? 'confirmed' : v === 'payments' ? 'active' : 'pending'} /> },
    { key: 'isActive', label: 'Status', render: v => <StatusBadge status={v ? 'active' : 'inactive'} /> },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="table-actions">
          <button className="btn btn-sm" onClick={() => openFaqEdit(row)}><Edit size={13} /></button>
          <button className="btn btn-sm btn-danger" onClick={() => setDeletingFaqId(row.id)}><Trash2 size={13} /></button>
        </div>
      ),
    },
  ];

  /* ─── Charge Columns ─── */
  const chargeCols = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: v => <span style={{ textTransform: 'capitalize' }}>{v}</span> },
    {
      key: 'amount', label: 'Amount',
      render: (v, row) => <span style={{ fontWeight: 600 }}>{row.type === 'percentage' ? `${v}%` : `₹${v}`}</span>,
    },
    { key: 'appliesTo', label: 'Applies To', render: v => <span style={{ textTransform: 'capitalize' }}>{v}</span> },
    { key: 'isActive', label: 'Status', render: v => <StatusBadge status={v ? 'active' : 'inactive'} /> },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="table-actions">
          <button className="btn btn-sm" onClick={() => openChargeEdit(row)}><Edit size={13} /></button>
          <button className="btn btn-sm btn-danger" onClick={() => setDeletingChargeId(row.id)}><Trash2 size={13} /></button>
        </div>
      ),
    },
  ];

  /* ─── Coupon Columns ─── */
  const couponCols = [
    {
      key: 'code', label: 'Code',
      render: v => <span style={{ fontWeight: 700, background: 'var(--accent-light)', color: 'var(--accent)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.82rem', letterSpacing: '0.04em' }}>{v}</span>,
    },
    {
      key: 'discountType', label: 'Discount',
      render: (v, row) => <span style={{ fontWeight: 600 }}>{v === 'percentage' ? `${row.discountValue}%` : `₹${row.discountValue}`}</span>,
    },
    { key: 'minOrderAmount', label: 'Min Order', render: v => `₹${v || 0}` },
    {
      key: 'usedCount', label: 'Usage',
      render: (v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 50, height: 5, background: 'var(--bg-primary)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${row.usageLimit ? ((v || 0) / row.usageLimit) * 100 : 0}%`, height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: '0.8rem' }}>{v || 0}/{row.usageLimit || '∞'}</span>
        </div>
      ),
    },
    {
      key: 'validTo', label: 'Valid Until',
      render: v => v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    },
    { key: 'isActive', label: 'Status', render: v => <StatusBadge status={v ? 'active' : 'inactive'} /> },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="table-actions">
          <button className="btn btn-sm" onClick={() => openCouponEdit(row)}><Edit size={13} /></button>
          <button className="btn btn-sm btn-danger" onClick={() => setDeletingCouponId(row.id)}><Trash2 size={13} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="page-subtitle">Manage system configuration</p>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="settings-content">
        {/* ─── FAQs Tab ─── */}
        {activeTab === 'FAQs' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button className="btn btn-primary" onClick={openFaqCreate}><Plus size={16} /> Add FAQ</button>
            </div>
            <DataTable columns={faqCols} data={faqs} loading={loadingFaqs} searchable={false} />
          </>
        )}

        {/* ─── Charges Tab ─── */}
        {activeTab === 'Charges' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button className="btn btn-primary" onClick={openChargeCreate}><Plus size={16} /> Add Charge</button>
            </div>
            <DataTable columns={chargeCols} data={charges} loading={loadingCharges} searchable={false} />
          </>
        )}

        {/* ─── Coupons Tab ─── */}
        {activeTab === 'Coupons' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button className="btn btn-primary" onClick={openCouponCreate}><Plus size={16} /> Add Coupon</button>
            </div>
            <DataTable columns={couponCols} data={coupons} loading={loadingCoupons} />
          </>
        )}

        {/* ─── App Config Tab ─── */}
        {activeTab === 'App Config' && (
          <>
            <div className="settings-grid">
              {config.map((c, i) => (
                <div key={c.key || c.configKey || i} className="config-item">
                  <span className="config-key">{c.key || c.configKey}</span>
                  <div className="config-value">
                    <input
                      value={c.value || c.configValue || ''}
                      onChange={e => setConfig(config.map((cfg, j) =>
                        j === i ? { ...cfg, value: e.target.value, configValue: e.target.value } : cfg
                      ))}
                    />
                  </div>
                </div>
              ))}
              {config.length === 0 && !loadingConfig && <p style={{ color: 'var(--text-muted)' }}>No config entries found</p>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={handleConfigSave}><Save size={16} /> Save Config</button>
            </div>
          </>
        )}
      </div>

      {/* FAQ Modal */}
      <Modal open={faqModal} onClose={() => setFaqModal(false)} title={editingFaq ? 'Edit FAQ' : 'Add FAQ'}
        footer={<><button className="btn" onClick={() => setFaqModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleFaqSave}>{editingFaq ? 'Update' : 'Create'}</button></>}>
        <div className="form">
          <div className="form-group">
            <label>Question</label>
            <input value={faqForm.question} onChange={e => setFaqForm({ ...faqForm, question: e.target.value })} placeholder="Enter question" />
          </div>
          <div className="form-group">
            <label>Answer</label>
            <textarea rows={3} value={faqForm.answer} onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })} placeholder="Enter answer" />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={faqForm.category} onChange={e => setFaqForm({ ...faqForm, category: e.target.value })}>
              <option value="general">General</option>
              <option value="ordering">Ordering</option>
              <option value="payments">Payments</option>
              <option value="subscriptions">Subscriptions</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Charge Modal */}
      <Modal open={chargeModal} onClose={() => setChargeModal(false)} title={editingCharge ? 'Edit Charge' : 'Add Charge'}
        footer={<><button className="btn" onClick={() => setChargeModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleChargeSave}>{editingCharge ? 'Update' : 'Create'}</button></>}>
        <div className="form">
          <div className="form-group">
            <label>Name</label>
            <input value={chargeForm.name} onChange={e => setChargeForm({ ...chargeForm, name: e.target.value })} placeholder="e.g. Platform Fee" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select value={chargeForm.type} onChange={e => setChargeForm({ ...chargeForm, type: e.target.value })}>
                <option value="fixed">Fixed (₹)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Amount</label>
              <input type="number" value={chargeForm.amount} onChange={e => setChargeForm({ ...chargeForm, amount: e.target.value })} placeholder="0.00" />
            </div>
          </div>
          <div className="form-group">
            <label>Applies To</label>
            <select value={chargeForm.appliesTo} onChange={e => setChargeForm({ ...chargeForm, appliesTo: e.target.value })}>
              <option value="order">Order</option>
              <option value="recharge">Recharge</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Coupon Modal */}
      <Modal open={couponModal} onClose={() => setCouponModal(false)} title={editingCoupon ? 'Edit Coupon' : 'Add Coupon'}
        footer={<><button className="btn" onClick={() => setCouponModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCouponSave}>{editingCoupon ? 'Update' : 'Create'}</button></>}>
        <div className="form">
          <div className="form-row">
            <div className="form-group">
              <label>Coupon Code</label>
              <input value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} placeholder="e.g. FLAT50" />
            </div>
            <div className="form-group">
              <label>Discount Type</label>
              <select value={couponForm.discountType} onChange={e => setCouponForm({ ...couponForm, discountType: e.target.value })}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (₹)</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Discount Value</label>
              <input type="number" value={couponForm.discountValue} onChange={e => setCouponForm({ ...couponForm, discountValue: e.target.value })} placeholder="0" />
            </div>
            <div className="form-group">
              <label>Min Order Amount (₹)</label>
              <input type="number" value={couponForm.minOrderAmount} onChange={e => setCouponForm({ ...couponForm, minOrderAmount: e.target.value })} placeholder="0" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Max Discount (₹)</label>
              <input type="number" value={couponForm.maxDiscount} onChange={e => setCouponForm({ ...couponForm, maxDiscount: e.target.value })} placeholder="Optional" />
            </div>
            <div className="form-group">
              <label>Usage Limit</label>
              <input type="number" value={couponForm.usageLimit} onChange={e => setCouponForm({ ...couponForm, usageLimit: e.target.value })} placeholder="Unlimited" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Valid From</label>
              <input type="date" value={couponForm.validFrom} onChange={e => setCouponForm({ ...couponForm, validFrom: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Valid To</label>
              <input type="date" value={couponForm.validTo} onChange={e => setCouponForm({ ...couponForm, validTo: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmations */}
      <ConfirmDialog open={!!deletingFaqId} title="Delete FAQ?" message="This action cannot be undone." onConfirm={handleFaqDelete} onCancel={() => setDeletingFaqId(null)} />
      <ConfirmDialog open={!!deletingChargeId} title="Delete Charge?" message="This will remove the charge from all future calculations." onConfirm={handleChargeDelete} onCancel={() => setDeletingChargeId(null)} />
      <ConfirmDialog open={!!deletingCouponId} title="Delete Coupon?" message="This coupon will be permanently removed." onConfirm={handleCouponDelete} onCancel={() => setDeletingCouponId(null)} />
    </div>
  );
}
