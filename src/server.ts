import Fastify from "fastify";
import cors from "@fastify/cors";
import { restauranteRoutes } from "./routes/restaurantes";
import { departamentoRoutes } from "./routes/departamentos";
import { fornecedorRoutes } from "./routes/fornecedores";
import { itemRoutes } from "./routes/itens";
import { cotacaoRoutes } from "./routes/cotacoes";
// Rotas legadas (gestão financeira) — manter até migração completa
import { clienteRoutes } from "./routes/clientes";
import { contratoRoutes } from "./routes/contratos";
import { cobrancaRoutes } from "./routes/cobrancas";
import { exportRoutes } from "./routes/export";

const app = Fastify({ logger: true });

async function bootstrap() {
  await app.register(cors, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // CotaWeb (núcleo do produto)
  await app.register(restauranteRoutes);
  await app.register(departamentoRoutes);
  await app.register(fornecedorRoutes);
  await app.register(itemRoutes);
  await app.register(cotacaoRoutes);

  // Legado (financeiro/cobrança)
  await app.register(clienteRoutes);
  await app.register(contratoRoutes);
  await app.register(cobrancaRoutes);
  await app.register(exportRoutes);

  // Health check
  app.get("/health", async () => ({ status: "ok", timestamp: new Date() }));

  const port = Number(process.env.PORT) || 3000;
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`🚀 CotaWeb API rodando em http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});