import crypto from "crypto";
import db from "../db/connection";

// Interfaces

export interface Cotacao {
  id: number;
  restaurante_id: number;
  titulo: string | null;
  status: "rascunho" | "enviada" | "respondida" | "finalizada" | "cancelada";
  observacoes: string | null;
  enviada_em: Date | null;
  finalizada_em: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface CotacaoItem {
  id: number;
  cotacao_id: number;
  item_id: number | null;
  produto: string;
  unidade: string;
  quantidade: number;
}

export interface CotacaoFornecedor {
  id: number;
  cotacao_id: number;
  fornecedor_id: number;
  token_resposta: string;
  status: "aguardando" | "respondido" | "recusado";
  respondido_em: Date | null;
}

export interface CotacaoResposta {
  id: number;
  cotacao_fornecedor_id: number;
  cotacao_item_id: number;
  preco_unitario: number;
  disponivel: boolean;
  observacao: string | null;
}

// DTOs

export interface CreateCotacaoDTO {
  restaurante_id: number;
  titulo?: string;
  observacoes?: string;
  itens: Array<{
    item_id?: number;
    produto: string;
    unidade: string;
    quantidade: number;
  }>;
  fornecedor_ids: number[];
}

export interface ResponderCotacaoDTO {
  respostas: Array<{
    cotacao_item_id: number;
    preco_unitario: number;
    disponivel?: boolean;
    observacao?: string;
  }>;
}

export class CotacaoService {

  // Listar cotações do restaurante
  async listarPorRestaurante(restaurante_id: number): Promise<Cotacao[]> {
    return db("cotacoes")
      .where({ restaurante_id })
      .orderBy("created_at", "desc");
  }

  // Buscar cotação completa (com itens e fornecedores)
  async buscarCompleta(id: number) {
    const cotacao = await db("cotacoes").where({ id }).first();
    if (!cotacao) return null;

    const itens = await db("cotacao_itens").where({ cotacao_id: id });

    const fornecedores = await db("cotacao_fornecedores as cf")
      .join("fornecedores as f", "cf.fornecedor_id", "f.id")
      .where("cf.cotacao_id", id)
      .select("cf.*", "f.nome as fornecedor_nome", "f.telefone as fornecedor_telefone");

    return { ...cotacao, itens, fornecedores };
  }

  // Criar cotação (rascunho)
  async criar(dto: CreateCotacaoDTO): Promise<Cotacao> {
    return db.transaction(async (trx) => {
      const [cotacao] = await trx("cotacoes")
        .insert({
          restaurante_id: dto.restaurante_id,
          titulo: dto.titulo,
          observacoes: dto.observacoes,
          status: "rascunho",
        })
        .returning("*");

      // Insere os itens
      if (dto.itens.length > 0) {
        await trx("cotacao_itens").insert(
          dto.itens.map((item) => ({
            cotacao_id: cotacao.id,
            item_id: item.item_id ?? null,
            produto: item.produto,
            unidade: item.unidade,
            quantidade: item.quantidade,
          }))
        );
      }

      // Insere os fornecedores convidados com token único
      if (dto.fornecedor_ids.length > 0) {
        await trx("cotacao_fornecedores").insert(
          dto.fornecedor_ids.map((fornecedor_id) => ({
            cotacao_id: cotacao.id,
            fornecedor_id,
            token_resposta: crypto.randomBytes(32).toString("hex"),
            status: "aguardando",
          }))
        );
      }

      return cotacao;
    });
  }

  // Enviar cotação (muda status e registra horário)
  async enviar(id: number): Promise<Cotacao> {
    const cotacao = await db("cotacoes").where({ id }).first();
    if (!cotacao) throw new Error("Cotação não encontrada");
    if (cotacao.status !== "rascunho") throw new Error("Apenas cotações em rascunho podem ser enviadas");

    const [atualizada] = await db("cotacoes")
      .where({ id })
      .update({ status: "enviada", enviada_em: db.fn.now(), updated_at: db.fn.now() })
      .returning("*");

    return atualizada;
  }

  // Buscar cotação pelo token do fornecedor (para o form público)
  async buscarPorToken(token: string) {
    const cotacaoFornecedor = await db("cotacao_fornecedores as cf")
      .join("cotacoes as c", "cf.cotacao_id", "c.id")
      .join("fornecedores as f", "cf.fornecedor_id", "f.id")
      .join("restaurantes as r", "c.restaurante_id", "r.id")
      .where("cf.token_resposta", token)
      .select(
        "cf.id as cotacao_fornecedor_id",
        "cf.status as cf_status",
        "c.id as cotacao_id",
        "c.titulo",
        "c.status as cotacao_status",
        "c.observacoes",
        "f.nome as fornecedor_nome",
        "r.nome as restaurante_nome"
      )
      .first();

    if (!cotacaoFornecedor) return null;

    const itens = await db("cotacao_itens").where({
      cotacao_id: cotacaoFornecedor.cotacao_id,
    });

    return { ...cotacaoFornecedor, itens };
  }

  // Registrar resposta do fornecedor
  async responder(token: string, dto: ResponderCotacaoDTO) {
    const cf = await db("cotacao_fornecedores").where({ token_resposta: token }).first();
    if (!cf) throw new Error("Token inválido");
    if (cf.status === "respondido") throw new Error("Cotação já foi respondida");

    return db.transaction(async (trx) => {
      // Insere ou substitui respostas
      for (const resposta of dto.respostas) {
        await trx("cotacao_respostas")
          .insert({
            cotacao_fornecedor_id: cf.id,
            cotacao_item_id: resposta.cotacao_item_id,
            preco_unitario: resposta.preco_unitario,
            disponivel: resposta.disponivel ?? true,
            observacao: resposta.observacao ?? null,
          })
          .onConflict(["cotacao_fornecedor_id", "cotacao_item_id"])
          .merge();
      }

      // Atualiza status do fornecedor
      await trx("cotacao_fornecedores")
        .where({ id: cf.id })
        .update({ status: "respondido", respondido_em: trx.fn.now() });

      // Se todos os fornecedores responderam, muda cotação para "respondida"
      const pendentes = await trx("cotacao_fornecedores")
        .where({ cotacao_id: cf.cotacao_id, status: "aguardando" })
        .count("id as total")
        .first();

      if (Number(pendentes?.total) === 0) {
        await trx("cotacoes")
          .where({ id: cf.cotacao_id })
          .update({ status: "respondida", updated_at: trx.fn.now() });
      }

      return { sucesso: true };
    });
  }

  // Comparar preços (quadro de comparação)
  async compararPrecos(cotacao_id: number) {
    const cotacao = await db("cotacoes").where({ id: cotacao_id }).first();
    if (!cotacao) throw new Error("Cotação não encontrada");

    const itens = await db("cotacao_itens").where({ cotacao_id });

    const fornecedores = await db("cotacao_fornecedores as cf")
      .join("fornecedores as f", "cf.fornecedor_id", "f.id")
      .where("cf.cotacao_id", cotacao_id)
      .where("cf.status", "respondido")
      .select("cf.id as cotacao_fornecedor_id", "f.id as fornecedor_id", "f.nome as fornecedor_nome");

    const respostas = await db("cotacao_respostas as cr")
      .join("cotacao_fornecedores as cf", "cr.cotacao_fornecedor_id", "cf.id")
      .where("cf.cotacao_id", cotacao_id)
      .select("cr.*");

    // Monta matriz: item × fornecedor → preço
    const tabela = itens.map((item) => {
      const precos = fornecedores.map((forn) => {
        const resposta = respostas.find(
          (r) =>
            r.cotacao_fornecedor_id === forn.cotacao_fornecedor_id &&
            r.cotacao_item_id === item.id
        );
        return {
          fornecedor_id: forn.fornecedor_id,
          fornecedor_nome: forn.fornecedor_nome,
          preco_unitario: resposta?.preco_unitario ?? null,
          preco_total: resposta ? Number(resposta.preco_unitario) * Number(item.quantidade) : null,
          disponivel: resposta?.disponivel ?? false,
          observacao: resposta?.observacao ?? null,
        };
      });

      // Identifica o menor preço disponível
      const menorPreco = precos
        .filter((p) => p.disponivel && p.preco_unitario !== null)
        .sort((a, b) => (a.preco_unitario ?? 0) - (b.preco_unitario ?? 0))[0] ?? null;

      return {
        item_id: item.id,
        produto: item.produto,
        unidade: item.unidade,
        quantidade: item.quantidade,
        precos,
        menor_preco_fornecedor: menorPreco?.fornecedor_nome ?? null,
        menor_preco_unitario: menorPreco?.preco_unitario ?? null,
      };
    });

    return {
      cotacao_id,
      titulo: cotacao.titulo,
      status: cotacao.status,
      fornecedores: fornecedores.map((f) => ({
        id: f.fornecedor_id,
        nome: f.fornecedor_nome,
      })),
      tabela,
    };
  }

  // Finalizar cotação
  async finalizar(id: number): Promise<Cotacao> {
    const cotacao = await db("cotacoes").where({ id }).first();
    if (!cotacao) throw new Error("Cotação não encontrada");

    const [atualizada] = await db("cotacoes")
      .where({ id })
      .update({ status: "finalizada", finalizada_em: db.fn.now(), updated_at: db.fn.now() })
      .returning("*");

    return atualizada;
  }
}