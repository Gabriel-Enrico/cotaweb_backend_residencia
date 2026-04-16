import db from "../db/connection";

export interface Item {
  id: number;
  restaurante_id: number;
  departamento_id: number | null;
  produto: string;
  unidade: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateItemDTO {
  restaurante_id: number;
  departamento_id?: number;
  produto: string;
  unidade?: string;
}

export interface UpdateItemDTO {
  departamento_id?: number | null;
  produto?: string;
  unidade?: string;
}

export class ItemService {
  async listarPorRestaurante(restaurante_id: number): Promise<Item[]> {
    return db("itens")
      .where("itens.restaurante_id", restaurante_id)
      .leftJoin("departamentos", "itens.departamento_id", "departamentos.id")
      .select(
        "itens.*",
        "departamentos.nome as departamento_nome"
      )
      .orderBy("departamentos.nome", "asc")
      .orderBy("itens.produto", "asc");
  }

  async buscarPorId(id: number): Promise<Item | null> {
    const item = await db("itens").where({ id }).first();
    return item || null;
  }

  async criar(dto: CreateItemDTO): Promise<Item> {
    const [item] = await db("itens").insert(dto).returning("*");
    return item;
  }

  async atualizar(id: number, dto: UpdateItemDTO): Promise<Item> {
    const existing = await this.buscarPorId(id);
    if (!existing) throw new Error("Item não encontrado");

    const [atualizado] = await db("itens")
      .where({ id })
      .update({ ...dto, updated_at: db.fn.now() })
      .returning("*");
    return atualizado;
  }

  async deletar(id: number): Promise<void> {
    const existing = await this.buscarPorId(id);
    if (!existing) throw new Error("Item não encontrado");
    await db("itens").where({ id }).del();
  }
}