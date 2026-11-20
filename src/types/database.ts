export type AccountRole = 'professional' | 'admin' | 'client';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface Profile {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  tipo_conta: AccountRole;
  created_at: string;
}

export interface Professional {
  id: string;
  descricao_experiencia: string;
  cidade: string;
  bairro: string;
  valor_hora: number;
  servicos: string[];
  status: ApprovalStatus;
  created_at: string;
}

export interface ProfessionalWithProfile extends Professional {
  profiles: Pick<Profile, 'nome' | 'email' | 'telefone'> | null;
}
