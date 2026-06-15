const ordersList = document.querySelector("#ordersList");
const ordersFeedback = document.querySelector("#ordersFeedback");
const refreshOrdersButton = document.querySelector("#refreshOrdersButton");
const statusFilter = document.querySelector("#statusFilter");
const searchFilter = document.querySelector("#searchFilter");
const adminLogoutButton = document.querySelector("#adminLogoutButton");
const ADMIN_TOKEN_STORAGE_KEY = "rafaDeliciasAdminToken";
const STATUS_OPTIONS = [
  { value: "recebido", label: "Recebido" },
  { value: "em_producao", label: "Em produção" },
  { value: "pronto", label: "Pronto" },
  { value: "entregue", label: "Entregue" },
  { value: "cancelado", label: "Cancelado" }
];
const PAYMENT_STATUS_LABELS = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  EM_PROCESSAMENTO: "Em processamento",
  RECUSADO: "Recusado",
  CANCELADO: "Cancelado",
  REEMBOLSADO: "Reembolsado",
  CONTESTADO: "Contestado"
};
let todosOsPedidos = [];

function obterTokenAdmin() {
  return localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
}

function limparSessaoAdmin() {
  localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
}

function redirecionarParaLogin() {
  window.location.href = "./login.html";
}

function tratarRespostaNaoAutorizada(response) {
  if (response.status === 401) {
    limparSessaoAdmin();
    redirecionarParaLogin();
    return true;
  }

  return false;
}

function obterHeadersAutenticados(incluirContentType = false) {
  const headers = {
    Authorization: `Bearer ${obterTokenAdmin()}`
  };

  if (incluirContentType) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

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

function formatarStatus(status) {
  const option = STATUS_OPTIONS.find((item) => item.value === status);

  return option ? option.label : status;
}

function formatarStatusPagamento(statusPagamento) {
  return PAYMENT_STATUS_LABELS[statusPagamento] || "Pendente";
}

function obterClasseStatusPagamento(statusPagamento) {
  const classes = {
    PENDENTE: "pagamento-pendente",
    APROVADO: "pagamento-aprovado",
    EM_PROCESSAMENTO: "pagamento-processamento",
    RECUSADO: "pagamento-recusado",
    CANCELADO: "pagamento-cancelado",
    REEMBOLSADO: "pagamento-reembolsado",
    CONTESTADO: "pagamento-contestado"
  };

  return classes[statusPagamento] || "pagamento-pendente";
}

function montarOpcoesStatus(statusAtual) {
  return STATUS_OPTIONS.map((option) => `
    <option value="${option.value}" ${option.value === statusAtual ? "selected" : ""}>
      ${option.label}
    </option>
  `).join("");
}

function obterPedidosFiltrados() {
  const statusSelecionado = statusFilter ? statusFilter.value : "todos";
  const termoBusca = searchFilter ? searchFilter.value.trim().toLowerCase() : "";

  return todosOsPedidos.filter((pedido) => {
    const correspondeStatus = statusSelecionado === "todos" || pedido.status === statusSelecionado;

    if (!correspondeStatus) {
      return false;
    }

    if (!termoBusca) {
      return true;
    }

    const camposBusca = [
      String(pedido.id || ""),
      pedido.nome_cliente || "",
      pedido.telefone || ""
    ].map((valor) => valor.toLowerCase());

    return camposBusca.some((valor) => valor.includes(termoBusca));
  });
}

function renderizarPedidos(pedidos) {
  if (!ordersList || !ordersFeedback) {
    return;
  }

  if (!Array.isArray(pedidos) || pedidos.length === 0) {
    const usandoFiltros = (statusFilter && statusFilter.value !== "todos")
      || (searchFilter && searchFilter.value.trim() !== "");

    ordersFeedback.textContent = usandoFiltros
      ? "Nenhum pedido encontrado para os filtros selecionados."
      : "Nenhum pedido encontrado.";
    ordersList.innerHTML = `
      <div class="orders-empty">
        <p>${usandoFiltros ? "Nenhum pedido encontrado para os filtros selecionados." : "Nenhum pedido encontrado."}</p>
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
        <div class="order-status-wrapper">
          <span class="order-status" data-status-label>${formatarStatus(pedido.status)}</span>
          <label class="status-control">
            <span>Status</span>
            <select class="status-select" data-order-id="${pedido.id}" data-previous-value="${pedido.status}">
              ${montarOpcoesStatus(pedido.status)}
            </select>
          </label>
        </div>
      </div>

      <div class="order-grid">
        <section class="order-block">
          <h4>Cliente</h4>
          <p><strong>${pedido.nome_cliente}</strong></p>
          <p class="order-meta">Telefone: ${pedido.telefone}</p>
          <p class="order-meta">Tipo: ${pedido.tipo_recebimento}</p>
          <div class="payment-status-row">
            <span class="payment-status-label">Pagamento:</span>
            <span class="payment-status-badge ${obterClasseStatusPagamento(pedido.status_pagamento)}">
              ${formatarStatusPagamento(pedido.status_pagamento)}
            </span>
          </div>
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

function aplicarFiltros() {
  renderizarPedidos(obterPedidosFiltrados());
}

async function atualizarStatusPedido(orderId, status, selectElement) {
  const response = await fetch(`/api/pedidos/${orderId}/status`, {
    method: "PATCH",
    headers: obterHeadersAutenticados(true),
    body: JSON.stringify({ status })
  });

  if (tratarRespostaNaoAutorizada(response)) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  const data = await response.json();

  if (!response.ok || !data?.sucesso) {
    throw new Error(data?.mensagem || "Não foi possível atualizar o status agora.");
  }

  const orderCard = selectElement.closest(".order-card");
  const statusLabel = orderCard ? orderCard.querySelector("[data-status-label]") : null;
  const pedidoEmMemoria = todosOsPedidos.find((pedido) => String(pedido.id) === String(orderId));

  if (statusLabel) {
    statusLabel.textContent = formatarStatus(status);
  }

  if (pedidoEmMemoria) {
    pedidoEmMemoria.status = status;
  }

  if (ordersFeedback) {
    ordersFeedback.textContent = data.mensagem;
  }

  aplicarFiltros();
}

async function carregarPedidos() {
  if (!ordersList || !ordersFeedback) {
    return;
  }

  ordersFeedback.textContent = "Carregando pedidos...";

  try {
    const response = await fetch("/api/pedidos", {
      headers: obterHeadersAutenticados()
    });

    if (tratarRespostaNaoAutorizada(response)) {
      return;
    }

    const data = await response.json();

    if (!response.ok || !data?.sucesso) {
      throw new Error(data?.mensagem || "Não foi possível carregar os pedidos agora.");
    }

    todosOsPedidos = Array.isArray(data.pedidos) ? data.pedidos : [];
    aplicarFiltros();
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

if (adminLogoutButton) {
  adminLogoutButton.addEventListener("click", () => {
    limparSessaoAdmin();
    redirecionarParaLogin();
  });
}

if (statusFilter) {
  statusFilter.addEventListener("change", () => {
    aplicarFiltros();
  });
}

if (searchFilter) {
  searchFilter.addEventListener("input", () => {
    aplicarFiltros();
  });
}

if (ordersList) {
  ordersList.addEventListener("change", async (event) => {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement) || !target.matches(".status-select")) {
      return;
    }

    const { orderId } = target.dataset;
    const previousValue = target.dataset.previousValue || target.value;

    target.disabled = true;

    try {
      await atualizarStatusPedido(orderId, target.value, target);
      target.dataset.previousValue = target.value;
    } catch (error) {
      target.value = previousValue;

      if (ordersFeedback) {
        ordersFeedback.textContent = error.message || "Não foi possível atualizar o status agora.";
      }
    } finally {
      target.disabled = false;
    }
  });
}

if (!obterTokenAdmin()) {
  redirecionarParaLogin();
} else {
  carregarPedidos();
}
