/* Локальное хранилище каркаса.
   Коллекции пустые: заметки, карточки, вопросы, билеты.
   Позже сюда же будет записываться наполнение. */
const Store = (() => {
  const KEY = "kabinet.v1";

  const empty = () => ({
    notes: [],
    cards: [],
    questions: [],
    tickets: [],
  });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return empty();
      const data = JSON.parse(raw);
      return {
        notes: Array.isArray(data.notes) ? data.notes : [],
        cards: Array.isArray(data.cards) ? data.cards : [],
        questions: Array.isArray(data.questions) ? data.questions : [],
        tickets: Array.isArray(data.tickets) ? data.tickets : [],
      };
    } catch {
      return empty();
    }
  }

  return { load };
})();
