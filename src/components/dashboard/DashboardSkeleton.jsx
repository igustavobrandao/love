import React from 'react';

const Block = ({ className }) => <div className={`rounded-lg bg-white/10 animate-dash-pulse ${className}`} />;

/** Esqueleto mostrado enquanto a configuração carrega (evita a tela "pular"). */
export default function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 pt-24" aria-busy="true" aria-label="Carregando">
      <div className="mx-auto max-w-sm space-y-3 text-center">
        <Block className="mx-auto h-9 w-3/4" />
        <Block className="mx-auto h-5 w-1/2" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
          <Block className="h-6 w-48" />
          <Block className="h-10 w-full" />
          <Block className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}
