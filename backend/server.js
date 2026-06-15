const express = require("express");
const pedidosRoutes = require("./routes/pedidosRoutes");
const testeBancoRoutes = require("./routes/testeBancoRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Libera o acesso da API para o front-end durante a integração.
// Isso evita bloqueios de CORS quando site e backend estão em origens diferentes.
app.use((request, response, next) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  response.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (request.method === "OPTIONS") {
    return response.sendStatus(204);
  }

  next();
});

// Middleware para permitir que a API entenda JSON no futuro.
// Nesta etapa ainda não recebemos dados, mas essa linha já prepara a base do servidor.
app.use(express.json());

// Rota inicial de saúde da API.
// Ela serve para confirmar rapidamente se o servidor está online.
app.get("/", (request, response) => {
  response.json({
    status: "online",
    projeto: "Rafa Delícias Artesanais API"
  });
});

// Agrupa rotas da API em um prefixo único para organizar o backend desde o início.
app.use("/api", testeBancoRoutes);
app.use("/api", pedidosRoutes);

// Inicializa o servidor HTTP na porta definida.
app.listen(PORT, () => {
  console.log(`Servidor backend rodando em http://localhost:${PORT}`);
});
