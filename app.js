//Welcome to JSCompile. Click on Run Code to get started.

console.log("hello JSCompile")// ══════════════════════════════════════════════════════════
// ЧИСТЫЙ ГОРОД — app.js
// Firebase + 2GIS MapGL
// ══════════════════════════════════════════════════════════

// ── State ──────────────────────────────────────────────────
let currentUser = null;
let map = null;
let markers2gis = {};
let tempMarkerCoords = null;
let selectedProblemType = 'trash';
let selectedUrgency = 'medium';
let activeFilter = 'all';
let currentProblemId = null;
let allProblems = [];

// Firebase refs (populated after firebase-ready)
let auth, db, fns;

// ── Eco Guide articles ─────────────────────────────────────
const ECO_ARTICLES = [
    {
        id: 'sort',
        emoji: '♻️',
        bg: '#d8f3dc',
        title: 'Как правильно сортировать мусор',
        short: 'Раздельный сбор отходов — первый шаг к чистой планете. Узнайте, что куда.',
        content: `<p>Сортировка мусора — важная привычка, которая помогает снизить объём отходов на полигонах и даёт вторую жизнь ресурсам.</p>
        <h4>🟡 Жёлтый контейнер — пластик и металл</h4>
        <p>Пластиковые бутылки, крышки, упаковки от продуктов, банки из-под консервов.</p>
        <h4>🔵 Синий контейнер — бумага и картон</h4>
        <p>Газеты, журналы, коробки, упаковки. Мокрую бумагу не принимают.</p>
        <h4>🟢 Зелёный контейнер — стекло</h4>
        <p>Бутылки, банки, стеклянная тара. Без зеркал и оконного стекла.</p>
        <h4>⚫ Серый/чёрный — несортируемый остаток</h4>
        <p>То, что не вошло в другие категории.</p>`
    },
    {
        id: 'batteries',
        emoji: '🔋',
        bg: '#fef9c3',
        title: 'Куда сдать батарейки и лампочки',
        short: 'Батарейки нельзя выбрасывать с обычным мусором — они токсичны.',
        content: `<p>Одна батарейка загрязняет 400 литров воды или 20 кг почвы. Сдавайте батарейки в специальные пункты приёма.</p>
        <h4>Где принимают:</h4>
        <ul>
        <li>Магазины «Леруа Мерлен», «ОБИ», «Ашан»</li>
        <li>Гипермаркеты «ИКЕА»</li>
        <li>Многие школы и офисы</li>
        <li>Сайт <strong>recyclemap.ru</strong> — карта пунктов приёма</li>
        </ul>
        <h4>Энергосберегающие лампочки:</h4>
        <p>Содержат ртуть. Сдавать только в специальные пункты, ни в коем случае не разбивать.</p>`
    },
    {
        id: 'water',
        emoji: '💧',
        bg: '#e0f2fe',
        title: 'Береги воду: 10 простых привычек',
        short: 'Пресная вода — самый ценный ресурс. Вот как её экономить.',
        content: `<p>Пресная вода составляет лишь 2,5% от всей воды на Земле. Эти простые привычки помогут её сберечь:</p>
        <ol>
        <li>Закрывайте кран во время чистки зубов (экономия — 6 л/мин)</li>
        <li>Принимайте душ вместо ванны (в 4 раза меньше воды)</li>
        <li>Запускайте стиральную машину только с полной загрузкой</li>
        <li>Устраните протечки — капающий кран теряет 15 л в сутки</li>
        <li>Поливайте растения утром или вечером, когда меньше испарение</li>
        </ol>`
    },
    {
        id: 'trees',
        emoji: '🌳',
        bg: '#dcfce7',
        title: 'Почему деревья — лёгкие города',
        short: 'Одно взрослое дерево поглощает столько CO₂, сколько выделяет автомобиль за 20 000 км.',
        content: `<p>Городские деревья — это не просто красота, это жизненно важная инфраструктура.</p>
        <h4>Что даёт одно дерево в год:</h4>
        <ul>
        <li>Поглощает до 120 кг CO₂</li>
        <li>Выделяет кислород для 10 человек</li>
        <li>Снижает температуру воздуха вокруг на 2–8°C</li>
        <li>Задерживает до 200 кг пыли</li>
        </ul>
        <h4>Что делать если срубают здоровое дерево:</h4>
        <p>Проверьте наличие порубочного разрешения у рабочих. Без документов — вызывайте полицию и фиксируйте на видео.</p>`
    },
    {
        id: 'plastic',
        emoji: '🛍️',
        bg: '#fce7f3',
        title: 'Жизнь без пластика: с чего начать',
        short: 'Пластиковые пакеты используются в среднем 12 минут, а разлагаются 400 лет.',
        content: `<p>Отказаться от одноразового пластика проще, чем кажется. Начните с этих шагов:</p>
        <h4>Простые замены:</h4>
        <ul>
        <li>Пластиковый пакет → тканевая сумка</li>
        <li>Одноразовая бутылка → многоразовая (сэкономите 10 000 рублей в год)</li>
        <li>Пластиковые столовые приборы → металлические</li>
        <li>Пластиковая соломинка → металлическая или бумажная</li>
        </ul>
        <p>Каждый отказ от одноразового пластика — реальный вклад в здоровье океанов.</p>`
    },
    {
        id: 'air',
        emoji: '🌫️',
        bg: '#f0f9ff',
        title: 'Чистый воздух: источники загрязнения',
        short: 'Загрязнённый воздух ежегодно сокращает продолжительность жизни в России на 1,5–2 года.',
        content: `<p>Главные источники загрязнения воздуха в городах и что с этим делать:</p>
        <h4>🚗 Транспорт (50–70% городских выбросов)</h4>
        <p>Пересаживайтесь на велосипед, самокат или общественный транспорт хотя бы несколько дней в неделю.</p>
        <h4>🏭 Промышленность</h4>
        <p>Сообщайте о нарушениях в Роспотребнадзор (номер 8-800-555-49-43).</p>
        <h4>🔥 Сжигание мусора</h4>
        <p>Сжигание 1 кг отходов выделяет сотни токсичных веществ. Фиксируйте нарушителей и сообщайте в экологическую инспекцию.</p>`
    }
];

// ── Problem types config ───────────────────────────────────
const PROBLEM_TYPES = {
    trash:  { label: 'Мусор',     emoji: '🗑️', color: '#e74c3c' },
    water:  { label: 'Вода',      emoji: '💧', color: '#2b7a9f' },
    air:    { label: 'Воздух',    emoji: '🌫️', color: '#95a5a6' },
    tree:   { label: 'Деревья',   emoji: '🌳', color: '#27ae60' },
    other:  { label: 'Другое',    emoji: '❓', color: '#8e44ad' }
};

const URGENCY_POINTS = { low: 5, medium: 10, high: 15 };

// ══════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════
document.addEventListener('firebase-ready', initApp);

function initApp() {
    auth = window.firebaseAuth;
    db = window.firebaseDb;
    fns = window.firebaseFns;

    // Auth state listener
    fns.onAuthStateChanged(auth, user => {
        if (user) {
            currentUser = user;
            showApp(user);
        } else {
            currentUser = null;
            showAuthScreen();
        }
    });

    // Google sign in
    document.getElementById('google-sign-in').addEventListener('click', async () => {
        try {
            await fns.signInWithPopup(auth, window.googleProvider);
        } catch (e) {
            showToast('Ошибка входа: ' + e.message);
        }
    });

    // Sign out
    document.getElementById('sign-out-btn').addEventListener('click', () => {
        fns.signOut(auth);
    });

    setupUI();
}

// ══════════════════════════════════════════════════════════
// AUTH UI
// ══════════════════════════════════════════════════════════
function showAuthScreen() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
}

async function showApp(user) {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

    // Update UI
    document.getElementById('user-name').textContent = user.displayName || 'Пользователь';
    const avatar = document.getElementById('user-avatar');
    if (user.photoURL) {
        avatar.src = user.photoURL;
    } else {
        avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=2d6a4f&color=fff`;
    }

    // Ensure user doc exists in Firestore
    await ensureUserDoc(user);

    // Load user points
    loadUserPoints();

    // Init map
    if (!map) initMap();

    // Load data
    loadProblems();
    loadEvents();
    loadRating();
    renderEcoGuide();
}

async function ensureUserDoc(user) {
    try {
        const userRef = fns.doc(db, 'users', user.uid);
        const snap = await fns.getDoc(userRef);
        if (!snap.exists()) {
            await fns.setDoc(userRef, {
                name: user.displayName || 'Пользователь',
                email: user.email,
                photoURL: user.photoURL || '',
                points: 0,
                problemsCount: 0,
                solvedCount: 0,
                createdAt: fns.Timestamp.now()
            });
        }
    } catch (e) {
        console.warn('Could not ensure user doc:', e);
    }
}

// ══════════════════════════════════════════════════════════
// 2GIS MAP (ИСПРАВЛЕННАЯ ВЕРСИЯ)
// ══════════════════════════════════════════════════════════
function initMap() {
    map = new mapgl.Map('map', {
        center: [47.8864, 56.6344], // Йошкар-Ола
        zoom: 13,
        key: '94eeaf1e-53b8-429d-9cc2-a6c4fd844057',
        lang: 'ru'
    });

    // Добавляем обработчик клика с правильной проверкой
    // Клик по карте — только в ручном pick mode
    map.on('click', function(e) {
        if (!window._pickMode) return;
        window._pickMode = false;
        document.getElementById('map').style.cursor = '';

        const [lng, lat] = e.lngLat;
        tempMarkerCoords = { lat, lng };
        addTempMarker(lat, lng);

        // Возвращаем форму с обновлёнными координатами
        openAddProblemModal(false);
    });;
    
    // Добавляем обработчик ошибок карты
    map.on('error', function(e) {
        console.error('Ошибка карты:', e);
        showToast('Ошибка загрузки карты');
    });
}

// Временный маркер для визуализации выбранной точки
function addTempMarker(lat, lng) {
    // Удаляем предыдущий временный маркер, если есть
    if (window.tempMarker) {
        window.tempMarker.destroy();
    }
    
    // Создаем новый временный маркер
    const el = document.createElement('div');
    el.innerHTML = `<div style="
        width: 20px;
        height: 20px;
        background: #f4c430;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        animation: pulse 1.5s infinite;
    "></div>`;
    
    // Добавляем стиль анимации, если его нет
    if (!document.getElementById('temp-marker-style')) {
        const style = document.createElement('style');
        style.id = 'temp-marker-style';
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.3); opacity: 0.8; }
                100% { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    window.tempMarker = new mapgl.HtmlMarker(map, {
        coordinates: [lng, lat],
        html: el.innerHTML,
        anchor: [0.5, 0.5]
    });
}

function addMapMarker(problem) {
    if (!map) return;
    const type = PROBLEM_TYPES[problem.type] || PROBLEM_TYPES.other;
    const statusColor = problem.status === 'resolved' ? '#27ae60'
        : problem.status === 'in-progress' ? '#f59e0b' : '#e74c3c';

    const el = document.createElement('div');
    el.innerHTML = `<div style="
        width:40px;height:40px;
        background:${statusColor};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        display:flex;align-items:center;justify-content:center;
        border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
        cursor:pointer;
        font-size:16px;
    "><span style="transform:rotate(45deg)">${type.emoji}</span></div>`;

    el.style.cssText = 'width:40px;height:40px;cursor:pointer;';
    el.title = problem.description;

    const marker = new mapgl.HtmlMarker(map, {
        coordinates: [problem.lng, problem.lat],
        html: el.innerHTML,
        anchor: [0.5, 1]
    });

    marker.on('click', () => showProblemDetails(problem.id));
    markers2gis[problem.id] = marker;
}

function clearTempMarker() {
    if (window.tempMarker) {
        window.tempMarker.destroy();
        window.tempMarker = null;
    }
}

// ── ДОБАВЛЕНИЕ МЕТКИ ПО ГЕОЛОКАЦИИ ─────────────────────────
function addMarkerByGeolocation() {
    clearTempMarker();
    tempMarkerCoords = null;

    if (!navigator.geolocation) {
        // Геолокация не поддерживается — открываем форму без координат и предлагаем ввести вручную
        openAddProblemModal(true);
        return;
    }

    // Показываем индикатор загрузки на кнопке
    const btn = document.getElementById('add-marker-btn');
    const origHTML = btn.innerHTML;
    btn.innerHTML = '<span class="geo-spinner"></span><span class="fab-label">Определяю место...</span>';
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            btn.innerHTML = origHTML;
            btn.disabled = false;

            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            tempMarkerCoords = { lat, lng };

            // Центрируем карту на пользователе и ставим временный маркер
            if (map) map.setCenter([lng, lat], { duration: 600, zoom: 16 });
            addTempMarker(lat, lng);
            openAddProblemModal(false);
        },
        (err) => {
            btn.innerHTML = origHTML;
            btn.disabled = false;

            // Геолокация отклонена или недоступна — открываем форму, предлагаем выбрать вручную
            showToast('📍 Геолокация недоступна — выберите место на карте вручную');
            openAddProblemModal(true);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
}

function openAddProblemModal(manualMode = false) {
    // Сбрасываем форму
    document.getElementById('problem-desc').value = '';
    document.getElementById('photo-preview').classList.add('hidden');
    document.getElementById('photo-label-text').textContent = '📷 Выбрать фото';
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === 'trash');
    });
    document.querySelectorAll('.urgency-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.urgency === 'medium');
    });
    selectedProblemType = 'trash';
    selectedUrgency = 'medium';

    // Показываем координаты или инструкцию
    const coordsEl = document.getElementById('modal-coords');
    if (tempMarkerCoords && !manualMode) {
        coordsEl.innerHTML = `<span style="color:var(--green);font-weight:600">✅ Место определено: ${tempMarkerCoords.lat.toFixed(5)}, ${tempMarkerCoords.lng.toFixed(5)}</span>`;
    } else {
        // В ручном режиме — показываем кнопку "выбрать на карте"
        coordsEl.innerHTML = `
            <span id="manual-coords-status" style="color:var(--text-muted)">📍 Место не определено</span>
            <button class="btn-pick-manual" id="pick-manual-btn" onclick="startManualPick()">🗺️ Выбрать на карте</button>
        `;
    }

    document.getElementById('modal-problem').classList.remove('hidden');
}

// Ручной выбор точки: закрываем форму, активируем клик по карте
window._pickMode = false;
function startManualPick() {
    document.getElementById('modal-problem').classList.add('hidden');
    window._pickMode = true;
    showToast('📍 Нажмите на карту, чтобы выбрать место');
    if (map) document.getElementById('map').style.cursor = 'crosshair';
}

function removeMapMarker(id) {
    if (markers2gis[id]) {
        markers2gis[id].destroy();
        delete markers2gis[id];
    }
}

function clearMapMarkers() {
    Object.values(markers2gis).forEach(m => m.destroy());
    markers2gis = {};
}

// ══════════════════════════════════════════════════════════
// PROBLEMS
// ══════════════════════════════════════════════════════════
function loadProblems() {
    if (!db) return;
    const q = fns.query(fns.collection(db, 'problems'), fns.orderBy('createdAt', 'desc'));
    fns.onSnapshot(q, snap => {
        allProblems = [];
        clearMapMarkers();
        snap.forEach(d => {
            const problem = { id: d.id, ...d.data() };
            allProblems.push(problem);
            if (activeFilter === 'all' || activeFilter === problem.type) {
                addMapMarker(problem);
            }
        });
        renderMyProblems();
    });
}

async function saveProblem() {
    if (!currentUser) return;
    const desc = document.getElementById('problem-desc').value.trim();
    if (!desc) { showToast('⚠️ Введите описание проблемы'); return; }
    if (!tempMarkerCoords) { showToast('⚠️ Нажмите на карту, чтобы выбрать место'); return; }

    const btn = document.getElementById('save-problem-btn');
    btn.textContent = 'Сохраняю...'; btn.disabled = true;

    try {
        // Handle photo (base64 for simplicity — in prod use Firebase Storage)
        let photoData = null;
        const photoInput = document.getElementById('problem-photo');
        if (photoInput.files[0]) {
            photoData = await compressImage(photoInput.files[0], 800, 0.75);
        }

        const points = URGENCY_POINTS[selectedUrgency] || 10;
        const problemData = {
            description: desc,
            type: selectedProblemType,
            urgency: selectedUrgency,
            lat: tempMarkerCoords.lat,
            lng: tempMarkerCoords.lng,
            status: 'active',
            authorId: currentUser.uid,
            authorName: currentUser.displayName || 'Пользователь',
            authorPhoto: currentUser.photoURL || '',
            photo: photoData,
            points,
            createdAt: fns.Timestamp.now()
        };

        await fns.addDoc(fns.collection(db, 'problems'), problemData);
        await addUserPoints(points, 'problem');

        closeModal('modal-problem');
        showToast(`✅ Проблема добавлена! +${points} баллов`);
        switchTab('map');
    } catch (e) {
        showToast('Ошибка: ' + e.message);
    }

    btn.textContent = '💾 Сохранить (+10 баллов)'; btn.disabled = false;
}

async function markResolved(problemId) {
    if (!currentUser) return;
    try {
        const ref = fns.doc(db, 'problems', problemId);
        const snap = await fns.getDoc(ref);
        if (!snap.exists()) return;

        await fns.updateDoc(ref, {
            status: 'resolved',
            resolvedBy: currentUser.uid,
            resolvedAt: fns.Timestamp.now()
        });

        await addUserPoints(20, 'solved');
        closeModal('modal-details');
        showToast('🎉 Проблема отмечена как решённая! +20 баллов');
    } catch (e) {
        showToast('Ошибка: ' + e.message);
    }
}

async function markInProgress(problemId) {
    try {
        await fns.updateDoc(fns.doc(db, 'problems', problemId), { status: 'in-progress' });
        closeModal('modal-details');
        showToast('📋 Статус обновлён: «В работе»');
    } catch (e) {
        showToast('Ошибка: ' + e.message);
    }
}

function showProblemDetails(id) {
    const p = allProblems.find(x => x.id === id);
    if (!p) return;
    currentProblemId = id;
    const type = PROBLEM_TYPES[p.type] || PROBLEM_TYPES.other;
    const statusMap = {
        active: '<span class="status-badge active">🔴 Активная</span>',
        'in-progress': '<span class="status-badge in-progress">🟡 В работе</span>',
        resolved: '<span class="status-badge resolved">🟢 Решена</span>'
    };
    const isOwner = currentUser && p.authorId === currentUser.uid;
    const date = p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('ru-RU') : 'Недавно';

    document.getElementById('details-content').innerHTML = `
        ${p.photo ? `<img class="details-img" src="${p.photo}" alt="Фото проблемы">` : ''}
        <div class="details-header">
            <div class="details-meta">
                <span class="card-type">${type.emoji} ${type.label}</span>
                ${statusMap[p.status] || ''}
            </div>
            <div class="details-title">${escapeHtml(p.description)}</div>
            <div class="card-meta">
                <span>👤 ${escapeHtml(p.authorName)}</span>
                <span>📅 ${date}</span>
                <span>📍 ${p.lat?.toFixed(4)}, ${p.lng?.toFixed(4)}</span>
            </div>
        </div>
        <div class="details-actions">
            ${p.status !== 'resolved' ? `<button class="btn-success" onclick="markResolved('${id}')">✅ Решена (+20 баллов)</button>` : ''}
            ${p.status === 'active' ? `<button class="btn-secondary" onclick="markInProgress('${id}')">📋 В работе</button>` : ''}
            <button class="btn-secondary" onclick="panToMarker(${p.lat},${p.lng})">🗺️ На карте</button>
        </div>
    `;
    document.getElementById('modal-details').classList.remove('hidden');
}

function panToMarker(lat, lng) {
    closeModal('modal-details');
    if (map) map.setCenter([lng, lat], { duration: 800 });
    switchTab('map');
}

function renderMyProblems() {
    if (!currentUser) return;
    const container = document.getElementById('myproblems-container');
    const mine = allProblems.filter(p => p.authorId === currentUser.uid);
    if (mine.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="icon">📌</div><p>Вы ещё не добавили ни одной проблемы.<br>Используйте карту, чтобы отметить проблемное место.</p></div>`;
        return;
    }
    container.innerHTML = mine.map(p => renderProblemCard(p)).join('');
}

function renderProblemCard(p) {
    const type = PROBLEM_TYPES[p.type] || PROBLEM_TYPES.other;
    const statusColors = { active: 'red', 'in-progress': 'yellow', resolved: 'green' };
    const statusLabels = { active: '🔴 Активная', 'in-progress': '🟡 В работе', resolved: '🟢 Решена' };
    const date = p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('ru-RU') : '';
    return `
        <div class="card" onclick="showProblemDetails('${p.id}')">
            ${p.photo ? `<img class="card-photo" src="${p.photo}" alt="">` : ''}
            <div class="card-accent ${statusColors[p.status] || 'red'}"></div>
            <div class="card-body">
                <span class="card-type">${type.emoji} ${type.label}</span>
                <div class="card-title">${escapeHtml(p.description.slice(0, 80))}${p.description.length > 80 ? '...' : ''}</div>
                <div class="card-meta">
                    <span class="status-badge ${p.status || 'active'}">${statusLabels[p.status] || '🔴 Активная'}</span>
                    <span>${date}</span>
                </div>
            </div>
        </div>
    `;
}

// ══════════════════════════════════════════════════════════
// EVENTS
// ══════════════════════════════════════════════════════════
function loadEvents() {
    const q = fns.query(fns.collection(db, 'events'), fns.orderBy('date', 'asc'));
    fns.onSnapshot(q, snap => {
        const container = document.getElementById('events-container');
        const events = [];
        snap.forEach(d => events.push({ id: d.id, ...d.data() }));
        if (events.length === 0) {
            container.innerHTML = `<div class="empty-state"><div class="icon">📅</div><p>Пока нет мероприятий.<br>Добавьте первое!</p></div>`;
            return;
        }
        container.innerHTML = events.map(e => renderEventCard(e)).join('');
    });
}

function renderEventCard(e) {
    const date = e.date?.toDate ? e.date.toDate().toLocaleString('ru-RU', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' }) : e.dateStr || '';
    const joined = e.participants?.includes(currentUser?.uid);
    return `
        <div class="card">
            <div class="card-accent"></div>
            <div class="card-body">
                <span class="card-type">📅 Мероприятие</span>
                <div class="card-title">${escapeHtml(e.title)}</div>
                <div class="card-desc">${escapeHtml(e.description || '')}</div>
                <div class="card-meta">
                    <span class="card-meta-item">🕐 ${date}</span>
                    <span class="card-meta-item">📍 ${escapeHtml(e.location || '')}</span>
                </div>
                <div style="margin-top:10px"><span class="points-badge">⭐ +${e.points || 50} баллов за участие</span></div>
            </div>
            <div class="card-actions">
                <button class="${joined ? 'btn-secondary' : 'btn-primary'}"
                    onclick="joinEvent('${e.id}', ${joined})"
                    ${joined ? 'disabled' : ''}>
                    ${joined ? '✅ Вы записаны' : '🙋 Участвовать'}
                </button>
                <span style="font-size:0.8rem;color:var(--text-muted)">${(e.participants?.length || 0)} участников</span>
            </div>
        </div>
    `;
}

async function saveEvent() {
    const title = document.getElementById('event-title').value.trim();
    if (!title) { showToast('⚠️ Введите название мероприятия'); return; }
    const dateVal = document.getElementById('event-date').value;
    let dateTs = null;
    if (dateVal) dateTs = fns.Timestamp.fromDate(new Date(dateVal));

    try {
        await fns.addDoc(fns.collection(db, 'events'), {
            title,
            description: document.getElementById('event-desc').value.trim(),
            date: dateTs,
            dateStr: dateVal,
            location: document.getElementById('event-location').value.trim(),
            points: parseInt(document.getElementById('event-points').value) || 50,
            authorId: currentUser.uid,
            authorName: currentUser.displayName,
            participants: [],
            createdAt: fns.Timestamp.now()
        });
        closeModal('modal-event');
        showToast('✅ Мероприятие добавлено!');
    } catch (e) {
        showToast('Ошибка: ' + e.message);
    }
}

async function joinEvent(eventId, alreadyJoined) {
    if (alreadyJoined || !currentUser) return;
    try {
        const ref = fns.doc(db, 'events', eventId);
        const snap = await fns.getDoc(ref);
        if (!snap.exists()) return;
        const participants = snap.data().participants || [];
        if (participants.includes(currentUser.uid)) return;
        await fns.updateDoc(ref, { participants: [...participants, currentUser.uid] });
        const pts = snap.data().points || 50;
        await addUserPoints(pts, 'event');
        showToast(`🎉 Вы записаны! +${pts} баллов`);
    } catch (e) {
        showToast('Ошибка: ' + e.message);
    }
}

// ══════════════════════════════════════════════════════════
// RATING
// ══════════════════════════════════════════════════════════
async function loadRating() {
    try {
        const q = fns.query(fns.collection(db, 'users'), fns.orderBy('points', 'desc'));
        fns.onSnapshot(q, snap => {
            const container = document.getElementById('rating-container');
            const users = [];
            snap.forEach(d => users.push({ id: d.id, ...d.data() }));
            if (users.length === 0) {
                container.innerHTML = '<div class="empty-state"><div class="icon">🏆</div><p>Рейтинг пока пуст</p></div>';
                return;
            }
            container.innerHTML = users.slice(0, 50).map((u, i) => {
                const pos = i + 1;
                const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : '';
                const posClass = pos <= 3 ? `pos-${pos}` : '';
                const isMe = u.id === currentUser?.uid;
                return `
                    <div class="rating-row" style="${isMe ? 'background:var(--green-pale);border-color:var(--green-light);' : ''}">
                        <div class="rating-pos ${posClass}">${medal || pos}</div>
                        <img class="rating-avatar" src="${u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name||'U')}&background=2d6a4f&color=fff`}" alt="">
                        <div class="rating-info">
                            <div class="rating-name">${escapeHtml(u.name || 'Пользователь')}${isMe ? ' (Вы)' : ''}</div>
                            <div class="rating-activity">🏴 ${u.problemsCount || 0} проблем • ✅ ${u.solvedCount || 0} решено</div>
                        </div>
                        <div class="rating-pts">⭐ ${u.points || 0}</div>
                    </div>
                `;
            }).join('');
        });
    } catch (e) {
        console.warn('Rating load error:', e);
    }
}

// ══════════════════════════════════════════════════════════
// ECO GUIDE
// ══════════════════════════════════════════════════════════
function renderEcoGuide() {
    document.getElementById('ecoguide-container').innerHTML = ECO_ARTICLES.map(a => `
        <div class="ecoguide-card" onclick="showArticle('${a.id}')">
            <div class="ecoguide-emoji" style="background:${a.bg}">${a.emoji}</div>
            <div class="ecoguide-body">
                <div class="card-title">${a.title}</div>
                <div class="card-desc">${a.short}</div>
                <button class="btn-secondary" style="font-size:0.8rem;padding:8px 14px">Читать →</button>
            </div>
        </div>
    `).join('');
}

function showArticle(id) {
    const a = ECO_ARTICLES.find(x => x.id === id);
    if (!a) return;
    document.getElementById('details-content').innerHTML = `
        <div style="text-align:center;font-size:4rem;margin-bottom:16px;padding:24px;background:${a.bg};border-radius:12px">${a.emoji}</div>
        <h2 style="font-family:'Unbounded',sans-serif;font-size:1rem;font-weight:700;color:var(--green-dark);margin-bottom:16px">${a.title}</h2>
        <div style="color:var(--text-muted);line-height:1.7;font-size:0.9rem">${a.content}</div>
    `;
    document.getElementById('modal-details').classList.remove('hidden');
}

// ══════════════════════════════════════════════════════════
// USER POINTS
// ══════════════════════════════════════════════════════════
async function addUserPoints(amount, type) {
    if (!currentUser || !db) return;
    const userRef = fns.doc(db, 'users', currentUser.uid);
    const update = { points: fns.increment(amount) };
    if (type === 'problem') update.problemsCount = fns.increment(1);
    if (type === 'solved') update.solvedCount = fns.increment(1);
    try {
        await fns.updateDoc(userRef, update);
    } catch (e) {
        console.warn('Points update error:', e);
    }
}

async function loadUserPoints() {
    if (!currentUser) return;
    const userRef = fns.doc(db, 'users', currentUser.uid);
    fns.onSnapshot(userRef, snap => {
        if (snap.exists()) {
            const pts = snap.data().points || 0;
            document.getElementById('user-points').textContent = pts;
            document.getElementById('topbar-points').textContent = pts;
        }
    });
}

// ══════════════════════════════════════════════════════════
// UI SETUP
// ══════════════════════════════════════════════════════════
function setupUI() {
    // Tab navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
            closeSidebar();
        });
    });

    // Sidebar
    document.getElementById('menu-btn').addEventListener('click', openSidebar);
    document.getElementById('sidebar-close').addEventListener('click', closeSidebar);
    document.addEventListener('click', e => {
        if (!document.getElementById('sidebar').contains(e.target) &&
            !document.getElementById('menu-btn').contains(e.target)) {
            closeSidebar();
        }
    });

    // Modal closes
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.dataset.modal));
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) closeModal(overlay.id);
        });
    });

        // Add marker button — получает геолокацию и сразу открывает форму
    document.getElementById('add-marker-btn').addEventListener('click', () => {
        if (!currentUser) { showToast('⚠️ Сначала войдите в систему'); return; }
        addMarkerByGeolocation();
    });


    // My location
    document.getElementById('my-location-btn').addEventListener('click', () => {
        if (!navigator.geolocation) { showToast('Геолокация не поддерживается'); return; }
        navigator.geolocation.getCurrentPosition(pos => {
            if (map) map.setCenter([pos.coords.longitude, pos.coords.latitude], { duration: 800, zoom: 15 });
        }, () => showToast('Не удалось получить геолокацию'));
    });

    // Save problem
    document.getElementById('save-problem-btn').addEventListener('click', saveProblem);

    // Problem type buttons
    document.getElementById('problem-type-grid').addEventListener('click', e => {
        const btn = e.target.closest('.type-btn');
        if (!btn) return;
        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedProblemType = btn.dataset.type;
    });

    // Urgency buttons
    document.querySelectorAll('.urgency-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.urgency-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedUrgency = btn.dataset.urgency;
        });
    });

    // Photo preview — сжимает и показывает итоговый размер
    document.getElementById('problem-photo').addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;
        const labelEl = document.getElementById('photo-label-text');
        labelEl.textContent = '⏳ Сжимаю...';
        try {
            const compressed = await compressImage(file, 800, 0.75);
            // base64 overhead ~4/3 → реальный KB ≈ length * 0.75 / 1024
            const kb = Math.round(compressed.length * 0.75 / 1024);
            const img = document.getElementById('photo-preview');
            img.src = compressed;
            img.classList.remove('hidden');
            labelEl.textContent = `✅ Готово · ${kb} КБ`;
        } catch {
            labelEl.textContent = '❌ Не удалось сжать фото';
        }
    });

    // Map filter chips
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeFilter = chip.dataset.filter;
            clearMapMarkers();
            allProblems.forEach(p => {
                if (activeFilter === 'all' || activeFilter === p.type) addMapMarker(p);
            });
        });
    });

    // Add event button
    document.getElementById('add-event-btn').addEventListener('click', () => {
        document.getElementById('event-title').value = '';
        document.getElementById('event-desc').value = '';
        document.getElementById('event-location').value = '';
        document.getElementById('modal-event').classList.remove('hidden');
    });

    // Save event
    document.getElementById('save-event-btn').addEventListener('click', saveEvent);
}

// ══════════════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════════════
const TAB_TITLES = {
    map: '🗺️ Карта проблем',
    events: '📅 Мероприятия',
    ecoguide: '📚 Эко-гид',
    rating: '🏆 Рейтинг',
    myproblems: '📌 Мои отметки'
};

function switchTab(tabName) {
    document.querySelectorAll('.tab-section').forEach(s => {
        s.classList.add('hidden');
        s.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

    const section = document.getElementById(`tab-${tabName}`);
    if (section) { section.classList.remove('hidden'); section.classList.add('active'); }
    const navItem = document.querySelector(`[data-tab="${tabName}"]`);
    if (navItem) navItem.classList.add('active');

    document.getElementById('topbar-title').textContent = TAB_TITLES[tabName] || '';

    if (tabName === 'myproblems') renderMyProblems();
}

function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    let overlay = document.getElementById('sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', closeSidebar);
        document.body.appendChild(overlay);
    }
    overlay.classList.add('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) overlay.classList.remove('active');
}

// ══════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════
function closeModal(id) {
    document.getElementById(id)?.classList.add('hidden');
    
    // Если закрываем модальное окно проблемы, очищаем временный маркер
    if (id === 'modal-problem') {
        clearTempMarker();
        tempMarkerCoords = null;
    }
}

function showToast(msg, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.remove('hidden');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => toast.classList.add('hidden'), duration);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Сжимает фото через Canvas: масштабирует до maxPx и конвертирует в JPEG
// Типичный результат: 5 МБ → ~80 КБ (укладывается в лимит Firestore 1 МБ)
async function compressImage(file, maxPx = 800, quality = 0.75) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = ev => {
            const img = new Image();
            img.onerror = reject;
            img.onload = () => {
                let { naturalWidth: w, naturalHeight: h } = img;
                // Уменьшаем пропорционально по длинной стороне
                if (w > h) { if (w > maxPx) { h = Math.round(h * maxPx / w); w = maxPx; } }
                else        { if (h > maxPx) { w = Math.round(w * maxPx / h); h = maxPx; } }

                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Global functions for onclick handlers
window.showProblemDetails = showProblemDetails;
window.markResolved = markResolved;
window.markInProgress = markInProgress;
window.panToMarker = panToMarker;
window.joinEvent = joinEvent;
window.showArticle = showArticle;
window.switchTab = switchTab;
window.startManualPick = startManualPick;