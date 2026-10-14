import React from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '../ui/button';

/** Barra fixa no rodapé: sempre à mão, com o estado das alterações. */
export default function SaveBar({ dirty, saving, disabled, onSave, onDiscard }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#202026]/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <p className={`text-sm ${dirty ? 'text-amber-300' : 'text-white/50'}`}>
          {dirty ? 'Você tem alterações não salvas.' : 'Nenhuma alteração pendente.'}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onDiscard} disabled={!dirty || saving}>
            Descartar
          </Button>
          <Button onClick={onSave} disabled={!dirty || saving || disabled}>
            {saving ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : <Save className="mr-2 inline h-4 w-4" />}
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
