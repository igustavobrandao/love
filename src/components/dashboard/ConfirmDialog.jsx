import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import Modal from './Modal';

/** Substitui window.confirm(). `onConfirm` pode ser assíncrono; o botão mostra "carregando". */
export default function ConfirmDialog({
  open,
  title,
  description,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && onCancel()}
      title={title}
      description={description}
      dismissible={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'destructive' : undefined} onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
