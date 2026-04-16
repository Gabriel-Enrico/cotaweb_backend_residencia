import type { ZodSchema } from "zod";
import type { FastifyReply } from "fastify";

export function validate<T>(
  schema: ZodSchema<T>,
  data: unknown,
  reply: FastifyReply
): T | null {
  const result = schema.safeParse(data);

  if (!result.success) {
    const detalhes = result.error.errors.map((e) => ({
      campo: e.path.join(".") || "body",
      mensagem: e.message,
    }));

    reply.status(400).send({
      error: "Dados inválidos",
      detalhes,
    });

    return null;
  }

  return result.data;
}