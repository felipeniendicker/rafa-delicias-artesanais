const { MercadoPagoConfig, Preference } = require("mercadopago");

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
const baseUrl = (process.env.APP_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const successUrl = `${baseUrl}/pagamento-sucesso.html`;
const failureUrl = `${baseUrl}/pagamento-falha.html`;
const pendingUrl = `${baseUrl}/pagamento-pendente.html`;

// O client só é criado quando o token existir.
// Isso mantém a aplicação segura e evita tentar usar o SDK com configuração incompleta.
const mercadoPagoClient = accessToken
  ? new MercadoPagoConfig({ accessToken })
  : null;

function validarConfiguracaoMercadoPago() {
  if (!accessToken) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");
  }
}

async function criarPreferenciaPagamento(pedido) {
  validarConfiguracaoMercadoPago();

  if (!mercadoPagoClient) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");
  }

  const preference = new Preference(mercadoPagoClient);
  const itensMercadoPago = (pedido.itens || []).map((item) => ({
    title: item.produto_nome,
    quantity: Number(item.quantidade),
    currency_id: "BRL",
    unit_price: Number(item.preco_unitario)
  }));

  const preferenceResponse = await preference.create({
    body: {
      items: itensMercadoPago,
      external_reference: String(pedido.id),
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl
      },
      // notification_url: `${baseUrl}/api/pagamentos/webhook`,
      // auto_return foi removido temporariamente para evitar incompatibilidade durante os testes locais.
    }
  });

  return {
    sucesso: true,
    preferenceId: preferenceResponse.id,
    initPoint: preferenceResponse.init_point
  };
}

module.exports = {
  mercadoPagoClient,
  validarConfiguracaoMercadoPago,
  criarPreferenciaPagamento
};
