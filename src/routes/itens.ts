import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ItemService } from "../services/ItemService";
import { validate } from "../utils/validate";

const svc = new ItemService();

const idParam = z.object({ id: z.coerce.number().int().positive() });
const restauranteParam = z.object({ restauranteId: z.coerce.number().int().positive() });

const createSchema = z.object({
  restaurante_id: z.number().int().positive(),
  departamento_id: z.number().int().positive().optional(),
  produto: z.string().min(1).max(100).trim(),
  unidade: z.string().min(1).max(30).trim().default("un"),
  quantidade: z.number().min(0).default(0), 
});

const updateSchema = z.object({
  departamento_id: z.number().int().positive().nullable().optional(),
  produto: z.string().min(1).max(100).trim().optional(),
  unidade: z.string().min(1).max(30).trim().optional(),
  quantidade: z.number().min(0).optional(),
});

export async function itemRoutes(app: FastifyInstance) {
  // GET /restaurantes/:restauranteId/itens
  app.get<{ Params: { restauranteId: string } }>(
    "/restaurantes/:restauranteId/itens",
    async (req, reply) => {
      const params = validate(restauranteParam, req.params, reply);
      if (!params) return;
      return reply.send(await svc.listarPorRestaurante(params.restauranteId));
    }
  );

  // GET /itens/:id
  app.get<{ Params: { id: string } }>("/itens/:id", async (req, reply) => {
    const params = validate(idParam, req.params, reply);
    if (!params) return;
    const item = await svc.buscarPorId(params.id);
    if (!item) return reply.status(404).send({ error: "Item não encontrado" });
    return reply.send(item);
  });

  // POST /itens
  app.post("/itens", async (req, reply) => {
    const body = validate(createSchema, req.body, reply);
    if (!body) return;
    return reply.status(201).send(await svc.criar(body));
  });

  // PUT /itens/:id
  app.put<{ Params: { id: string } }>("/itens/:id", async (req, reply) => {
    const params = validate(idParam, req.params, reply);
    if (!params) return;
    const body = validate(updateSchema, req.body, reply);
    if (!body) return;
    try {
      return reply.send(await svc.atualizar(params.id, body));
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });

  // DELETE /itens/:id
  app.delete<{ Params: { id: string } }>("/itens/:id", async (req, reply) => {
    const params = validate(idParam, req.params, reply);
    if (!params) return;
    try {
      await svc.deletar(params.id);
      return reply.status(204).send();
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });
}