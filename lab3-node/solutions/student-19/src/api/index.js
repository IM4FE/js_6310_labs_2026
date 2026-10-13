import express from 'express';

// createApi() — создаёт Express-приложение
// providers — реестр провайдеров
export function createApi(providers) {
  const app = express();
  
  // Middleware: парсит JSON из тела запроса
  // limit: '1mb' — защита от слишком больших запросов
  app.use(express.json({ limit: '1mb' }));

  // === GET /api/providers ===
  // Возвращает список всех провайдеров с их моделями и статусами
  app.get('/api/providers', (_req, res) => {
    // _req — объект запроса (нам не нужен, подчёркивание — соглашение)
    // res — объект ответа
    const list = providers.list().map((p) => ({
      name: p.name,
      models: p.getModels(),
      status: p.getStatus()
    }));
    res.json({ providers: list }); // отправляем JSON-ответ
  });

  // === POST /api/chat ===
  // Принимает { provider, model, message }, возвращает { reply, provider, model }
  app.post('/api/chat', async (req, res) => {
    try {
      const body = req.body || {};
      const { provider, model, message } = body;

      // === Валидация входных данных ===
      // Если что-то не так — возвращаем 400 Bad Request с описанием ошибки
      if (typeof provider !== 'string' || provider.length === 0) {
        return res.status(400).json({ error: 'provider is required and must be a string' });
      }
      if (typeof model !== 'string' || model.length === 0) {
        return res.status(400).json({ error: 'model is required and must be a string' });
      }
      if (typeof message !== 'string' || message.length === 0) {
        return res.status(400).json({ error: 'message is required and must be a string' });
      }

      // Отправляем запрос в провайдер
      const reply = await providers.chat(provider, model, message);
      res.json({ reply, provider, model });
    } catch (err) {
      // Если провайдер не найден — 404, если другое — 500
      const status = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
      res.status(status).json({ error: err.message });
    }
  });

  // === Обработчик для всех неизвестных маршрутов ===
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // === Глобальный обработчик ошибок Express ===
  // Ловит любые необработанные ошибки, чтобы сервер не упал
  app.use((err, _req, res, _next) => {
    console.error('API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}