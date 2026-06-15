const fs = require("fs");
const path = require("path");
const express = require("express");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const pagamentosRoutes = require("./routes/pagamentosRoutes");
const pedidosRoutes = require("./routes/pedidosRoutes");
const testeBancoRoutes = require("./routes/testeBancoRoutes");

const app = express();
const PORT = process.env.PORT || 3000;
const frontendPath = path.join(__dirname, "..");
const notFoundPagePath = path.join(frontendPath, "404.html");
const adminPagePath = path.join(frontendPath, "admin.html");

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

// Agrupa rotas da API em um prefixo único para organizar o backend desde o início.
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/pagamentos", pagamentosRoutes);
app.use("/api", testeBancoRoutes);
app.use("/api", pedidosRoutes);

// O painel passa a ter uma rota amigável própria.
// Como o JWT fica no localStorage, o servidor não consegue validar esse token neste GET.
// A proteção real dos dados continua nas rotas da API, que exigem Authorization: Bearer TOKEN.
app.get("/admin", (request, response) => {
  response.sendFile(adminPagePath);
});

// Mantém compatibilidade com acessos antigos e concentra o fluxo de entrada do painel em /admin.
app.get("/admin.html", (request, response) => {
  response.redirect("/admin");
});

// Serve os arquivos estáticos do front-end a partir da raiz do projeto.
// Isso permite publicar site e API no mesmo domínio usando um único serviço Node/Express.
app.use(express.static(frontendPath));

app.get("/", (request, response) => {
  response.sendFile(path.join(frontendPath, "index.html"));
});

// Fallback simples para páginas inexistentes fora da API.
// Se o arquivo 404.html existir, ele é servido; caso contrário, devolvemos um texto padrão.
app.use((request, response) => {
  if (request.path.startsWith("/api")) {
    return response.status(404).json({
      sucesso: false,
      mensagem: "Rota da API não encontrada."
    });
  }

  if (fs.existsSync(notFoundPagePath)) {
    return response.status(404).sendFile(notFoundPagePath);
  }

  return response.status(404).send("Página não encontrada.");
});

// Inicializa o servidor HTTP na porta definida.
app.listen(PORT, () => {
  console.log(`Servidor backend rodando em http://localhost:${PORT}`);
});
