// #import "@preview/cheq:0.4.0": checklist  // Markdown-style checklists

#import "@preview/codly:2.0.0" as codly
#import "@preview/codly-languages:0.1.8": codly-languages
#show: codly.lang-set_(languages: codly-languages)
#show raw.where(block: true): codly.new

// #import "@preview/lilaq:0.6.0" as lq  // Plots, data visualization

#import "@preview/meander:0.4.6"  // For text image avoidance

// #import "@preview/zero:0.7.1": num, format-table, zi  // For scientific number formatting

#set text(lang: "ru")
#set align(left)
#set text(font: "Times new roman", size: 12pt, hyphenate: true)
#set heading(numbering: "1.")
#set page("a4", margin: (left: 2.5cm, right: 1.5cm, bottom: 2cm, top: 2cm))
#show math.equation: set text(font: "Latin Modern Math", size: 14pt)
#show link: underline

#page(numbering: none)[
  #align(center)[
    Национальный исследовательский университет «МЭИ»
    #line(length: 100%)
    Институт информационных и вычислительных технологий
    #v(1em)
    #v(1.5fr)
    Расчётное задание
    #title[
      Информационная медицинская система
    ]
    Курс "Базы данных"
    #v(1.2fr)
    #align(right)[
      #grid(
        columns: 2,
        column-gutter: 0.5em,
        row-gutter: 1em,
        [], align(left)[*Выполнил*],
        [*Студент*], underline[Лыкум Фёдор Валентинович],
        [*Группа*], underline[Аэ-21-24],
        [*Вариант*], underline[9],
      )
      #v(2em)
      // #grid(
      //   columns: 2,
      //   column-gutter: 0.5em,
      //   row-gutter: 1em,
      //   [], align(left)[*Принял*],
      //   [*Преподаватель*], underline[NAME],
      //   [*Оценка*], box(stroke: (bottom: 0.5pt))[#v(10pt) #h(8em)],
      //   [*Дата*], box(stroke: (bottom: 0.5pt))[#v(10pt) #h(8em)],
      // )
      #v(2em)
    ]
    #v(0.5fr)
    Москва, 2026
  ]
]

#set page(numbering: "1", columns: 2)
#set par(
  first-line-indent: (
    amount: 1.25em,
    all: true,
  ),
  justify: true,
  linebreaks: "optimized",
)

#show heading.where(level:1): set text(size: 15pt)
#show heading.where(level:2): set text(size: 13pt)

#place(
  top,
  float: true,
  scope: "parent",
  clearance: 2em,
)[
  #outline()
]

// #heading(numbering: none)[Введение]


= Описание предметной области

В некотором медицинском учреждении необходимо сохранять информацию обо всех
назначенных пациентам процедурах, лекарствах и т.п. Планируется перевести данные
записи в электронный формат, чтобы уменьшить количество бумаг и облегчить врачам
работу. Для работы с данными планируется создать электронный сервис.

*Добавление новой процедуры в базу*

Сначала врач заходит в свой профиль, отсканировав свою лицензию. Далее врач
создаёт новую процедуру, время создания процедуры сразу же сохраняется. Затем врач сканирует
полис ОМС пациента. В данные о процедуре сохраняются
идентификаторы лицензии врача и полиса пациента, а также прочая информация о враче и пациенте,
например: ФИО, дата рождения, номер
телефона и т.д. Далее врач вводит название процедуры.

Если во время процедуры пациенту назначаются препараты, врач сначала сканирует
уникальный идентификатор лекарства (честный знак #sym.copyright), с которым
ассоциируется информация о препарате (его название и метод применения), затем указывает
дозировку, в которой лекарство было применено, и метод назначения препарата.

Если во время процедуры было применено более одного препарата, действия
необходимо повторить. Повторять можно сколько угодно раз.

Перед закрытием процедуры (т.е. перед её непосредственной записью в базу) врач имеет право внести в неё свои личные
замечания и рекомендации пациенту.

 *Редактирование и просмотр данных*

Пациенты имеют право просматривать данные о своих
медицинских процедурах в публичном сегменте сервиса.

Врачи имеют право создавать медицинские процедуры, просматривать медицинские процедуры
_всех_ пациентов и базу лекарств.

Администратор имеет право просматривать все выше упомянутые данные, а ещё полный
список пациентов и врачей. Администратор имеет право добавлять и удалять пациентов,
врачей, лекарства, а также редактировать медицинские процедуры уже после
их записи в базу.

*Прочие замечания*

Сканер --- это обычное устройство ввода, подключаемое по USB. Если сканера
нет, данные можно вводить с клавиатуры.

У пользователей авторизация работает по номеру полиса и TOTP-коду,
у врачей --- по номеру лицензии и TOTP-коду, у администраторов --- по логину
и паролю.

= Проектирование базы данных

== Структура данных, таблицы

#lorem(100)

#figure(
  caption: [Базовый набор атрибутов],
  image("img/er/base.png", width: 70%)
)<i_base>

#lorem(100)

#figure(
  caption: [Выделение первичного ключа],
  image("img/er/pk.png", width: 70%)
)<i_pk>

#lorem(100)
#place(
  top + center,
  float: true,
  scope: "parent",
  clearance: 2em,
)[
  #figure(
    caption: [Первая нормальная форма],
    image("img/er/1nf.png", width: 65%)
  )<i_1nf>
]

#place(
  bottom + center,
  float: true,
  scope: "parent",
  clearance: 2em,
)[
  #figure(
    caption: [Вторая нормальная форма],
    image("img/er/2nf.png")
  )<i_2nf>
]

#lorem(100)

#place(
  top + center,
  float: true,
  scope: "parent",
  clearance: 2em,
)[
  #figure(
    caption: [Третья нормальная форма],
    image("img/er/3nf.png")
  )<i_3nf>
]

#place(
  bottom + center,
  float: true,
  scope: "parent",
  clearance: 2em,
)[
  #figure(
    caption: [Добавление фиктивных идентификаторов],
    image("img/er/ids.png")
  )<i_ids>
]

#lorem(400)

== Индексы

== Процедуры, функции и представления

== SQL-скрипт

// = Приложения. Исходный код
// #raw(read("file.source"), lang: "lang", block: true)
