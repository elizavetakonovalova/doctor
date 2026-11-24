const SECTIONS = [
  {
    id: "home",
    hash: "#/",
    label: "Обзор",
    title: "Обзор",
  },
  {
    id: "knowledge",
    hash: "#/knowledge",
    label: "База знаний",
    title: "База знаний",
    hint: "Конспекты, темы и короткие записи, к которым можно вернуться.",
    empty: "Записей пока нет",
    collection: "notes",
  },
  {
    id: "cards",
    hash: "#/cards",
    label: "Карточки",
    title: "Карточки",
    hint: "Лицевая сторона — вопрос, оборот — ответ. Для самопроверки.",
    empty: "Карточек пока нет",
    collection: "cards",
  },
  {
    id: "tests",
    hash: "#/tests",
    label: "Тесты",
    title: "Тесты",
    hint: "Вопрос, варианты и отметка, насколько уверенно вы ответили.",
    empty: "Вопросов пока нет",
    collection: "questions",
  },
  {
    id: "tickets",
    hash: "#/tickets",
    label: "Билеты",
    title: "Билеты",
    hint: "Экзаменационные билеты: номер, вопросы и то, что уже разобрано.",
    empty: "Билетов пока нет",
    collection: "tickets",
  },
];

const nav = document.getElementById("nav");
const view = document.getElementById("view");

function currentId() {
  const hash = location.hash || "#/";
  if (hash === "#/" || hash === "#") return "home";
  const found = SECTIONS.find((section) => section.hash === hash);
  return found ? found.id : "home";
}

function renderNav() {
  const active = currentId();
  nav.innerHTML = SECTIONS.map(
    (section) => `
      <a class="nav-link${section.id === active ? " is-active" : ""}" href="${section.hash}">
        ${section.label}
      </a>`
  ).join("");
}

function pageHead(title, hint) {
  return `
    <header class="page-head">
      <p class="eyebrow">Каркас</p>
      <h1>${title}</h1>
      ${hint ? `<p class="lede">${hint}</p>` : ""}
    </header>`;
}

function emptyState(text) {
  return `
    <div class="empty">
      <p class="empty-title">${text}</p>
      <p class="empty-text">Место под ваши материалы. Сейчас коллекция пустая.</p>
    </div>`;
}

function renderHome(data) {
  const tiles = SECTIONS.filter((section) => section.collection)
    .map((section) => {
      const count = data[section.collection].length;
      return `
        <a class="tile" href="${section.hash}">
          <span class="tile-count">${count}</span>
          <span class="tile-label">${section.label}</span>
          <span class="tile-hint">${section.hint}</span>
        </a>`;
    })
    .join("");

  view.innerHTML = `
    ${pageHead(
      "Кабинет",
      "Личное место для конспектов и подготовки к экзаменам. Пока здесь только каркас разделов."
    )}
    <section class="tiles">${tiles}</section>`;
}

function renderList(section, data) {
  const items = data[section.collection];
  const body = items.length
    ? `<ul class="list">${items
        .map((item) => `<li class="list-item">${item.title || "Без названия"}</li>`)
        .join("")}</ul>`
    : emptyState(section.empty);

  view.innerHTML = `
    ${pageHead(section.title, section.hint)}
    <section class="panel">${body}</section>`;
}

function renderCards(section, data) {
  if (!data.cards.length) {
    view.innerHTML = `
      ${pageHead(section.title, section.hint)}
      <section class="panel">
        <button class="flashcard" type="button" id="flashcard" aria-pressed="false">
          <span class="flash-side" data-side="front">
            <span class="flash-kicker">Лицо</span>
            <span class="flash-text">Здесь будет вопрос</span>
          </span>
          <span class="flash-side" data-side="back">
            <span class="flash-kicker">Оборот</span>
            <span class="flash-text">Здесь будет ответ</span>
          </span>
        </button>
        <p class="caption">Нажмите на карточку, чтобы перевернуть. Это образец механизма, не учебная карточка.</p>
        ${emptyState(section.empty)}
      </section>`;

    const card = document.getElementById("flashcard");
    card.addEventListener("click", () => {
      const flipped = card.classList.toggle("is-flipped");
      card.setAttribute("aria-pressed", String(flipped));
    });
    return;
  }

  renderList(section, data);
}

function renderTests(section, data) {
  if (data.questions.length) {
    renderList(section, data);
    return;
  }

  view.innerHTML = `
    ${pageHead(section.title, section.hint)}
    <section class="panel">
      <div class="quiz" aria-hidden="true">
        <div class="quiz-progress"><span style="width: 0%"></span></div>
        <p class="quiz-prompt">Текст вопроса появится здесь</p>
        <div class="quiz-options">
          <button type="button" disabled>Вариант ответа</button>
          <button type="button" disabled>Вариант ответа</button>
          <button type="button" disabled>Вариант ответа</button>
          <button type="button" disabled>Вариант ответа</button>
        </div>
      </div>
      ${emptyState(section.empty)}
    </section>`;
}

function renderTickets(section, data) {
  if (data.tickets.length) {
    renderList(section, data);
    return;
  }

  view.innerHTML = `
    ${pageHead(section.title, section.hint)}
    <section class="panel">
      <ol class="tickets">
        <li class="ticket is-placeholder">
          <span class="ticket-num">01</span>
          <span>
            <span class="ticket-title">Номер билета</span>
            <span class="ticket-meta">Вопросы билета появятся здесь</span>
          </span>
        </li>
      </ol>
      ${emptyState(section.empty)}
    </section>`;
}

function render() {
  const data = Store.load();
  const id = currentId();
  renderNav();

  if (id === "home") {
    renderHome(data);
    return;
  }

  const section = SECTIONS.find((item) => item.id === id);
  if (id === "cards") renderCards(section, data);
  else if (id === "tests") renderTests(section, data);
  else if (id === "tickets") renderTickets(section, data);
  else renderList(section, data);
}

window.addEventListener("hashchange", render);
render();
