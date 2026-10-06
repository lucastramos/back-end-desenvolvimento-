const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const repository = require('../repositories/LivrariaRepository');
const { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_ROUNDS } = require('../config/env');

// Hash descartável usado para gastar o mesmo tempo de CPU quando o e-mail não existe,
// evitando que o tempo de resposta revele quais e-mails estão cadastrados.
const HASH_FALSO = bcrypt.hashSync('senha-descartavel', BCRYPT_ROUNDS);

const normalizarEmail = (email) => String(email).trim().toLowerCase();

class AuthService {
  async registrar({ nome, email, senha }) {
    if (!nome || !email || !senha) {
      throw { status: 400, message: "Campos obrigatórios ausentes: nome, email ou senha." };
    }
    if (String(senha).length < 6) {
      throw { status: 400, message: "A senha deve ter no mínimo 6 caracteres." };
    }

    const emailNormalizado = normalizarEmail(email);

    if (repository.buscarUsuarioPorEmail(emailNormalizado)) {
      throw { status: 409, message: "E-mail já cadastrado no sistema." };
    }

    // BCrypt: gera salt aleatório e aplica o work factor configurado.
    const senha_hash = await bcrypt.hash(String(senha), BCRYPT_ROUNDS);

    // O perfil NUNCA vem do corpo da requisição: cadastro público sempre cria USER
    // (aceitar "role" do cliente permitiria a qualquer um se autoproclamar ADMIN).
    const novoUsuario = repository.salvarUsuario({
      nome: String(nome).trim(),
      email: emailNormalizado,
      senha_hash,
      role: "USER"
    });

    const { senha_hash: _, ...usuarioRetorno } = novoUsuario;
    return usuarioRetorno;
  }

  async login({ email, senha }) {
    if (!email || !senha) {
      throw { status: 400, message: "E-mail e senha são obrigatórios." };
    }

    const usuario = repository.buscarUsuarioPorEmail(normalizarEmail(email));

    // Sempre executa bcrypt.compare e devolve a mesma mensagem para e-mail ou senha incorretos.
    const senhaConfere = await bcrypt.compare(String(senha), usuario ? usuario.senha_hash : HASH_FALSO);
    if (!usuario || !senhaConfere) {
      throw { status: 401, message: "Credenciais inválidas." };
    }

    const token = jwt.sign(
      { nome: usuario.nome, role: usuario.role },
      JWT_SECRET,
      { algorithm: 'HS256', subject: String(usuario.id), expiresIn: JWT_EXPIRES_IN }
    );

    return {
      usuario: { id: usuario.id, nome: usuario.nome, role: usuario.role },
      token
    };
  }
}

module.exports = new AuthService();
