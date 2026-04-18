---
name: add-admin-page
description: Step-by-step guide to add a new page to the Digimess admin panel
---

# Add a New Page to Admin Panel

Follow these steps to add a new page to the admin Vite + React web app.

---

## 1. Create the API Module

Add or update a file in `admin/src/api/`. Every module re-exports thin wrappers
around the shared Axios `client`, keeping HTTP logic out of components.

```javascript
// admin/src/api/myResource.js
import client from './client';

const BASE = '/admin/my-resource';

export const getAll    = (params) => client.get(BASE, { params });   // ?page=1&limit=20&search=foo
export const getById   = (id)     => client.get(`${BASE}/${id}`);
export const create    = (data)   => client.post(BASE, data);
export const update    = (id, data) => client.put(`${BASE}/${id}`, data);
export const remove    = (id)     => client.delete(`${BASE}/${id}`);
export const patchField = (id, data) => client.patch(`${BASE}/${id}`, data);  // partial update (toggle status, etc.)
```

> **Convention**: Always accept a `params` object on list endpoints so the page
> can later add pagination, search and filters without changing the API module.

---

## 2. Create the Page Component

Create a new `.jsx` file in `admin/src/pages/`.

### List Page (most common)

Most admin pages are **CRUD list views**. Use this pattern:

```jsx
// admin/src/pages/MyResource.jsx
import { useState, useEffect, useCallback } from 'react';
import { getAll, create, update, remove } from '../api/myResource';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmDialog from '../components/common/ConfirmDialog';
import toast from 'react-hot-toast';

export default function MyResource() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);         // null = create, object = edit
  const [confirmId, setConfirmId] = useState(null);      // ID pending delete confirmation

  // ── Fetch ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAll();
      setData(res.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Create / Update ──
  const handleSave = async (formData) => {
    try {
      if (editing) {
        await update(editing.id, formData);
        toast.success('Updated successfully');
      } else {
        await create(formData);
        toast.success('Created successfully');
      }
      setModalOpen(false);
      setEditing(null);
      fetchData();                                       // always refresh after mutation
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    try {
      await remove(confirmId);
      toast.success('Deleted');
      setConfirmId(null);
      fetchData();
    } catch {
      toast.error('Delete failed');
    }
  };

  // ── Table columns ──
  const columns = [
    { key: 'name',      label: 'Name' },
    { key: 'isActive',  label: 'Status',  render: (v) => <StatusBadge active={v} /> },
    { key: 'createdAt', label: 'Created', render: (v) => new Date(v).toLocaleDateString() },
    {
      key: 'actions', label: '', render: (_, row) => (
        <div className="table-actions">
          <button className="btn btn-sm" onClick={() => { setEditing(row); setModalOpen(true); }}>Edit</button>
          <button className="btn btn-sm btn-danger" onClick={() => setConfirmId(row.id)}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Resource</h1>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
          + Add New
        </button>
      </div>

      <DataTable columns={columns} data={data} loading={loading} />

      {/* Create / Edit Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }}
             title={editing ? 'Edit Resource' : 'Add Resource'}>
        {/* Form component here — receives `editing` as initial values and `onSave` callback */}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!confirmId}
        message="Are you sure you want to delete this item?"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
```

### Detail Page (drill-down)

For detail / read-only views:

```jsx
// admin/src/pages/MyResourceDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getById } from '../api/myResource';
import toast from 'react-hot-toast';

export default function MyResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getById(id)
      .then(res => setItem(res.data))
      .catch(() => { toast.error('Not found'); navigate('/my-resource'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="page"><div className="skeleton" /></div>;
  if (!item) return null;

  return (
    <div className="page">
      <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Back</button>
      <h1>{item.name}</h1>
      {/* Detail content */}
    </div>
  );
}
```

---

## 3. Add Routes

Update `admin/src/App.jsx`:

```jsx
import MyResource from './pages/MyResource';
import MyResourceDetail from './pages/MyResourceDetail';

// Inside <Routes>:
<Route path="/my-resource" element={<MyResource />} />
<Route path="/my-resource/:id" element={<MyResourceDetail />} />
```

---

## 4. Add Sidebar Navigation

Update the `navItems` array in `admin/src/components/Layout/Sidebar.jsx`:

```jsx
{ path: '/my-resource', label: 'My Resource', icon: <BoxIcon size={20} /> },
```

For nested sections, use a group:

```jsx
{
  label: 'Finance',
  icon: <WalletIcon size={20} />,
  children: [
    { path: '/revenue', label: 'Revenue' },
    { path: '/transactions', label: 'Transactions' },
    { path: '/charges', label: 'Charges' },
  ],
},
```

---

## Styling Rules

- **Vanilla CSS only** — all styles in `admin/src/styles/`
- Use CSS variables from the design system (`--bg-primary`, `--accent`, etc.)
- Reuse existing classes: `.page`, `.page-header`, `.card`, `.btn`, `.btn-primary`, `.btn-danger`, `.btn-sm`, `.btn-ghost`
- Tables → `<DataTable>`, Modals → `<Modal>`, Statuses → `<StatusBadge>`
- Never use inline styles for colors or spacing

---

## Common Pitfalls

| Mistake | Fix |
|---------|-----|
| Fetching inside `useEffect` without cleanup | Use `useCallback` + dependency array |
| Not refreshing data after create/update/delete | Always call `fetchData()` after mutations |
| Hardcoding colors in JSX | Use CSS variables via class names |
| Putting HTTP logic in components | Keep it in `src/api/` modules |
| Forgetting error toasts | Wrap all async calls with try/catch + `toast.error()` |

---

## Checklist

- [ ] API module created in `src/api/` with list, get, create, update, delete
- [ ] Page component created in `src/pages/` following CRUD pattern
- [ ] Route added in `App.jsx`
- [ ] Sidebar nav item / group added in `Sidebar.jsx`
- [ ] Detail page added (if drill-down needed)
- [ ] CRUD modal wired up with form component
- [ ] Delete uses `<ConfirmDialog>` (never raw `window.confirm`)
- [ ] Errors show `toast.error()`, success shows `toast.success()`
- [ ] Backend endpoint exists (use `add-admin-api` skill if not)
