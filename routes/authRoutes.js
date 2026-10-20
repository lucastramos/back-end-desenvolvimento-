const { Router } = require('express');
const controller = require('../controllers/AuthController');

const router = Router();

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Autenticação]
 *     summary: Cadastrar novo usuário
 *     description: |
 *       **Acesso:** 🌐 Público
 *
 *       Cria uma conta de leitor. Regras:
 *       - Todo cadastro por esta rota recebe o perfil **USER**; o campo `role` enviado no corpo é ignorado.
 *       - O e-mail é normalizado (minúsculas) e deve ser único — duplicidade retorna **409**.
 *       - A senha é armazenada somente como **hash BCrypt** e nunca é devolvida.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegistroRequest'
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Falha de validação dos dados enviados.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             examples:
 *               camposAusentes:
 *                 summary: Campo obrigatório ausente
 *                 value: { erro: "Campos obrigatórios ausentes: nome, email ou senha." }
 *               senhaCurta:
 *                 summary: Senha muito curta
 *                 value: { erro: "A senha deve ter no mínimo 6 caracteres." }
 *       409:
 *         description: E-mail já cadastrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example: { erro: "E-mail já cadastrado no sistema." }
 */
router.post('/register', (req, res, next) => controller.register(req, res, next));

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Autenticação]
 *     summary: Autenticar e obter token JWT
 *     description: |
 *       **Acesso:** 🌐 Público
 *
 *       Valida as credenciais e devolve um **token JWT** (HS256, stateless).
 *       E-mail inexistente e senha errada recebem a mesma resposta **401** (evita enumeração de usuários).
 *
 *       **Depois do login:** copie o `token`, clique em **Authorize** 🔓 e cole-o para liberar as rotas protegidas.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             admin:
 *               summary: Administrador (ADMIN)
 *               value: { email: "admin@livraria.com", senha: "admin123" }
 *             leitor:
 *               summary: Leitor (USER)
 *               value: { email: "leitor@gmail.com", senha: "leitor123" }
 *     responses:
 *       200:
 *         description: Login realizado; token emitido.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: E-mail ou senha não informados.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example: { erro: "E-mail e senha são obrigatórios." }
 *       401:
 *         description: Credenciais inválidas.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example: { erro: "Credenciais inválidas." }
 */
router.post('/login', (req, res, next) => controller.login(req, res, next));

module.exports = router;
