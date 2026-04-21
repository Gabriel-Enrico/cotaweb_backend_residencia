import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { CotacaoService } from "../services/CotacaoService";
import { validate } from "../utils/validate";

const svc = new CotacaoService();

const idParam = z.object({ id: z.coerce.number().int().positive() });
const restauranteParam = z.object({ restauranteId: z.coerce.number().int().positive() });
const tokenParam = z.object({ token: z.string().min(10) });

const createSchema = z.object({
  restaurante_id: z.number().int().positive(),
  titulo: z.string().max(150).optional(),
  observacoes: z.string().optional(),
  itens: z
    .array(
      z.object({
        item_id: z.number().int().positive().optional(),
        produto: z.string().min(1).max(100).trim(),
        unidade: z.string().min(1).max(30).trim(),
        quantidade: z.number().positive(),
      })
    )
    .min(1, "A cotação precisa ter ao menos 1 item"),
  fornecedor_ids: z
    .array(z.number().int().positive())
    .min(1, "A cotação precisa ter ao menos 1 fornecedor"),
});

const responderSchema = z.object({
  respostas: z.array(
    z.object({
      cotacao_item_id: z.number().int().positive(),
      preco_unitario: z.number().positive(),
      disponivel: z.boolean().optional().default(true),
      observacao: z.string().max(255).optional(),
    })
  ).min(1),
});

export async function cotacaoRoutes(app: FastifyInstance) {
  // GET /restaurantes/:restauranteId/cotacoes
  app.get<{ Params: { restauranteId: string } }>(
    "/restaurantes/:restauranteId/cotacoes",
    async (req, reply) => {
      const params = validate(restauranteParam, req.params, reply);
      if (!params) return;
      return reply.send(await svc.listarPorRestaurante(params.restauranteId));
    }
  );

  // GET /cotacoes/:id — detalhes completos com itens e fornecedores
  app.get<{ Params: { id: string } }>("/cotacoes/:id", async (req, reply) => {
    const params = validate(idParam, req.params, reply);
    if (!params) return;
    const cotacao = await svc.buscarCompleta(params.id);
    if (!cotacao) return reply.status(404).send({ error: "Cotação não encontrada" });
    return reply.send(cotacao);
  });

  // POST /cotacoes — criar cotação com itens e fornecedores
  app.post("/cotacoes", async (req, reply) => {
    const body = validate(createSchema, req.body, reply);
    if (!body) return;
    const cotacao = await svc.criar(body);
    return reply.status(201).send(cotacao);
  });

  // POST /cotacoes/:id/enviar — envia a cotação (gera os links de resposta)
  app.post<{ Params: { id: string } }>("/cotacoes/:id/enviar", async (req, reply) => {
    const params = validate(idParam, req.params, reply);
    if (!params) return;
    try {
      return reply.send(await svc.enviar(params.id));
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // POST /cotacoes/:id/finalizar
  app.post<{ Params: { id: string } }>("/cotacoes/:id/finalizar", async (req, reply) => {
    const params = validate(idParam, req.params, reply);
    if (!params) return;
    try {
      return reply.send(await svc.finalizar(params.id));
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // GET /cotacoes/:id/comparar — quadro de comparação de preços
  app.get<{ Params: { id: string } }>("/cotacoes/:id/comparar", async (req, reply) => {
    const params = validate(idParam, req.params, reply);
    if (!params) return;
    try {
      return reply.send(await svc.compararPrecos(params.id));
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });

  // ─── Rotas públicas do formulário (sem autenticação) ────────────────────────

  // GET /responder/:token — fornecedor abre o form com os itens da cotação
  app.get<{ Params: { token: string } }>("/responder/:token", async (req, reply) => {
    const params = validate(tokenParam, req.params, reply);
    if (!params) return;
    const dados = await svc.buscarPorToken(params.token);
    if (!dados) return reply.status(404).send({ error: "Link inválido ou expirado" });
    if (dados.cotacao_status !== "enviada" || dados.cf_status === "respondido") {
      return reply.status(400).send({ error: "Esta cotação não está disponível para resposta" });
    }
    return reply.send(dados);
  });

  // POST /responder/:token — fornecedor envia os preços pelo form
  app.post<{ Params: { token: string } }>("/responder/:token", async (req, reply) => {
    const params = validate(tokenParam, req.params, reply);
    if (!params) return;
    const body = validate(responderSchema, req.body, reply);
    if (!body) return;
    try {
      return reply.send(await svc.responder(params.token, body));
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
}