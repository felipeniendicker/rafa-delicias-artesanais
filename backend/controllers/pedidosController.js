const pool = require("../database/db");
const STATUS_PERMITIDOS = ["recebido", "em_producao", "pronto", "entregue", "cancelado"];

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

async function listarPedidos(request, response) {
  try {
    const pedidosQuery = `
      SELECT
        p.id,
        p.nome_cliente,
        p.telefone,
        p.tipo_recebimento,
        p.cep,
        p.rua,
        p.numero,
        p.bairro,
        p.complemento,
        p.referencia,
        p.data_desejada,
        p.horario_desejado,
        p.observacoes,
        p.subtotal,
        p.frete,
        p.total,
        p.status,
        p.status_pagamento,
        p.criado_em,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pi.id,
              'produto_nome', pi.produto_nome,
              'quantidade', pi.quantidade,
              'preco_unitario', pi.preco_unitario,
              'subtotal', pi.subtotal
            )
            ORDER BY pi.id
          ) FILTER (WHERE pi.id IS NOT NULL),
          '[]'::json
        ) AS itens
      FROM pedidos p
      LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
      GROUP BY p.id
      ORDER BY p.criado_em DESC, p.id DESC;
    `;

    const resultado = await pool.query(pedidosQuery);

    const pedidos = resultado.rows.map((pedido) => ({
      ...pedido,
      endereco: {
        cep: pedido.cep,
        rua: pedido.rua,
        numero: pedido.numero,
        bairro: pedido.bairro,
        complemento: pedido.complemento,
        referencia: pedido.referencia
      }
    }));

    return response.json({
      sucesso: true,
      pedidos
    });
  } catch (error) {
    return response.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível carregar os pedidos agora."
    });
  }
}

async function atualizarStatusPedido(request, response) {
  const pedidoId = Number(request.params.id);
  const { status } = request.body;

  if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
    return response.status(400).json({
      sucesso: false,
      mensagem: "Informe um identificador de pedido válido."
    });
  }

  if (!STATUS_PERMITIDOS.includes(status)) {
    return response.status(400).json({
      sucesso: false,
      mensagem: "Informe um status de pedido válido."
    });
  }

  try {
    const resultado = await pool.query(
      `
        UPDATE pedidos
        SET status = $1
        WHERE id = $2
        RETURNING id;
      `,
      [status, pedidoId]
    );

    if (resultado.rowCount === 0) {
      return response.status(404).json({
        sucesso: false,
        mensagem: "Pedido não encontrado."
      });
    }

    return response.json({
      sucesso: true,
      mensagem: "Status atualizado com sucesso."
    });
  } catch (error) {
    return response.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível atualizar o status do pedido agora."
    });
  }
}

module.exports = {
  criarPedido,
  listarPedidos,
  atualizarStatusPedido
};
