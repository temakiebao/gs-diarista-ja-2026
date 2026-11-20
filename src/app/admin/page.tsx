'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ApprovalStatus, ProfessionalWithProfile } from '@/types/database';
import {
  CheckCircle2,
  XCircle,
  PauseCircle,
  LogOut,
  MapPin,
  DollarSign,
  Phone,
  Mail,
  Search,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

const STATUS_BADGE: Record<ApprovalStatus, { text: string; classes: string }> = {
  pending: {
    text: 'Pendente (pending)',
    classes: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  approved: {
    text: 'Aprovado • No App (approved)',
    classes: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  rejected: {
    text: 'Rejeitado (rejected)',
    classes: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  suspended: {
    text: 'Suspenso (suspended)',
    classes: 'bg-slate-200 text-slate-800 border-slate-300',
  },
};

export default function AdminDashboardPage() {
  const router = useRouter();

  const [professionals, setProfessionals] = useState<ProfessionalWithProfile[]>([]);
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadProfessionals = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/admin/login');
        return;
      }

      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('tipo_conta')
        .eq('id', user.id)
        .single();

      if (adminProfile?.tipo_conta !== 'admin') {
        router.push('/admin/login');
        return;
      }

      const { data, error } = await supabase
        .from('professionals')
        .select(
          `
          id,
          descricao_experiencia,
          cidade,
          bairro,
          valor_hora,
          servicos,
          status,
          created_at,
          profiles (
            nome,
            email,
            telefone
          )
        `
        )
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProfessionals(data as unknown as ProfessionalWithProfile[]);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadProfessionals();
  }, [loadProfessionals]);

  async function handleStatusChange(
    id: string,
    nome: string,
    newStatus: ApprovalStatus
  ) {
    setUpdatingId(id);
    setFeedback(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('professionals')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setProfessionals((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );

      const actionLabel: Record<ApprovalStatus, string> = {
        approved: 'aprovado e publicado no aplicativo mobile',
        rejected: 'rejeitado',
        suspended: 'suspenso e removido da busca pública',
        pending: 'movido para pendente',
      };

      setFeedback(`Cadastro de ${nome} foi ${actionLabel[newStatus]}.`);
    } catch (err: any) {
      setFeedback(`Erro ao atualizar status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  }

  const counts = {
    all: professionals.length,
    pending: professionals.filter((p) => p.status === 'pending').length,
    approved: professionals.filter((p) => p.status === 'approved').length,
    rejected: professionals.filter((p) => p.status === 'rejected').length,
    suspended: professionals.filter((p) => p.status === 'suspended').length,
  };

  const filteredList = professionals.filter((prof) => {
    const matchesStatus =
      filterStatus === 'all' ? true : prof.status === filterStatus;

    const q = searchTerm.trim().toLowerCase();
    if (!q) return matchesStatus;

    const nome = prof.profiles?.nome?.toLowerCase() ?? '';
    const email = prof.profiles?.email?.toLowerCase() ?? '';
    const cidade = prof.cidade.toLowerCase();
    const bairro = prof.bairro.toLowerCase();
    const servicos = prof.servicos.join(' ').toLowerCase();

    return (
      matchesStatus &&
      (nome.includes(q) ||
        email.includes(q) ||
        cidade.includes(q) ||
        bairro.includes(q) ||
        servicos.includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-brand-mintSoft text-brand-ink">
      {/* Navbar Administrativa */}
      <header className="bg-brand-ink text-white sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-brand-orange" />
            <h1 className="font-extrabold text-base md:text-lg">
              DiaristaJá • Painel Administrativo
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={loadProfessionals}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Atualizar
            </button>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {feedback && (
          <div className="p-4 rounded-2xl bg-white border border-brand-green text-sm font-semibold text-brand-green shadow-sm">
            {feedback}
          </div>
        )}

        {/* Filtros de Status e Busca */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['pending', `Pendentes (${counts.pending})`],
                ['approved', `Aprovados (${counts.approved})`],
                ['rejected', `Rejeitados (${counts.rejected})`],
                ['suspended', `Suspensos (${counts.suspended})`],
                ['all', `Todos (${counts.all})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition ${
                  filterStatus === key
                    ? 'bg-brand-green text-white shadow-sm'
                    : 'bg-white text-brand-ink border border-brand-line hover:bg-brand-mint/60'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar nome, bairro ou serviço..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-brand-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
        </div>

        {/* Lista de Profissionais */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-brand-line p-12 text-center text-sm text-brand-muted">
            Carregando solicitações do Supabase...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-white rounded-3xl border border-brand-line p-12 text-center text-sm text-brand-muted">
            Nenhum profissional encontrado para o filtro selecionado.
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredList.map((prof) => {
              const nomeProf = prof.profiles?.nome ?? 'Profissional sem nome';
              return (
                <div
                  key={prof.id}
                  className="bg-white rounded-3xl border border-brand-line p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-lg font-extrabold text-brand-ink">
                        {nomeProf}
                      </h2>
                      <span
                        className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                          STATUS_BADGE[prof.status].classes
                        }`}
                      >
                        {STATUS_BADGE[prof.status].text}
                      </span>
                      <span className="text-xs text-brand-muted">
                        • Cadastro em{' '}
                        {new Date(prof.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs md:text-sm text-brand-muted">
                      {prof.profiles?.email && (
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
                          {prof.profiles.email}
                        </span>
                      )}
                      {prof.profiles?.telefone && (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          {prof.profiles.telefone}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 text-brand-ink font-medium">
                        <MapPin className="w-3.5 h-3.5 text-brand-green" />
                        {prof.bairro}, {prof.cidade}
                      </span>
                      <span className="inline-flex items-center gap-1 font-extrabold text-brand-green">
                        <DollarSign className="w-3.5 h-3.5" />
                        R$ {Number(prof.valor_hora).toFixed(2)}/hora
                      </span>
                    </div>

                    <p className="text-sm text-brand-ink/90 leading-relaxed bg-brand-mintSoft/70 p-3.5 rounded-2xl border border-brand-line">
                      {prof.descricao_experiencia}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {prof.servicos.map((servico) => (
                        <span
                          key={servico}
                          className="px-3 py-1 rounded-full bg-brand-mint text-brand-green text-xs font-bold"
                        >
                          {servico}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Controles do Administrador */}
                  <div className="flex flex-wrap lg:flex-col gap-2 shrink-0 min-w-[160px]">
                    {prof.status !== 'approved' && (
                      <button
                        disabled={updatingId === prof.id}
                        onClick={() =>
                          handleStatusChange(prof.id, nomeProf, 'approved')
                        }
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-green text-white text-xs font-bold hover:bg-brand-greenDark disabled:opacity-50 transition"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Aprovar
                      </button>
                    )}

                    {prof.status === 'pending' && (
                      <button
                        disabled={updatingId === prof.id}
                        onClick={() =>
                          handleStatusChange(prof.id, nomeProf, 'rejected')
                        }
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-red text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 transition"
                      >
                        <XCircle className="w-4 h-4" />
                        Rejeitar
                      </button>
                    )}

                    {prof.status === 'approved' && (
                      <button
                        disabled={updatingId === prof.id}
                        onClick={() =>
                          handleStatusChange(prof.id, nomeProf, 'suspended')
                        }
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 disabled:opacity-50 transition"
                      >
                        <PauseCircle className="w-4 h-4" />
                        Suspender
                      </button>
                    )}

                    {(prof.status === 'rejected' || prof.status === 'suspended') && (
                      <button
                        disabled={updatingId === prof.id}
                        onClick={() =>
                          handleStatusChange(prof.id, nomeProf, 'pending')
                        }
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-brand-line bg-white text-brand-ink text-xs font-bold hover:bg-slate-100 disabled:opacity-50 transition"
                      >
                        Voltar p/ Pendente
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
