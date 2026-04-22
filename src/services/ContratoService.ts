import db from "../db/connection";
import type {
  Contrato,
  CreateContratoDTO,
  UpdateContratoDTO,
  PaginatedResponse,
} from "../types";

export class ContratoService {
  async listarPorCliente(clienteId: number): Promise<Contrato[]> {
    return db("contratos")
      .where("cliente_id", clienteId)
      .orderBy("created_at", "desc");
  }

  async listar(page = 1, limit = 20): Promise<PaginatedResponse<Contrato>> {
    const offset = (page - 1) * limit;

    const [{ count }] = await db("contratos")
      .join("clientes", "contratos.cliente_id", "clientes.id")
      .count("contratos.id as count");
    const total = Number(count);

    const data = await db("contratos")
      .join("clientes", "contratos.cliente_id", "clientes.id")
      .select("contratos.*", "clientes.nome as cliente_nome", "clientes.cpf as cliente_cpf")
      .orderBy("contratos.created_at", "desc")
      .limit(limit)
      .offset(offset);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async buscarPorId(id: number) {
    const contrato = await db("contratos")
      .join("clientes", "contratos.cliente_id", "clientes.id")
      .select("contratos.*", "clientes.nome as cliente_nome", "clientes.telefone as cliente_telefone")
      .where("contratos.id", id)
      .first();

    return contrato || null;
  }

  async criar(dto: CreateContratoDTO): Promise<Contrato> {
    const cliente = await db("clientes").where("id", dto.cliente_id).first();
    if (!cliente) throw new Error("Cliente não encontrado");

    const existente = await db("contratos")
      .where("numero_contrato", dto.numero_contrato)
      .first();
    if (existente) throw new Error(`Número de contrato ${dto.numero_contrato} já existe`);

    const [contrato] = await db("contratos")
      .insert({
        ...dto,
        valor_divida: 0,
        status: "ativo",
      })
      .returning("*");

    return contrato;
  }

  async atualizar(id: number, dto: UpdateContratoDTO): Promise<Contrato> {
    const contrato = await db("contratos").where({ id }).first();
    if (!contrato) throw new Error("Contrato não encontrado");

    const [atualizado] = await db("contratos")
      .where({ id })
      .update({ ...dto, updated_at: db.fn.now() })
      .returning("*");

    return atualizado;
  }

  // Recalcula a dívida somando cobranças em aberto
  async recalcularDivida(contratoId: number): Promise<number> {
    const [{ total }] = await db("cobrancas")
      .where("contrato_id", contratoId)
      .whereIn("status", ["vencido", "pendente", "negociando"])
      .sum("valor as total");

    const divida = Number(total) || 0;

    await db("contratos")
      .where("id", contratoId)
      .update({ valor_divida: divida, updated_at: db.fn.now() });

    return divida;
  }
}