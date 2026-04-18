---
name: add-admin-component
description: Step-by-step guide to add a reusable UI component to the Digimess admin panel
---

# Add a Reusable Component to Admin Panel

Follow these steps to add a shared component to the admin web app.

---

## 1. Choose the Right Directory

| Directory | What goes here | Examples |
|-----------|---------------|----------|
| `src/components/common/` | Generic, data-agnostic UI primitives | `DataTable`, `Modal`, `StatusBadge`, `KPICard`, `ConfirmDialog` |
| `src/components/forms/` | Form components tied to a specific domain | `FAQForm`, `CouponForm`, `ChargeForm`, `PlanForm` |
| `src/components/Layout/` | Structural shell (should rarely change) | `Sidebar`, `Header`, `Layout` |

---

## 2. Create the Component

### Generic UI Component

```jsx
// admin/src/components/common/MyComponent.jsx
export default function MyComponent({ title, value, icon, trend, className = '' }) {
  return (
    <div className={`my-component ${className}`}>
      {icon && <span className="my-component-icon">{icon}</span>}
      <div>
        <p className="my-component-label">{title}</p>
        <h3 className="my-component-value">{value}</h3>
        {trend !== undefined && (
          <span className={`my-component-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}
```

### Form Component

Form components receive `initialData` (for editing) and call `onSave` on submit:

```jsx
// admin/src/components/forms/MyForm.jsx
import { useState, useEffect } from 'react';

export default function MyForm({ initialData, onSave, loading }) {
  const [form, setForm] = useState({ name: '', amount: '' });

  // Populate form when editing
  useEffect(() => {
    if (initialData) {
      setForm({ name: initialData.name || '', amount: initialData.amount || '' });
    } else {
      setForm({ name: '', amount: '' });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;       // basic client-side guard
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" value={form.name} onChange={handleChange}
               placeholder="Enter name" required />
      </div>
      <div className="form-group">
        <label htmlFor="amount">Amount</label>
        <input id="amount" name="amount" type="number" value={form.amount}
               onChange={handleChange} placeholder="0.00" required />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving…' : (initialData ? 'Update' : 'Create')}
        </button>
      </div>
    </form>
  );
}
```

---

## 3. Add Styles

Add CSS in `admin/src/styles/`. **Always use CSS variables** — never hardcode
colors, so the design system stays consistent.

```css
/* admin/src/styles/components.css */
.my-component {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.my-component:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.my-component-label {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin: 0;
}

.my-component-value {
  color: var(--text-primary);
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0.25rem 0 0;
}

.my-component-trend.positive { color: var(--success); }
.my-component-trend.negative { color: var(--danger); }
```

If this is a **new CSS file**, import it in `admin/src/main.jsx`:

```jsx
import './styles/components.css';
```

---

## 4. Use in Pages

```jsx
import MyComponent from '../components/common/MyComponent';
import { Users } from 'lucide-react';

<MyComponent
  title="Total Users"
  value="1,234"
  icon={<Users size={24} />}
  trend={12.5}
/>
```

---

## Design System Reference

All CSS variables are defined in `admin/src/styles/index.css`:

| Variable | Purpose | Value (Dark) |
|----------|---------|--------------|
| `--bg-primary` | Page background | `#0f172a` |
| `--bg-secondary` | Sidebar / panels | `#1e293b` |
| `--card-bg` | Card surfaces | `#1e293b` |
| `--text-primary` | Primary text | `#f1f5f9` |
| `--text-secondary` | Muted / label text | `#94a3b8` |
| `--accent` | Primary action / links | `#3b82f6` |
| `--accent-hover` | Hover state for accent | `#2563eb` |
| `--success` | Positive / active | `#22c55e` |
| `--warning` | Amber warnings | `#f59e0b` |
| `--danger` | Error / destructive | `#ef4444` |
| `--border-color` | Borders & dividers | `#334155` |

### Shared CSS Classes

| Class | Element |
|-------|---------|
| `.btn` | Base button |
| `.btn-primary` | Blue accent button |
| `.btn-danger` | Red destructive button |
| `.btn-sm` | Small inline button (table actions) |
| `.btn-ghost` | Borderless text button |
| `.card` | Elevated card container |
| `.page` | Top-level page wrapper |
| `.page-header` | Flex row with title + actions |
| `.form-group` | Label + input wrapper |
| `.form-actions` | Button row inside forms |
| `.table-actions` | Inline button group in table rows |

---

## Component Design Principles

1. **Props over config** — Pass data and callbacks as props, never access global state inside common components.
2. **Controlled forms** — Forms receive `initialData` and call `onSave`; the parent owns the API call and handles success/error.
3. **No inline styles** — Use CSS classes and variables exclusively.
4. **Accessible markup** — Always use `<label htmlFor>` with matching `id` on inputs. Use `<button>` over `<div onClick>`.
5. **Responsive** — Use `min-width` media queries; components should stack on narrow viewports.

---

## Checklist

- [ ] Component file created in `src/components/{common,forms,Layout}/`
- [ ] CSS added to `src/styles/` using design system variables
- [ ] CSS file imported in `main.jsx` (if new file)
- [ ] Props are descriptive and documented inline
- [ ] Form components use controlled state + `initialData` pattern
- [ ] Hover / focus states defined for interactive elements
- [ ] Used in at least one page
