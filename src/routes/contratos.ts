import type { FastifyInstance } from "fastify";
import { ContratoService } from "../services/ContratoService";
import {
  createContratoSchema,
  updateContratoSchema,
  listContratoQuerySchema,
  contratoIdParamSchema,
  contratoClienteParamSchema,
} from "../schemas";
import { validate } from "../utils/validate";

const contratoService = new ContratoService();

export async function contratoRoutes(app: FastifyInstance) {
  // GET /contratos - listar todos
  app.get("/contratos", async (req, reply) => {
    const query = validate(listContratoQuerySchema, req.query, reply);
    if (!query) return;

    const result = await contratoService.listar(query.page, query.limit);
    return reply.send(result);
  });

  // GET /contratos/:id - buscar por ID
  app.get<{ Params: { id: string } }>("/contratos/:id", async (req, reply) => {
    const params = validate(contratoIdParamSchema, req.params, reply);
    if (!params) return;

    const contrato = await contratoService.buscarPorId(params.id);
    if (!contrato) return reply.status(404).send({ error: "Contrato não encontrado" });
    return reply.send(contrato);
  });

  // GET /contratos/cliente/:clienteId - contratos de um cliente
  app.get<{ Params: { clienteId: string } }>(
    "/contratos/cliente/:clienteId",
    async (req, reply) => {
      const params = validate(contratoClienteParamSchema, req.params, reply);
      if (!params) return;

      const contratos = await contratoService.listarPorCliente(params.clienteId);
      return reply.send(contratos);
    }
  );

  // POST /contratos - criar
  app.post("/contratos", async (req, reply) => {
    const body = validate(createContratoSchema, req.body, reply);
    if (!body) return;

    try {
      const contrato = await contratoService.criar(body);
      return reply.status(201).send(contrato);
    } catch (err: any) {
      return reply.status(409).send({ error: err.message });
    }
  });

  // PUT /contratos/:id - atualizar
  app.put<{ Params: { id: string } }>("/contratos/:id", async (req, reply) => {
    const params = validate(contratoIdParamSchema, req.params, reply);
    if (!params) return;

    const body = validate(updateContratoSchema, req.body, reply);
    if (!body) return;

    try {
      const atualizado = await contratoService.atualizar(params.id, body);
      return reply.send(atualizado);
    } catch (err: any) {
      const status = err.message.includes("não encontrado") ? 404 : 409;
      return reply.status(status).send({ error: err.message });
    }
  });

  // POST /contratos/:id/recalcular-divida
  app.post<{ Params: { id: string } }>(
    "/contratos/:id/recalcular-divida",
    async (req, reply) => {
      const params = validate(contratoIdParamSchema, req.params, reply);
      if (!params) return;

      try {
        const divida = await contratoService.recalcularDivida(params.id);
        return reply.send({ contratoId: params.id, valorDivida: divida });
      } catch (err: any) {
        return reply.status(404).send({ error: err.message });
      }
    }
  );
}