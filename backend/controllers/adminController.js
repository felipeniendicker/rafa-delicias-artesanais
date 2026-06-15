const pool = require("../database/db");

async function obterDashboard(request, response) {
  try {
    const dashboardQuery = `
      SELECT
        COUNT(*) FILTER (
          WHERE criado_em::date = CURRENT_DATE
        ) AS pedidos_hoje,
        COALESCE(
          SUM(total) FILTER (
            WHERE criado_em::date = CURRENT_DATE
              AND status_pagamento = 'APROVADO'
          ),
          0
        ) AS valor_vendido_hoje,
        COUNT(*) FILTER (
          WHERE status = 'recebido'
        ) AS pedidos_pendentes,
        COUNT(*) FILTER (
          WHERE status = 'em_producao'
        ) AS em_producao,
        COUNT(*) FILTER (
          WHERE status_pagamento = 'APROVADO'
        ) AS pagos,
        COUNT(*) FILTER (
          WHERE status = 'entregue'
        ) AS entregues
      FROM pedidos;
    `;

    const resultado = await pool.query(dashboardQuery);
    const resumo = resultado.rows[0] || {};

    return response.json({
      sucesso: true,
      pedidosHoje: Number(resumo.pedidos_hoje || 0),
      valorVendidoHoje: Number(resumo.valor_vendido_hoje || 0),
      pedidosPendentes: Number(resumo.pedidos_pendentes || 0),
      emProducao: Number(resumo.em_producao || 0),
      pagos: Number(resumo.pagos || 0),
      entregues: Number(resumo.entregues || 0)
    });
  } catch (error) {
    return response.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível carregar o resumo agora."
    });
  }
}

module.exports = {
  obterDashboard
};
