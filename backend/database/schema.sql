CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  nome_cliente VARCHAR(120) NOT NULL,
  telefone VARCHAR(30) NOT NULL,
  tipo_recebimento VARCHAR(20) NOT NULL,
  cep VARCHAR(20),
  rua VARCHAR(160),
  numero VARCHAR(30),
  bairro VARCHAR(100),
  complemento VARCHAR(160),
  referencia VARCHAR(160),
  data_desejada DATE NOT NULL,
  horario_desejado VARCHAR(20) NOT NULL,
  observacoes TEXT,
  subtotal NUMERIC(10,2) NOT NULL,
  frete NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  status VARCHAR(30) DEFAULT 'recebido',
  status_pagamento VARCHAR(30) DEFAULT 'PENDENTE',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pedido_itens (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_nome VARCHAR(160) NOT NULL,
  quantidade INTEGER NOT NULL,
  preco_unitario NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL
);
