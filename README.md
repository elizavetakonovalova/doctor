# Кабинет

Учебная база по курсам. У каждого курса свои коллоквиумы и экзамены, у каждой темы свои конспекты, карточки, тест и билеты.

## Куда класть материалы

```
content/catalog.json                         список курсов
content/courses/<курс>/course.json           список тем этого курса
content/courses/<курс>/<тема>/notes.json     база знаний
content/courses/<курс>/<тема>/cards.json     карточки
content/courses/<курс>/<тема>/questions.json тест
content/courses/<курс>/<тема>/tickets.json   устные билеты
```

Новый курс: папка `content/courses/<id>/` с `course.json` и строка в `content/catalog.json`.

Новая тема: папка рядом с `course.json`, четыре json-файла и строка в `topics` внутри `course.json`. Пустой файл можно оставить массивом `[]`.

Идентификаторы в адресе — латиница через дефис, как `physiology` и `sensory-systems`.
