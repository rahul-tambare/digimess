import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ open, title = 'Are you sure?', message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Confirm Action"
      footer={
        <>
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </>
      }
    >
      <div className="confirm-dialog">
        <div className="confirm-icon">
          <AlertTriangle size={28} />
        </div>
        <p className="confirm-title">{title}</p>
        <p className="confirm-message">{message}</p>
      </div>
    </Modal>
  );
}
