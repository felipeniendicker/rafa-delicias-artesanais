const express = require("express");
const pool = require("../database/db");
const { criarPreferenciaPagamento, consultarPagamento } = require("../services/mercadoPagoService");

const router = express.Router();

function mapearStatusPagamento(statusMercadoPago) {
  const mapaStatus = {
    approved: "APROVADO",
    pending: "PENDENTE",
    in_process: "EM_PROCESSAMENTO",
    rejected: "RECUSADO",
    cancelled: "CANCELADO",
    refunded: "REEMBOLSADO",
    charged_back: "CONTESTADO"
  };

  return mapaStatus[statusMercadoPago] || "PENDENTE";
}

router.get("/health", (request, response) => {
  response.json({
    status: "online",
    servico: "Mercado Pago preparado"
  });
});

// Webhook é uma chamada automática feita por outro serviço para avisar eventos.
// Aqui recebemos o payment id, consultamos a API real do Mercado Pago e atualizamos o status_pagamento.
// Ainda não usamos webhook para outras automações do sistema, então o processamento segue objetivo e seguro.
router.post("/webhook", async (request, response) => {
  console.log("Webhook Mercado Pago recebido:");
  console.log(request.body);

  const paymentId = request.body?.data?.id;

  if (!paymentId) {
    console.warn("Webhook Mercado Pago sem payment id. Evento ignorado.");

    // Respondemos HTTP 200 mesmo sem processar para evitar reenvios desnecessários do provedor.
    return response.status(200).json({
      sucesso: true
    });
  }

  try {
    console.log("Payment id recebido no webhook:", paymentId);

    const pagamento = await consultarPagamento(paymentId);
    const pedidoId = Number(pagamento.external_reference);

    console.log("Status Mercado Pago recebido:", pagamento.status);

    if (!pagamento.external_reference || !Number.isInteger(pedidoId) || pedidoId <= 0) {
      console.warn("Webhook Mercado Pago sem external_reference válido. Evento não vinculado a pedido.");

      return response.status(200).json({
        sucesso: true
      });
    }

    const statusPagamento = mapearStatusPagamento(pagamento.status);
    const resultado = await pool.query(
      `
        UPDATE pedidos
        SET status_pagamento = $1
        WHERE id = $2
        RETURNING id;
      `,
      [statusPagamento, pedidoId]
    );

    if (resultado.rowCount === 0) {
      console.warn("Pedido do webhook não encontrado no banco:", pedidoId);

      return response.status(200).json({
        sucesso: true
      });
    }

    console.log("Pedido identificado no webhook:", pedidoId);
    console.log("status_pagamento aplicado:", statusPagamento);

    return response.status(200).json({
      sucesso: true
    });
  } catch (error) {
    console.error("Erro ao processar webhook Mercado Pago:", {
      message: error.message,
      status: error.status,
      cause: error.cause,
      response: error.response?.data
    });

    // Respondemos HTTP 200 para o Mercado Pago mesmo em erro interno.
    // Assim evitamos loop de reenvio enquanto a integração ainda está em evolução controlada.
    return response.status(200).json({
      sucesso: true
    });
  }
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
