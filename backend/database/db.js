const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

// O Pool gerencia várias conexões reutilizáveis com o banco.
// Isso é mais eficiente e mais profissional do que abrir uma conexão nova a cada uso.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

module.exports = pool;
