import type { FastifyInstance } from "fastify";
import { CobrancaService } from "../services/CobrancaService";
import {
  createCobrancaSchema,
  registrarPagamentoSchema,
  filtroCobrancaSchema,
  cobrancaIdParamSchema,
} from "../schemas";
import { validate } from "../utils/validate";

const cobrancaService = new CobrancaService();

export async function cobrancaRoutes(app: FastifyInstance) {
  // GET /cobrancas - listar com filtros
  app.get("/cobrancas", async (req, reply) => {
    const filtros = validate(filtroCobrancaSchema, req.query, reply);
    if (!filtros) return;

    const result = await cobrancaService.listar(filtros);
    return reply.send(result);
  });

  // GET /cobrancas/resumo - dashboard financeiro
  app.get("/cobrancas/resumo", async (_req, reply) => {
    const resumo = await cobrancaService.resumoFinanceiro();
    return reply.send(resumo);
  });

  // GET /cobrancas/:id - buscar por ID
  app.get<{ Params: { id: string } }>("/cobrancas/:id", async (req, reply) => {
    const params = validate(cobrancaIdParamSchema, req.params, reply);
    if (!params) return;

    const cobranca = await cobrancaService.buscarPorId(params.id);
    if (!cobranca) return reply.status(404).send({ error: "Cobrança não encontrada" });
    return reply.send(cobranca);
  });

  // POST /cobrancas - criar cobrança
  app.post("/cobrancas", async (req, reply) => {
    const body = validate(createCobrancaSchema, req.body, reply);
    if (!body) return;

    try {
      const cobranca = await cobrancaService.criar(body);
      return reply.status(201).send(cobranca);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // PATCH /cobrancas/:id/pagamento - registrar pagamento ou atualizar status
  app.patch<{ Params: { id: string } }>("/cobrancas/:id/pagamento", async (req, reply) => {
    const params = validate(cobrancaIdParamSchema, req.params, reply);
    if (!params) return;

    const body = validate(registrarPagamentoSchema, req.body, reply);
    if (!body) return;

    try {
      const atualizada = await cobrancaService.registrarPagamento(params.id, body);
      return reply.send(atualizada);
    } catch (err: any) {
      const status = err.message.includes("não encontrada") ? 404 : 400;
      return reply.status(status).send({ error: err.message });
    }
  });
}