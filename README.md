# Livraria API (Node + Express) — Segurança

## Como rodar
```bash
npm install
cp .env.example .env   # troque o JWT_SECRET
npm start
```

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
