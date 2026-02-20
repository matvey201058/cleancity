// Конфигурация Яндекс Диска
const YANDEX_DISK_CONFIG = {
    // ПОЛУЧИТЕ ТОКЕН: https://oauth.yandex.ru/
    // 1. Зарегистрируйте приложение
    // 2. Получите OAuth токен
    // 3. Вставьте сюда
    ACCESS_TOKEN: 'y0__xCQgbD5Bhj6pj0gsu24vxbPU98PhGUW3kPyGTmMDuLwMPcPag',
    
    // Папка в Яндекс Диске для хранения данных
    APP_FOLDER: 'EcoMarker_Data',
    
    // Файл для хранения всех меток
    MARKERS_FILE: 'markers.json',
    
    // Папка для фотографий
    PHOTOS_FOLDER: 'photos'
};

// Класс для работы с Яндекс Диском
class YandexDiskStorage {
    constructor(config) {
        this.config = config;
        this.baseUrl = 'https://cloud-api.yandex.net/v1/disk/resources';
        this.init();
    }

    async init() {
        await this.ensureFolderExists();
    }

    async ensureFolderExists() {
        try {
            // Проверяем существование основной папки
            await this.request(`${this.baseUrl}?path=${this.config.APP_FOLDER}`);
            
            // Проверяем папку для фото
            await this.request(`${this.baseUrl}?path=${this.config.APP_FOLDER}/${this.config.PHOTOS_FOLDER}`);
        } catch (error) {
            // Если папки нет - создаем
            if (error.status === 404) {
                await this.request(`${this.baseUrl}?path=${this.config.APP_FOLDER}`, {
                    method: 'PUT'
                });
                
                await this.request(`${this.baseUrl}?path=${this.config.APP_FOLDER}/${this.config.PHOTOS_FOLDER}`, {
                    method: 'PUT'
                });
                
                console.log('Папки на Яндекс Диске созданы');
            }
        }
    }

    async request(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Authorization': `OAuth ${this.config.ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        };

        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw { status: response.status, ...error };
        }

        return response.json();
    }

    // Сохранить метки на Яндекс Диск
    async saveMarkersToDisk(markers) {
        const url = `${this.baseUrl}/upload?path=${this.config.APP_FOLDER}/${this.config.MARKERS_FILE}&overwrite=true`;
        
        try {
            // Получаем ссылку для загрузки
            const uploadData = await this.request(url, { method: 'GET' });
            
            // Загружаем данные
            const response = await fetch(uploadData.href, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(markers, null, 2)
            });

            if (!response.ok) throw new Error('Upload failed');
            
            console.log('Данные сохранены на Яндекс Диск');
            return true;
        } catch (error) {
            console.error('Ошибка сохранения на Яндекс Диск:', error);
            return false;
        }
    }

    // Загрузить метки с Яндекс Диска
    async loadMarkersFromDisk() {
        const url = `${this.baseUrl}/download?path=${this.config.APP_FOLDER}/${this.config.MARKERS_FILE}`;
        
        try {
            // Получаем ссылку для скачивания
            const downloadData = await this.request(url, { method: 'GET' });
            
            // Скачиваем файл
            const response = await fetch(downloadData.href);
            
            if (!response.ok) throw new Error('Download failed');
            
            const markers = await response.json();
            console.log('Данные загружены с Яндекс Диска');
            return markers;
        } catch (error) {
            console.log('Нет сохраненных данных на Яндекс Диске или ошибка загрузки');
            return {};
        }
    }

    // Загрузить фото на Яндекс Диск
    async uploadPhoto(file) {
        const timestamp = Date.now();
        const filename = `photo_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const path = `${this.config.APP_FOLDER}/${this.config.PHOTOS_FOLDER}/${filename}`;
        
        const url = `${this.baseUrl}/upload?path=${encodeURIComponent(path)}&overwrite=true`;
        
        try {
            // Получаем ссылку для загрузки
            const uploadData = await this.request(url, { method: 'GET' });
            
            // Загружаем файл
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(uploadData.href, {
                method: 'PUT',
                body: file
            });

            if (!response.ok) throw new Error('Photo upload failed');
            
            // Получаем публичную ссылку
            const fileInfo = await this.request(`${this.baseUrl}?path=${encodeURIComponent(path)}&fields=public_key`);
            
            if (fileInfo.public_key) {
                return `https://yadi.sk/d/${fileInfo.public_key}`;
            }
            
            return null;
        } catch (error) {
            console.error('Ошибка загрузки фото:', error);
            return null;
        }
    }
}

// Создаем экземпляр хранилища
const diskStorage = new YandexDiskStorage(YANDEX_DISK_CONFIG);

// Функции для использования в основном скрипте
async function saveToYandexDisk(markers) {
    try {
        await diskStorage.saveMarkersToDisk(markers);
        return true;
    } catch (error) {
        console.error('Не удалось сохранить на Яндекс Диск:', error);
        return false;
    }
}

async function loadFromYandexDisk() {
    try {
        const markers = await diskStorage.loadMarkersFromDisk();
        return markers;
    } catch (error) {
        console.error('Не удалось загрузить с Яндекс Диска:', error);
        return {};
    }
}

async function uploadPhotoToDisk(file) {
    try {
        const url = await diskStorage.uploadPhoto(file);
        return url;
    } catch (error) {
        console.error('Не удалось загрузить фото:', error);
        return null;
    }
}