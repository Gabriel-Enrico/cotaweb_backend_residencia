import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Limpa na ordem correta (respeita FK)
  await knex("cobrancas").del();
  await knex("contratos").del();
  await knex("clientes").del();

  // Insere clientes de exemplo
  const [cliente1, cliente2, cliente3] = await knex("clientes")
    .insert([
      {
        nome: "João Silva",
        telefone: "11999990001",
        email: "joao@email.com",
        cpf: "111.111.111-01",
        status: "ativo",
      },
      {
        nome: "Maria Souza",
        telefone: "11999990002",
        email: "maria@email.com",
        cpf: "222.222.222-02",
        status: "inadimplente",
      },
      {
        nome: "Carlos Oliveira",
        telefone: "11999990003",
        email: null,
        cpf: "333.333.333-03",
        status: "negociando",
      },
    ])
    .returning("id");

  // Insere contratos
  const [contrato1, contrato2, contrato3] = await knex("contratos")
    .insert([
      {
        cliente_id: cliente1.id,
        numero_contrato: "BEE-2024-001",
        valor_mensalidade: 89.9,
        valor_divida: 0,
        data_vencimento: "2025-01-10",
        data_inicio: "2024-01-10",
        status: "ativo",
        plano: "Fibra 100MB",
      },
      {
        cliente_id: cliente2.id,
        numero_contrato: "BEE-2024-002",
        valor_mensalidade: 129.9,
        valor_divida: 389.7,
        data_vencimento: "2025-01-15",
        data_inicio: "2024-01-15",
        status: "suspenso",
        plano: "Fibra 300MB",
        observacoes: "3 meses em atraso",
      },
      {
        cliente_id: cliente3.id,
        numero_contrato: "BEE-2024-003",
        valor_mensalidade: 99.9,
        valor_divida: 199.8,
        data_vencimento: "2025-01-20",
        data_inicio: "2024-01-20",
        status: "suspenso",
        plano: "Fibra 200MB",
      },
    ])
    .returning("id");

  // Insere cobranças
  await knex("cobrancas").insert([
    {
      contrato_id: contrato1.id,
      cliente_id: cliente1.id,
      valor: 89.9,
      data_vencimento: "2025-01-10",
      data_pagamento: "2025-01-08",
      valor_pago: 89.9,
      status: "pago",
      forma_pagamento: "PIX",
    },
    {
      contrato_id: contrato2.id,
      cliente_id: cliente2.id,
      valor: 129.9,
      data_vencimento: "2024-10-15",
      status: "vencido",
    },
    {
      contrato_id: contrato2.id,
      cliente_id: cliente2.id,
      valor: 129.9,
      data_vencimento: "2024-11-15",
      status: "vencido",
    },
    {
      contrato_id: contrato2.id,
      cliente_id: cliente2.id,
      valor: 129.9,
      data_vencimento: "2024-12-15",
      status: "negociando",
      observacoes: "Combinado parcelamento em 3x",
    },
    {
      contrato_id: contrato3.id,
      cliente_id: cliente3.id,
      valor: 99.9,
      data_vencimento: "2024-11-20",
      status: "vencido",
    },
    {
      contrato_id: contrato3.id,
      cliente_id: cliente3.id,
      valor: 99.9,
      data_vencimento: "2024-12-20",
      status: "vencido",
    },
  ]);
}
