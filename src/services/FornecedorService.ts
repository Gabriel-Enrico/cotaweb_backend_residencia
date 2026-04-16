import db from "../db/connection";

export interface Fornecedor {
  id: number;
  restaurante_id: number;
  nome: string;
  telefone: string;
  email: string | null;
  cnpj: string | null;
  contato_nome: string | null;
  ativo: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateFornecedorDTO {
  restaurante_id: number;
  nome: string;
  telefone: string;
  email?: string;
  cnpj?: string;
  contato_nome?: string;
}

export interface UpdateFornecedorDTO {
  nome?: string;
  telefone?: string;
  email?: string;
  cnpj?: string;
  contato_nome?: string;
  ativo?: boolean;
}

export class FornecedorService {
  async listarPorRestaurante(restaurante_id: number): Promise<Fornecedor[]> {
    return db("fornecedores")
      .where({ restaurante_id })
      .orderBy("nome", "asc");
  }

  async buscarPorId(id: number): Promise<Fornecedor | null> {
    const f = await db("fornecedores").where({ id }).first();
    return f || null;
  }

  async criar(dto: CreateFornecedorDTO): Promise<Fornecedor> {
    const [fornecedor] = await db("fornecedores").insert(dto).returning("*");
    return fornecedor;
  }

  async atualizar(id: number, dto: UpdateFornecedorDTO): Promise<Fornecedor> {
    const existing = await this.buscarPorId(id);
    if (!existing) throw new Error("Fornecedor não encontrado");

    const [atualizado] = await db("fornecedores")
      .where({ id })
      .update({ ...dto, updated_at: db.fn.now() })
      .returning("*");
    return atualizado;
  }

  async deletar(id: number): Promise<void> {
    const existing = await this.buscarPorId(id);
    if (!existing) throw new Error("Fornecedor não encontrado");
    await db("fornecedores").where({ id }).del();
  }
}