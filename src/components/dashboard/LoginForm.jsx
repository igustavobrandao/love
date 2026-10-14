import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { Auth } from '../../entities/CoupleConfig';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export default function LoginForm({ onSuccess, notice }) {
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await Auth.login(password);
      onSuccess();
    } catch (err) {
      setError(err.message);
      setPassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 rounded-2xl border border-white/10 bg-white/5 p-8">
        <div className="space-y-2 text-center">
          <Lock className="mx-auto h-10 w-10 text-[#FF6B6B]" />
          <h1 className="text-2xl font-bold text-white">Área restrita</h1>
          <p className="text-sm text-white/60">Digite a senha para editar a página.</p>
        </div>

        {notice && (
          <p role="status" className="rounded-lg bg-amber-500/10 p-3 text-center text-sm text-amber-300">{notice}</p>
        )}

        <div>
          <Label htmlFor="admin-password" className="text-white">Senha</Label>
          <div className="relative">
            <Input
              id="admin-password"
              type={visible ? 'text' : 'password'}
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? 'admin-password-error' : undefined}
              className="bg-white/10 border-white/20 pr-11 text-white placeholder:text-white/50"
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-white/60 hover:text-white"
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error && (
            <p id="admin-password-error" role="alert" className="mt-2 text-sm text-red-400">{error}</p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting || !password} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </div>
  );
}
