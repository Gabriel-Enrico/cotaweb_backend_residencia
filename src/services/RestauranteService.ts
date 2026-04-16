import db from "../db/connection";

export interface Restaurante {
  id: number;
  nome: string;
  telefone: string;
  email: string | null;
  cnpj: string | null;
  responsavel: string | null;
  status: "degustacao" | "ativo" | "suspenso" | "cancelado";
  degustacao_inicio: Date | null;
  degustacao_fim: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateRestauranteDTO {
  nome: string;
  telefone: string;
  email?: string;
  cnpj?: string;
  responsavel?: string;
}

export interface UpdateRestauranteDTO extends Partial<CreateRestauranteDTO> {
  status?: Restaurante["status"];
}

export class RestauranteService {
  async listar(): Promise<Restaurante[]> {
    return db("restaurantes").orderBy("created_at", "desc");
  }

  async buscarPorId(id: number): Promise<Restaurante | null> {
    const r = await db("restaurantes").where({ id }).first();
    return r || null;
  }

  async criar(dto: CreateRestauranteDTO): Promise<Restaurante> {
    const degustacao_inicio = new Date();
    const degustacao_fim = new Date();
    degustacao_fim.setDate(degustacao_fim.getDate() + 30);

    const [restaurante] = await db("restaurantes")
      .insert({
        ...dto,
        status: "degustacao",
        degustacao_inicio,
        degustacao_fim,
      })
      .returning("*");
    return restaurante;
  }

  async atualizar(id: number, dto: UpdateRestauranteDTO): Promise<Restaurante> {
    const existing = await this.buscarPorId(id);
    if (!existing) throw new Error("Restaurante não encontrado");

    const [atualizado] = await db("restaurantes")
      .where({ id })
      .update({ ...dto, updated_at: db.fn.now() })
      .returning("*");
    return atualizado;
  }

  async deletar(id: number): Promise<void> {
    const existing = await this.buscarPorId(id);
    if (!existing) throw new Error("Restaurante não encontrado");
    await db("restaurantes").where({ id }).del();
  }

  async degustacaoExpirada(id: number): Promise<boolean> {
    const r = await this.buscarPorId(id);
    if (!r || r.status !== "degustacao") return false;
    if (!r.degustacao_fim) return false;
    return new Date() > new Date(r.degustacao_fim);
  }
}