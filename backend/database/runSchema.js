const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const pool = require("./db");

dotenv.config();

async function runSchema() {
  try {
    const schemaPath = path.join(__dirname, "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");

    await pool.query(schemaSql);

    console.log("Schema executado com sucesso. As tabelas foram verificadas/criadas no PostgreSQL.");
  } catch (error) {
    console.error("Erro ao executar o schema.sql no PostgreSQL.");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runSchema();
