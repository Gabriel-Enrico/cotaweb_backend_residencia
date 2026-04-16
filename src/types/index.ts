// Enums

export type ClienteStatus =
  | "novo"
  | "ativo"
  | "inadimplente"
  | "negociando"
  | "pago"
  | "cancelado";

export type ContratoStatus = "ativo" | "suspenso" | "cancelado";

export type CobrancaStatus =
  | "pendente"
  | "pago"
  | "vencido"
  | "negociando"
  | "cancelado";

// Entidades do banco

export interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  email: string | null;
  cpf: string;
  status: ClienteStatus;
  created_at: Date;
  updated_at: Date;
}

export interface Contrato {
  id: number;
  cliente_id: number;
  numero_contrato: string;
  valor_mensalidade: number;
  valor_divida: number;
  data_vencimento: string;
  data_inicio: string;
  data_cancelamento: string | null;
  status: ContratoStatus;
  plano: string | null;
  observacoes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Cobranca {
  id: number;
  contrato_id: number;
  cliente_id: number;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  valor_pago: number | null;
  status: CobrancaStatus;
  forma_pagamento: string | null;
  observacoes: string | null;
  created_at: Date;
  updated_at: Date;
}

// DTOs (entrada/saída)

export interface CreateClienteDTO {
  nome: string;
  telefone: string;
  email?: string;
  cpf: string;
  status?: ClienteStatus;
}

export interface UpdateClienteDTO extends Partial<CreateClienteDTO> {}

export interface CreateContratoDTO {
  cliente_id: number;
  numero_contrato: string;
  valor_mensalidade: number;
  data_vencimento: string;
  data_inicio: string;
  plano?: string;
  observacoes?: string;
}

export interface UpdateContratoDTO extends Partial<Omit<CreateContratoDTO, "cliente_id">> {
  status?: ContratoStatus;
  valor_divida?: number;
  data_cancelamento?: string;
}

export interface CreateCobrancaDTO {
  contrato_id: number;
  cliente_id: number;
  valor: number;
  data_vencimento: string;
  observacoes?: string;
}

export interface UpdateCobrancaDTO {
  status?: CobrancaStatus;
  data_pagamento?: string;
  valor_pago?: number;
  forma_pagamento?: string;
  observacoes?: string;
}

// Filtros de listagem

export interface FiltroClientes {
  status?: ClienteStatus;
  nome?: string;
  cpf?: string;
  page?: number;
  limit?: number;
}

export interface FiltroCobrancas {
  cliente_id?: number;
  contrato_id?: number;
  status?: CobrancaStatus;
  data_inicio?: string;
  data_fim?: string;
  page?: number;
  limit?: number;
}

// Respostas paginadas
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
