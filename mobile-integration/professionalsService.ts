/**
 * Arquivo pronto para copiar para o projeto mobile Expo (App global solution 2026 / DiaristaJá)
 * Ex: services/professionalsService.ts
 *
 * Consulta o mesmo banco Supabase buscando APENAS profissionais com status 'approved'
 * e normaliza para o formato esperado por components/ProfessionalCard.tsx e app/professional/[id].tsx.
 */
import { createClient } from '@supabase/supabase-js';
import type { Professional } from '@/data/mock';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1704579924216-31ef96f7e008?crop=faces&fit=crop&w=500&h=500&q=85';

export async function fetchApprovedProfessionals(): Promise<Professional[]> {
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
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((item: any) => ({
    id: item.id,
    name: item.profiles?.nome ?? 'Profissional',
    photo: DEFAULT_AVATAR,
    rating: '5,00',
    jobs: 1,
    price: Number(item.valor_hora),
    tag: 'Verificada',
    distance: item.cidade,
    neighborhood: item.bairro,
    description: item.descricao_experiencia,
    skills: Array.isArray(item.servicos) ? item.servicos : [],
    availability: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
  }));
}
