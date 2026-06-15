const express = require("express");
const pool = require("../database/db");
const { criarPreferenciaPagamento } = require("../services/mercadoPagoService");

const router = express.Router();

router.get("/health", (request, response) => {
  response.json({
    status: "online",
    servico: "Mercado Pago preparado"
  });
});

router.post("/criar-preferencia", async (request, response) => {
  const pedidoId = Number(request.body?.pedidoId);

  if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
    return response.status(400).json({
      sucesso: false,
      mensagem: "Informe um pedidoId válido para criar a preferência."
    });
  }

  try {
    const pedidoQuery = `
      SELECT
        id,
        nome_cliente,
        telefone,
        total
      FROM pedidos
      WHERE id = $1;
    `;

    const itensQuery = `
      SELECT
        id,
        produto_nome,
        quantidade,
        preco_unitario,
        subtotal
      FROM pedido_itens
      WHERE pedido_id = $1
      ORDER BY id ASC;
    `;

    const pedidoResultado = await pool.query(pedidoQuery, [pedidoId]);

    if (pedidoResultado.rowCount === 0) {
      return response.status(404).json({
        sucesso: false,
        mensagem: "Pedido não encontrado."
      });
    }

    const itensResultado = await pool.query(itensQuery, [pedidoId]);
    const pedido = {
      ...pedidoResultado.rows[0],
      itens: itensResultado.rows
    };

    if (!pedido.itens.length) {
      return response.status(400).json({
        sucesso: false,
        mensagem: "O pedido não possui itens para gerar a preferência."
      });
    }

    const preferencia = await criarPreferenciaPagamento(pedido);

    return response.json({
      sucesso: true,
      preferenceId: preferencia.preferenceId,
      initPoint: preferencia.initPoint
    });
  } catch (error) {
    console.error("Erro ao criar preferência Mercado Pago:", {
      message: error.message,
      status: error.status,
      cause: error.cause,
      response: error.response?.data
    });

    if (error.message === "MERCADO_PAGO_ACCESS_TOKEN não configurado.") {
      return response.status(500).json({
        sucesso: false,
        mensagem: "MERCADO_PAGO_ACCESS_TOKEN está ausente. Configure a variável antes de criar a preferência."
      });
    }

    return response.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível criar a preferência de pagamento agora."
    });
  }
});

module.exports = router;
