import db from "../db/connection";
import type {
  Cliente,
  CreateClienteDTO,
  UpdateClienteDTO,
  FiltroClientes,
  PaginatedResponse,
} from "../types";

export class ClienteService {
  // Listar com filtros e paginação
  async listar(filtros: FiltroClientes): Promise<PaginatedResponse<Cliente>> {
    const page = filtros.page || 1;
    const limit = filtros.limit || 20;
    const offset = (page - 1) * limit;

    const query = db("clientes");

    if (filtros.status) query.where("status", filtros.status);
    if (filtros.cpf) query.where("cpf", filtros.cpf);
    if (filtros.nome) query.whereILike("nome", `%${filtros.nome}%`);

    const [{ count }] = await query.clone().count("id as count");
    const total = Number(count);

    const data = await query
      .orderBy("created_at", "desc")
      .limit(limit)
      .offset(offset);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Buscar por ID
  async buscarPorId(id: number): Promise<Cliente | null> {
    const cliente = await db("clientes").where({ id }).first();
    return cliente || null;
  }

  // Criar
  async criar(dto: CreateClienteDTO): Promise<Cliente> {
    const existente = await db("clientes").where("cpf", dto.cpf).first();
    if (existente) {
      throw new Error(`CPF ${dto.cpf} já cadastrado`);
    }

    const [cliente] = await db("clientes")
      .insert({
        nome: dto.nome,
        telefone: dto.telefone,
        email: dto.email || null,
        cpf: dto.cpf,
        status: dto.status || "novo",
      })
      .returning("*");

    return cliente;
  }

  // Atualizar 
  async atualizar(id: number, dto: UpdateClienteDTO): Promise<Cliente> {
    const cliente = await this.buscarPorId(id);
    if (!cliente) throw new Error("Cliente não encontrado");

    if (dto.cpf && dto.cpf !== cliente.cpf) {
      const existente = await db("clientes").where("cpf", dto.cpf).first();
      if (existente) throw new Error(`CPF ${dto.cpf} já pertence a outro cliente`);
    }

    const [atualizado] = await db("clientes")
      .where({ id })
      .update({ ...dto, updated_at: db.fn.now() })
      .returning("*");

    return atualizado;
  }

  // Deletar
  async deletar(id: number): Promise<void> {
    const cliente = await this.buscarPorId(id);
    if (!cliente) throw new Error("Cliente não encontrado");

    await db("clientes").where({ id }).del();
  }

  // Resumo de inadimplentes
  async resumoInadimplentes() {
    const resultado = await db("clientes")
      .join("contratos", "clientes.id", "contratos.cliente_id")
      .where("clientes.status", "inadimplente")
      .select(
        "clientes.id",
        "clientes.nome",
        "clientes.telefone",
        "clientes.cpf",
        "contratos.numero_contrato",
        "contratos.valor_divida",
        "contratos.plano"
      )
      .orderBy("contratos.valor_divida", "desc");

    const totalDivida = resultado.reduce(
      (acc, r) => acc + Number(r.valor_divida),
      0
    );

    return { clientes: resultado, totalDivida, quantidade: resultado.length };
  }
}
