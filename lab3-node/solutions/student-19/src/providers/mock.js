export class MockProvider {
  constructor() {
    this.name = 'mock';
    this._models = ['mock-small', 'mock-large'];
    this._status = 'available';
  }

  // getModels() — возвращает список доступных моделей
  getModels() {
    return [...this._models];
  }

  // getStatus() — возвращает текущий статус провайдера
  getStatus() {
    return this._status;
  }

  // chat() — «отправляет» сообщение в LLM и возвращает ответ
  // model — имя модели (в моке не используется, но сигнатура должна совпадать)
  // message — текст от пользователя
  async chat(model, message) {
    // Валидация: сообщение должно быть непустой строкой
    if (typeof message !== 'string' || message.length === 0) {
      throw new Error('Message must be a non-empty string');
    }
    // Имитируем задержку сети 10 мс — чтобы поведение было похоже на реальное API
    await new Promise((resolve) => setTimeout(resolve, 10));
    // Возвращаем «эхо» — просто повторяем сообщение с пометкой провайдера/модели
    return `[${this.name}/${model}] Echo: ${message}`;
  }
}