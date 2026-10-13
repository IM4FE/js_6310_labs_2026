import 'dotenv/config';
import { createBot } from './bot/index.js';
import { createApi } from './api/index.js';
import { ProviderRegistry } from './providers/index.js';
import { MockProvider } from './providers/mock.js';
import { OpenAIProvider } from './providers/openai.js';
import { PersistentFSM } from './state/index.js';
import { mkdirSync, existsSync } from 'node:fs';

// === 1. Создаём «реестр провайдеров» ===
// Это как «телефонная книга» всех доступных LLM-провайдеров
// Сюда мы будем добавлять провайдеров, а потом спрашивать: «а кто у тебя есть?»
const registry = new ProviderRegistry();

// === 2. Добавляем мок-провайдера (он всегда доступен, для тестов) ===
// Мок — это «имитация» настоящего провайдера, просто возвращает эхо
registry.register(new MockProvider());

// === 3. Если в .env указан ключ OpenAI — добавляем и настоящий провайдер ===
if (process.env.OPENAI_API_KEY) {
  registry.register(new OpenAIProvider(process.env.OPENAI_API_KEY));
}

// === 4. Создаём папку data/ для хранения состояний пользователей ===
// Сюда будет писаться JSON-файл с состояниями (бонусная фича — персистентность)
if (!existsSync('./data')) {
  mkdirSync('./data', { recursive: true });
}

// === 5. Создаём FSM (конечный автомат) с сохранением в файл ===
// FSM хранит: «какой пользователь сейчас выбирает провайдера, а какой — пишет сообщение»
const fsm = new PersistentFSM('./data/state.json');

// === 6. Запускаем Telegram-бота, если указан токен ===
const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (botToken && botToken !== 'your_telegram_bot_token_here') {
  // createBot — функция, которая создаёт и настраивает бота
  const bot = createBot(botToken, fsm, registry);
  // launch() — запускает подключение к Telegram
  bot.launch().then(() => console.log('Telegram bot started'));
  // Если приложение останавливают (Ctrl+C) — корректно закрываем бота
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
} else {
  // Если токена нет — работаем только через API
  console.log('TELEGRAM_BOT_TOKEN not set — running in API-only mode');
}

// === 7. Запускаем HTTP API на порту из .env (или 3000 по умолчанию) ===
const PORT = Number(process.env.PORT) || 3000;
const api = createApi(registry);
api.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});