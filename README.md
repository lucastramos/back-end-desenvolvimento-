# Livraria API (Node + Express) — Segurança + Documentação OpenAPI

## Como rodar
```bash
npm install
cp .env.example .env   # troque o JWT_SECRET
npm start
```

## 📖 Documentação (OpenAPI 3.0 + Swagger UI)

| Recurso | URL |
|---|---|
| **Swagger UI** (interativo, com botão *Authorize*) | http://localhost:3000/docs |
| Alias | http://localhost:3000/api/docs |
| **Especificação OpenAPI bruta (JSON)** | http://localhost:3000/docs/api.json |
| Alias da especificação | http://localhost:3000/api-docs.json |

Gerada com **swagger-jsdoc** (anotações `@openapi` em `routes/*.js`) e servida com **swagger-ui-express**. A base da especificação (Security Scheme, schemas e respostas de erro reutilizáveis) fica em `docs/swagger.js`.

### Testando as rotas protegidas pelo navegador
1. Em `/docs`, execute **POST `/api/v1/auth/login`** (o corpo já vem com exemplos de ADMIN e USER).
2. Copie o `token` da resposta.
3. Clique em **Authorize** 🔓 e cole **apenas o token** — o prefixo `Bearer` é adicionado automaticamente.
4. Teste as rotas com cadeado. Para ver o **403**, autorize com o token do leitor e tente criar um autor ou livro.

O token continua salvo ao recarregar a página (`persistAuthorization`).

### O que está documentado em cada rota
- **Sumário e descrição** com o perfil de acesso e as regras de negócio.
- **Request body** com campos `required`, tipos (`string`, `integer`, `email`…) e exemplos realistas.
- **Respostas** de sucesso (200/201) com schema e exemplo, e de erro: 400 (validação), 401 (token ausente, expirado ou corrompido), 403 (perfil USER em rota ADMIN), 404, 409 e 500.

| Método | Rota | Perfil | Sucesso | Falhas documentadas |
|---|---|---|---|---|
| GET | `/api/v1/livros` | Público | 200 | 500 |
| GET | `/api/v1/livros/{id}` | Público | 200 | 404 |
| POST | `/api/v1/auth/register` | Público | 201 | 400, 409 |
| POST | `/api/v1/auth/login` | Público | 200 | 400, 401 |
| POST | `/api/v1/livros/{id}/comentarios` | USER ou ADMIN | 201 | 400, 401, 404 |
| POST | `/api/v1/autores` | ADMIN | 201 | 400, 401, 403 |
| POST | `/api/v1/livros` | ADMIN | 201 | 400, 401, 403, 404 |
| GET | `/api/v1/autores` | Público | 200 | 500 |

## Segurança implementada
- **BCrypt** (`bcryptjs`): senhas armazenadas só como hash (salt aleatório + work factor 12 nos novos cadastros).
- **JWT stateless** (HS256): `POST /api/v1/auth/login` emite o token; as rotas protegidas exigem `Authorization: Bearer <token>`. Segredo e expiração vêm do `.env`.
- **RBAC**: middlewares `autenticarToken` (401) e `exigirRole` (403) em `middlewares/authMiddleware.js`.

## Matriz de permissões
| Método | Rota | Acesso | Falha |
|---|---|---|---|
| GET | /api/v1/livros, /api/v1/livros/:id | Público | — |
| POST | /api/v1/auth/register | Público (sempre cria USER) | 400/409 |
| POST | /api/v1/auth/login | Público | 401 |
| POST | /api/v1/livros/:id/comentarios | USER ou ADMIN | 401 |
| POST | /api/v1/autores | Somente ADMIN | 401 / 403 |
| POST | /api/v1/livros | Somente ADMIN | 401 / 403 |

## Decisões de segurança
- `register` ignora o campo `role` do corpo: caso contrário qualquer pessoa se cadastraria como ADMIN.
- Login devolve a mesma mensagem (401) para e-mail inexistente e senha errada, e executa `bcrypt.compare` nos dois casos (evita enumeração de usuários por mensagem ou tempo de resposta).
- `jwt.verify` fixa `algorithms: ['HS256']` (bloqueia tokens `alg: none`).
- Token expirado ou inválido retorna 401; perfil insuficiente retorna 403.
- O autor do comentário vem do token, nunca do corpo da requisição.

## Credenciais de teste (seed)
| Perfil | E-mail | Senha |
|---|---|---|
| ADMIN | admin@livraria.com | admin123 |
| USER | leitor@gmail.com | leitor123 |
