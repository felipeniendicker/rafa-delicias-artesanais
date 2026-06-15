const ordersList = document.querySelector("#ordersList");
const ordersFeedback = document.querySelector("#ordersFeedback");
const refreshOrdersButton = document.querySelector("#refreshOrdersButton");

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(valor || 0));
}

function formatarData(data) {
  if (!data) {
    return "Não informado";
  }

  const parsedDate = new Date(data);

  if (Number.isNaN(parsedDate.getTime())) {
    return data;
  }

  return parsedDate.toLocaleDateString("pt-BR");
}

function formatarDataHora(data) {
  if (!data) {
    return "Não informado";
  }

  const parsedDate = new Date(data);

  if (Number.isNaN(parsedDate.getTime())) {
    return data;
  }

  return parsedDate.toLocaleString("pt-BR");
}

function montarEndereco(pedido) {
  const linhas = [];

  if (pedido.cep) {
    linhas.push(`CEP: ${pedido.cep}`);
  }

  if (pedido.rua || pedido.numero) {
    linhas.push(`Rua: ${pedido.rua || "-"}, ${pedido.numero || "-"}`);
  }

  if (pedido.bairro) {
    linhas.push(`Bairro: ${pedido.bairro}`);
  }

  if (pedido.complemento) {
    linhas.push(`Complemento: ${pedido.complemento}`);
  }

  if (pedido.referencia) {
    linhas.push(`Referência: ${pedido.referencia}`);
  }

  return linhas.length > 0 ? linhas.join("<br>") : "Não informado";
}

function renderizarPedidos(pedidos) {
  if (!ordersList || !ordersFeedback) {
    return;
  }

  if (!Array.isArray(pedidos) || pedidos.length === 0) {
    ordersFeedback.textContent = "Nenhum pedido encontrado.";
    ordersList.innerHTML = `
      <div class="orders-empty">
        <p>Nenhum pedido encontrado.</p>
      </div>
    `;
    return;
  }

  ordersFeedback.textContent = `${pedidos.length} ${pedidos.length === 1 ? "pedido encontrado" : "pedidos encontrados"}.`;

  ordersList.innerHTML = pedidos.map((pedido) => `
    <article class="order-card">
      <div class="order-header">
        <div>
          <h3>Pedido #${pedido.id}</h3>
          <p class="order-meta">Registrado em ${formatarDataHora(pedido.criado_em)}</p>
        </div>
        <span class="order-status">${pedido.status}</span>
      </div>

      <div class="order-grid">
        <section class="order-block">
          <h4>Cliente</h4>
          <p><strong>${pedido.nome_cliente}</strong></p>
          <p class="order-meta">Telefone: ${pedido.telefone}</p>
          <p class="order-meta">Tipo: ${pedido.tipo_recebimento}</p>
        </section>

        <section class="order-block">
          <h4>Entrega ou retirada</h4>
          <p class="order-address">${pedido.tipo_recebimento === "Entrega" ? montarEndereco(pedido) : "Retirada no local."}</p>
        </section>

        <section class="order-block">
          <h4>Data e horário</h4>
          <p class="order-meta">Data desejada: ${formatarData(pedido.data_desejada)}</p>
          <p class="order-meta">Horário desejado: ${pedido.horario_desejado}</p>
        </section>

        <section class="order-block">
          <h4>Observações</h4>
          <p class="order-notes">${pedido.observacoes || "Nenhuma observação informada."}</p>
        </section>

        <section class="order-block">
          <h4>Itens</h4>
          <div class="order-items">
            ${(pedido.itens || []).map((item) => `
              <article class="order-item">
                <strong>${item.produto_nome}</strong>
                <p class="order-item-line">Quantidade: ${item.quantidade}</p>
                <p class="order-item-line">Preço unitário: ${formatarMoeda(item.preco_unitario)}</p>
                <p class="order-item-line">Subtotal: ${formatarMoeda(item.subtotal)}</p>
              </article>
            `).join("")}
          </div>
        </section>

        <section class="order-block">
          <h4>Resumo financeiro</h4>
          <div class="order-totals">
            <div class="order-total-line">
              <span>Subtotal</span>
              <strong>${formatarMoeda(pedido.subtotal)}</strong>
            </div>
            <div class="order-total-line">
              <span>Frete</span>
              <strong>${formatarMoeda(pedido.frete)}</strong>
            </div>
            <div class="order-total-line">
              <span>Total</span>
              <strong>${formatarMoeda(pedido.total)}</strong>
            </div>
          </div>
        </section>
      </div>
    </article>
  `).join("");
}

async function carregarPedidos() {
  if (!ordersList || !ordersFeedback) {
    return;
  }

  ordersFeedback.textContent = "Carregando pedidos...";

  try {
    const response = await fetch("/api/pedidos");
    const data = await response.json();

    if (!response.ok || !data?.sucesso) {
      throw new Error(data?.mensagem || "Não foi possível carregar os pedidos agora.");
    }

    renderizarPedidos(data.pedidos);
  } catch (error) {
    ordersFeedback.textContent = "Não foi possível carregar os pedidos agora.";
    ordersList.innerHTML = `
      <div class="orders-error">
        <p>Não foi possível carregar os pedidos agora.</p>
      </div>
    `;
  }
}

if (refreshOrdersButton) {
  refreshOrdersButton.addEventListener("click", () => {
    carregarPedidos();
  });
}

carregarPedidos();
