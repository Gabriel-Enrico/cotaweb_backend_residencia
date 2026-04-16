import type { FastifyInstance } from "fastify";
import { ClienteService } from "../services/ClienteService";
import {
  createClienteSchema,
  updateClienteSchema,
  filtroClienteSchema,
  clienteIdParamSchema,
} from "../schemas";
import { validate } from "../utils/validate";

const clienteService = new ClienteService();

export async function clienteRoutes(app: FastifyInstance) {
  // GET /clientes - listar com paginação e filtros
  app.get("/clientes", async (req, reply) => {
    const filtros = validate(filtroClienteSchema, req.query, reply);
    if (!filtros) return;

    const result = await clienteService.listar(filtros);
    return reply.send(result);
  });

  // GET /clientes/inadimplentes - resumo de inadimplentes
  app.get("/clientes/inadimplentes", async (_req, reply) => {
    const result = await clienteService.resumoInadimplentes();
    return reply.send(result);
  });

  // GET /clientes/:id - buscar por ID
  app.get<{ Params: { id: string } }>("/clientes/:id", async (req, reply) => {
    const params = validate(clienteIdParamSchema, req.params, reply);
    if (!params) return;

    const cliente = await clienteService.buscarPorId(params.id);
    if (!cliente) return reply.status(404).send({ error: "Cliente não encontrado" });
    return reply.send(cliente);
  });

  // POST /clientes - criar
  app.post("/clientes", async (req, reply) => {
    const body = validate(createClienteSchema, req.body, reply);
    if (!body) return;

    try {
      const cliente = await clienteService.criar(body);
      return reply.status(201).send(cliente);
    } catch (err: any) {
      return reply.status(409).send({ error: err.message });
    }
  });

  // PUT /clientes/:id - atualizar
  app.put<{ Params: { id: string } }>("/clientes/:id", async (req, reply) => {
    const params = validate(clienteIdParamSchema, req.params, reply);
    if (!params) return;

    const body = validate(updateClienteSchema, req.body, reply);
    if (!body) return;

    try {
      const atualizado = await clienteService.atualizar(params.id, body);
      return reply.send(atualizado);
    } catch (err: any) {
      const status = err.message.includes("não encontrado") ? 404 : 409;
      return reply.status(status).send({ error: err.message });
    }
  });

  // DELETE /clientes/:id - deletar
  app.delete<{ Params: { id: string } }>("/clientes/:id", async (req, reply) => {
    const params = validate(clienteIdParamSchema, req.params, reply);
    if (!params) return;

    try {
      await clienteService.deletar(params.id);
      return reply.status(204).send();
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });
}