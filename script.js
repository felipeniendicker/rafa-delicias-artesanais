// ==========================
// CONFIGURAÇÕES DA LOJA
// ==========================
// Ajuste nome e WhatsApp neste único objeto quando precisar atualizar a identidade da loja.
// Isso evita alterar vários pontos do código e ajuda a manter a manutenção mais segura.
const CONFIG = {
  nomeLoja: "Rafa Delícias Artesanais",
  whatsapp: "5512988970995"
};

// Faz o botão principal levar o usuário até a seção inicial do cardápio.
const menuButton = document.querySelector("#menuButton");
const categoriesSection = document.querySelector("#categorias");

if (menuButton && categoriesSection) {
  menuButton.addEventListener("click", () => {
    categoriesSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}

// Atualiza o título da aba com uma mensagem curta quando a página perde foco.
const originalTitle = document.title;

window.addEventListener("blur", () => {
  document.title = `${CONFIG.nomeLoja} | Volte para o cardápio`;
});

window.addEventListener("focus", () => {
  document.title = originalTitle;
});

// Elementos-base do carrinho para renderização e atualização do resumo.
const cartItemsContainer = document.querySelector("#cartItems");
const cartTotalElement = document.querySelector("#cartTotal");
const cartCountElement = document.querySelector("#cartCount");
const cartBadgeElement = document.querySelector("#cartBadge");
const summaryCountElement = document.querySelector("#summaryCount");
const finalizeOrderButton = document.querySelector("#finalizeOrderButton");
const clearOrderButton = document.querySelector("#clearOrderButton");
const addToCartButtons = document.querySelectorAll(".add-to-cart-button");
const floatingCartButton = document.querySelector("#floatingCartButton");
const floatingCartCount = document.querySelector("#floatingCartCount");
const backToTopButton = document.querySelector("#backToTopButton");
const cartSection = document.querySelector("#carrinho");

const CHAVE_CARRINHO_STORAGE = "rafaDeliciasCarrinho";

// Estrutura simples em memória. Mais adiante ela pode ser persistida ou integrada com outra etapa.
const carrinho = [];

// Formata valores monetários em Real para manter a apresentação consistente.
function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(valor);
}

// Localiza um produto já existente no carrinho pelo identificador único.
function encontrarProduto(id) {
  return carrinho.find((produto) => produto.id === id);
}

function obterMensagemMinimo(produto) {
  if (produto.nome.toLowerCase().includes("cupcake")) {
    return `Pedido mínimo de ${produto.minimo} unidades para cupcakes.`;
  }

  return `Pedido mínimo de ${produto.minimo} unidades para ${produto.nome}.`;
}

// Lê os dados do card clicado para manter o carrinho flexível a opções extras, como cobertura nos bolos.
function obterDadosProduto(button) {
  const productCard = button.closest(".product-card");
  const { id, nome, preco } = button.dataset;
  let nomeFinal = nome;
  let idFinal = id;
  let precoFinal = Number(preco);
  let minimoFinal = Number(button.dataset.minimo || 0);

  if (!productCard) {
    return {
      id: idFinal,
      nome: nomeFinal,
      preco: precoFinal,
      minimo: minimoFinal
    };
  }

  const optionCheckbox = productCard.querySelector(".product-option-checkbox");

  if (optionCheckbox && optionCheckbox.checked) {
    const optionLabel = optionCheckbox.dataset.optionLabel || "com cobertura";
    const optionPrice = Number(optionCheckbox.dataset.optionPrice || 0);

    nomeFinal = `${nome} (${optionLabel})`;
    idFinal = `${id}-com-cobertura`;
    precoFinal += optionPrice;
  }

  return {
    id: idFinal,
    nome: nomeFinal,
    preco: precoFinal,
    minimo: minimoFinal
  };
}

// Adiciona um produto novo ou aumenta a quantidade se ele já existir no pedido.
// Quando houver data-minimo, a primeira entrada respeita esse valor e as próximas somam de 1 em 1.
function adicionarProduto(id, nome, preco, minimo = 0) {
  const produtoExistente = encontrarProduto(id);

  if (produtoExistente) {
    produtoExistente.quantidade += 1;
  } else {
    carrinho.push({
      id,
      nome,
      preco,
      quantidade: minimo > 0 ? minimo : 1,
      minimo
    });
  }

  atualizarCarrinho();
}

// Aumenta a quantidade de um item já presente no carrinho.
function aumentarQuantidade(id) {
  const produto = encontrarProduto(id);

  if (!produto) {
    return;
  }

  produto.quantidade += 1;
  atualizarCarrinho();
}

// Diminui a quantidade e remove o item se ela chegar a zero.
function diminuirQuantidade(id) {
  const produto = encontrarProduto(id);

  if (!produto) {
    return;
  }

  // Regras comerciais com mínimo são respeitadas no próprio carrinho.
  // Assim, qualquer produto futuro com data-minimo segue o mesmo comportamento.
  if (produto.minimo && produto.quantidade <= produto.minimo) {
    alert(obterMensagemMinimo(produto));
    atualizarCarrinho();
    return;
  }

  produto.quantidade -= 1;

  if (produto.quantidade <= 0) {
    removerProduto(id);
    return;
  }

  atualizarCarrinho();
}

// Remove completamente um item do carrinho.
function removerProduto(id) {
  const indice = carrinho.findIndex((produto) => produto.id === id);

  if (indice === -1) {
    return;
  }

  carrinho.splice(indice, 1);
  atualizarCarrinho();
}

// Soma os subtotais dos itens para exibir o valor final do pedido.
function calcularTotal() {
  return carrinho.reduce((total, produto) => {
    return total + produto.preco * produto.quantidade;
  }, 0);
}

// Conta a quantidade total de unidades no pedido.
function calcularQuantidadeItens() {
  return carrinho.reduce((total, produto) => total + produto.quantidade, 0);
}

// Monta a lista textual dos produtos no formato que será enviado ao WhatsApp.
function montarLinhasPedido() {
  return carrinho.map((produto) => {
    const subtotal = produto.preco * produto.quantidade;

    return `${produto.quantidade}x ${produto.nome} - ${formatarMoeda(produto.preco)} cada - Subtotal: ${formatarMoeda(subtotal)}`;
  }).join("\n");
}

// Salva o estado atual do carrinho no navegador para manter o pedido mesmo após recarregar a página.
function salvarCarrinho() {
  try {
    localStorage.setItem(CHAVE_CARRINHO_STORAGE, JSON.stringify(carrinho));
  } catch (error) {
    // Se o armazenamento falhar, o carrinho continua funcional apenas em memória.
  }
}

// Recupera o carrinho salvo e valida os dados antes de reutilizá-los.
// Em caso de erro, dado inválido ou storage vazio, a loja segue com carrinho limpo sem quebrar a tela.
function carregarCarrinho() {
  try {
    const carrinhoSalvo = localStorage.getItem(CHAVE_CARRINHO_STORAGE);

    if (!carrinhoSalvo) {
      return;
    }

    const dados = JSON.parse(carrinhoSalvo);

    if (!Array.isArray(dados)) {
      return;
    }

    const itensValidos = dados.filter((produto) => {
      return produto
        && typeof produto.id === "string"
        && typeof produto.nome === "string"
        && typeof produto.preco === "number"
        && Number.isFinite(produto.preco)
        && typeof produto.quantidade === "number"
        && Number.isFinite(produto.quantidade)
        && produto.quantidade > 0
        && typeof produto.minimo === "number"
        && Number.isFinite(produto.minimo)
        && produto.minimo >= 0;
    });

    carrinho.splice(0, carrinho.length, ...itensValidos.map((produto) => ({
      ...produto
    })));
  } catch (error) {
    carrinho.splice(0, carrinho.length);
  }
}

function limparCarrinho() {
  carrinho.splice(0, carrinho.length);

  try {
    localStorage.removeItem(CHAVE_CARRINHO_STORAGE);
  } catch (error) {
    // A limpeza visual segue funcionando mesmo se o storage não responder.
  }

  atualizarCarrinho();
}

// Gera a mensagem completa e abre o WhatsApp com encodeURIComponent, sem limpar o carrinho.
// O número e o nome da loja são lidos do objeto CONFIG para facilitar futuras alterações.
function enviarPedidoParaWhatsApp() {
  if (carrinho.length === 0) {
    alert("Adicione pelo menos um produto antes de finalizar o pedido.");
    return;
  }

  const totalPedido = calcularTotal();
  const listaProdutos = montarLinhasPedido();
  const mensagem = `Olá! Vim pelo site da ${CONFIG.nomeLoja} e gostaria de fazer um pedido:\n\n${listaProdutos}\n\nTotal: ${formatarMoeda(totalPedido)}\n\nGostaria de confirmar a disponibilidade e combinar a entrega/retirada.\n\n---\n\nPedido realizado pelo site da ${CONFIG.nomeLoja}.`;
  const mensagemCodificada = encodeURIComponent(mensagem);
  const urlWhatsApp = `https://wa.me/${CONFIG.whatsapp}?text=${mensagemCodificada}`;

  window.open(urlWhatsApp, "_blank");
}

function alternarBotaoTopo() {
  if (!backToTopButton) {
    return;
  }

  backToTopButton.classList.toggle("is-hidden", window.scrollY < 240);
}

// Gera a interface completa do carrinho sempre que algum item é alterado.
function atualizarCarrinho() {
  if (!cartItemsContainer || !cartTotalElement || !cartCountElement || !cartBadgeElement || !summaryCountElement) {
    return;
  }

  const totalItens = calcularQuantidadeItens();
  const totalPedido = calcularTotal();

  cartCountElement.textContent = String(totalItens);
  cartBadgeElement.textContent = `${totalItens} ${totalItens === 1 ? "item" : "itens"}`;
  summaryCountElement.textContent = String(totalItens);
  cartTotalElement.textContent = formatarMoeda(totalPedido);

  if (floatingCartCount) {
    floatingCartCount.textContent = String(totalItens);
  }

  salvarCarrinho();

  if (carrinho.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="cart-empty">
        <p>Seu pedido ainda está vazio.</p>
      </div>
    `;
    return;
  }

  cartItemsContainer.innerHTML = carrinho.map((produto) => {
    const subtotal = produto.preco * produto.quantidade;

    return `
      <article class="cart-item">
        <div class="cart-item-info">
          <h4>${produto.nome}</h4>
          <p class="cart-item-unit">Preço unitário: ${formatarMoeda(produto.preco)}</p>
          <p class="cart-item-subtotal">Subtotal: ${formatarMoeda(subtotal)}</p>
          <div class="cart-item-actions">
            <button class="quantity-button" type="button" data-action="decrease" data-id="${produto.id}">
              Diminuir
            </button>
            <span class="quantity-value">${produto.quantidade}</span>
            <button class="quantity-button" type="button" data-action="increase" data-id="${produto.id}">
              Aumentar
            </button>
            <button class="remove-button" type="button" data-action="remove" data-id="${produto.id}">
              Remover item
            </button>
          </div>
        </div>
        <strong class="cart-item-price">${formatarMoeda(subtotal)}</strong>
      </article>
    `;
  }).join("");
}

// Os botões dos produtos já expõem data-id, data-nome e data-preco para futuras integrações.
addToCartButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const produto = obterDadosProduto(button);

    // O atributo data-minimo permite aplicar regras comerciais sem quebrar o restante do carrinho.
    adicionarProduto(produto.id, produto.nome, produto.preco, produto.minimo);
  });
});

// Delegação de eventos: um único listener trata aumentar, diminuir e remover itens do carrinho.
if (cartItemsContainer) {
  cartItemsContainer.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const actionButton = target.closest("button[data-action]");

    if (!actionButton) {
      return;
    }

    const { action, id } = actionButton.dataset;

    if (!id) {
      return;
    }

    if (action === "increase") {
      aumentarQuantidade(id);
    }

    if (action === "decrease") {
      diminuirQuantidade(id);
    }

    if (action === "remove") {
      removerProduto(id);
    }
  });
}

if (finalizeOrderButton) {
  finalizeOrderButton.addEventListener("click", () => {
    enviarPedidoParaWhatsApp();
  });
}

if (clearOrderButton) {
  clearOrderButton.addEventListener("click", () => {
    limparCarrinho();
  });
}

// Ações rápidas para melhorar a navegação sem alterar a lógica do pedido.
if (floatingCartButton && cartSection) {
  floatingCartButton.addEventListener("click", () => {
    cartSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}

if (backToTopButton) {
  backToTopButton.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

window.addEventListener("scroll", alternarBotaoTopo);

// Renderização inicial do estado vazio do carrinho.
carregarCarrinho();
atualizarCarrinho();
alternarBotaoTopo();
