const express = require("express");
const pool = require("../database/db");

const router = express.Router();

router.get("/health", (request, response) => {
  response.json({
    status: "online",
    projeto: "Rafa Delícias Artesanais API"
  });
});

// Esta rota faz uma consulta simples ao PostgreSQL para validar se a conexão está funcionando.
// Ela não cria tabelas, não altera dados e não interfere nas próximas etapas do sistema.
router.get("/teste-banco", async (request, response) => {
  try {
    const resultado = await pool.query("SELECT NOW();");

    response.json({
      sucesso: true,
      mensagem: "Conexão com PostgreSQL funcionando.",
      horarioBanco: resultado.rows[0].now
    });
  } catch (error) {
    response.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível conectar ao PostgreSQL no momento."
    });
  }
});

module.exports = router;
