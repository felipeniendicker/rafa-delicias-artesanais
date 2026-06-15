const jwt = require("jsonwebtoken");

function autenticarAdmin(request, response, next) {
  const authorizationHeader = request.headers.authorization;
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return response.status(500).json({
      sucesso: false,
      mensagem: "Configuração de autenticação incompleta no servidor."
    });
  }

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return response.status(401).json({
      sucesso: false,
      mensagem: "Acesso não autorizado."
    });
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();

  if (!token) {
    return response.status(401).json({
      sucesso: false,
      mensagem: "Acesso não autorizado."
    });
  }

  try {
    // O middleware valida a assinatura e a expiração do JWT antes de liberar a rota administrativa.
    const payload = jwt.verify(token, jwtSecret);
    request.admin = payload;
    return next();
  } catch (error) {
    return response.status(401).json({
      sucesso: false,
      mensagem: "Acesso não autorizado."
    });
  }
}

module.exports = {
  autenticarAdmin
};
