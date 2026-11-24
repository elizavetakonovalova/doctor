/* Каталог курсов и загрузка материалов темы.
   Новый курс — папка в content/courses и строка в content/catalog.json.
   Новая тема — папка внутри курса и строка в course.json. */
const Library = (() => {
  const cache = new Map();

  function load(url) {
    if (cache.has(url)) return cache.get(url);
    const pending = fetch(url).then(async (response) => {
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(url);
      return response.json();
    });
    cache.set(url, pending);
    pending.catch(() => cache.delete(url));
    return pending;
  }

  function courseDir(courseId) {
    return `content/courses/${encodeURIComponent(courseId)}`;
  }

  function topicDir(courseId, topicId) {
    return `${courseDir(courseId)}/${encodeURIComponent(topicId)}`;
  }

  return {
    catalog() {
      return load("content/catalog.json");
    },
    course(courseId) {
      return load(`${courseDir(courseId)}/course.json`);
    },
    async materials(courseId, topicId) {
      const dir = topicDir(courseId, topicId);
      const [notes, cards, questions, tickets] = await Promise.all([
        load(`${dir}/notes.json`),
        load(`${dir}/cards.json`),
        load(`${dir}/questions.json`),
        load(`${dir}/tickets.json`),
      ]);
      return {
        notes: Array.isArray(notes) ? notes : [],
        cards: Array.isArray(cards) ? cards : [],
        questions: Array.isArray(questions) ? questions : [],
        tickets: Array.isArray(tickets) ? tickets : [],
      };
    },
  };
})();
