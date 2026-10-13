import { readFileSync, writeFileSync } from 'node:fs';

export const STATES = Object.freeze({
  IDLE: 'IDLE',                                 // «свободен», ждёт команду
  WAITING_FOR_PROVIDER: 'WAITING_FOR_PROVIDER', // ждёт выбор провайдера (номер)
  WAITING_FOR_MODEL: 'WAITING_FOR_MODEL',       // ждёт выбор модели (номер)
  WAITING_FOR_MESSAGE: 'WAITING_FOR_MESSAGE'    // ждёт текст сообщения для LLM
});

export class FSM {
  constructor() {
    // Map: ключ = ID пользователя, значение = { state, data }
    this.states = new Map();
  }

  // getState() — возвращает текущее состояние пользователя
  // Если пользователь новый — возвращаем IDLE (начальное состояние)
  getState(userId) {
    return this.states.get(String(userId)) || { state: STATES.IDLE, data: {} };
  }

  // setState() — устанавливает новое состояние для пользователя
  // state — одно из значений STATES
  // data — дополнительные данные (например, список моделей для выбора)
  setState(userId, state, data = {}) {
    this.states.set(String(userId), { state, data });
  }

  // reset() — сбрасывает состояние пользователя в IDLE
  reset(userId) {
    this.states.delete(String(userId));
  }

  // clear() — сбрасывает состояния ВСЕХ пользователей
  clear() {
    this.states.clear();
  }
}

export class PersistentFSM extends FSM {
  // filePath — путь к файлу, куда будем писать состояния
  constructor(filePath) {
    super();
    this.filePath = filePath;
    this._load(); // при запуске читаем ранее сохранённые состояния
  }

  // _load() — читает файл и заполняет Map состояниями
  _load() {
    try {
      const raw = readFileSync(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        // Переносим данные из JSON-объекта в Map
        for (const [key, value] of Object.entries(parsed)) {
          this.states.set(key, value);
        }
      }
    } catch {
      this.states = new Map();
    }
  }

  // _save() — записывает текущие состояния в файл
  _save() {
    // Object.fromEntries превращает Map обратно в обычный объект
    const obj = Object.fromEntries(this.states);
    writeFileSync(this.filePath, JSON.stringify(obj, null, 2));
  }

  // Переопределяем методы родителя — чтобы после каждого изменения сохранять файл
  setState(userId, state, data = {}) {
    super.setState(userId, state, data); // вызываем метод родителя
    this._save();                        // и сохраняем на диск
  }

  reset(userId) {
    super.reset(userId);
    this._save();
  }

  clear() {
    super.clear();
    this._save();
  }
}