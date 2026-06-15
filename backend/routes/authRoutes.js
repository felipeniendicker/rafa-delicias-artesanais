const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post("/login", async (request, response) => {
  const { email, senha } = request.body || {};
  const adminEmail = process.env.ADMIN_EMAIL;
  // A senha do administrador deve ficar armazenada como hash bcrypt no .env, nunca em texto puro.
  const adminPasswordHash = process.env.ADMIN_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;

  if (!adminEmail || !adminPasswordHash || !jwtSecret) {
    return response.status(500).json({
      sucesso: false,
      mensagem: "Configuração de autenticação incompleta no servidor."
    });
  }

  if (!email || !senha) {
    return response.status(401).json({
      sucesso: false,
      mensagem: "Credenciais inválidas."
    });
  }

  if (email !== adminEmail) {
    return response.status(401).json({
      sucesso: false,
      mensagem: "Credenciais inválidas."
    });
  }

  const senhaValida = await bcrypt.compare(senha, adminPasswordHash);

  if (!senhaValida) {
    return response.status(401).json({
      sucesso: false,
      mensagem: "Credenciais inválidas."
    });
  }

  // JWT permite emitir um token assinado e temporário sem precisar salvar sessão em memória.
  // Nesta etapa o token é apenas gerado; a proteção de rotas virá em seguida.
  const token = jwt.sign(
    {
      tipo: "admin",
      email: adminEmail
    },
    jwtSecret,
    {
      expiresIn: "8h"
    }
  );

  return response.json({
    sucesso: true,
    token,
    mensagem: "Login realizado com sucesso."
  });
});

module.exports = router;
