# 🌿 Чистый город — Руководство по запуску

## Что это

Веб-приложение для мониторинга экологических проблем города. Работает в браузере, данные хранятся в Firebase (облако Google) и синхронизируются между всеми пользователями в реальном времени.

---

## 🚀 Быстрый запуск (3 шага)

### Шаг 1 — Создать проект Firebase

1. Зайдите на [console.firebase.google.com](https://console.firebase.google.com)
2. Нажмите **"Добавить проект"** → дайте имя **"chisty-gorod"**
3. Отключите Google Analytics (необязательно) → **Создать проект**

### Шаг 2 — Настроить Authentication и Firestore

**Authentication:**
1. В левом меню: **Build → Authentication → Get started**
2. Вкладка **Sign-in method** → нажмите **Google** → Включить → Сохранить

**Firestore:**
1. В левом меню: **Build → Firestore Database → Create database**
2. Выберите **Production mode** → регион **europe-west3** → Создать
3. Перейдите в **Rules** и вставьте:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /problems/{problemId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
  }
}
```
4. Нажмите **Publish**

### Шаг 3 — Получить конфиг и вставить в код

1. В Firebase Console: **Project settings** (шестерёнка сверху) → вкладка **General**
2. Листайте вниз до **"Your apps"** → нажмите **</>** (Web)
3. Дайте имя приложению → **Register app**
4. Скопируйте объект `firebaseConfig`

**Откройте `index.html`** и замените конфиг (строки ~30-38):

```javascript
const firebaseConfig = {
    apiKey: "ВСТАВЬТЕ_СЮДА",
    authDomain: "ВАШ-ПРОЕКТ.firebaseapp.com",
    projectId: "ВАШ-ПРОЕКТ",
    storageBucket: "ВАШ-ПРОЕКТ.appspot.com",
    messagingSenderId: "ВАШИ_ЦИФРЫ",
    appId: "ВАШИ_ДАННЫЕ"
};
```

---

## 🗺️ Настройка карты 2GIS

В `app.js`, строка ~130, замените ключ карты:

```javascript
map = new mapgl.Map('map', {
    center: [47.8864, 56.6344],  // Координаты Йошкар-Олы, можно изменить
    zoom: 13,
    key: 'ВАШ_КЛЮЧ_2GIS',  // ← вставьте сюда
    ...
```

Получить бесплатный ключ 2GIS: [dev.2gis.com](https://dev.2gis.com) → **Get API Key**

---

## 🌐 Размещение на GitHub Pages

1. Создайте репозиторий на GitHub (например, `chisty-gorod`)
2. Загрузите файлы: `index.html`, `styles.css`, `app.js`
3. В настройках репозитория: **Settings → Pages → Source: Deploy from branch → main**
4. Через пару минут сайт будет доступен по адресу: `https://ВАШ-ЛОГИН.github.io/chisty-gorod`

**Важно:** В Firebase Console → Authentication → Settings → **Authorized domains** — добавьте ваш домен GitHub Pages.

---

## 📂 Структура файлов

```
chisty-gorod/
├── index.html    — разметка страницы
├── styles.css    — стили
├── app.js        — логика приложения (Firebase + карта)
└── README.md     — это руководство
```

---

## ✨ Функции приложения

| Функция | Описание |
|---------|----------|
| 🔐 Авторизация | Вход через аккаунт Google |
| 🗺️ Карта проблем | Интерактивная карта 2GIS с метками |
| 📍 Добавление проблем | Клик по карте + описание + фото + тип + срочность |
| 📅 Мероприятия | Субботники, события с записью участников |
| ⭐ Система баллов | +10 за проблему, +20 за решение, баллы за события |
| 🏆 Рейтинг | Таблица всех пользователей в реальном времени |
| 📚 Эко-гид | 6 образовательных статей об экологии |
| 📌 Мои отметки | История своих добавленных проблем |
| 🔄 Синхронизация | Все данные в реальном времени через Firebase |
