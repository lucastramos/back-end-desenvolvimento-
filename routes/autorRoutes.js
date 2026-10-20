const { Router } = require('express');
const controller = require('../controllers/AutorController');
const { autenticarToken, exigirRole } = require('../middlewares/authMiddleware');

const router = Router();

/**
 * @openapi
 * /api/v1/autores:
 *   get:
 *     tags: [Autores]
 *     summary: Listar autores
 *     description: |
 *       **Acesso:** 🌐 Público
 *
 *       Retorna todos os autores cadastrados. Útil para descobrir o `autor_id` antes de cadastrar um livro.
 *     responses:
 *       200:
 *         description: Lista de autores.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Autor'
 *       500:
 *         $ref: '#/components/responses/ErroInterno'
 */
router.get('/', (req, res, next) => controller.index(req, res, next));

/**
 * @openapi
 * /api/v1/autores:
 *   post:
 *     tags: [Autores]
 *     summary: Cadastrar autor
 *     description: |
 *       **Acesso:** 🔒 Exclusivo **ADMIN**
 *
 *       Cadastra um novo autor. Se `nacionalidade` não for enviada, assume "Não informada".
 *       - Sem token, ou token expirado/corrompido → **401**.
 *       - Token válido de usuário **USER** → **403**.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AutorRequest'
 *     responses:
 *       201:
 *         description: Autor criado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Autor'
 *             example: { id: 1760921200000, nome: "Clarice Lispector", nacionalidade: "Brasileira" }
 *       400:
 *         description: Nome do autor ausente ou vazio.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 *             example: { erro: "O nome do autor é obrigatório." }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', autenticarToken, exigirRole('ADMIN'), (req, res, next) => controller.store(req, res, next));

module.exports = router;
