const pool = require("../database/db");

function isValorNumericoValido(valor) {
  return typeof valor === "number" && Number.isFinite(valor);
}

function validarItens(itens) {
  if (!Array.isArray(itens) || itens.length === 0) {
    return "O pedido precisa conter pelo menos um item.";
  }

  for (const item of itens) {
    if (!item || typeof item !== "object") {
      return "Todos os itens do pedido precisam ser válidos.";
    }

    const {
      produto_nome: produtoNome,
      quantidade,
      preco_unitario: precoUnitario,
      subtotal
    } = item;

    if (!produtoNome || typeof produtoNome !== "string") {
      return "Cada item precisa informar o nome do produto.";
    }

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      return "Cada item precisa informar uma quantidade válida.";
    }

    if (!isValorNumericoValido(precoUnitario)) {
      return "Cada item precisa informar um preço unitário válido.";
    }

    if (!isValorNumericoValido(subtotal)) {
      return "Cada item precisa informar um subtotal válido.";
    }
  }

  return null;
}

async function criarPedido(request, response) {
  const {
    nome_cliente: nomeCliente,
    telefone,
    tipo_recebimento: tipoRecebimento,
    cep,
    rua,
    numero,
    bairro,
    complemento,
    referencia,
    data_desejada: dataDesejada,
    horario_desejado: horarioDesejado,
    observacoes,
    subtotal,
    frete,
    total,
    itens
  } = request.body;

  if (!nomeCliente || !telefone || !tipoRecebimento || !dataDesejada || !horarioDesejado) {
    return response.status(400).json({
      sucesso: false,
      mensagem: "Preencha os campos obrigatórios do pedido antes de enviar."
    });
  }

  if (!isValorNumericoValido(subtotal) || !isValorNumericoValido(frete) || !isValorNumericoValido(total)) {
    return response.status(400).json({
      sucesso: false,
      mensagem: "Subtotal, frete e total precisam ser números válidos."
    });
  }

  const erroItens = validarItens(itens);

  if (erroItens) {
    return response.status(400).json({
      sucesso: false,
      mensagem: erroItens
    });
  }

  if (tipoRecebimento === "Entrega" && (!cep || !rua || !numero || !bairro)) {
    return response.status(400).json({
      sucesso: false,
      mensagem: "Para entrega, informe CEP, rua, número e bairro."
    });
  }

  const client = await pool.connect();

  try {
    // A transação garante que pedido e itens sejam salvos juntos.
    // Se qualquer parte falhar, nada fica salvo pela metade no banco.
    await client.query("BEGIN");

    const insertPedidoQuery = `
      INSERT INTO pedidos (
        nome_cliente,
        telefone,
        tipo_recebimento,
        cep,
        rua,
        numero,
        bairro,
        complemento,
        referencia,
        data_desejada,
        horario_desejado,
        observacoes,
        subtotal,
        frete,
        total
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      )
      RETURNING id;
    `;

    const pedidoResult = await client.query(insertPedidoQuery, [
      nomeCliente,
      telefone,
      tipoRecebimento,
      cep || null,
      rua || null,
      numero || null,
      bairro || null,
      complemento || null,
      referencia || null,
      dataDesejada,
      horarioDesejado,
      observacoes || null,
      subtotal,
      frete,
      total
    ]);

    const pedidoId = pedidoResult.rows[0].id;

    const insertItemQuery = `
      INSERT INTO pedido_itens (
        pedido_id,
        produto_nome,
        quantidade,
        preco_unitario,
        subtotal
      )
      VALUES ($1, $2, $3, $4, $5);
    `;

    for (const item of itens) {
      await client.query(insertItemQuery, [
        pedidoId,
        item.produto_nome,
        item.quantidade,
        item.preco_unitario,
        item.subtotal
      ]);
    }

    await client.query("COMMIT");

    return response.status(201).json({
      sucesso: true,
      pedidoId,
      mensagem: "Pedido registrado com sucesso."
    });
  } catch (error) {
    await client.query("ROLLBACK");

    return response.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível registrar o pedido no momento."
    });
  } finally {
    client.release();
  }
}

module.exports = {
  criarPedido
};
