const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

// Autenticação: valida o JWT enviado em "Authorization: Bearer <token>".
function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const [esquema, token] = authHeader ? authHeader.split(' ') : [];

  if (!token || esquema.toLowerCase() !== 'bearer') {
    return res.status(401).json({ erro: "Token de autenticação não fornecido." });
  }

  try {
    // Fixa o algoritmo para impedir ataques de troca de algoritmo (ex.: alg "none").
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.usuario = { id: Number(payload.sub), nome: payload.nome, role: payload.role };
    next();
  } catch (err) {
    const mensagem = err.name === 'TokenExpiredError'
      ? "Token expirado. Faça login novamente."
      : "Token inválido.";
    return res.status(401).json({ erro: mensagem });
  }
}

// Autorização (RBAC): aceita um ou mais perfis permitidos. Deve vir depois de autenticarToken.
function exigirRole(...rolesPermitidas) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ erro: "Autenticação necessária." });
    }
    if (!rolesPermitidas.includes(req.usuario.role)) {
      return res.status(403).json({ erro: `Acesso proibido: privilégio de ${rolesPermitidas.join(' ou ')} exigido.` });
    }
    next();
  };
}

module.exports = { autenticarToken, exigirRole };
