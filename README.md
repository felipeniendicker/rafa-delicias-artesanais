# Rafa Delícias Artesanais

Mini sistema de pedidos online para confeitaria artesanal, com carrinho, checkout, integração com WhatsApp, backend Node/Express, PostgreSQL, painel administrativo e preparação para pagamento online com Mercado Pago.

## Funcionalidades

- Catálogo online de produtos artesanais
- Carrinho de compras com persistência em `localStorage`
- Checkout com entrega ou retirada
- Finalização pelo WhatsApp
- Salvamento de pedidos no PostgreSQL
- Painel administrativo em `/admin.html`
- Atualização de status do pedido
- Exibição de status de pagamento
- Preparação para pagamento online com Mercado Pago

## Tecnologias

- HTML5
- CSS3
- JavaScript
- Node.js
- Express
- PostgreSQL
- Mercado Pago
- Railway

## Como executar

Agora o projeto roda como aplicação unificada em Node/Express.

Instalação:

```bash
npm install
```

Execução:

```bash
npm start
```

Acesso local:

- Loja: `http://localhost:3000`
- Painel: `http://localhost:3000/admin.html`
- API Health: `http://localhost:3000/api/health`

## Estrutura do projeto

```text
/
├── .gitignore
├── 404.html
├── admin.css
├── admin.html
├── admin.js
├── backend/
│   ├── controllers/
│   ├── database/
│   ├── routes/
│   ├── services/
│   ├── .env.example
│   └── server.js
├── imagens/
├── index.html
├── package.json
├── pagamento-falha.html
├── pagamento-pendente.html
├── pagamento-sucesso.html
├── README.md
├── script.js
└── style.css
```

## Variáveis de ambiente

As variáveis devem ser configuradas no arquivo `.env` local e também no painel do Railway, sem expor valores reais no repositório.

Variáveis necessárias:

- `DATABASE_URL`
- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_PUBLIC_KEY`
- `APP_BASE_URL`

Exemplo de responsabilidade de cada uma:

- `DATABASE_URL`: conexão com o PostgreSQL
- `MERCADO_PAGO_ACCESS_TOKEN`: token secreto usado no backend
- `MERCADO_PAGO_PUBLIC_KEY`: chave pública para etapas futuras do front-end
- `APP_BASE_URL`: domínio base da aplicação, usado em retornos e integrações

## API e rotas principais

- `/` abre a loja
- `/admin.html` abre o painel administrativo
- `/api/health` verifica se a API está online
- `/api/...` concentra as rotas do backend

## Deploy no Railway

O deploy agora é unificado: loja, painel e API rodam no mesmo serviço Node/Express.

Configuração recomendada:

1. Conectar o repositório ao Railway.
2. Usar a raiz do projeto como `Root Directory`.
3. Garantir que o Railway execute:

```bash
npm start
```

4. Configurar no painel do Railway:
   - `DATABASE_URL`
   - `MERCADO_PAGO_ACCESS_TOKEN`
   - `MERCADO_PAGO_PUBLIC_KEY`
   - `APP_BASE_URL`

Após o deploy:

- o mesmo domínio servirá a loja
- o mesmo domínio servirá o painel administrativo
- o mesmo domínio servirá a API

## Observações

- O fluxo de WhatsApp continua como alternativa de finalização.
- O painel administrativo ainda não possui autenticação.
- O webhook do Mercado Pago já está preparado e pode evoluir nas próximas etapas.
- Não exponha tokens reais no código nem em commits.
