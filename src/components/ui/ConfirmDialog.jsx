import Modal from './Modal.jsx'
import Button from './Button.jsx'

export default function ConfirmDialog({ open, onClose, onConfirm, title = '¿Estás seguro?', description, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-muted mb-6">{description}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>Eliminar</Button>
      </div>
    </Modal>
  )
}
