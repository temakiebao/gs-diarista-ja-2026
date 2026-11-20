'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ApprovalStatus, Professional } from '@/types/database';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  PauseCircle,
  Sparkles,
  Save,
} from 'lucide-react';

const SUGESTOES_SERVICOS = [
  'Limpeza completa',
  'Limpeza leve',
  'Limpeza pesada',
  'Passadoria',
  'Organização',
  'Cozinha',
];

const STATUS_INFO: Record<
  ApprovalStatus,
  {
    label: string;
    badge: string;
    box: string;
    desc: string;
    icon: React.ReactNode;
  }
> = {
  pending: {
    label: 'Pendente de Análise (pending)',
    badge: 'bg-amber-100 text-amber-800',
    box: 'bg-amber-50 border-amber-200 text-amber-900',
    desc: 'Seu cadastro foi registrado no banco de dados e está aguardando análise do administrador. Assim que aprovado, você aparecerá no app mobile.',
    icon: <Clock className="w-5 h-5 text-amber-600 shrink-0" />,
  },
  approved: {
    label: 'Aprovado e Ativo no App (approved)',
    badge: 'bg-emerald-100 text-emerald-800',
    box: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    desc: 'Parabéns! Seu perfil foi aprovado e já está visível para contratação no aplicativo mobile DiaristaJá.',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
  },
  rejected: {
    label: 'Cadastro Rejeitado (rejected)',
    badge: 'bg-rose-100 text-rose-800',
    box: 'bg-rose-50 border-rose-200 text-rose-900',
    desc: 'Sua solicitação não foi aprovada pela moderação. Revise seus dados abaixo ou entre em contato com o suporte.',
    icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
  },
  suspended: {
    label: 'Perfil Suspenso (suspended)',
    badge: 'bg-slate-200 text-slate-800',
    box: 'bg-slate-100 border-slate-300 text-slate-800',
    desc: 'Seu perfil está temporariamente suspenso e não aparece nas buscas públicas do aplicativo.',
    icon: <PauseCircle className="w-5 h-5 text-slate-600 shrink-0" />,
  },
};

export default function CadastroProfissionalPage() {
  const [tab, setTab] = useState<'register' | 'status'>('register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dados de conta / autenticação
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefone, setTelefone] = useState('');

  // Dados profissionais
  const [cidade, setCidade] = useState('');
  const [bairro, setBairro] = useState('');
  const [valorHora, setValorHora] = useState('');
  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>([
    'Limpeza completa',
  ]);
  const [servicoExtra, setServicoExtra] = useState('');
  const [descricaoExperiencia, setDescricaoExperiencia] = useState('');

  // Estado do profissional logado na aba de acompanhamento
  const [loggedUserId, setLoggedUserId] = useState<string | null>(null);
  const [professionalRecord, setProfessionalRecord] = useState<Professional | null>(null);

  function toggleServico(servico: string) {
    setServicosSelecionados((prev) =>
      prev.includes(servico)
        ? prev.filter((item) => item !== servico)
        : [...prev, servico]
    );
  }

  function addServicoExtra() {
    const trimmed = servicoExtra.trim();
    if (!trimmed) return;
    if (!servicosSelecionados.includes(trimmed)) {
      setServicosSelecionados((prev) => [...prev, trimmed]);
    }
    setServicoExtra('');
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (servicosSelecionados.length === 0) {
        throw new Error('Selecione ou adicione pelo menos um serviço oferecido.');
      }

      const supabase = createClient();

      // 1. Cria conta no Supabase Auth enviando metadados para o trigger de profiles
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            telefone,
            tipo_conta: 'professional',
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) {
        throw new Error('Não foi possível criar o usuário no Supabase Auth.');
      }

      const userId = authData.user.id;

      // Caso o Supabase esteja com confirmação de e-mail ativada, ainda não há sessão ativa
      if (!authData.session) {
        setSuccessMessage(
          'Conta criada! Verifique seu e-mail para confirmar o cadastro e depois faça login na aba "Acompanhar / Editar" para concluir o envio do perfil profissional.'
        );
        setLoading(false);
        return;
      }

      // 2. Garante o registro na tabela profiles
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        nome,
        email,
        telefone,
        tipo_conta: 'professional',
      });

      if (profileError) throw profileError;

      // 3. Salva na tabela professionals com status inicial 'pending'
      const valorNumerico = parseFloat(valorHora.replace(',', '.'));
      if (isNaN(valorNumerico) || valorNumerico < 0) {
        throw new Error('Informe um valor por hora válido.');
      }

      const { data: createdProf, error: profError } = await supabase
        .from('professionals')
        .insert({
          id: userId,
          descricao_experiencia: descricaoExperiencia,
          cidade,
          bairro,
          valor_hora: valorNumerico,
          servicos: servicosSelecionados,
          status: 'pending',
        })
        .select()
        .single();

      if (profError) throw profError;

      setLoggedUserId(userId);
      setProfessionalRecord(createdProf as Professional);
      setTab('status');
      setSuccessMessage('Cadastro enviado com sucesso! Status inicial: pending.');
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLoginAndFetch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const supabase = createClient();

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (authError) throw authError;

      const userId = authData.user.id;
      setLoggedUserId(userId);

      // Carrega perfil básico
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        setNome(profileData.nome);
        setTelefone(profileData.telefone ?? '');
      }

      // Carrega dados profissionais (se já existirem)
      const { data: profData, error: profError } = await supabase
        .from('professionals')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profError) throw profError;

      if (profData) {
        const prof = profData as Professional;
        setProfessionalRecord(prof);
        setCidade(prof.cidade);
        setBairro(prof.bairro);
        setValorHora(String(prof.valor_hora));
        setServicosSelecionados(prof.servicos ?? []);
        setDescricaoExperiencia(prof.descricao_experiencia);
      } else {
        setProfessionalRecord(null);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfessionalChanges(e: React.FormEvent) {
    e.preventDefault();
    if (!loggedUserId) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const supabase = createClient();
      const valorNumerico = parseFloat(valorHora.replace(',', '.'));

      // Atualiza telefone/nome em profiles
      await supabase
        .from('profiles')
        .upsert({
          id: loggedUserId,
          nome: nome || email.split('@')[0],
          email,
          telefone,
          tipo_conta: 'professional',
        });

      if (professionalRecord) {
        // Atualiza dados descritivos (RLS impede que o profissional altere o próprio status)
        const { data: updated, error: updateError } = await supabase
          .from('professionals')
          .update({
            descricao_experiencia: descricaoExperiencia,
            cidade,
            bairro,
            valor_hora: valorNumerico,
            servicos: servicosSelecionados,
          })
          .eq('id', loggedUserId)
          .select()
          .single();

        if (updateError) throw updateError;
        setProfessionalRecord(updated as Professional);
        setSuccessMessage('Dados profissionais atualizados com sucesso!');
      } else {
        // Caso o usuário tenha confirmado o e-mail agora e ainda não tinha registro em professionals
        const { data: inserted, error: insertError } = await supabase
          .from('professionals')
          .insert({
            id: loggedUserId,
            descricao_experiencia: descricaoExperiencia,
            cidade,
            bairro,
            valor_hora: valorNumerico,
            servicos: servicosSelecionados,
            status: 'pending',
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setProfessionalRecord(inserted as Professional);
        setSuccessMessage('Perfil profissional enviado para análise (status: pending)!');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar dados.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-mintSoft text-brand-ink py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Topo */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-green hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o início
          </Link>

          <div className="inline-flex rounded-xl border border-brand-line bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
                tab === 'register'
                  ? 'bg-brand-green text-white'
                  : 'text-brand-muted hover:text-brand-ink'
              }`}
            >
              Novo Cadastro
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('status');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
                tab === 'status'
                  ? 'bg-brand-green text-white'
                  : 'text-brand-muted hover:text-brand-ink'
              }`}
            >
              Acompanhar / Editar
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-brand-line shadow-sm p-6 md:p-9">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-brand-mint text-brand-green flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-brand-ink">
                {tab === 'register'
                  ? 'Cadastro de Profissional'
                  : 'Meu Perfil e Status de Aprovação'}
              </h1>
              <p className="text-sm text-brand-muted">
                {tab === 'register'
                  ? 'Preencha seus dados para análise administrativa e publicação no app.'
                  : 'Consulte o andamento da sua aprovação ou atualize suas informações.'}
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-800 font-medium">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mt-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 font-medium">
              {successMessage}
            </div>
          )}

          {/* ABA 1: NOVO CADASTRO */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="mt-6 space-y-6">
              <div>
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-green mb-3">
                  1. Dados da Conta (Tabela profiles)
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Nome completo *
                    </label>
                    <input
                      required
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Ana Paula Oliveira"
                      className="w-full rounded-xl border border-brand-line px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Telefone / WhatsApp *
                    </label>
                    <input
                      required
                      type="tel"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full rounded-xl border border-brand-line px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      E-mail *
                    </label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="profissional@email.com"
                      className="w-full rounded-xl border border-brand-line px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Senha de acesso *
                    </label>
                    <input
                      required
                      minLength={6}
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full rounded-xl border border-brand-line px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-brand-line" />

              <div>
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-green mb-3">
                  2. Dados Profissionais (Tabela professionals)
                </h2>

                <div className="grid sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Cidade *
                    </label>
                    <input
                      required
                      type="text"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      placeholder="São Paulo"
                      className="w-full rounded-xl border border-brand-line px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Bairro *
                    </label>
                    <input
                      required
                      type="text"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      placeholder="Vila Madalena"
                      className="w-full rounded-xl border border-brand-line px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Valor por hora (R$) *
                    </label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={valorHora}
                      onChange={(e) => setValorHora(e.target.value)}
                      placeholder="45.00"
                      className="w-full rounded-xl border border-brand-line px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">
                    Serviços oferecidos *
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2.5">
                    {SUGESTOES_SERVICOS.map((servico) => {
                      const active = servicosSelecionados.includes(servico);
                      return (
                        <button
                          key={servico}
                          type="button"
                          onClick={() => toggleServico(servico)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                            active
                              ? 'bg-brand-green text-white border-brand-green'
                              : 'bg-brand-mintSoft text-brand-ink border-brand-line hover:bg-brand-mint'
                          }`}
                        >
                          {active ? '✓ ' : '+ '}
                          {servico}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={servicoExtra}
                      onChange={(e) => setServicoExtra(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addServicoExtra();
                        }
                      }}
                      placeholder="Adicionar outro serviço (ex: Pós-obra)"
                      className="flex-1 rounded-xl border border-brand-line px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                    />
                    <button
                      type="button"
                      onClick={addServicoExtra}
                      className="px-4 py-2 rounded-xl bg-brand-mint text-brand-green text-xs font-bold hover:bg-brand-green hover:text-white transition"
                    >
                      Adicionar
                    </button>
                  </div>

                  {servicosSelecionados.length > 0 && (
                    <p className="text-xs text-brand-muted mt-2">
                      Selecionados: <strong>{servicosSelecionados.join(', ')}</strong>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Descrição e experiência *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={descricaoExperiencia}
                    onChange={(e) => setDescricaoExperiencia(e.target.value)}
                    placeholder="Descreva sua experiência, tempo de atuação, cuidados especiais e diferenciais..."
                    className="w-full rounded-xl border border-brand-line px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-brand-green text-white font-bold hover:bg-brand-greenDark disabled:opacity-50 transition shadow-sm"
              >
                {loading
                  ? 'Salvando no Supabase...'
                  : 'Enviar Cadastro para Aprovação'}
              </button>
            </form>
          )}

          {/* ABA 2: LOGIN E ACOMPANHAMENTO DE STATUS */}
          {tab === 'status' && (
            <div className="mt-6 space-y-6">
              {!loggedUserId ? (
                <form onSubmit={handleLoginAndFetch} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      E-mail cadastrado
                    </label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-brand-line px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Senha
                    </label>
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-brand-line px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-brand-green text-white font-bold hover:bg-brand-greenDark disabled:opacity-50"
                  >
                    {loading ? 'Consultando...' : 'Entrar e Ver Meu Status'}
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  {professionalRecord && (
                    <div
                      className={`p-5 rounded-2xl border flex items-start gap-3.5 ${
                        STATUS_INFO[professionalRecord.status].box
                      }`}
                    >
                      {STATUS_INFO[professionalRecord.status].icon}
                      <div>
                        <p className="font-extrabold text-base">
                          {STATUS_INFO[professionalRecord.status].label}
                        </p>
                        <p className="text-sm mt-1">
                          {STATUS_INFO[professionalRecord.status].desc}
                        </p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSaveProfessionalChanges} className="space-y-4">
                    <h3 className="text-sm font-extrabold text-brand-ink">
                      {professionalRecord
                        ? 'Atualizar informações do seu perfil'
                        : 'Concluir preenchimento do perfil profissional'}
                    </h3>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1">
                          Nome completo
                        </label>
                        <input
                          required
                          type="text"
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          className="w-full rounded-xl border border-brand-line px-3.5 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">
                          Telefone
                        </label>
                        <input
                          required
                          type="tel"
                          value={telefone}
                          onChange={(e) => setTelefone(e.target.value)}
                          className="w-full rounded-xl border border-brand-line px-3.5 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1">
                          Cidade
                        </label>
                        <input
                          required
                          type="text"
                          value={cidade}
                          onChange={(e) => setCidade(e.target.value)}
                          className="w-full rounded-xl border border-brand-line px-3.5 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">
                          Bairro
                        </label>
                        <input
                          required
                          type="text"
                          value={bairro}
                          onChange={(e) => setBairro(e.target.value)}
                          className="w-full rounded-xl border border-brand-line px-3.5 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">
                          Valor/hora (R$)
                        </label>
                        <input
                          required
                          type="number"
                          step="0.01"
                          value={valorHora}
                          onChange={(e) => setValorHora(e.target.value)}
                          className="w-full rounded-xl border border-brand-line px-3.5 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Serviços oferecidos
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {SUGESTOES_SERVICOS.map((servico) => {
                          const active = servicosSelecionados.includes(servico);
                          return (
                            <button
                              key={servico}
                              type="button"
                              onClick={() => toggleServico(servico)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                                active
                                  ? 'bg-brand-green text-white border-brand-green'
                                  : 'bg-brand-mintSoft text-brand-ink border-brand-line'
                              }`}
                            >
                              {active ? '✓ ' : '+ '}
                              {servico}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-1">
                        Descrição e experiência
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={descricaoExperiencia}
                        onChange={(e) => setDescricaoExperiencia(e.target.value)}
                        className="w-full rounded-xl border border-brand-line px-3.5 py-2 text-sm"
                      />
                    </div>

                    <button
                      disabled={loading}
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-brand-green text-white font-bold hover:bg-brand-greenDark disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
