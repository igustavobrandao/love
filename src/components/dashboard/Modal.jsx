import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

/**
 * Modal acessível (foco preso, Esc fecha, foco volta ao botão que abriu).
 * `dismissible={false}` impede fechar por Esc/clique fora (ex.: durante uma ação em andamento).
 */
export default function Modal({ open, onOpenChange, title, description, children, footer, dismissible = true }) {
  const guard = (e) => {
    if (!dismissible) e.preventDefault();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => (dismissible || next) && onOpenChange(next)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-dash-fade" />
        <Dialog.Content
          onEscapeKeyDown={guard}
          onInteractOutside={guard}
          {...(description ? {} : { 'aria-describedby': undefined })}
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#2a2a32] p-6 shadow-2xl animate-dash-pop focus:outline-none"
        >
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="text-lg font-semibold text-white">{title}</Dialog.Title>
            {dismissible && (
              <Dialog.Close
                aria-label="Fechar"
                className="-mr-2 -mt-1 rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Dialog.Close>
            )}
          </div>
          {description && (
            <Dialog.Description className="mt-2 text-sm text-white/70">{description}</Dialog.Description>
          )}
          {children && <div className="mt-4">{children}</div>}
          {footer && <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
