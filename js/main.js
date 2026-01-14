// ===== КОНФИГУРАЦИЯ =====
const CONFIG = {
    VERSION: '2.1',
    STORAGE_KEY: 'admin_offers',
    ACTIVE_TAB_KEY: 'admin_active_tab'
};

// ===== СОСТОЯНИЕ =====
const state = {
    offers: [],
    currentTab: localStorage.getItem(CONFIG.ACTIVE_TAB_KEY) || 'offers',
    user: { name: 'Администратор', role: 'admin' }
};

// ===== КОМПОНЕНТЫ =====

/**
 * Инициализация приложения
 */
export function initApp() {
    console.log('🚀 Инициализация приложения');
    
    try {
        // Загрузка данных
        loadData();
        
        // Рендер интерфейса
        renderApp();
        
        // Инициализация обработчиков
        initEventListeners();
        
        // Загрузка активной вкладки
        loadTab(state.currentTab);
        
        console.log('✅ Приложение запущено');
        showNotification('Приложение загружено', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        showError('Ошибка запуска приложения');
    }
}

/**
 * Загрузка данных
 */
function loadData() {
    try {
        const data = localStorage.getItem(CONFIG.STORAGE_KEY);
        state.offers = data ? JSON.parse(data) : [];
        
        if (state.offers.length === 0) {
            createDemoData();
        }
        
        console.log(`📊 Загружено офферов: ${state.offers.length}`);
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        state.offers = [];
        createDemoData();
    }
}

/**
 * Сохранение данных
 */
function saveData() {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state.offers));
        console.log('💾 Данные сохранены');
        return true;
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        showNotification('Ошибка сохранения данных', 'error');
        return false;
    }
}

/**
 * Создание демо данных
 */
function createDemoData() {
    state.offers = [
        {
            id: generateId(),
            name: 'Моментальные деньги',
            description: 'Займы до 100 000 ₽ на карту',
            status: 'active',
            income: 50000
        },
        {
            id: generateId(),
            name: 'Кредитная карта',
            description: 'Кредитный лимит до 500 000 ₽',
            status: 'active',
            income: 75000
        }
    ];
    saveData();
}

/**
 * Рендер основного интерфейса
 */
function renderApp() {
    const app = document.getElementById('admin-app');
    if (!app) return;
    
    app.innerHTML = `
        <div class="admin-container">
            <!-- Sidebar -->
            <aside class="sidebar">
                <div class="logo">
                    <h1>
                        <i class="fas fa-cogs"></i>
                        <span>Админ-панель</span>
                    </h1>
                </div>
                
                <nav class="nav-menu">
                    <button class="nav-item active" data-tab="offers">
                        <i class="fas fa-gem"></i>
                        <span>Офферы</span>
                        <span class="badge">${state.offers.length}</span>
                    </button>
                    <button class="nav-item" data-tab="preview">
                        <i class="fas fa-eye"></i>
                        <span>Предпросмотр</span>
                    </button>
                    <button class="nav-item" data-tab="settings">
                        <i class="fas fa-cog"></i>
                        <span>Настройки</span>
                    </button>
                </nav>
                
                <!-- User Panel -->
                <div class="user-panel">
                    <div class="user-info">
                        <div class="user-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="user-details">
                            <div class="user-name">${state.user.name}</div>
                            <div class="user-role">${state.user.role}</div>
                        </div>
                    </div>
                    <button class="logout-btn" id="logout-btn">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </aside>
            
            <!-- Main Content -->
            <main class="main-content">
                <!-- Stats -->
                <div class="stats" id="stats"></div>
                
                <!-- Content -->
                <div class="content-area" id="content-area">
                    <div class="loading">Загрузка...</div>
                </div>
            </main>
        </div>
    `;
    
    // Обновление статистики
    updateStats();
}

/**
 * Инициализация обработчиков событий
 */
function initEventListeners() {
    // Навигация
    document.addEventListener('click', (e) => {
        const tabBtn = e.target.closest('[data-tab]');
        if (tabBtn) {
            e.preventDefault();
            const tab = tabBtn.dataset.tab;
            switchTab(tab);
        }
    });
    
    // Выход
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

/**
 * Переключение вкладки
 */
function switchTab(tab) {
    if (state.currentTab === tab) return;
    
    console.log(`🔄 Переключение на: ${tab}`);
    
    // Обновление активной кнопки
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    // Сохранение выбора
    state.currentTab = tab;
    localStorage.setItem(CONFIG.ACTIVE_TAB_KEY, tab);
    
    // Загрузка контента
    loadTab(tab);
}

/**
 * Загрузка контента вкладки
 */
async function loadTab(tab) {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;
    
    contentArea.innerHTML = '<div class="loading">Загрузка...</div>';
    
    try {
        let content = '';
        
        switch (tab) {
            case 'offers':
                content = await loadOffersTab();
                break;
            case 'preview':
                content = await loadPreviewTab();
                break;
            case 'settings':
                content = await loadSettingsTab();
                break;
            default:
                content = '<div class="empty-state">Вкладка не найдена</div>';
        }
        
        contentArea.innerHTML = content;
        
        // Инициализация обработчиков вкладки
        initTabHandlers(tab);
        
    } catch (error) {
        console.error(`Ошибка загрузки вкладки ${tab}:`, error);
        contentArea.innerHTML = `
            <div class="error-state">
                <h3>Ошибка загрузки</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

/**
 * Загрузка вкладки офферов
 */
async function loadOffersTab() {
    return `
        <div class="tab-header">
            <h2><i class="fas fa-gem"></i> Офферы</h2>
            <button class="btn btn-primary" id="add-offer-btn">
                <i class="fas fa-plus"></i> Добавить
            </button>
        </div>
        
        <div class="table-container">
            <table class="offers-table">
                <thead>
                    <tr>
                        <th>Название</th>
                        <th>Описание</th>
                        <th>Статус</th>
                        <th>Доход</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody id="offers-table-body">
                    ${renderOffersTable()}
                </tbody>
            </table>
        </div>
        
        <div class="table-info">
            Всего офферов: ${state.offers.length}
        </div>
    `;
}

/**
 * Рендер таблицы офферов
 */
function renderOffersTable() {
    if (state.offers.length === 0) {
        return '<tr><td colspan="5" class="empty">Нет офферов</td></tr>';
    }
    
    return state.offers.map(offer => `
        <tr data-id="${offer.id}">
            <td><strong>${escapeHtml(offer.name)}</strong></td>
            <td>${escapeHtml(offer.description || '')}</td>
            <td>
                <span class="status-badge ${offer.status || 'inactive'}">
                    ${offer.status === 'active' ? 'Активен' : 'Неактивен'}
                </span>
            </td>
            <td>${offer.income ? formatNumber(offer.income) + ' ₽' : '-'}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm" onclick="editOffer('${offer.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteOffer('${offer.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Загрузка вкладки предпросмотра
 */
async function loadPreviewTab() {
    return `
        <div class="tab-header">
            <h2><i class="fas fa-eye"></i> Предпросмотр</h2>
        </div>
        
        <div class="preview-container">
            <p>Функция предпросмотра офферов</p>
            <p>Всего офферов: ${state.offers.length}</p>
        </div>
    `;
}

/**
 * Загрузка вкладки настроек
 */
async function loadSettingsTab() {
    return `
        <div class="tab-header">
            <h2><i class="fas fa-cog"></i> Настройки</h2>
        </div>
        
        <div class="settings-container">
            <div class="setting">
                <h3>Демо данные</h3>
                <p>Текущая версия: ${CONFIG.VERSION}</p>
                <button class="btn btn-secondary" id="reset-data-btn">
                    <i class="fas fa-trash"></i> Сбросить данные
                </button>
            </div>
        </div>
    `;
}

/**
 * Инициализация обработчиков вкладки
 */
function initTabHandlers(tab) {
    switch (tab) {
        case 'offers':
            initOffersHandlers();
            break;
        case 'settings':
            initSettingsHandlers();
            break;
    }
}

/**
 * Инициализация обработчиков офферов
 */
function initOffersHandlers() {
    // Добавление оффера
    const addBtn = document.getElementById('add-offer-btn');
    if (addBtn) {
        addBtn.addEventListener('click', showAddOfferModal);
    }
}

/**
 * Инициализация обработчиков настроек
 */
function initSettingsHandlers() {
    // Сброс данных
    const resetBtn = document.getElementById('reset-data-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', handleResetData);
    }
}

/**
 * Обновление статистики
 */
function updateStats() {
    const statsEl = document.getElementById('stats');
    if (!statsEl) return;
    
    const total = state.offers.length;
    const active = state.offers.filter(o => o.status === 'active').length;
    const income = state.offers.reduce((sum, o) => sum + (o.income || 0), 0);
    
    statsEl.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${total}</div>
            <div class="stat-label">Всего офферов</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${active}</div>
            <div class="stat-label">Активные</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${formatNumber(income, 0)} ₽</div>
            <div class="stat-label">Общий доход</div>
        </div>
    `;
    
    // Обновление бейджа
    const badge = document.querySelector('.nav-item[data-tab="offers"] .badge');
    if (badge) {
        badge.textContent = total;
    }
}

/**
 * Показать модалку добавления оффера
 */
function showAddOfferModal() {
    // Реализация модалки будет в отдельном модуле
    showNotification('Добавление оффера (функция в разработке)', 'info');
}

/**
 * Редактирование оффера
 */
function editOffer(id) {
    const offer = state.offers.find(o => o.id === id);
    if (offer) {
        showNotification(`Редактирование: ${offer.name}`, 'info');
    }
}

/**
 * Удаление оффера
 */
function deleteOffer(id) {
    if (!confirm('Удалить оффер?')) return;
    
    state.offers = state.offers.filter(o => o.id !== id);
    saveData();
    updateStats();
    
    // Перезагрузка вкладки
    if (state.currentTab === 'offers') {
        loadTab('offers');
    }
    
    showNotification('Оффер удален', 'success');
}

/**
 * Сброс данных
 */
function handleResetData() {
    if (!confirm('Сбросить все данные? Это действие нельзя отменить.')) return;
    
    localStorage.clear();
    state.offers = [];
    createDemoData();
    updateStats();
    loadTab('settings');
    
    showNotification('Данные сброшены', 'success');
}

/**
 * Выход из системы
 */
function handleLogout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('admin_auth');
        window.location.href = 'auth.html';
    }
}

// ===== УТИЛИТЫ =====

/**
 * Генерация ID
 */
function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Форматирование числа
 */
function formatNumber(num, decimals = 0) {
    return num.toLocaleString('ru-RU', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Экранирование HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Показать уведомление
 */
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container') || createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="close-btn">×</button>
    `;
    
    container.appendChild(notification);
    
    // Автоудаление
    setTimeout(() => {
        notification.remove();
    }, 5000);
    
    // Закрытие по клику
    notification.querySelector('.close-btn').addEventListener('click', () => {
        notification.remove();
    });
}

/**
 * Создание контейнера для уведомлений
 */
function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
}

/**
 * Показать ошибку
 */
function showError(message) {
    const app = document.getElementById('admin-app');
    if (!app) return;
    
    app.innerHTML = `
        <div class="error-screen">
            <div class="error-icon">⚠️</div>
            <h3>Ошибка</h3>
            <p>${message}</p>
            <button class="btn" onclick="location.reload()">Перезагрузить</button>
        </div>
    `;
}

// ===== ГЛОБАЛЬНЫЙ ДОСТУП =====

// Для совместимости
window.initAdminApp = initApp;
window.App = {
    state,
    initApp,
    saveData,
    loadData: loadData,
    switchTab,
    deleteOffer,
    editOffer
};

// Автоматическая инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    setTimeout(initApp, 100);
}

console.log('📦 Основной модуль загружен');
