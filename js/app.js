const nav = document.getElementById("nav");
const view = document.getElementById("view");
const sidebarFoot = document.getElementById("sidebar-foot");

const study = {
  scope: "",
  card: 0,
  flipped: false,
  quiz: 0,
  picked: null,
  correct: 0,
  ticket: null,
};

let renderToken = 0;

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseRoute() {
  const parts = (location.hash || "#/")
    .replace(/^#/, "")
    .split("/")
    .filter(Boolean);
  if (parts[0] !== "course" || !parts[1]) return { name: "home" };
  if (!parts[2]) return { name: "course", courseId: decodeURIComponent(parts[1]) };
  return {
    name: "topic",
    courseId: decodeURIComponent(parts[1]),
    topicId: decodeURIComponent(parts[2]),
    section: parts[3] || "hub",
    noteId: parts[4] ? decodeURIComponent(parts.slice(4).join("/")) : "",
  };
}

function courseHref(courseId) {
  return `#/course/${encodeURIComponent(courseId)}`;
}

function topicHref(courseId, topicId, section) {
  const base = `#/course/${encodeURIComponent(courseId)}/${encodeURIComponent(topicId)}`;
  return section ? `${base}/${section}` : base;
}

function rememberScope(route) {
  const scope = `${route.courseId}/${route.topicId}`;
  if (study.scope === scope) return;
  study.scope = scope;
  study.card = 0;
  study.flipped = false;
  study.quiz = 0;
  study.picked = null;
  study.correct = 0;
  study.ticket = null;
}

function drawNav(route, course, topic) {
  const items = [{ href: "#/", label: "Курсы", active: route.name === "home" }];
  if (course) {
    items.push({
      href: courseHref(course.id),
      label: course.title,
      active: route.name === "course",
    });
  }
  if (topic) {
    const sections = [
      ["hub", "Обзор темы"],
      ["knowledge", "База знаний"],
      ["cards", "Карточки"],
      ["tests", "Тесты"],
      ["tickets", "Билеты"],
    ];
    sections.forEach(([id, label]) => {
      items.push({
        href: topicHref(course.id, topic.id, id === "hub" ? "" : id),
        label,
        active: route.section === id,
      });
    });
  }
  nav.innerHTML = items
    .map(
      (item) =>
        `<a class="nav-link${item.active ? " is-active" : ""}" href="${item.href}">${esc(item.label)}</a>`
    )
    .join("");
  sidebarFoot.textContent = topic ? `${topic.kind || "Тема"} · ${topic.title}` : "Курсы, коллоквиумы, экзамены";
}

function pageHead(eyebrow, title, hint) {
  return `
    <header class="page-head">
      <p class="eyebrow">${esc(eyebrow)}</p>
      <h1>${esc(title)}</h1>
      ${hint ? `<p class="lede">${esc(hint)}</p>` : ""}
    </header>`;
}

function renderBlocks(blocks) {
  return (blocks || [])
    .map((block) => {
      if (block.type === "h") return `<h2>${esc(block.text)}</h2>`;
      if (block.type === "ul") {
        return `<ul>${(block.items || []).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
      }
      if (block.type === "note") return `<p class="callout">${esc(block.text)}</p>`;
      return `<p>${esc(block.text)}</p>`;
    })
    .join("");
}

function emptyState(title, text) {
  return `
    <div class="empty">
      <p class="empty-title">${esc(title)}</p>
      <p class="empty-text">${esc(text)}</p>
    </div>`;
}

function drawHome(catalog) {
  const courses = catalog.courses || [];
  const tiles = courses.length
    ? courses
        .map(
          (course) => `
          <a class="tile" href="${courseHref(course.id)}">
            <span class="kind">Курс</span>
            <span class="tile-label">${esc(course.title)}</span>
            <span class="tile-hint">${esc(course.summary)}</span>
          </a>`
        )
        .join("")
    : emptyState("Курсов пока нет", "Добавьте курс в content/catalog.json и папку content/courses.");
  view.innerHTML = `
    ${pageHead("Кабинет", "Курсы", "Каждый курс собирает свои коллоквиумы и экзамены. Внутри темы — конспект, карточки, тест и билеты.")}
    <section class="tiles">${tiles}</section>`;
}

function drawCourse(course) {
  const topics = course.topics || [];
  const tiles = topics.length
    ? topics
        .map(
          (topic) => `
          <a class="tile" href="${topicHref(course.id, topic.id)}">
            <span class="kind">${esc(topic.kind || "Тема")}</span>
            <span class="tile-label">${esc(topic.title)}</span>
            <span class="tile-hint">${esc(topic.summary)}</span>
          </a>`
        )
        .join("")
    : emptyState("Тем пока нет", "Добавьте тему в course.json и папку с материалами.");
  view.innerHTML = `
    ${pageHead("Курс", course.title, course.summary)}
    <section class="tiles">${tiles}</section>`;
}

function drawHub(course, topic, materials) {
  const sections = [
    ["knowledge", "База знаний", materials.notes.length, "Конспекты этой темы"],
    ["cards", "Карточки", materials.cards.length, "Короткие вопросы для самопроверки"],
    ["tests", "Тесты", materials.questions.length, "Вопросы с вариантами ответа"],
    ["tickets", "Билеты", materials.tickets.length, "Устные вопросы и опора для ответа"],
  ];
  view.innerHTML = `
    ${pageHead(topic.kind || "Тема", topic.title, topic.summary)}
    <p class="crumb"><a href="${courseHref(course.id)}">${esc(course.title)}</a></p>
    <section class="tiles">
      ${sections
        .map(
          ([id, label, count, hint]) => `
          <a class="tile" href="${topicHref(course.id, topic.id, id)}">
            <span class="tile-count">${count}</span>
            <span class="tile-label">${label}</span>
            <span class="tile-hint">${hint}</span>
          </a>`
        )
        .join("")}
    </section>`;
}

function drawKnowledge(course, topic, materials, noteId) {
  const back = topicHref(course.id, topic.id, "knowledge");
  const note = materials.notes.find((item) => item.id === noteId);
  if (note) {
    view.innerHTML = `
      <a class="back" href="${back}">Все записи</a>
      <article class="article">
        <p class="eyebrow">${esc(topic.title)}</p>
        <h1>${esc(note.title)}</h1>
        <p class="lede">${esc(note.lead)}</p>
        ${renderBlocks(note.blocks)}
      </article>`;
    return;
  }
  const list = materials.notes.length
    ? `<ol class="notes">${materials.notes
        .map(
          (item, index) => `
          <li>
            <a class="note-link" href="${back}/${encodeURIComponent(item.id)}">
              <span class="note-num">${String(index + 1).padStart(2, "0")}</span>
              <span>
                <span class="note-title">${esc(item.title)}</span>
                <span class="note-lead">${esc(item.lead || "")}</span>
              </span>
            </a>
          </li>`
        )
        .join("")}</ol>`
    : emptyState("Записей пока нет", "Положите конспекты в notes.json этой темы.");
  view.innerHTML = `
    ${pageHead(topic.title, "База знаний", "Записи только этой темы.")}
    ${list}`;
}

function drawCards(topic, materials) {
  if (!materials.cards.length) {
    view.innerHTML = `
      ${pageHead(topic.title, "Карточки", "")}
      ${emptyState("Карточек пока нет", "Добавьте их в cards.json этой темы.")}`;
    return;
  }
  const index = Math.min(study.card, materials.cards.length - 1);
  const card = materials.cards[index];
  view.innerHTML = `
    ${pageHead(topic.title, "Карточки", "Ответьте вслух, затем переверните карточку.")}
    <p class="progress-label">${esc(card.topic || topic.title)} · ${index + 1} из ${materials.cards.length}</p>
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
    study.card = (index - 1 + materials.cards.length) % materials.cards.length;
    study.flipped = false;
    render();
  });
  document.getElementById("card-next").addEventListener("click", () => {
    study.card = (index + 1) % materials.cards.length;
    study.flipped = false;
    render();
  });
}

function drawTests(topic, materials) {
  const total = materials.questions.length;
  if (!total) {
    view.innerHTML = `
      ${pageHead(topic.title, "Тест", "")}
      ${emptyState("Вопросов пока нет", "Добавьте их в questions.json этой темы.")}`;
    return;
  }
  if (study.quiz >= total) {
    view.innerHTML = `
      ${pageHead(topic.title, "Тест пройден", "Это самопроверка по этой теме.")}
      <section class="panel result">
        <p class="result-score">${study.correct} из ${total}</p>
        <button class="btn btn-primary" type="button" id="quiz-restart">Пройти ещё раз</button>
      </section>`;
    document.getElementById("quiz-restart").addEventListener("click", () => {
      study.quiz = 0;
      study.picked = null;
      study.correct = 0;
      render();
    });
    return;
  }
  const item = materials.questions[study.quiz];
  const locked = study.picked !== null;
  view.innerHTML = `
    ${pageHead(topic.title, "Тест", "Один верный вариант. Пояснение откроется сразу.")}
    <p class="progress-label">Вопрос ${study.quiz + 1} из ${total} · верно ${study.correct}</p>
    <div class="quiz-progress"><span style="width: ${Math.round((study.quiz / total) * 100)}%"></span></div>
    <p class="quiz-prompt">${esc(item.q)}</p>
    <div class="quiz-options">
      ${(item.options || [])
        .map((option, index) => {
          let cls = "";
          if (locked && index === item.answer) cls = " is-right";
          else if (locked && index === study.picked) cls = " is-wrong";
          return `<button type="button" class="option${cls}" data-index="${index}" ${locked ? "disabled" : ""}>${esc(option)}</button>`;
        })
        .join("")}
    </div>
    ${locked ? `<p class="callout">${esc(item.explain || "")}</p><button class="btn btn-primary" type="button" id="quiz-next">${study.quiz === total - 1 ? "К результату" : "Дальше"}</button>` : ""}`;
  document.querySelectorAll(".option").forEach((button) => {
    button.addEventListener("click", () => {
      if (study.picked !== null) return;
      study.picked = Number(button.dataset.index);
      if (study.picked === item.answer) study.correct += 1;
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

function drawTickets(topic, materials) {
  if (!materials.tickets.length) {
    view.innerHTML = `
      ${pageHead(topic.title, "Билеты", "")}
      ${emptyState("Билетов пока нет", "Добавьте их в tickets.json этой темы.")}`;
    return;
  }
  view.innerHTML = `
    ${pageHead(topic.title, "Билеты", "Сначала ответьте сами, потом откройте опору.")}
    <ol class="tickets">
      ${materials.tickets
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

function showError(error) {
  view.innerHTML = emptyState("Не удалось открыть материалы", error.message || "Проверьте файлы темы.");
}

async function render() {
  const token = ++renderToken;
  const route = parseRoute();
  const hash = location.hash;
  try {
    if (route.name === "home") {
      const catalog = await Library.catalog();
      if (token !== renderToken) return;
      drawNav(route, null, null);
      drawHome(catalog || { courses: [] });
    } else if (route.name === "course") {
      const course = await Library.course(route.courseId);
      if (token !== renderToken) return;
      if (!course) {
        drawNav(route, null, null);
        showError(new Error("Такого курса нет в каталоге."));
      } else {
        drawNav(route, course, null);
        drawCourse(course);
      }
    } else {
      const course = await Library.course(route.courseId);
      if (token !== renderToken) return;
      const topic = course && (course.topics || []).find((item) => item.id === route.topicId);
      if (!course || !topic) {
        drawNav(route, course, null);
        showError(new Error("Такой темы нет в курсе."));
        return;
      }
      rememberScope(route);
      const materials = await Library.materials(route.courseId, route.topicId);
      if (token !== renderToken) return;
      drawNav(route, course, topic);
      if (route.section === "knowledge") drawKnowledge(course, topic, materials, route.noteId);
      else if (route.section === "cards") drawCards(topic, materials);
      else if (route.section === "tests") drawTests(topic, materials);
      else if (route.section === "tickets") drawTickets(topic, materials);
      else drawHub(course, topic, materials);
    }
  } catch (error) {
    if (token !== renderToken) return;
    showError(error);
  }
  if (hash !== render.lastHash) {
    window.scrollTo(0, 0);
    render.lastHash = hash;
  }
}

window.addEventListener("hashchange", render);
render();
