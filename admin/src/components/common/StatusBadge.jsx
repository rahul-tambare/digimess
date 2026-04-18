export default function StatusBadge({ status }) {
  const normalized = (status || 'unknown').toLowerCase().replace(/\s+/g, '_');
  return (
    <span className={`status-badge ${normalized}`}>
      {status}
    </span>
  );
}
