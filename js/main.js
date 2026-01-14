// Основная логика приложения
// 🔧 ИСПРАВЛЕНИЕ: Делаем переменные глобально доступными
window.offers = [];
window.currentEditOffer = null;
window.features = [];

// 🔧 ИСПРАВЛЕНИЕ: Делаем иконки глобально доступными
window.icons = {
    'bolt': '⚡',
    'shield-alt': '🛡️',
    'star': '⭐',
    'rocket': '🚀',
    'wallet': '💰',
    'clock': '⏱️',
    'gem': '💎',
    'trophy': '🏆'
};

window.reviewIcons = {
    'star': '⭐',
    'thumbs-up': '👍',
    'heart': '❤️',
    'award': '🏆'
};

// ===== ФУНКЦИИ ДЛЯ РАБОТЫ С ДАННЫМИ =====

// Загрузка данных
function loadData() {
    try {
        const savedOffers = localStorage.getItem('admin_offers_v2_1');
        if (savedOffers) {
            window.offers = JSON.parse(savedOffers);
        }
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        window.offers = [];
    }
}

// Сохранение данных
function saveData() {
    try {
        localStorage.setItem('admin_offers_v2_1', JSON.stringify(window.offers));
        updateUI();
        // 🔧 ИСПРАВЛЕНИЕ: Проверяем существование функции перед вызовом
        if (typeof updatePreview === 'function') {
            updatePreview();
        }
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        showNotification('Ошибка сохранения данных', 'error');
    }
}

// 🔧 ИСПРАВЛЕНИЕ: Делаем функции глобально доступными
window.loadData = loadData;
window.saveData = saveData;

// Инициализация примеров данных
function initExampleData() {
    window.offers = [
        // ... ваш массив offers (оставьте без изменений)
    ];
    saveData();
}

// Форматирование числа
function formatNumber(num) {
    // ... ваш код formatNumber (оставьте без изменений)
}
window.formatNumber = formatNumber; // 🔧 Делаем глобальной

// Показать уведомление
function showNotification(message, type = 'info') {
    // ... ваш код showNotification (оставьте без изменений)
}
window.showNotification = showNotification; // 🔧 Делаем глобальной

// ===== ОСНОВНЫЕ ФУНКЦИИ ПРИЛОЖЕНИЯ =====

// Инициализация приложения
function initAdminApp() {
    // Загрузка данных
    loadData();
    
    // Инициализация примера данных если нет сохраненных
    if (window.offers.length === 0) {
        initExampleData();
    }
    
    // Рендер интерфейса
    renderAdminInterface();
    
    // Обновление UI
    updateUI();
    
    // Инициализация обработчиков
    initEventHandlers();
}
window.initAdminApp = initAdminApp; // 🔧 КРИТИЧЕСКО ВАЖНО: Делаем глобальной

// Рендер интерфейса админ-панели
function renderAdminInterface() {
    // ... ваш код renderAdminInterface (оставьте без изменений)
}

// Инициализация обработчиков событий
function initEventHandlers() {
    // ... ваш код initEventHandlers (оставьте без изменений)
}

// Переключение вкладок - 🔧 КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ
function switchTab(tab) {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;
    
    // Скрываем все контенты
    contentArea.innerHTML = '';
    
    // 🔧 ИСПРАВЛЕНИЕ: Проверяем существование функций перед вызовом
    if (tab === 'offers') {
        if (typeof renderOffersTab === 'function') {
            contentArea.innerHTML = renderOffersTab();
            if (typeof initOffersHandlers === 'function') initOffersHandlers();
        } else {
            contentArea.innerHTML = '<div class="empty-state"><p>Модуль офферов не загружен</p></div>';
        }
    } else if (tab === 'preview') {
        if (typeof renderPreviewTab === 'function') {
            contentArea.innerHTML = renderPreviewTab();
            if (typeof initPreviewHandlers === 'function') initPreviewHandlers();
        } else {
            contentArea.innerHTML = '<div class="empty-state"><p>Модуль предпросмотра не загружен</p></div>';
        }
    } else if (tab === 'settings') {
        if (typeof renderSettingsTab === 'function') {
            contentArea.innerHTML = renderSettingsTab();
            if (typeof initSettingsHandlers === 'function') initSettingsHandlers();
        } else {
            contentArea.innerHTML = '<div class="empty-state"><p>Модуль настроек не загружен</p></div>';
        }
    }
}
window.switchTab = switchTab; // 🔧 Делаем глобальной

// Обновить UI - 🔧 ИСПРАВЛЕНИЕ
function updateUI() {
    // 🔧 ИСПРАВЛЕНИЕ: Проверяем существование функции перед вызовом
    if (typeof renderOffersList === 'function') {
        renderOffersList();
    }
    updateStats();
}
window.updateUI = updateUI; // 🔧 Делаем глобальной

// Обновить статистику
function updateStats() {
    const totalOffers = window.offers.length;
    const activeOffers = window.offers.filter(o => o.status === 'active').length;
    const landing1Offers = window.offers.filter(o => o.landing1 && o.status === 'active').length;
    const landing2Offers = window.offers.filter(o => o.landing2 && o.status === 'active').length;
    
    const totalElement = document.getElementById('total-offers');
    const activeElement = document.getElementById('active-offers');
    const landing1Element = document.getElementById('landing1-count');
    const landing2Element = document.getElementById('landing2-count');
    
    if (totalElement) totalElement.textContent = totalOffers;
    if (activeElement) activeElement.textContent = activeOffers;
    if (landing1Element) landing1Element.textContent = landing1Offers;
    if (landing2Element) landing2Element.textContent = landing2Offers;
}

// Выход из системы
function logout() {
    localStorage.removeItem('admin_auth_data');
    sessionStorage.removeItem('admin_auth_data');
    window.location.href = 'auth.html';
}
window.logout = logout; // 🔧 Делаем глобальной (уже есть в auth.js, но для надёжности)
