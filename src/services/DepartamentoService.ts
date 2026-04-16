import db from "../db/connection";

export interface Departamento {
  id: number;
  restaurante_id: number;
  nome: string;
  descricao: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateDepartamentoDTO {
  restaurante_id: number;
  nome: string;
  descricao?: string;
}

export interface UpdateDepartamentoDTO {
  nome?: string;
  descricao?: string;
}

export class DepartamentoService {
  async listarPorRestaurante(restaurante_id: number): Promise<Departamento[]> {
    return db("departamentos")
      .where({ restaurante_id })
      .orderBy("nome", "asc");
  }

  async buscarPorId(id: number): Promise<Departamento | null> {
    const dep = await db("departamentos").where({ id }).first();
    return dep || null;
  }

  async criar(dto: CreateDepartamentoDTO): Promise<Departamento> {
    const [dep] = await db("departamentos").insert(dto).returning("*");
    return dep;
  }

  async atualizar(id: number, dto: UpdateDepartamentoDTO): Promise<Departamento> {
    const existing = await this.buscarPorId(id);
    if (!existing) throw new Error("Departamento não encontrado");

    const [atualizado] = await db("departamentos")
      .where({ id })
      .update({ ...dto, updated_at: db.fn.now() })
      .returning("*");
    return atualizado;
  }

  async deletar(id: number): Promise<void> {
    const existing = await this.buscarPorId(id);
    if (!existing) throw new Error("Departamento não encontrado");
    await db("departamentos").where({ id }).del();
  }
}