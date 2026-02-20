// Основные переменные
let map;
let markers = {};
let currentUser = null;
let selectedCoords = null;
let selectedMarkerId = null;
let userPoints = 0;
let userEvents = [];

// Константы для баллов
const POINTS = {
    ADD_PROBLEM: 10,
    SOLVE_PROBLEM: 20,
    JOIN_EVENT: 50,
    UPLOAD_PHOTO: 5,
    INVITE_FRIEND: 30
};

// Статьи для Эко-гида
const ecoGuideArticles = [
    {
        id: 1,
        title: 'Как сортировать мусор',
        description: 'Простое руководство по раздельному сбору отходов для начинающих',
        category: 'Сортировка',
        image: 'https://via.placeholder.com/300x150/4caf50/ffffff?text=Сортировка',
        content: 'Раздельный сбор мусора - это первый шаг к сохранению природы. Начните с простого: отделяйте пластик, стекло и бумагу от пищевых отходов. В каждом районе есть пункты приема вторсырья, где можно сдать отсортированные отходы.'
    },
    {
        id: 2,
        title: 'Батарейки: куда сдавать?',
        description: 'Почему нельзя выбрасывать батарейки и где находятся пункты приема',
        category: 'Опасные отходы',
        image: 'https://via.placeholder.com/300x150/ff9800/ffffff?text=Батарейки',
        content: 'Одна пальчиковая батарейка загрязняет 20 квадратных метров земли тяжелыми металлами. В городе работают пункты приема батареек в крупных магазинах электроники и специальных экобоксах.'
    },
    {
        id: 3,
        title: 'Экосумки вместо пакетов',
        description: 'Как отказаться от пластика и не испортить себе жизнь',
        category: 'Экопривычки',
        image: 'https://via.placeholder.com/300x150/2196f3/ffffff?text=Экосумки',
        content: 'Пластиковый пакет разлагается 400 лет, а используется в среднем 20 минут. Заведите многоразовую сумку и носите её с собой - это поможет сократить количество пластикового мусора.'
    },
    {
        id: 4,
        title: 'Вода из-под крана',
        description: 'Можно ли пить водопроводную воду и как её очистить',
        category: 'Здоровье',
        image: 'https://via.placeholder.com/300x150/00acc1/ffffff?text=Вода',
        content: 'Водопроводная вода в городе соответствует санитарным нормам, но для лучшего вкуса и безопасности можно использовать фильтры-кувшины или стационарные системы очистки. Откажитесь от бутилированной воды в пластике!'
    }
];

// Локальное хранилище
const STORAGE_KEY = 'ecoMarkers_v2';
const USER_KEY = 'ecoMarkerUser';
const POINTS_KEY = 'userPoints';
const EVENTS_KEY = 'ecoEvents';
const USER_EVENTS_KEY = 'userEvents';

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    await initMap();
    await loadUser();
    await loadAllMarkers();
    await loadUserPoints();
    await loadUserEvents();
    updateUI();

    // Загружаем данные для вкладок
    loadEvents();
    loadEcoGuide();
    loadRating();
});

// Инициализация Яндекс Карты
async function initMap() {
    try {
        await ymaps.ready();

        map = new ymaps.Map('map', {
            center: [55.76, 37.64], // Москва по умолчанию
            zoom: 10,
            controls: ['zoomControl', 'fullscreenControl']
        });

        // Клик по карте для выбора места
        map.events.add('click', function (e) {
            selectedCoords = e.get('coords');
            openAddMarkerModal();
        });

        console.log('Карта инициализирована');
    } catch (error) {
        console.error('Ошибка инициализации карты:', error);
        alert('Не удалось загрузить карту. Проверьте ключ API Яндекс Карт.');
    }
}

// Переключение вкладок
function switchTab(tabName) {
    // Обновляем активную кнопку
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Показываем нужную вкладку
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');

    // Если переключились на определенные вкладки, загружаем данные
    if (tabName === 'events') loadEvents();
    if (tabName === 'ecoguide') loadEcoGuide();
    if (tabName === 'rating') loadRating();
}

// Работа с пользователем
async function loadUser() {
    currentUser = localStorage.getItem(USER_KEY);
    if (currentUser) {
        document.getElementById('user-status').textContent = `👤 ${currentUser}`;
        document.getElementById('user-name').value = currentUser;
    }
}

function login() {
    const userName = document.getElementById('user-name').value.trim();
    if (!userName) {
        alert('Введите ваше имя');
        return;
    }

    currentUser = userName;
    localStorage.setItem(USER_KEY, userName);

    // Загружаем баллы пользователя
    loadUserPoints();

    document.getElementById('user-status').textContent = `👤 ${currentUser}`;
    updateUI();

    // Показываем приветствие с баллами
    alert(`Добро пожаловать, ${currentUser}! У вас ${userPoints} баллов.`);
}

function logout() {
    currentUser = null;
    localStorage.removeItem(USER_KEY);
    document.getElementById('user-status').textContent = 'Гость';
    document.getElementById('user-name').value = '';
    userPoints = 0;
    updatePointsDisplay();
    updateUI();
}

function updateUI() {
    const isLoggedIn = !!currentUser;
    document.getElementById('user-name').disabled = isLoggedIn;
}

// Работа с баллами
function loadUserPoints() {
    if (!currentUser) return;

    const pointsData = JSON.parse(localStorage.getItem(POINTS_KEY)) || {};
    userPoints = pointsData[currentUser] || 0;
    updatePointsDisplay();
}

function saveUserPoints() {
    if (!currentUser) return;

    const pointsData = JSON.parse(localStorage.getItem(POINTS_KEY)) || {};
    pointsData[currentUser] = userPoints;
    localStorage.setItem(POINTS_KEY, JSON.stringify(pointsData));
    updatePointsDisplay();

    // Обновляем рейтинг, если открыта соответствующая вкладка
    if (document.getElementById('tab-rating').classList.contains('active')) {
        loadRating();
    }
}

function addPoints(amount, reason) {
    if (!currentUser) return;

    userPoints += amount;
    saveUserPoints();

    // Показываем всплывающее уведомление
    showNotification(`+${amount} баллов: ${reason}`);

    // Анимация на счетчике баллов
    const pointsElement = document.getElementById('user-points');
    pointsElement.classList.add('points-earned');
    setTimeout(() => pointsElement.classList.remove('points-earned'), 500);
}

function updatePointsDisplay() {
    document.getElementById('user-points').textContent = userPoints;
}

function showNotification(message) {
    // Создаем элемент уведомления, если его нет
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);

        // Добавляем стили для уведомления
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            z-index: 2000;
            animation: slideIn 0.3s ease;
        `;
    }

    notification.textContent = message;
    notification.style.display = 'block';

    // Скрываем через 3 секунды
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Работа с метками
async function loadAllMarkers() {
    try {
        // Пытаемся загрузить с Яндекс Диска
        console.log('Загрузка данных с Яндекс Диска...');
        const diskMarkers = await loadFromYandexDisk();

        // Загружаем из localStorage
        const localMarkers = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

        // Объединяем данные (приоритет у Яндекс Диска)
        let allMarkers = { ...localMarkers, ...diskMarkers };

        // Если в localStorage есть более свежие данные, обновляем Яндекс Диск
        const hasLocalUpdates = Object.keys(localMarkers).length > Object.keys(diskMarkers).length;
        if (hasLocalUpdates) {
            await saveToYandexDisk(allMarkers);
        }

        // Сохраняем обратно в localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allMarkers));

        // Отображаем метки на карте
        Object.entries(allMarkers).forEach(([id, marker]) => {
            addMarkerToMap(marker, id);
        });

        console.log(`Загружено ${Object.keys(allMarkers).length} меток`);
    } catch (error) {
        console.error('Ошибка загрузки меток:', error);
        // Используем только локальные данные при ошибке
        const localMarkers = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        Object.entries(localMarkers).forEach(([id, marker]) => {
            addMarkerToMap(marker, id);
        });
    }
}

function addMarkerToMap(data, id) {
    const icon = data.solved ? 'islands#greenIcon' : 'islands#redIcon';

    const placemark = new ymaps.Placemark([data.lat, data.lng], {
        balloonContentHeader: `<b>${getProblemTypeName(data.type)}</b>`,
        balloonContentBody: `
            <p><b>Описание:</b> ${data.description}</p>
            <p><b>Добавил:</b> ${data.user}</p>
            <p><b>Дата:</b> ${new Date(data.timestamp).toLocaleString()}</p>
            <p><b>Статус:</b> ${data.solved ? '✅ Решено' : '⚠️ Требует решения'}</p>
            ${data.photo ? `<img src="${data.photo}" style="max-width:200px; max-height:150px; margin-top:10px;">` : ''}
        `,
        balloonContentFooter: `
            <button onclick="showMarkerDetails('${id}')" style="margin:5px; padding:5px 10px; background:#4caf50; color:white; border:none; border-radius:3px; cursor:pointer;">
                📋 Детали
            </button>
        `
    }, {
        preset: icon,
        balloonCloseButton: true,
        hideIconOnBalloonOpen: false
    });

    placemark.events.add('click', function () {
        selectedMarkerId = id;
    });

    map.geoObjects.add(placemark);
    markers[id] = placemark;
}

// Модальные окна
function openAddMarkerModal() {
    if (!currentUser) {
        alert('Пожалуйста, войдите в систему');
        login();
        return;
    }

    document.getElementById('modal-title').textContent = 'Добавить экологическую проблему';
    document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('problem-description').value = '';
    document.getElementById('photo').value = '';
}

function showMarkerDetails(id) {
    selectedMarkerId = id;
    const allMarkers = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    const marker = allMarkers[id];

    if (!marker) return;

    document.getElementById('details-title').textContent = `Проблема: ${getProblemTypeName(marker.type)}`;

    let details = `
        <p><strong>🗺️ Местоположение:</strong> ${marker.lat.toFixed(6)}, ${marker.lng.toFixed(6)}</p>
        <p><strong>👤 Добавил:</strong> ${marker.user}</p>
        <p><strong>📅 Дата добавления:</strong> ${new Date(marker.timestamp).toLocaleString()}</p>
        <p><strong>🚨 Срочность:</strong> ${getUrgencyName(marker.urgency)}</p>
        <p><strong>📝 Описание:</strong><br>${marker.description}</p>
        <p><strong>📊 Статус:</strong> <span class="status-badge ${marker.solved ? 'status-solved' : 'status-active'}">
            ${marker.solved ? '✅ Решено' : '⚠️ Активно'}
        </span></p>
    `;

    if (marker.solved && marker.solvedDate) {
        details += `<p><strong>✅ Дата решения:</strong> ${new Date(marker.solvedDate).toLocaleString()}</p>`;
    }

    if (marker.photo) {
        details += `<p><strong>📷 Фото:</strong></p><img src="${marker.photo}" alt="Фото проблемы" style="max-width:100%; border-radius:5px;">`;
    }

    document.getElementById('details-body').innerHTML = details;
    document.getElementById('details-modal').style.display = 'flex';
}

function closeDetails() {
    document.getElementById('details-modal').style.display = 'none';
}

// Сохранение новой метки
async function saveMarker() {
    if (!selectedCoords) {
        alert('Выберите место на карте!');
        return;
    }

    const description = document.getElementById('problem-description').value.trim();
    if (!description) {
        alert('Введите описание проблемы');
        return;
    }

    const type = document.getElementById('problem-type').value;
    const urgency = document.getElementById('urgency').value;
    const photoFile = document.getElementById('photo').files[0];

    // Определяем количество баллов в зависимости от срочности
    let pointsEarned = POINTS.ADD_PROBLEM;
    if (urgency === 'high') pointsEarned = 15;
    else if (urgency === 'low') pointsEarned = 5;

    // Создаем ID
    const id = `marker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Загружаем фото если есть
    let photoUrl = null;
    if (photoFile) {
        try {
            photoUrl = await uploadPhotoToDisk(photoFile);
            if (photoUrl) {
                pointsEarned += POINTS.UPLOAD_PHOTO; // Бонус за фото
            }
        } catch (error) {
            console.error('Ошибка обработки фото:', error);
        }
    }

    // Создаем объект метки
    const marker = {
        id: id,
        lat: selectedCoords[0],
        lng: selectedCoords[1],
        user: currentUser,
        description: description,
        type: type,
        urgency: urgency,
        photo: photoUrl,
        timestamp: Date.now(),
        solved: false
    };

    // Сохраняем локально
    const allMarkers = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    allMarkers[id] = marker;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allMarkers));

    // Сохраняем на Яндекс Диск
    await saveToYandexDisk(allMarkers);

    // Добавляем на карту
    addMarkerToMap(marker, id);

    // Начисляем баллы
    addPoints(pointsEarned, `Добавлена проблема: ${description.substring(0, 30)}...`);

    // Открываем баллун новой метки
    markers[id].balloon.open();

    // Закрываем модалку и сбрасываем
    closeModal();
    selectedCoords = null;

    alert('✅ Проблема добавлена!');
}

// Отметить как решено
async function markAsCleaned() {
    if (!selectedMarkerId) return;

    const allMarkers = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    const marker = allMarkers[selectedMarkerId];

    if (!marker) return;

    // Проверяем, не отмечает ли пользователь чужую проблему
    if (marker.user !== currentUser) {
        if (!confirm('Вы отмечаете чужую проблему как решенную. Продолжить?')) {
            return;
        }
    }

    marker.solved = true;
    marker.solvedDate = Date.now();

    // Обновляем иконку на карте
    if (markers[selectedMarkerId]) {
        markers[selectedMarkerId].options.set('preset', 'islands#greenIcon');
    }

    // Сохраняем
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allMarkers));
    await saveToYandexDisk(allMarkers);

    // Начисляем баллы (тому, кто добавил проблему)
    if (marker.user !== currentUser) {
        // Если чужую проблему, начисляем меньше
        addPoints(POINTS.SOLVE_PROBLEM / 2, `Помощь в решении проблемы: ${marker.description.substring(0, 30)}...`);

        // Добавляем баллы автору
        const pointsData = JSON.parse(localStorage.getItem(POINTS_KEY)) || {};
        pointsData[marker.user] = (pointsData[marker.user] || 0) + POINTS.SOLVE_PROBLEM;
        localStorage.setItem(POINTS_KEY, JSON.stringify(pointsData));
    } else {
        addPoints(POINTS.SOLVE_PROBLEM, `Проблема решена: ${marker.description.substring(0, 30)}...`);
    }

    alert('✅ Проблема отмечена как решенная!');
    closeDetails();
}

// Вспомогательные функции
function addMarkerAtCenter() {
    selectedCoords = map.getCenter();
    openAddMarkerModal();
}

function useMyLocation() {
    if (!navigator.geolocation) {
        alert('Геолокация не поддерживается вашим браузером');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            selectedCoords = [position.coords.latitude, position.coords.longitude];

            // Центрируем карту
            map.setCenter(selectedCoords, 16);

            // Открываем модалку для добавления
            setTimeout(() => openAddMarkerModal(), 500);
        },
        (error) => {
            alert('Не удалось получить ваше местоположение: ' + error.message);
        }
    );
}

function getProblemTypeName(type) {
    const types = {
        'trash': '🗑️ Мусор',
        'water': '💧 Загрязнение воды',
        'air': '🌫️ Загрязнение воздуха',
        'tree': '🌳 Вырубка деревьев',
        'other': '❓ Другое'
    };
    return types[type] || 'Неизвестно';
}

function getUrgencyName(urgency) {
    const urgencies = {
        'low': 'Низкая',
        'medium': 'Средняя',
        'high': 'Высокая'
    };
    return urgencies[urgency] || 'Не указана';
}

// Работа с мероприятиями
function loadUserEvents() {
    if (!currentUser) return;
    userEvents = JSON.parse(localStorage.getItem(`${USER_EVENTS_KEY}_${currentUser}`)) || [];
}

function loadEvents() {
    const events = JSON.parse(localStorage.getItem(EVENTS_KEY)) || [];
    const eventsList = document.getElementById('events-list');

    if (!eventsList) return;

    if (events.length === 0) {
        eventsList.innerHTML = '<p class="no-data">Пока нет запланированных мероприятий. Будьте первым, кто создаст событие!</p>';
        return;
    }

    // Сортируем по дате (ближайшие первыми)
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    eventsList.innerHTML = events.map(event => {
        const isJoined = userEvents.includes(event.id);
        const eventDate = new Date(event.date).toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="event-card">
                <h3>${event.title}</h3>
                <div class="event-meta">
                    <span>📅 ${eventDate}</span>
                    <span>📍 ${event.location}</span>
                </div>
                <p>${event.description}</p>
                <div class="event-points">+${event.points} баллов за участие</div>
                <button class="join-event-btn ${isJoined ? 'joined' : ''}" 
                        onclick="joinEvent('${event.id}')"
                        ${isJoined ? 'disabled' : ''}>
                    ${isJoined ? '✓ Вы участвуете' : 'Участвовать'}
                </button>
            </div>
        `;
    }).join('');
}

function joinEvent(eventId) {
    if (!currentUser) {
        alert('Войдите в систему, чтобы участвовать в мероприятиях');
        return;
    }

    if (userEvents.includes(eventId)) {
        alert('Вы уже участвуете в этом мероприятии');
        return;
    }

    const events = JSON.parse(localStorage.getItem(EVENTS_KEY)) || [];
    const event = events.find(e => e.id === eventId);

    if (!event) return;

    userEvents.push(eventId);
    localStorage.setItem(`${USER_EVENTS_KEY}_${currentUser}`, JSON.stringify(userEvents));

    // Начисляем баллы
    addPoints(event.points, `Участие в мероприятии: ${event.title}`);

    // Обновляем отображение
    loadEvents();

    alert(`Вы записаны на мероприятие! +${event.points} баллов начислено.`);
}

function showAddEventModal() {
    if (!currentUser) {
        alert('Войдите в систему, чтобы добавлять мероприятия');
        return;
    }

    document.getElementById('event-modal').style.display = 'flex';
}

function closeEventModal() {
    document.getElementById('event-modal').style.display = 'none';
    // Очищаем поля
    document.getElementById('event-title').value = '';
    document.getElementById('event-description').value = '';
    document.getElementById('event-date').value = '';
    document.getElementById('event-location').value = '';
    document.getElementById('event-points').value = '50';
}

function saveEvent() {
    const title = document.getElementById('event-title').value.trim();
    const description = document.getElementById('event-description').value.trim();
    const date = document.getElementById('event-date').value;
    const location = document.getElementById('event-location').value.trim();
    const points = parseInt(document.getElementById('event-points').value);

    if (!title || !description || !date || !location || !points) {
        alert('Заполните все поля');
        return;
    }

    const event = {
        id: `event_${Date.now()}`,
        title,
        description,
        date,
        location,
        points,
        creator: currentUser,
        created: Date.now()
    };

    const events = JSON.parse(localStorage.getItem(EVENTS_KEY)) || [];
    events.push(event);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));

    closeEventModal();
    loadEvents();

    alert('Мероприятие добавлено!');
}

// Эко-гид
function loadEcoGuide() {
    const guideContainer = document.getElementById('eco-guide');

    if (!guideContainer) return;

    guideContainer.innerHTML = ecoGuideArticles.map(article => `
        <div class="eco-card">
            <div class="eco-card-image" style="background-image: url('${article.image}')">
                <span class="eco-card-category">${article.category}</span>
            </div>
            <div class="eco-card-content">
                <h3>${article.title}</h3>
                <p>${article.description}</p>
                <button class="read-more-btn" onclick="showArticle(${article.id})">Читать далее</button>
            </div>
        </div>
    `).join('');
}

function showArticle(articleId) {
    const article = ecoGuideArticles.find(a => a.id === articleId);
    if (!article) return;

    // Создаем модальное окно для статьи
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <h2>${article.title}</h2>
            <div style="margin: 20px 0;">
                <img src="${article.image}" alt="${article.title}" style="width:100%; border-radius:5px;">
            </div>
            <p style="line-height:1.8;">${article.content}</p>
            <div class="modal-buttons">
                <button onclick="this.closest('.modal').remove()" class="btn-primary">Закрыть</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Закрытие по клику вне модального окна
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Рейтинг
function loadRating() {
    const pointsData = JSON.parse(localStorage.getItem(POINTS_KEY)) || {};
    const ratingTable = document.getElementById('rating-table');

    if (!ratingTable) return;

    // Преобразуем в массив и сортируем
    const rating = Object.entries(pointsData)
        .map(([name, points]) => ({ name, points }))
        .filter(user => user.points > 0)
        .sort((a, b) => b.points - a.points);

    if (rating.length === 0) {
        ratingTable.innerHTML = '<p class="no-data">Пока нет активных участников. Будьте первым!</p>';
        return;
    }

    ratingTable.innerHTML = rating.map((user, index) => {
        let positionClass = '';
        let medal = '';

        if (index === 0) {
            positionClass = 'gold';
            medal = '🥇';
        } else if (index === 1) {
            positionClass = 'silver';
            medal = '🥈';
        } else if (index === 2) {
            positionClass = 'bronze';
            medal = '🥉';
        } else {
            medal = '📌';
        }

        return `
            <div class="rating-row">
                <span class="rating-position ${positionClass}">${medal} ${index + 1}</span>
                <span class="rating-name">${user.name}</span>
                <span class="rating-points">${user.points} баллов</span>
                <span class="rating-badge">${getUserBadge(user.points)}</span>
            </div>
        `;
    }).join('');
}

function getUserBadge(points) {
    if (points >= 1000) return '🏆 Эко-легенда';
    if (points >= 500) return '⭐ Эко-герой';
    if (points >= 200) return '🌟 Эко-активист';
    if (points >= 50) return '🌱 Эко-новичок';
    return '🌿 Новичок';
}

function filterRating(period) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Здесь можно добавить реальную фильтрацию по периоду
    // Пока просто показываем уведомление
    showNotification(`Показан рейтинг за ${period === 'all' ? 'все время' : period === 'month' ? 'месяц' : 'неделю'}`);
    loadRating();
}

// Экспорт/импорт
function exportData() {
    const allMarkers = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    const pointsData = JSON.parse(localStorage.getItem(POINTS_KEY)) || {};
    const events = JSON.parse(localStorage.getItem(EVENTS_KEY)) || [];

    const fullExport = {
        markers: allMarkers,
        points: pointsData,
        events: events,
        exportDate: new Date().toISOString(),
        version: '2.0'
    };

    const dataStr = JSON.stringify(fullExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `ecocity_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();

    alert('✅ Все данные экспортированы в файл JSON');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const imported = JSON.parse(e.target.result);

                // Проверяем версию и структуру
                if (imported.markers && imported.points) {
                    // Новый формат
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(imported.markers));
                    localStorage.setItem(POINTS_KEY, JSON.stringify(imported.points));

                    if (imported.events) {
                        localStorage.setItem(EVENTS_KEY, JSON.stringify(imported.events));
                    }

                    // Сохраняем на Яндекс Диск
                    await saveToYandexDisk(imported.markers);
                } else {
                    // Старый формат (только маркеры)
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
                    await saveToYandexDisk(imported);
                }

                // Перезагружаем страницу
                alert('✅ Данные успешно импортированы! Страница будет перезагружена.');
                location.reload();
            } catch (error) {
                alert('❌ Ошибка при импорте данных: ' + error.message);
            }
        };

        reader.readAsText(file);
    };

    input.click();
}

// Автосохранение на Яндекс Диск каждые 5 минут
setInterval(async () => {
    const allMarkers = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    if (Object.keys(allMarkers).length > 0) {
        await saveToYandexDisk(allMarkers);
        console.log('Автосохранение на Яндекс Диск выполнено');
    }
}, 5 * 60 * 1000);