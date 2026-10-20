const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const { PORT } = require('../config/env');

/**
 * Definição base da OpenAPI 3.0.
 * Os caminhos (paths) de cada rota são lidos das anotações @openapi em routes/*.js;
 * aqui ficam as informações gerais, o Security Scheme (Bearer JWT) e os
 * componentes reutilizáveis (schemas e respostas de erro).
 */
const definition = {
  openapi: '3.0.3',
  info: {
    title: 'Livraria API',
    version: '2.0.0',
    description: [
      'API REST de **livros**, **autores** e **comentários**, protegida com **BCrypt + JWT (stateless) + RBAC**.',
      '',
      '## 🔐 Como testar as rotas protegidas',
      '1. Execute `POST /api/v1/auth/login` com um dos usuários de teste abaixo.',
      '2. Copie o valor de `token` da resposta.',
      '3. Clique no botão **Authorize** 🔓 e cole **apenas o token** (o prefixo `Bearer` é adicionado automaticamente).',
      '4. As rotas com cadeado passam a enviar `Authorization: Bearer <token>`.',
      '',
      '| Perfil | E-mail | Senha |',
      '|---|---|---|',
      '| ADMIN | `admin@livraria.com` | `admin123` |',
      '| USER | `leitor@gmail.com` | `leitor123` |',
      '',
      '> Para ver o **403 Forbidden**, autorize com o token do USER e tente criar um autor ou livro.',
      '',
      '## 👥 Matriz de permissões',
      '| Método | Rota | Perfil |',
      '|---|---|---|',
      '| GET | `/api/v1/livros` | 🌐 Público |',
      '| GET | `/api/v1/livros/{id}` | 🌐 Público |',
      '| POST | `/api/v1/auth/register` | 🌐 Público |',
      '| POST | `/api/v1/auth/login` | 🌐 Público |',
      '| POST | `/api/v1/livros/{id}/comentarios` | 🔑 USER ou ADMIN |',
      '| POST | `/api/v1/autores` | 🔒 ADMIN |',
      '| POST | `/api/v1/livros` | 🔒 ADMIN |',
      '',
      'Todos os erros seguem o formato `{ "erro": "mensagem" }`.'
    ].join('\n'),
    contact: { name: 'Lucas Tomaz Ramos' }
  },
  servers: [{ url: `http://localhost:${PORT}`, description: 'Ambiente local' }],
  tags: [
    { name: 'Autenticação', description: 'Cadastro de usuários e emissão de token JWT.' },
    { name: 'Livros', description: 'Consulta pública, cadastro (ADMIN) e comentários (autenticado).' },
    { name: 'Autores', description: 'Consulta pública e cadastro (ADMIN).' }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token obtido em `POST /api/v1/auth/login`. Cole somente o token, sem o prefixo `Bearer`.'
      }
    },

    schemas: {
      // ---------- Erros ----------
      Erro: {
        type: 'object',
        required: ['erro'],
        properties: { erro: { type: 'string', description: 'Mensagem legível do erro.' } },
        example: { erro: 'Mensagem descrevendo o problema.' }
      },

      // ---------- Autenticação ----------
      RegistroRequest: {
        type: 'object',
        required: ['nome', 'email', 'senha'],
        properties: {
          nome: { type: 'string', minLength: 1, description: 'Nome do usuário.', example: 'Maria Silva' },
          email: { type: 'string', format: 'email', description: 'E-mail único (usado como login).', example: 'maria.silva@email.com' },
          senha: { type: 'string', format: 'password', minLength: 6, description: 'Mínimo de 6 caracteres. Armazenada como hash BCrypt.', example: 'Senha@123' }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'senha'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@livraria.com' },
          senha: { type: 'string', format: 'password', example: 'admin123' }
        }
      },
      Usuario: {
        type: 'object',
        required: ['id', 'nome', 'email', 'role'],
        properties: {
          id: { type: 'integer', example: 1760920800000 },
          nome: { type: 'string', example: 'Maria Silva' },
          email: { type: 'string', format: 'email', example: 'maria.silva@email.com' },
          role: { type: 'string', enum: ['ADMIN', 'USER'], description: 'Perfil de acesso (RBAC).', example: 'USER' }
        }
      },
      LoginResponse: {
        type: 'object',
        required: ['usuario', 'token'],
        properties: {
          usuario: {
            type: 'object',
            required: ['id', 'nome', 'role'],
            properties: {
              id: { type: 'integer', example: 1 },
              nome: { type: 'string', example: 'Admin' },
              role: { type: 'string', enum: ['ADMIN', 'USER'], example: 'ADMIN' }
            }
          },
          token: {
            type: 'string',
            description: 'JWT (HS256) a ser enviado em `Authorization: Bearer <token>`. Expira conforme `JWT_EXPIRES_IN` (padrão 1h).',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub21lIjoiQWRtaW4iLCJyb2xlIjoiQURNSU4iLCJzdWIiOiIxIn0.assinatura'
          }
        }
      },

      // ---------- Autores ----------
      AutorRequest: {
        type: 'object',
        required: ['nome'],
        properties: {
          nome: { type: 'string', minLength: 1, description: 'Nome do autor.', example: 'Clarice Lispector' },
          nacionalidade: { type: 'string', description: 'Opcional. Padrão: "Não informada".', example: 'Brasileira' }
        }
      },
      Autor: {
        type: 'object',
        required: ['id', 'nome', 'nacionalidade'],
        properties: {
          id: { type: 'integer', example: 1 },
          nome: { type: 'string', example: 'Machado de Assis' },
          nacionalidade: { type: 'string', example: 'Brasileiro' }
        }
      },

      // ---------- Comentários ----------
      ComentarioRequest: {
        type: 'object',
        required: ['texto'],
        properties: {
          texto: { type: 'string', minLength: 1, description: 'Conteúdo do comentário (não pode ser vazio).', example: 'A dúvida sobre Capitu me acompanhou até a última página.' }
        }
      },
      Comentario: {
        type: 'object',
        required: ['id', 'autor_nome', 'texto'],
        properties: {
          id: { type: 'integer', example: 1760921000000 },
          autor_nome: { type: 'string', description: 'Nome de quem comentou (extraído do token JWT).', example: 'Leitor' },
          texto: { type: 'string', example: 'A dúvida sobre Capitu me acompanhou até a última página.' }
        }
      },

      // ---------- Livros ----------
      LivroRequest: {
        type: 'object',
        required: ['titulo', 'autor_id'],
        properties: {
          titulo: { type: 'string', minLength: 1, description: 'Título do livro.', example: 'Memórias Póstumas de Brás Cubas' },
          ano: { type: 'integer', description: 'Opcional. Padrão: ano atual.', example: 1881 },
          autor_id: { type: 'integer', description: 'ID de um autor já cadastrado.', example: 1 }
        }
      },
      LivroCriado: {
        type: 'object',
        required: ['id', 'titulo', 'ano', 'autor_id', 'comentarios'],
        properties: {
          id: { type: 'integer', example: 1760921500000 },
          titulo: { type: 'string', example: 'Memórias Póstumas de Brás Cubas' },
          ano: { type: 'integer', example: 1881 },
          autor_id: { type: 'integer', example: 1 },
          comentarios: { type: 'array', items: { $ref: '#/components/schemas/Comentario' }, example: [] }
        }
      },
      Livro: {
        type: 'object',
        required: ['id', 'titulo', 'ano', 'autor_id', 'autor_nome', 'comentarios'],
        properties: {
          id: { type: 'integer', example: 1 },
          titulo: { type: 'string', example: 'Dom Casmurro' },
          ano: { type: 'integer', example: 1899 },
          autor_id: { type: 'integer', example: 1 },
          autor_nome: { type: 'string', example: 'Machado de Assis' },
          comentarios: {
            type: 'array',
            items: { $ref: '#/components/schemas/Comentario' },
            example: [{ id: 1, autor_nome: 'Leitor', texto: 'Clássico indispensável.' }]
          }
        }
      }
    },

    // ---------- Respostas de erro reutilizáveis ----------
    responses: {
      BadRequest: {
        description: 'Falha de validação — campo obrigatório ausente ou inválido.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } }
      },
      Unauthorized: {
        description: 'Não autenticado — token ausente, expirado ou corrompido.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Erro' },
            examples: {
              tokenAusente: { summary: 'Token ausente', value: { erro: 'Token de autenticação não fornecido.' } },
              tokenExpirado: { summary: 'Token expirado', value: { erro: 'Token expirado. Faça login novamente.' } },
              tokenInvalido: { summary: 'Token inválido/corrompido', value: { erro: 'Token inválido.' } }
            }
          }
        }
      },
      Forbidden: {
        description: 'Acesso negado — rota exclusiva do perfil ADMIN.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Erro' },
            example: { erro: 'Acesso proibido: privilégio de ADMIN exigido.' }
          }
        }
      },
      LivroNaoEncontrado: {
        description: 'Livro não encontrado.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Erro' },
            example: { erro: 'Livro não localizado.' }
          }
        }
      },
      ErroInterno: {
        description: 'Erro interno inesperado no servidor.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Erro' },
            example: { erro: 'Ocorreu um erro interno no servidor.' }
          }
        }
      }
    }
  }
};

const swaggerSpec = swaggerJsdoc({
  definition,
  apis: [path.join(__dirname, '..', 'routes', '*.js')]
});

module.exports = swaggerSpec;
