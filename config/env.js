require('dotenv').config();
const crypto = require('crypto');

let jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET não definido. Configure a variável de ambiente antes de iniciar em produção.');
  }
  // Ambiente de desenvolvimento: gera um segredo aleatório (tokens são invalidados a cada reinício).
  jwtSecret = crypto.randomBytes(64).toString('hex');
  console.warn('[AVISO] JWT_SECRET não definido; usando segredo temporário. Copie .env.example para .env.');
}

module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS) || 12
};
