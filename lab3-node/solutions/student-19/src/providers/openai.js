import OpenAI from 'openai';

export class OpenAIProvider {
  constructor(apiKey) {
    this.name = 'openai';
    this._client = new OpenAI({ apiKey });
    // Список моделей, которые мы разрешаем использовать
    this._models = ['gpt-4o-mini', 'gpt-4o'];
    this._status = 'available';
  }

  getModels() {
    return [...this._models];
  }

  getStatus() {
    return this._status;
  }

  // chat() — отправляет сообщение в OpenAI и возвращает ответ
  async chat(model, message) {
    if (typeof message !== 'string' || message.length === 0) {
      throw new Error('Message must be a non-empty string');
    }
    // Вызываем API OpenAI: создаём «диалог» из одного сообщения от пользователя
    const response = await this._client.chat.completions.create({
      model,                                       // какую модель использовать
      messages: [{ role: 'user', content: message }] // массив сообщений диалога
    });
    // Из ответа достаём текст первого (и единственного) ответа модели
    return response.choices[0].message.content;
  }
}