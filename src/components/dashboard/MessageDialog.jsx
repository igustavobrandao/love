import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import Modal from './Modal';

/** Substitui window.alert() quando há algo a detalhar (ex.: lista de arquivos que falharam). */
export default function MessageDialog({ open, title, description, items = [], onClose }) {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={title}
      description={description}
      footer={<Button onClick={onClose}>Entendi</Button>}
    >
      {items.length > 0 && (
        <ul className="max-h-60 space-y-2 overflow-y-auto pr-1">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 rounded-lg bg-white/5 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div className="min-w-0">
                <p className="truncate font-medium text-white" title={item.name}>{item.name}</p>
                <p className="text-white/60">{item.reason}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
