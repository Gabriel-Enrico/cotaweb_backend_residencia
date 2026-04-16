import db from "../db/connection";
import type {
  Cobranca,
  CreateCobrancaDTO,
  UpdateCobrancaDTO,
  FiltroCobrancas,
  PaginatedResponse,
} from "../types";
import { ContratoService } from "./ContratoService";

const contratoService = new ContratoService();

export class CobrancaService {
  async listar(filtros: FiltroCobrancas): Promise<PaginatedResponse<Cobranca>> {
    const page = filtros.page || 1;
    const limit = filtros.limit || 20;
    const offset = (page - 1) * limit;

    const query = db("cobrancas")
      .join("clientes", "cobrancas.cliente_id", "clientes.id")
      .join("contratos", "cobrancas.contrato_id", "contratos.id")
      .select(
        "cobrancas.*",
        "clientes.nome as cliente_nome",
        "clientes.telefone as cliente_telefone",
        "contratos.numero_contrato",
        "contratos.plano"
      )
      .orderBy("cobrancas.data_vencimento", "asc");

    if (filtros.cliente_id) query.where("cobrancas.cliente_id", filtros.cliente_id);
    if (filtros.contrato_id) query.where("cobrancas.contrato_id", filtros.contrato_id);
    if (filtros.status) query.where("cobrancas.status", filtros.status);
    if (filtros.data_inicio) query.where("cobrancas.data_vencimento", ">=", filtros.data_inicio);
    if (filtros.data_fim) query.where("cobrancas.data_vencimento", "<=", filtros.data_fim);

    const [{ count }] = await query.clone().count("cobrancas.id as count");
    const total = Number(count);
    const data = await query.limit(limit).offset(offset);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async buscarPorId(id: number) {
    const cobranca = await db("cobrancas")
      .join("clientes", "cobrancas.cliente_id", "clientes.id")
      .join("contratos", "cobrancas.contrato_id", "contratos.id")
      .select("cobrancas.*", "clientes.nome as cliente_nome", "contratos.numero_contrato")
      .where("cobrancas.id", id)
      .first();

    return cobranca || null;
  }

  async criar(dto: CreateCobrancaDTO): Promise<Cobranca> {
    const contrato = await db("contratos").where("id", dto.contrato_id).first();
    if (!contrato) throw new Error("Contrato não encontrado");

    const [cobranca] = await db("cobrancas")
      .insert({ ...dto, status: "pendente" })
      .returning("*");

    await contratoService.recalcularDivida(dto.contrato_id);

    return cobranca;
  }

  async registrarPagamento(id: number, dto: UpdateCobrancaDTO): Promise<Cobranca> {
    const cobranca = await db("cobrancas").where({ id }).first();
    if (!cobranca) throw new Error("Cobrança não encontrada");

    const dados: Partial<Cobranca> = { ...dto };

    // Se está marcando como pago, garante data
    if (dto.status === "pago" && !dto.data_pagamento) {
      dados.data_pagamento = new Date().toISOString().split("T")[0];
    }
    if (dto.status === "pago" && !dto.valor_pago) {
      dados.valor_pago = cobranca.valor;
    }

    const [atualizada] = await db("cobrancas")
      .where({ id })
      .update({ ...dados, updated_at: db.fn.now() })
      .returning("*");

    // Atualiza dívida do contrato
    await contratoService.recalcularDivida(cobranca.contrato_id);

    // Se todas as cobranças foram pagas, atualiza status do cliente
    if (dto.status === "pago") {
      await this.atualizarStatusClienteSeNecessario(cobranca.cliente_id);
    }

    return atualizada;
  }

  // Verifica se ainda há cobranças em aberto para o cliente
  private async atualizarStatusClienteSeNecessario(clienteId: number) {
    const abertas = await db("cobrancas")
      .where("cliente_id", clienteId)
      .whereIn("status", ["vencido", "negociando"])
      .count("id as total")
      .first();

    if (Number(abertas?.total) === 0) {
      await db("clientes").where("id", clienteId).update({
        status: "ativo",
        updated_at: db.fn.now(),
      });
    }
  }

  // Dashboard: resumo financeiro
  async resumoFinanceiro() {
    const [totais] = await db("cobrancas").select(
      db.raw("SUM(CASE WHEN status = 'pago' THEN valor_pago ELSE 0 END) as total_recebido"),
      db.raw("SUM(CASE WHEN status IN ('vencido','pendente','negociando') THEN valor ELSE 0 END) as total_em_aberto"),
      db.raw("COUNT(CASE WHEN status = 'vencido' THEN 1 END) as qtd_vencidas"),
      db.raw("COUNT(CASE WHEN status = 'pendente' THEN 1 END) as qtd_pendentes"),
      db.raw("COUNT(CASE WHEN status = 'pago' THEN 1 END) as qtd_pagas")
    );

    return {
      totalRecebido: Number(totais.total_recebido) || 0,
      totalEmAberto: Number(totais.total_em_aberto) || 0,
      qtdVencidas: Number(totais.qtd_vencidas) || 0,
      qtdPendentes: Number(totais.qtd_pendentes) || 0,
      qtdPagas: Number(totais.qtd_pagas) || 0,
    };
  }
}
