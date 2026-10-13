const { neon } = require('@neondatabase/serverless');

let client;

// Conexão com o Neon. A DATABASE_URL só existe no servidor (nunca vai para o navegador).
function sql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não configurada');
  }
  if (!client) client = neon(process.env.DATABASE_URL);
  return client;
}

module.exports = { sql };
