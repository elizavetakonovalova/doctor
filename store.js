/* Учебные материалы лежат в KabinetContent.
   Локальное хранилище пока не подменяет курс. */
const Store = (() => {
  function load() {
    const data = window.KabinetContent || { notes: [], cards: [], questions: [], tickets: [] };
    return {
      notes: data.notes || [],
      cards: data.cards || [],
      questions: data.questions || [],
      tickets: data.tickets || [],
    };
  }

  return { load };
})();
