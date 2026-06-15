// ==========================
// CONFIGURAÇÕES DA LOJA
// ==========================
// Ajuste nome, WhatsApp e taxa de entrega neste único objeto.
// Assim, a identidade da loja e as regras básicas do checkout podem ser alteradas futuramente em um só lugar.
const CONFIG = {
  nomeLoja: "Rafa Delícias Artesanais",
  whatsapp: "5512988970995",
  taxaEntregaPadrao: 8
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

// Elementos-base do carrinho, checkout e resumo financeiro.
const cartItemsContainer = document.querySelector("#cartItems");
const cartTotalElement = document.querySelector("#cartTotal");
const cartSubtotalElement = document.querySelector("#cartSubtotal");
const cartShippingElement = document.querySelector("#cartShipping");
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
const addressFields = document.querySelector("#addressFields");
const checkoutSubtotalElement = document.querySelector("#checkoutSubtotal");
const checkoutShippingElement = document.querySelector("#checkoutShipping");
const checkoutTotalElement = document.querySelector("#checkoutTotal");
const customerNameInput = document.querySelector("#customerName");
const customerPhoneInput = document.querySelector("#customerPhone");
const customerZipcodeInput = document.querySelector("#customerZipcode");
const customerStreetInput = document.querySelector("#customerStreet");
const customerNumberInput = document.querySelector("#customerNumber");
const customerDistrictInput = document.querySelector("#customerDistrict");
const customerComplementInput = document.querySelector("#customerComplement");
const customerReferenceInput = document.querySelector("#customerReference");
const desiredDateInput = document.querySelector("#desiredDate");
const desiredTimeInput = document.querySelector("#desiredTime");
const customerNotesInput = document.querySelector("#customerNotes");
const deliveryTypeInputs = document.querySelectorAll('input[name="deliveryType"]');

const CHAVE_CARRINHO_STORAGE = "rafaDeliciasCarrinho";

// Estrutura simples em memória. Ela segue compatível com localStorage e com as regras já existentes.
const carrinho = [];

// Formata valores monetários em Real para manter a apresentação consistente.
function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(valor);
}

function obterTipoRecebimentoSelecionado() {
  const selectedOption = Array.from(deliveryTypeInputs).find((input) => input.checked);

  return selectedOption ? selectedOption.value : "";
}

function isEntregaSelecionada() {
  return obterTipoRecebimentoSelecionado() === "entrega";
}

function calcularFrete() {
  return isEntregaSelecionada() ? Number(CONFIG.taxaEntregaPadrao || 0) : 0;
}

// Soma apenas os produtos do carrinho.
function calcularSubtotalProdutos() {
  return carrinho.reduce((total, produto) => {
    return total + produto.preco * produto.quantidade;
  }, 0);
}

function calcularTotalFinal() {
  return calcularSubtotalProdutos() + calcularFrete();
}

function formatarDataParaMensagem(data) {
  if (!data) {
    return "";
  }

  const [ano, mes, dia] = data.split("-");

  if (!ano || !mes || !dia) {
    return data;
  }

  return `${dia}/${mes}/${ano}`;
}

function obterDadosCheckout() {
  return {
    nome: customerNameInput ? customerNameInput.value.trim() : "",
    telefone: customerPhoneInput ? customerPhoneInput.value.trim() : "",
    tipoRecebimento: obterTipoRecebimentoSelecionado(),
    cep: customerZipcodeInput ? customerZipcodeInput.value.trim() : "",
    rua: customerStreetInput ? customerStreetInput.value.trim() : "",
    numero: customerNumberInput ? customerNumberInput.value.trim() : "",
    bairro: customerDistrictInput ? customerDistrictInput.value.trim() : "",
    complemento: customerComplementInput ? customerComplementInput.value.trim() : "",
    referencia: customerReferenceInput ? customerReferenceInput.value.trim() : "",
    dataDesejada: desiredDateInput ? desiredDateInput.value : "",
    horarioDesejado: desiredTimeInput ? desiredTimeInput.value : "",
    observacoes: customerNotesInput ? customerNotesInput.value.trim() : ""
  };
}

// Exibe ou oculta os campos de endereço conforme o tipo de recebimento escolhido.
function atualizarCamposEntrega() {
  if (!addressFields) {
    return;
  }

  addressFields.classList.toggle("is-hidden", !isEntregaSelecionada());
}

function validarCheckout(dadosCheckout) {
  const camposFaltando = [];

  if (!dadosCheckout.nome) {
    camposFaltando.push("nome do cliente");
  }

  if (!dadosCheckout.telefone) {
    camposFaltando.push("telefone");
  }

  if (!dadosCheckout.tipoRecebimento) {
    camposFaltando.push("tipo de recebimento");
  }

  if (!dadosCheckout.dataDesejada) {
    camposFaltando.push("data desejada");
  }

  if (!dadosCheckout.horarioDesejado) {
    camposFaltando.push("horário desejado");
  }

  if (dadosCheckout.tipoRecebimento === "entrega") {
    if (!dadosCheckout.cep) {
      camposFaltando.push("CEP");
    }

    if (!dadosCheckout.rua) {
      camposFaltando.push("rua");
    }

    if (!dadosCheckout.numero) {
      camposFaltando.push("número");
    }

    if (!dadosCheckout.bairro) {
      camposFaltando.push("bairro");
    }
  }

  return camposFaltando;
}

function montarEnderecoEntrega(dadosCheckout) {
  const linhasEndereco = [
    `CEP: ${dadosCheckout.cep}`,
    `Rua: ${dadosCheckout.rua}, ${dadosCheckout.numero}`,
    `Bairro: ${dadosCheckout.bairro}`
  ];

  if (dadosCheckout.complemento) {
    linhasEndereco.push(`Complemento: ${dadosCheckout.complemento}`);
  }

  if (dadosCheckout.referencia) {
    linhasEndereco.push(`Ponto de referência: ${dadosCheckout.referencia}`);
  }

  return linhasEndereco.join("\n");
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
  const minimoFinal = Number(button.dataset.minimo || 0);

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
// A nova etapa de checkout complementa o pedido com dados do cliente, entrega ou retirada e observações.
function enviarPedidoParaWhatsApp() {
  if (carrinho.length === 0) {
    alert("Adicione pelo menos um produto antes de finalizar o pedido.");
    return;
  }

  const dadosCheckout = obterDadosCheckout();
  const camposFaltando = validarCheckout(dadosCheckout);

  if (camposFaltando.length > 0) {
    alert(`Preencha os campos obrigatórios antes de finalizar o pedido: ${camposFaltando.join(", ")}.`);
    return;
  }

  const subtotalProdutos = calcularSubtotalProdutos();
  const frete = calcularFrete();
  const totalPedido = calcularTotalFinal();
  const listaProdutos = montarLinhasPedido();
  const recebimento = dadosCheckout.tipoRecebimento === "entrega" ? "Entrega" : "Retirada";
  const enderecoEntrega = dadosCheckout.tipoRecebimento === "entrega"
    ? `\n\nEndereço de entrega:\n${montarEnderecoEntrega(dadosCheckout)}`
    : "";
  const observacoes = dadosCheckout.observacoes
    ? `\nObservações: ${dadosCheckout.observacoes}`
    : "";
  const mensagem = `Olá! Vim pelo site da ${CONFIG.nomeLoja} e gostaria de fazer um pedido:\n\nNome: ${dadosCheckout.nome}\nTelefone: ${dadosCheckout.telefone}\nTipo de recebimento: ${recebimento}${enderecoEntrega}\n\nData desejada: ${formatarDataParaMensagem(dadosCheckout.dataDesejada)}\nHorário desejado: ${dadosCheckout.horarioDesejado}${observacoes}\n\nItens do pedido:\n${listaProdutos}\n\nSubtotal dos produtos: ${formatarMoeda(subtotalProdutos)}\nFrete: ${formatarMoeda(frete)}\nTotal final: ${formatarMoeda(totalPedido)}\n\nGostaria de confirmar a disponibilidade e combinar a ${dadosCheckout.tipoRecebimento === "entrega" ? "entrega" : "retirada"}.\n\n---\n\nPedido realizado pelo site da ${CONFIG.nomeLoja}.`;
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
// O resumo também é recalculado quando o cliente alterna entre entrega e retirada.
function atualizarCarrinho() {
  if (!cartItemsContainer || !cartTotalElement || !cartCountElement || !cartBadgeElement || !summaryCountElement) {
    return;
  }

  const totalItens = calcularQuantidadeItens();
  const subtotalProdutos = calcularSubtotalProdutos();
  const frete = calcularFrete();
  const totalPedido = calcularTotalFinal();

  cartCountElement.textContent = String(totalItens);
  cartBadgeElement.textContent = `${totalItens} ${totalItens === 1 ? "item" : "itens"}`;
  summaryCountElement.textContent = String(totalItens);

  if (cartSubtotalElement) {
    cartSubtotalElement.textContent = formatarMoeda(subtotalProdutos);
  }

  if (cartShippingElement) {
    cartShippingElement.textContent = formatarMoeda(frete);
  }

  cartTotalElement.textContent = formatarMoeda(totalPedido);

  if (checkoutSubtotalElement) {
    checkoutSubtotalElement.textContent = formatarMoeda(subtotalProdutos);
  }

  if (checkoutShippingElement) {
    checkoutShippingElement.textContent = formatarMoeda(frete);
  }

  if (checkoutTotalElement) {
    checkoutTotalElement.textContent = formatarMoeda(totalPedido);
  }

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

deliveryTypeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    atualizarCamposEntrega();
    atualizarCarrinho();
  });
});

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

// Renderização inicial do estado do carrinho e do checkout.
carregarCarrinho();
atualizarCamposEntrega();
atualizarCarrinho();
alternarBotaoTopo();
