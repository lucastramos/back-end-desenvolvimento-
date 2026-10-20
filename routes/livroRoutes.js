const { Router } = require('express');
const controller = require('../controllers/LivroController');
const { autenticarToken, exigirRole } = require('../middlewares/authMiddleware');

const router = Router();

/**
 * @openapi
 * components:
 *   parameters:
 *     LivroId:
 *       name: id
 *       in: path
 *       required: true
 *       description: Identificador numérico do livro.
 *       schema:
 *         type: integer
 *         example: 1
 */

// ---------------- Rotas Públicas ----------------

/**
 * @openapi
 * /api/v1/livros:
 *   get:
 *     tags: [Livros]
 *     summary: Listar livros
 *     description: |
 *       **Acesso:** 🌐 Público
 *
 *       Retorna todos os livros do acervo, com o nome do autor e os comentários. Não exige token.
 *     responses:
 *       200:
 *         description: Lista de livros (pode ser vazia).
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Livro'
 *       500:
 *         $ref: '#/components/responses/ErroInterno'
 */
router.get('/', (req, res, next) => controller.index(req, res, next));

/**
 * @openapi
 * /api/v1/livros/{id}:
 *   get:
 *     tags: [Livros]
 *     summary: Detalhar livro
 *     description: |
 *       **Acesso:** 🌐 Público
 *
 *       Retorna um livro pelo `id`, com o nome do autor e os comentários. Se não existir, responde **404**.
 *     parameters:
 *       - $ref: '#/components/parameters/LivroId'
 *     responses:
 *       200:
 *         description: Livro encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Livro'
 *       404:
 *         $ref: '#/components/responses/LivroNaoEncontrado'
 */
router.get('/:id', (req, res, next) => controller.show(req, res, next));

// ---------------- Rota Restrita: ADMIN ----------------

/**
 * @openapi
 * /api/v1/livros:
 *   post:
 *     tags: [Livros]
 *     summary: Cadastrar livro
 *     description: |
 *       **Acesso:** 🔒 Exclusivo **ADMIN**
 *
 *       Cadastra um livro vinculado a um autor existente. Regras:
 *       - `titulo` e `autor_id` são obrigatórios → senão **400**.
 *       - `autor_id` precisa existir → senão **404**.
 *       - Se `ano` não for enviado, assume o ano atual.
 *       - Sem token → **401**; perfil **USER** → **403**.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LivroRequest'
 *     responses:
 *       201:
 *         description: Livro criado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LivroCriado'
 *       400:
 *         description: Título ou autor_id ausente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example: { erro: "O título e o autor_id são obrigatórios." }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: O autor informado não existe.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example: { erro: "O autor informado não existe." }
 */
router.post('/', autenticarToken, exigirRole('ADMIN'), (req, res, next) => controller.store(req, res, next));

// ---------------- Rota Restrita: Usuário Autenticado ----------------

/**
 * @openapi
 * /api/v1/livros/{id}/comentarios:
 *   post:
 *     tags: [Livros]
 *     summary: Comentar livro
 *     description: |
 *       **Acesso:** 🔑 Autenticado (**USER** ou **ADMIN**)
 *
 *       Adiciona um comentário ao livro. O nome de quem comenta vem do **token JWT**, nunca do corpo.
 *       - Sem token, ou token expirado/corrompido → **401**.
 *       - Livro inexistente → **404**.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/LivroId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ComentarioRequest'
 *     responses:
 *       201:
 *         description: Comentário criado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comentario'
 *       400:
 *         description: Texto do comentário vazio.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example: { erro: "O texto do comentário não pode estar vazio." }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/LivroNaoEncontrado'
 */
router.post('/:id/comentarios', autenticarToken, (req, res, next) => controller.storeComment(req, res, next));

module.exports = router;
