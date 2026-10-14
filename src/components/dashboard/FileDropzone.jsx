import React, { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

/** Área para clicar ou arrastar arquivos. Funciona com teclado (Enter/Espaço). */
export default function FileDropzone({ icon: Icon, title, hint, accept, multiple = false, disabled = false, busy = false, onFiles }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const locked = disabled || busy;

  const open = () => !locked && inputRef.current?.click();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (locked) return;
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };

  return (
    <div
      role="button"
      tabIndex={locked ? -1 : 0}
      aria-disabled={locked}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      onDragOver={(e) => { e.preventDefault(); if (!locked) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B6B] ${
        locked ? 'cursor-not-allowed border-white/10 opacity-60' : 'cursor-pointer'
      } ${dragging ? 'border-[#FF6B6B] bg-[#FF6B6B]/10' : 'border-[#FF6B6B]/40 hover:border-[#FF6B6B]'}`}
    >
      {busy ? (
        <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-[#FF6B6B]" />
      ) : (
        <Icon className="mx-auto mb-2 h-8 w-8 text-[#FF6B6B]" />
      )}
      <p className="text-white">{dragging ? 'Solte para enviar' : title}</p>
      <p className="mt-1 text-sm text-white/50">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        tabIndex={-1}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          e.target.value = '';
          if (files.length) onFiles(files);
        }}
      />
    </div>
  );
}
