import { z } from "zod";

// Helpers reutilizáveis

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
const telefoneRegex = /^\d{10,11}$/;

const idParam = z.object({
  id: z.coerce.number({ invalid_type_error: "ID deve ser um número" }).int().positive("ID deve ser positivo"),
});

const paginacao = {
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100, "Limite máximo é 100").optional().default(20),
};

// Clientes

export const clienteStatusEnum = z.enum([
  "novo", "ativo", "inadimplente", "negociando", "pago", "cancelado"
]);

export const createClienteSchema = z.object({
  nome: z
    .string({ required_error: "Nome é obrigatório" })
    .min(3, "Nome deve ter ao menos 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .trim(),
  telefone: z
    .string({ required_error: "Telefone é obrigatório" })
    .regex(telefoneRegex, "Telefone deve conter apenas números (10 ou 11 dígitos, sem espaços ou traços)"),
  email: z
    .string()
    .email("E-mail inválido")
    .max(100)
    .optional()
    .or(z.literal("")),
  cpf: z
    .string({ required_error: "CPF é obrigatório" })
    .regex(cpfRegex, "CPF deve estar no formato 000.000.000-00"),
  status: clienteStatusEnum.optional().default("novo"),
});

export const updateClienteSchema = createClienteSchema.partial();

export const filtroClienteSchema = z.object({
  status: clienteStatusEnum.optional(),
  nome: z.string().optional(),
  cpf: z.string().optional(),
  ...paginacao,
});

export const clienteIdParamSchema = idParam;

// Contratos

export const contratoStatusEnum = z.enum(["ativo", "suspenso", "cancelado"]);

export const createContratoSchema = z.object({
  cliente_id: z
    .number({ required_error: "cliente_id é obrigatório" })
    .int()
    .positive("cliente_id deve ser um número positivo"),
  numero_contrato: z
    .string({ required_error: "Número do contrato é obrigatório" })
    .min(1)
    .max(50, "Número do contrato deve ter no máximo 50 caracteres")
    .trim(),
  valor_mensalidade: z
    .number({ required_error: "Valor da mensalidade é obrigatório" })
    .positive("Valor da mensalidade deve ser positivo")
    .max(99999.99, "Valor da mensalidade muito alto"),
  data_vencimento: z
    .string({ required_error: "Data de vencimento é obrigatória" })
    .regex(dataRegex, "Data de vencimento deve estar no formato YYYY-MM-DD"),
  data_inicio: z
    .string({ required_error: "Data de início é obrigatória" })
    .regex(dataRegex, "Data de início deve estar no formato YYYY-MM-DD"),
  plano: z.string().max(100).optional(),
  observacoes: z.string().max(1000).optional(),
}).refine(
  (data) => new Date(data.data_inicio) <= new Date(data.data_vencimento),
  {
    message: "Data de início não pode ser posterior à data de vencimento",
    path: ["data_inicio"],
  }
);

export const updateContratoSchema = z.object({
  numero_contrato: z.string().min(1).max(50).trim().optional(),
  valor_mensalidade: z.number().positive().max(99999.99).optional(),
  valor_divida: z.number().min(0).optional(),
  data_vencimento: z.string().regex(dataRegex, "Data deve estar no formato YYYY-MM-DD").optional(),
  data_cancelamento: z.string().regex(dataRegex, "Data deve estar no formato YYYY-MM-DD").optional(),
  status: contratoStatusEnum.optional(),
  plano: z.string().max(100).optional(),
  observacoes: z.string().max(1000).optional(),
});

export const listContratoQuerySchema = z.object({ ...paginacao });

export const contratoIdParamSchema = idParam;

export const contratoClienteParamSchema = z.object({
  clienteId: z.coerce.number().int().positive("clienteId deve ser positivo"),
});

// Cobranças

export const cobrancaStatusEnum = z.enum([
  "pendente", "pago", "vencido", "negociando", "cancelado"
]);

export const createCobrancaSchema = z.object({
  contrato_id: z
    .number({ required_error: "contrato_id é obrigatório" })
    .int()
    .positive("contrato_id deve ser positivo"),
  cliente_id: z
    .number({ required_error: "cliente_id é obrigatório" })
    .int()
    .positive("cliente_id deve ser positivo"),
  valor: z
    .number({ required_error: "Valor é obrigatório" })
    .positive("Valor deve ser positivo")
    .max(99999.99, "Valor muito alto"),
  data_vencimento: z
    .string({ required_error: "Data de vencimento é obrigatória" })
    .regex(dataRegex, "Data deve estar no formato YYYY-MM-DD"),
  observacoes: z.string().max(500).optional(),
});

export const registrarPagamentoSchema = z.object({
  status: cobrancaStatusEnum,
  data_pagamento: z
    .string()
    .regex(dataRegex, "Data deve estar no formato YYYY-MM-DD")
    .optional(),
  valor_pago: z.number().positive("Valor pago deve ser positivo").optional(),
  forma_pagamento: z
    .enum(["PIX", "boleto", "cartao", "dinheiro", "transferencia"], {
      errorMap: () => ({
        message: "Forma de pagamento deve ser: PIX, boleto, cartao, dinheiro ou transferencia",
      }),
    })
    .optional(),
  observacoes: z.string().max(500).optional(),
}).refine(
  (data) => {
    // Se status é "pago", valor_pago e forma_pagamento são recomendados mas não obrigatórios
    // (o service preenche automaticamente se não vier)
    if (data.status === "pago" && data.valor_pago !== undefined && data.valor_pago <= 0) {
      return false;
    }
    return true;
  },
  {
    message: "Valor pago deve ser maior que zero quando informado",
    path: ["valor_pago"],
  }
);

export const filtroCobrancaSchema = z.object({
  cliente_id: z.coerce.number().int().positive().optional(),
  contrato_id: z.coerce.number().int().positive().optional(),
  status: cobrancaStatusEnum.optional(),
  data_inicio: z.string().regex(dataRegex, "Data deve estar no formato YYYY-MM-DD").optional(),
  data_fim: z.string().regex(dataRegex, "Data deve estar no formato YYYY-MM-DD").optional(),
  ...paginacao,
}).refine(
  (data) => {
    if (data.data_inicio && data.data_fim) {
      return new Date(data.data_inicio) <= new Date(data.data_fim);
    }
    return true;
  },
  {
    message: "data_inicio não pode ser posterior a data_fim",
    path: ["data_inicio"],
  }
);

export const cobrancaIdParamSchema = idParam;

// Fornecedores

export const createFornecedorSchema = z.object({
  nome: z
    .string({ required_error: "Nome é obrigatório" })
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(100)
    .trim(),
  telefone: z
    .string({ required_error: "Telefone é obrigatório" })
    .regex(telefoneRegex, "Telefone deve conter apenas números (10 ou 11 dígitos, sem espaços ou traços)"),
});

export const updateFornecedorSchema = createFornecedorSchema.partial();

export const fornecedorIdParamSchema = idParam;

// Itens

export const createItemSchema = z.object({
  produto: z
    .string({ required_error: "Produto é obrigatório" })
    .min(1, "Produto deve ter ao menos 1 caractere")
    .max(100)
    .trim(),
  quantidade: z
    .number({ required_error: "Quantidade é obrigatória" })
    .positive("Quantidade deve ser positiva")
    .max(999999),
  unidade: z
    .string({ required_error: "Unidade é obrigatória" })
    .min(1)
    .max(30)
    .trim()
    .default("un"),
});

export const updateItemSchema = createItemSchema.partial();

export const itemIdParamSchema = idParam;

// Tipos inferidos (substituem os DTOs manuais do types/index.ts)

export type CreateClienteInput    = z.infer<typeof createClienteSchema>;
export type UpdateClienteInput    = z.infer<typeof updateClienteSchema>;
export type FiltroClienteInput    = z.infer<typeof filtroClienteSchema>;

export type CreateContratoInput   = z.infer<typeof createContratoSchema>;
export type UpdateContratoInput   = z.infer<typeof updateContratoSchema>;

export type CreateCobrancaInput   = z.infer<typeof createCobrancaSchema>;
export type RegistrarPagamentoInput = z.infer<typeof registrarPagamentoSchema>;
export type FiltroCobrancaInput   = z.infer<typeof filtroCobrancaSchema>;

export type CreateFornecedorInput = z.infer<typeof createFornecedorSchema>;
export type UpdateFornecedorInput = z.infer<typeof updateFornecedorSchema>;

export type CreateItemInput       = z.infer<typeof createItemSchema>;
export type UpdateItemInput       = z.infer<typeof updateItemSchema>;