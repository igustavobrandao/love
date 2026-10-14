import React from 'react';
import { Heart, LogOut } from 'lucide-react';
import { Button } from '../ui/button';

export default function DashboardHeader({ dirty, onLogout }) {
  return (
    <header className="space-y-4 text-center">
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <Heart className="h-5 w-5 shrink-0 text-[#FF6B6B] sm:h-7 sm:w-7" fill="currentColor" />
        <h1 className="text-2xl font-bold text-white sm:text-4xl">Dashboard do Casal</h1>
        <Heart className="h-5 w-5 shrink-0 text-[#FF6B6B] sm:h-7 sm:w-7" fill="currentColor" />
      </div>
      <p className="text-white/70">Configure a sua história de amor</p>
      <div className="flex items-center justify-center gap-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
            dirty ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${dirty ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          {dirty ? 'Alterações não salvas' : 'Tudo salvo'}
        </span>
        <Button variant="ghost" size="sm" onClick={onLogout} className="text-white/60 hover:text-white">
          <LogOut className="mr-1.5 inline h-4 w-4" />
          Sair
        </Button>
      </div>
    </header>
  );
}
