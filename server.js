const express = require('express');
const { PORT } = require('./config/env');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const livroRoutes = require('./routes/livroRoutes');
const autorRoutes = require('./routes/autorRoutes');
const errorHandler = require('./middlewares/errorMiddleware');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');

const app = express();

app.use(cors());
app.use(express.json());

// Documentação OpenAPI 3.0
// - Especificação bruta (JSON): /docs/api.json (alias: /api-docs.json)
// - Interface interativa Swagger UI com botão "Authorize": /docs (alias: /api/docs)
const servirSpec = (req, res) => res.json(swaggerSpec);
app.get('/docs/api.json', servirSpec);
app.get('/api-docs.json', servirSpec);

const swaggerUiOptions = {
  customSiteTitle: 'Livraria API — Documentação',
  swaggerOptions: {
    persistAuthorization: true,   // mantém o token após recarregar a página
    displayRequestDuration: true,
    tryItOutEnabled: true
  }
};
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
app.get('/api/docs', (req, res) => res.redirect('/docs'));
app.get('/', (req, res) => res.redirect('/docs'));

// Agrupamento Semântico de Rotas (RESTful /api/v1)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/livros', livroRoutes);
app.use('/api/v1/autores', autorRoutes);

// Middleware Global de Tratamento de Erros
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Livraria API rodando em http://localhost:${PORT}`);
  console.log(`Documentação (Swagger UI): http://localhost:${PORT}/docs`);
});