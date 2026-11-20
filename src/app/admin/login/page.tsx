'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (authError) throw authError;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tipo_conta')
        .eq('id', authData.user.id)
        .single();

      if (profileError || profile?.tipo_conta !== 'admin') {
        await supabase.auth.signOut();
        throw new Error(
          'Acesso negado. Esta conta não possui perfil de administrador (tipo_conta = admin).'
        );
      }

      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação administrativa.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-ink flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-mint hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o site
        </Link>

        <div className="bg-white rounded-3xl p-8 shadow-xl border border-brand-line">
          <div className="flex items-center gap-3.5 mb-6">
            <div className="p-3 rounded-2xl bg-brand-mint text-brand-green">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-brand-ink">
                Painel Administrativo
              </h1>
              <p className="text-xs text-brand-muted">
                DiaristaJá • Moderação e aprovação de cadastros
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-brand-ink mb-1">
                E-mail do administrador
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@diaristaja.com"
                className="w-full rounded-xl border border-brand-line px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-brand-ink mb-1">
                Senha
              </label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-brand-line px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full py-3 rounded-2xl bg-brand-green text-white font-bold hover:bg-brand-greenDark disabled:opacity-50 transition"
            >
              {loading ? 'Validando acesso...' : 'Entrar no Painel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
