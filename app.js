const SECTIONS = [
  { id: "home", hash: "#/", label: "Обзор" },
  {
    id: "knowledge",
    hash: "#/knowledge",
    label: "База знаний",
    title: "База знаний",
    hint: "Объяснения к коллоквиуму по сенсорным системам. Открывайте тему и читайте вслух структуру ответа.",
    empty: "Записей пока нет",
    collection: "notes",
  },
  {
    id: "cards",
    hash: "#/cards",
    label: "Карточки",
    title: "Карточки",
    hint: "Короткий вопрос на лице. Нажмите карточку, чтобы увидеть ответ, затем переходите дальше.",
    empty: "Карточек пока нет",
    collection: "cards",
  },
  {
    id: "tests",
    hash: "#/tests",
    label: "Тесты",
    title: "Тесты",
    hint: "Один верный вариант. После выбора сразу видно пояснение.",
    empty: "Вопросов пока нет",
    collection: "questions",
  },
  {
    id: "tickets",
    hash: "#/tickets",
    label: "Билеты",
    title: "Билеты",
    hint: "Вопросы к зачёту. Сначала ответьте сами, потом откройте опору.",
    empty: "Билетов пока нет",
    collection: "tickets",
  },
];

const nav = document.getElementById("nav");
const view = document.getElementById("view");

const study = {
  card: 0,
  flipped: false,
  quiz: 0,
  picked: null,
  correct: 0,
  answered: 0,
  ticket: null,
};

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function currentId() {
  const hash = location.hash || "#/";
  if (hash === "#/" || hash === "#") return "home";
  const found = SECTIONS.find((section) => hash === section.hash || hash.startsWith(section.hash + "/"));
  return found ? found.id : "home";
}

function noteId() {
  const hash = location.hash || "";
  if (!hash.startsWith("#/knowledge/")) return "";
  return decodeURIComponent(hash.slice("#/knowledge/".length));
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
      <p class="eyebrow">Сенсорные системы</p>
      <h1>${esc(title)}</h1>
      ${hint ? `<p class="lede">${esc(hint)}</p>` : ""}
    </header>`;
}

function renderHome(data) {
  const tiles = SECTIONS.filter((section) => section.collection)
    .map((section) => {
      const count = data[section.collection].length;
      return `
        <a class="tile" href="${section.hash}">
          <span class="tile-count">${count}</span>
          <span class="tile-label">${esc(section.label)}</span>
          <span class="tile-hint">${esc(section.hint)}</span>
        </a>`;
    })
    .join("");

  view.innerHTML = `
    ${pageHead(
      "Кабинет",
      "Подготовка к коллоквиуму по физиологии сенсорных систем: объяснения, карточки, тест и устные билеты."
    )}
    <section class="tiles">${tiles}</section>`;
}

function renderBlocks(blocks) {
  return blocks
    .map((block) => {
      if (block.type === "h") return `<h2>${esc(block.text)}</h2>`;
      if (block.type === "ul") {
        return `<ul>${block.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
      }
      if (block.type === "note") return `<p class="callout">${esc(block.text)}</p>`;
      return `<p>${esc(block.text)}</p>`;
    })
    .join("");
}

function renderKnowledge(data) {
  const id = noteId();
  const note = data.notes.find((item) => item.id === id);
  if (note) {
    view.innerHTML = `
      <a class="back" href="#/knowledge">Все темы</a>
      <article class="article">
        <p class="eyebrow">База знаний</p>
        <h1>${esc(note.title)}</h1>
        <p class="lede">${esc(note.lead)}</p>
        ${renderBlocks(note.blocks)}
      </article>`;
    return;
  }

  view.innerHTML = `
    ${pageHead("База знаний", "Темы по порядку: сначала общий анализатор, потом каждая система и практические работы.")}
    <ol class="notes">
      ${data.notes
        .map(
          (item, index) => `
          <li>
            <a class="note-link" href="#/knowledge/${encodeURIComponent(item.id)}">
              <span class="note-num">${String(index + 1).padStart(2, "0")}</span>
              <span>
                <span class="note-title">${esc(item.title)}</span>
                <span class="note-lead">${esc(item.lead)}</span>
              </span>
            </a>
          </li>`
        )
        .join("")}
    </ol>`;
}

function renderCards(data) {
  if (!data.cards.length) return;
  const index = Math.min(study.card, data.cards.length - 1);
  const card = data.cards[index];
  view.innerHTML = `
    ${pageHead("Карточки", "Нажмите на карточку, чтобы перевернуть. Ответьте вслух до того, как откроете оборот.")}
    <p class="progress-label">${esc(card.topic)} · ${index + 1} из ${data.cards.length}</p>
    <button class="flashcard${study.flipped ? " is-flipped" : ""}" type="button" id="flashcard" aria-pressed="${study.flipped}">
      <span class="flash-side" data-side="front">
        <span class="flash-kicker">Вопрос</span>
        <span class="flash-text">${esc(card.front)}</span>
      </span>
      <span class="flash-side" data-side="back">
        <span class="flash-kicker">Ответ</span>
        <span class="flash-text flash-text-answer">${esc(card.back)}</span>
      </span>
    </button>
    <div class="row">
      <button class="btn" type="button" id="card-prev">Назад</button>
      <button class="btn btn-primary" type="button" id="card-next">Дальше</button>
    </div>`;

  document.getElementById("flashcard").addEventListener("click", () => {
    study.flipped = !study.flipped;
    render();
  });
  document.getElementById("card-prev").addEventListener("click", () => {
    study.card = (index - 1 + data.cards.length) % data.cards.length;
    study.flipped = false;
    render();
  });
  document.getElementById("card-next").addEventListener("click", () => {
    study.card = (index + 1) % data.cards.length;
    study.flipped = false;
    render();
  });
}

function renderTests(data) {
  const total = data.questions.length;
  if (!total) return;
  if (study.quiz >= total) {
    view.innerHTML = `
      ${pageHead("Тест пройден", "Это самопроверка, не оценка. Вернитесь к темам, где пояснение было неожиданным.")}
      <section class="panel result">
        <p class="result-score">${study.correct} из ${total}</p>
        <p>Верных ответов за эту попытку.</p>
        <button class="btn btn-primary" type="button" id="quiz-restart">Пройти ещё раз</button>
      </section>`;
    document.getElementById("quiz-restart").addEventListener("click", () => {
      study.quiz = 0;
      study.picked = null;
      study.correct = 0;
      study.answered = 0;
      render();
    });
    return;
  }

  const item = data.questions[study.quiz];
  const locked = study.picked !== null;
  view.innerHTML = `
    ${pageHead("Тест", "Выберите один ответ. Пояснение откроется сразу.")}
    <p class="progress-label">Вопрос ${study.quiz + 1} из ${total} · верно ${study.correct}</p>
    <div class="quiz-progress"><span style="width: ${Math.round((study.quiz / total) * 100)}%"></span></div>
    <p class="quiz-prompt">${esc(item.q)}</p>
    <div class="quiz-options" id="quiz-options">
      ${item.options
        .map((option, index) => {
          let cls = "";
          if (locked && index === item.answer) cls = " is-right";
          else if (locked && index === study.picked) cls = " is-wrong";
          return `<button type="button" class="option${cls}" data-index="${index}" ${locked ? "disabled" : ""}>${esc(option)}</button>`;
        })
        .join("")}
    </div>
    ${locked ? `<p class="callout">${esc(item.explain)}</p><button class="btn btn-primary" type="button" id="quiz-next">${study.quiz === total - 1 ? "К результату" : "Дальше"}</button>` : ""}`;

  document.querySelectorAll(".option").forEach((button) => {
    button.addEventListener("click", () => {
      if (study.picked !== null) return;
      study.picked = Number(button.dataset.index);
      if (study.picked === item.answer) study.correct += 1;
      study.answered += 1;
      render();
    });
  });
  const next = document.getElementById("quiz-next");
  if (next) {
    next.addEventListener("click", () => {
      study.quiz += 1;
      study.picked = null;
      render();
    });
  }
}

function renderTickets(data) {
  view.innerHTML = `
    ${pageHead("Билеты", "Одиннадцать устных вопросов по списку зачёта. Откройте опору после своего ответа.")}
    <ol class="tickets">
      ${data.tickets
        .map((ticket, index) => {
          const open = study.ticket === index;
          return `
            <li class="ticket">
              <button class="ticket-toggle" type="button" data-index="${index}" aria-expanded="${open}">
                <span class="ticket-num">${String(index + 1).padStart(2, "0")}</span>
                <span>
                  <span class="ticket-title">${esc(ticket.title)}</span>
                  <span class="ticket-meta">${esc(ticket.prompt)}</span>
                </span>
              </button>
              ${open ? `<p class="ticket-answer">${esc(ticket.answer)}</p>` : ""}
            </li>`;
        })
        .join("")}
    </ol>`;

  document.querySelectorAll(".ticket-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      study.ticket = study.ticket === index ? null : index;
      render();
    });
  });
}

function render() {
  const data = Store.load();
  const id = currentId();
  renderNav();
  if (id === "home") renderHome(data);
  else if (id === "knowledge") renderKnowledge(data);
  else if (id === "cards") renderCards(data);
  else if (id === "tests") renderTests(data);
  else if (id === "tickets") renderTickets(data);
  else renderHome(data);
  if (location.hash !== render.lastHash) {
    window.scrollTo(0, 0);
    render.lastHash = location.hash;
  }
}

window.addEventListener("hashchange", render);
render();
