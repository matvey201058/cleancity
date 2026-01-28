// Основные переменные
let map;
let markers = {};
let currentUser = null;
let selectedCoords = null;
let selectedMarkerId = null;

// Локальное хранилище
const STORAGE_KEY = 'ecoMarkers_v2';
const USER_KEY = 'ecoMarkerUser';

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    await initMap();
    await loadUser();
    await loadAllMarkers();
    updateUI();
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
    document.getElementById('user-status').textContent = `👤 ${currentUser}`;
    alert(`Добро пожаловать, ${currentUser}!`);
    updateUI();
}

function logout() {
    currentUser = null;
    localStorage.removeItem(USER_KEY);
    document.getElementById('user-status').textContent = 'Гость';
    document.getElementById('user-name').value = '';
    updateUI();
}

function updateUI() {
    const isLoggedIn = !!currentUser;
    document.getElementById('user-name').disabled = isLoggedIn;
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
    const iconColor = data.solved ? 'green' : 'red';
    
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
    
    placemark.events.add('click', function() {
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
    
    // Создаем ID
    const id = `marker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Загружаем фото если есть
    let photoUrl = null;
    if (photoFile) {
        try {
            photoUrl = await uploadPhotoToDisk(photoFile);
            if (!photoUrl) {
                // Если не удалось на Яндекс Диск, сохраняем локально
                photoUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(photoFile);
                });
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
    
    marker.solved = true;
    marker.solvedDate = Date.now();
    
    // Обновляем иконку на карте
    if (markers[selectedMarkerId]) {
        markers[selectedMarkerId].options.set('preset', 'islands#greenIcon');
    }
    
    // Сохраняем
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allMarkers));
    await saveToYandexDisk(allMarkers);
    
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

// Экспорт/импорт
function exportData() {
    const allMarkers = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    const dataStr = JSON.stringify(allMarkers, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `ecomarker_backup_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    
    alert('✅ Данные экспортированы в файл JSON');
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
                const importedMarkers = JSON.parse(e.target.result);
                
                // Объединяем с существующими
                const currentMarkers = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
                const mergedMarkers = { ...currentMarkers, ...importedMarkers };
                
                // Сохраняем
                localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedMarkers));
                await saveToYandexDisk(mergedMarkers);
                
                // Перезагружаем карту
                location.reload();
                
                alert('✅ Данные успешно импортированы!');
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