// ===== main.js =====
// Основной модуль управления админ-панелью

// ===== КОНФИГУРАЦИЯ =====
const APP_CONFIG = {
    version: '2.1',
    storageKey: 'admin_offers_v2_1',
    sessionKey: 'admin_session_data',
    
    // Пути к модулям
    modules: {
        offers: 'offers',
        preview: 'preview',
        settings: 'settings'
    },
    
    // Настройки UI
    defaultTab: 'offers',
    animations: true,
    confirmActions: true,
    
    // Сообщения
    messages: {
        loading: 'Загрузка приложения...',
        dataLoaded: 'Данные загружены',
        dataSaved: 'Данные сохранены',
        errorLoading: 'Ошибка загрузки данных',
        errorSaving: 'Ошибка сохранения данных'
    }
};

// ===== СОСТОЯНИЕ ПРИЛОЖЕНИЯ =====
const AppState = {
    // Основные данные
    offers: [],
    features: [],
    
    // UI состояние
    currentTab: APP_CONFIG.defaultTab,
    currentEditOffer: null,
    isLoading: false,
    isSaving: false,
    
    // Кэш
    cache: {
        offersList: null,
        stats: null,
        lastUpdate: null
    },
    
    // Модули
    modules: {
        offers: null,
        preview: null,
        settings: null
    }
};

// ===== КОНТРОЛЛЕРЫ СОСТОЯНИЯ =====

// Инициализация состояния
function initAppState() {
    console.log('🔄 Инициализация состояния приложения...');
    
    try {
        // Загрузка сохраненного состояния
        const savedState = localStorage.getItem(APP_CONFIG.storageKey + '_state');
        if (savedState) {
            const parsed = JSON.parse(savedState);
            
            // Восстановление только безопасных данных
            AppState.offers = Array.isArray(parsed.offers) ? parsed.offers : [];
            AppState.features = Array.isArray(parsed.features) ? parsed.features : [];
            AppState.currentTab = parsed.currentTab || APP_CONFIG.defaultTab;
            
            console.log('✅ Состояние восстановлено');
        } else {
            console.log('📝 Новое состояние создано');
        }
        
        // Сброс временных состояний
        AppState.currentEditOffer = null;
        AppState.isLoading = false;
        AppState.isSaving = false;
        
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка инициализации состояния:', error);
        resetAppState();
        return false;
    }
}

// Сброс состояния
function resetAppState() {
    AppState.offers = [];
    AppState.features = [];
    AppState.currentTab = APP_CONFIG.defaultTab;
    AppState.currentEditOffer = null;
    AppState.isLoading = false;
    AppState.isSaving = false;
    AppState.cache = {
        offersList: null,
        stats: null,
        lastUpdate: null
    };
    
    // Очистка кэша
    clearCache();
    
    console.log('🔄 Состояние приложения сброшено');
}

// Сохранение состояния
function saveAppState() {
    try {
        const stateToSave = {
            offers: AppState.offers,
            features: AppState.features,
            currentTab: AppState.currentTab,
            version: APP_CONFIG.version,
            timestamp: Date.now()
        };
        
        localStorage.setItem(APP_CONFIG.storageKey + '_state', JSON.stringify(stateToSave));
        
        // Инвалидация кэша
        AppState.cache.lastUpdate = Date.now();
        
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка сохранения состояния:', error);
        showNotification('Ошибка сохранения состояния', 'error');
        return false;
    }
}

// ===== УПРАВЛЕНИЕ ДАННЫМИ =====

// Безопасная загрузка данных
async function loadAppData() {
    if (AppState.isLoading) {
        console.log('⏳ Загрузка уже выполняется...');
        return false;
    }
    
    AppState.isLoading = true;
    
    try {
        console.log('📥 Загрузка данных приложения...');
        
        // Загрузка офферов
        const savedOffers = localStorage.getItem(APP_CONFIG.storageKey);
        if (savedOffers) {
            const parsed = JSON.parse(savedOffers);
            
            // Валидация данных
            if (validateOffersData(parsed)) {
                AppState.offers = parsed;
                console.log(`✅ Загружено ${AppState.offers.length} офферов`);
            } else {
                console.warn('⚠️ Данные офферов не прошли валидацию');
                AppState.offers = [];
            }
        } else {
            console.log('📝 Данные офферов не найдены, создание примера...');
            initExampleData();
        }
        
        // Загрузка фич
        const savedFeatures = localStorage.getItem('admin_features');
        if (savedFeatures) {
            AppState.features = JSON.parse(savedFeatures);
        }
        
        AppState.isLoading = false;
        showNotification(APP_CONFIG.messages.dataLoaded, 'success');
        
        // Обновление кэша
        updateCache();
        
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
        AppState.isLoading = false;
        showNotification(APP_CONFIG.messages.errorLoading, 'error');
        return false;
    }
}

// Безопасное сохранение данных
async function saveAppData() {
    if (AppState.isSaving) {
        console.log('⏳ Сохранение уже выполняется...');
        return false;
    }
    
    AppState.isSaving = true;
    
    try {
        console.log('💾 Сохранение данных приложения...');
        
        // Валидация перед сохранением
        if (!validateOffersData(AppState.offers)) {
            throw new Error('Данные не прошли валидацию');
        }
        
        // Сохранение офферов
        localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify(AppState.offers));
        
        // Сохранение фич
        localStorage.setItem('admin_features', JSON.stringify(AppState.features));
        
        // Сохранение состояния
        saveAppState();
        
        // Инвалидация кэша
        clearCache();
        
        console.log('✅ Данные успешно сохранены');
        AppState.isSaving = false;
        showNotification(APP_CONFIG.messages.dataSaved, 'success');
        
        // Обновление UI
        updateAppUI();
        
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка сохранения данных:', error);
        AppState.isSaving = false;
        showNotification(APP_CONFIG.messages.errorSaving, 'error');
        return false;
    }
}

// Валидация данных офферов
function validateOffersData(data) {
    try {
        if (!Array.isArray(data)) {
            return false;
        }
        
        // Проверка каждого оффера
        for (const offer of data) {
            if (!offer || typeof offer !== 'object') {
                return false;
            }
            
            // Обязательные поля
            if (!offer.id || typeof offer.id !== 'string') {
                return false;
            }
            
            if (!offer.name || typeof offer.name !== 'string') {
                return false;
            }
            
            // Безопасность: проверка на XSS
            const dangerousPatterns = /<script|javascript:|on\w+=/i;
            if (dangerousPatterns.test(offer.name) || 
                (offer.description && dangerousPatterns.test(offer.description))) {
                console.warn('⚠️ Обнаружены потенциально опасные данные');
                return false;
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('Ошибка валидации данных:', error);
        return false;
    }
}

// ===== КЭШИРОВАНИЕ =====

// Обновление кэша
function updateCache() {
    AppState.cache.lastUpdate = Date.now();
    AppState.cache.offersList = null;
    AppState.cache.stats = null;
    
    console.log('🔄 Кэш обновлен');
}

// Очистка кэша
function clearCache() {
    AppState.cache = {
        offersList: null,
        stats: null,
        lastUpdate: null
    };
    
    console.log('🧹 Кэш очищен');
}

// Получение статистики (с кэшированием)
function getCachedStats() {
    if (AppState.cache.stats && 
        AppState.cache.lastUpdate && 
        (Date.now() - AppState.cache.lastUpdate < 5000)) {
        return AppState.cache.stats;
    }
    
    const stats = calculateStats();
    AppState.cache.stats = stats;
    AppState.cache.lastUpdate = Date.now();
    
    return stats;
}

// ===== УТИЛИТЫ =====

// Форматирование чисел
function formatNumber(num, decimals = 0) {
    if (typeof num !== 'number' || isNaN(num)) {
        return '0';
    }
    
    return num.toLocaleString('ru-RU', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// Расчет статистики
function calculateStats() {
    const total = AppState.offers.length;
    const active = AppState.offers.filter(o => o.status === 'active').length;
    const landing1 = AppState.offers.filter(o => o.landing1 && o.status === 'active').length;
    const landing2 = AppState.offers.filter(o => o.landing2 && o.status === 'active').length;
    
    // Расчет доходов
    const totalIncome = AppState.offers.reduce((sum, offer) => {
        return sum + (offer.income || 0);
    }, 0);
    
    // Расчет просроченных
    const now = new Date();
    const overdue = AppState.offers.filter(offer => {
        if (!offer.deadline) return false;
        const deadline = new Date(offer.deadline);
        return deadline < now && offer.status === 'active';
    }).length;
    
    return {
        total,
        active,
        landing1,
        landing2,
        totalIncome,
        overdue,
        inactive: total - active
    };
}

// Генератор ID
function generateId(prefix = 'offer') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}_${timestamp}_${random}`;
}

// Безопасный innerHTML
function safeInnerHTML(element, html) {
    if (!element) return;
    
    // Очистка потенциально опасных тегов
    const safeHtml = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
        .replace(/on\w+\s*=\s*'[^']*'/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/data:/gi, '');
    
    element.innerHTML = safeHtml;
}

// ===== UI КОМПОНЕНТЫ =====

// Показать уведомление
function showNotification(message, type = 'info') {
    // Проверяем, есть ли уже контейнер для уведомлений
    let container = document.getElementById('notification-container');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" aria-label="Закрыть">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Автоматическое скрытие
    const autoHide = setTimeout(() => {
        hideNotification(notification);
    }, 5000);
    
    // Кнопка закрытия
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        clearTimeout(autoHide);
        hideNotification(notification);
    });
    
    return notification;
}

// Скрыть уведомление
function hideNotification(notification) {
    notification.classList.remove('show');
    notification.classList.add('hide');
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Показать экран загрузки
function showLoadingScreen(message = APP_CONFIG.messages.loading) {
    let loader = document.getElementById('app-loading-screen');
    
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'app-loading-screen';
        loader.className = 'app-loading-screen';
        document.body.appendChild(loader);
    }
    
    loader.innerHTML = `
        <div class="app-loader-container">
            <div class="app-loader"></div>
            <p class="app-loading-text">${message}</p>
        </div>
    `;
    
    loader.style.display = 'flex';
    
    return loader;
}

// Скрыть экран загрузки
function hideLoadingScreen() {
    const loader = document.getElementById('app-loading-screen');
    if (loader) {
        loader.style.display = 'none';
    }
}

// ===== РЕНДЕРИНГ ИНТЕРФЕЙСА =====

// Рендер основного интерфейса
async function renderAppInterface() {
    console.log('🎨 Рендер интерфейса приложения...');
    
    const appContainer = document.getElementById('admin-app');
    if (!appContainer) {
        console.error('❌ Контейнер приложения не найден');
        return false;
    }
    
    // Показываем загрузку
    showLoadingScreen('Загрузка интерфейса...');
    
    try {
        // Безопасный рендер HTML
        safeInnerHTML(appContainer, getAppTemplate());
        
        // Инициализация UI компонентов
        initAppUIComponents();
        
        // Загрузка активной вкладки
        await loadActiveTab();
        
        // Обновление статистики
        updateStatsDisplay();
        
        // Скрываем загрузку
        setTimeout(hideLoadingScreen, 300);
        
        console.log('✅ Интерфейс успешно отрендерен');
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка рендера интерфейса:', error);
        hideLoadingScreen();
        
        // Показать экран ошибки
        appContainer.innerHTML = getErrorTemplate(error);
        return false;
    }
}

// Шаблон приложения
function getAppTemplate() {
    return `
        <div class="admin-container">
            <!-- Sidebar -->
            <aside class="sidebar" role="navigation">
                <div class="logo">
                    <h1>
                        <i class="fas fa-cogs"></i>
                        <span>Админ-панель</span>
                        <span class="logo-badge">v${APP_CONFIG.version}</span>
                    </h1>
                </div>
                
                <nav class="nav-menu" aria-label="Основная навигация">
                    <a href="#" class="nav-item active" data-tab="offers">
                        <i class="fas fa-gem"></i>
                        <span>Офферы</span>
                        <span class="nav-badge" id="offers-badge">0</span>
                    </a>
                    <a href="#" class="nav-item" data-tab="preview">
                        <i class="fas fa-eye"></i>
                        <span>Предпросмотр</span>
                    </a>
                    <a href="#" class="nav-item" data-tab="settings">
                        <i class="fas fa-cog"></i>
                        <span>Настройки</span>
                    </a>
                </nav>
                
                <!-- User Panel -->
                <div class="user-panel">
                    <div class="user-info">
                        <div class="user-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="user-details">
                            <div class="user-name" id="user-name">Администратор</div>
                            <div class="user-role">Админ</div>
                        </div>
                    </div>
                    <button class="logout-btn" id="logout-btn" aria-label="Выйти из системы">
                        <i class="fas fa-sign-out-alt"></i>
                        <span class="logout-text">Выйти</span>
                    </button>
                </div>
            </aside>
            
            <!-- Main Content -->
            <main class="main-content" role="main">
                <!-- Header -->
                <div class="stats-grid" id="stats-grid">
                    <!-- Статистика будет загружена динамически -->
                </div>
                
                <!-- Content Area -->
                <div id="content-area" class="content-area">
                    <!-- Контент вкладок будет загружен здесь -->
                </div>
            </main>
        </div>
        
        <!-- Модальные окна -->
        <div id="modal-container"></div>
        
        <!-- Уведомления -->
        <div id="notification-container" class="notification-container"></div>
    `;
}

// Шаблон ошибки
function getErrorTemplate(error) {
    return `
        <div class="error-screen">
            <div class="error-container">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2 class="error-title">Ошибка приложения</h2>
                <p class="error-message">${error.message || 'Неизвестная ошибка'}</p>
                <div class="error-actions">
                    <button class="btn btn-primary" id="reload-app">
                        <i class="fas fa-redo"></i> Перезагрузить
                    </button>
                    <button class="btn btn-secondary" id="reset-app">
                        <i class="fas fa-trash"></i> Сбросить данные
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Инициализация UI компонентов
function initAppUIComponents() {
    // Навигация
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.dataset.tab;
            if (tab) {
                switchTab(tab);
            }
        });
    });
    
    // Кнопка выхода
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Кнопка перезагрузки (если есть)
    const reloadBtn = document.getElementById('reload-app');
    if (reloadBtn) {
        reloadBtn.addEventListener('click', () => window.location.reload());
    }
    
    // Кнопка сброса (если есть)
    const resetBtn = document.getElementById('reset-app');
    if (resetBtn) {
        resetBtn.addEventListener('click', handleResetApp);
    }
}

// ===== УПРАВЛЕНИЕ ВКЛАДКАМИ =====

// Переключение вкладок
async function switchTab(tabName) {
    if (!tabName || AppState.currentTab === tabName) {
        return;
    }
    
    console.log(`🔄 Переключение на вкладку: ${tabName}`);
    
    try {
        // Обновление активного состояния в навигации
        updateActiveTab(tabName);
        
        // Обновление состояния
        AppState.currentTab = tabName;
        saveAppState();
        
        // Загрузка контента вкладки
        await loadTabContent(tabName);
        
    } catch (error) {
        console.error(`❌ Ошибка переключения вкладки ${tabName}:`, error);
        showNotification(`Ошибка загрузки вкладки: ${tabName}`, 'error');
    }
}

// Обновление активной вкладки в навигации
function updateActiveTab(activeTab) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const isActive = item.dataset.tab === activeTab;
        item.classList.toggle('active', isActive);
        item.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
}

// Загрузка контента вкладки
async function loadTabContent(tabName) {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) {
        console.error('❌ Область контента не найдена');
        return;
    }
    
    // Показать загрузку
    contentArea.innerHTML = '<div class="tab-loading">Загрузка...</div>';
    
    try {
        let content = '';
        
        switch (tabName) {
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
                content = '<div class="empty-state"><p>Вкладка не найдена</p></div>';
        }
        
        // Безопасный рендер
        safeInnerHTML(contentArea, content);
        
        // Инициализация обработчиков вкладки
        initTabHandlers(tabName);
        
    } catch (error) {
        console.error(`❌ Ошибка загрузки вкладки ${tabName}:`, error);
        contentArea.innerHTML = `
            <div class="error-state">
                <h3>Ошибка загрузки</h3>
                <p>${error.message}</p>
                <button class="btn btn-secondary" onclick="switchTab('${tabName}')">
                    <i class="fas fa-redo"></i> Попробовать снова
                </button>
            </div>
        `;
    }
}

// Загрузка активной вкладки
async function loadActiveTab() {
    await loadTabContent(AppState.currentTab);
}

// Загрузка вкладки офферов
async function loadOffersTab() {
    // Проверка загрузки модуля
    if (!AppState.modules.offers && typeof window.OffersModule !== 'undefined') {
        AppState.modules.offers = window.OffersModule;
    }
    
    if (AppState.modules.offers && typeof AppState.modules.offers.render === 'function') {
        return AppState.modules.offers.render();
    }
    
    // Fallback базовый шаблон
    return `
        <div class="tab-header">
            <h2 class="tab-title">
                <i class="fas fa-gem"></i>
                Управление офферами
            </h2>
            <button class="btn btn-primary" id="add-offer-btn">
                <i class="fas fa-plus"></i> Добавить оффер
            </button>
        </div>
        <div class="tab-content">
            <div id="offers-list-container">
                <!-- Список офферов будет загружен здесь -->
            </div>
        </div>
    `;
}

// Загрузка вкладки предпросмотра
async function loadPreviewTab() {
    if (!AppState.modules.preview && typeof window.PreviewModule !== 'undefined') {
        AppState.modules.preview = window.PreviewModule;
    }
    
    if (AppState.modules.preview && typeof AppState.modules.preview.render === 'function') {
        return AppState.modules.preview.render();
    }
    
    return '<div class="empty-state"><p>Модуль предпросмотра не загружен</p></div>';
}

// Загрузка вкладки настроек
async function loadSettingsTab() {
    if (!AppState.modules.settings && typeof window.SettingsModule !== 'undefined') {
        AppState.modules.settings = window.SettingsModule;
    }
    
    if (AppState.modules.settings && typeof AppState.modules.settings.render === 'function') {
        return AppState.modules.settings.render();
    }
    
    return '<div class="empty-state"><p>Модуль настроек не загружен</p></div>';
}

// Инициализация обработчиков вкладки
function initTabHandlers(tabName) {
    switch (tabName) {
        case 'offers':
            if (AppState.modules.offers && typeof AppState.modules.offers.init === 'function') {
                AppState.modules.offers.init();
            } else {
                initBasicOffersHandlers();
            }
            break;
        case 'preview':
            if (AppState.modules.preview && typeof AppState.modules.preview.init === 'function') {
                AppState.modules.preview.init();
            }
            break;
        case 'settings':
            if (AppState.modules.settings && typeof AppState.modules.settings.init === 'function') {
                AppState.modules.settings.init();
            }
            break;
    }
}

// Базовые обработчики для офферов (fallback)
function initBasicOffersHandlers() {
    const addBtn = document.getElementById('add-offer-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            showNotification('Модуль офферов не загружен', 'warning');
        });
    }
}

// ===== ОБНОВЛЕНИЕ UI =====

// Обновление всего UI
function updateAppUI() {
    updateStatsDisplay();
    updateOffersBadge();
    
    // Обновление активной вкладки
    if (AppState.currentTab === 'offers') {
        updateOffersList();
    }
}

// Обновление статистики
function updateStatsDisplay() {
    const statsGrid = document.getElementById('stats-grid');
    if (!statsGrid) return;
    
    const stats = getCachedStats();
    
    safeInnerHTML(statsGrid, `
        <div class="stat-card">
            <div class="stat-icon stat-icon-1">
                <i class="fas fa-gem"></i>
            </div>
            <div class="stat-value">${formatNumber(stats.total)}</div>
            <div class="stat-label">Всего офферов</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon stat-icon-2">
                <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-value">${formatNumber(stats.active)}</div>
            <div class="stat-label">Активные</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon stat-icon-3">
                <i class="fas fa-hourglass-end"></i>
            </div>
            <div class="stat-value">${formatNumber(stats.overdue)}</div>
            <div class="stat-label">Просрочены</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon stat-icon-4">
                <i class="fas fa-wallet"></i>
            </div>
            <div class="stat-value">${formatNumber(stats.totalIncome, 0)} ₽</div>
            <div class="stat-label">Общий доход</div>
        </div>
    `);
}

// Обновление бейджа офферов
function updateOffersBadge() {
    const badge = document.getElementById('offers-badge');
    if (badge) {
        const stats = getCachedStats();
        badge.textContent = formatNumber(stats.total);
    }
}

// Обновление списка офферов
function updateOffersList() {
    if (AppState.modules.offers && typeof AppState.modules.offers.update === 'function') {
        AppState.modules.offers.update();
    }
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====

// Выход из системы
async function handleLogout() {
    if (APP_CONFIG.confirmActions) {
        const confirmed = confirm('Вы уверены, что хотите выйти?');
        if (!confirmed) return;
    }
    
    showNotification('Выход из системы...', 'info');
    
    try {
        // Очистка данных сессии
        localStorage.removeItem(APP_CONFIG.sessionKey);
        sessionStorage.clear();
        
        // Редирект на страницу входа
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1000);
        
    } catch (error) {
        console.error('Ошибка при выходе:', error);
        showNotification('Ошибка при выходе', 'error');
    }
}

// Сброс приложения
async function handleResetApp() {
    if (APP_CONFIG.confirmActions) {
        const confirmed = confirm('Вы уверены, что хотите сбросить все данные? Это действие нельзя отменить.');
        if (!confirmed) return;
    }
    
    showLoadingScreen('Сброс данных...');
    
    try {
        // Очистка всех данных
        localStorage.clear();
        sessionStorage.clear();
        
        // Сброс состояния
        resetAppState();
        
        // Перезагрузка
        setTimeout(() => {
            window.location.reload();
        }, 1500);
        
    } catch (error) {
        console.error('Ошибка при сбросе:', error);
        hideLoadingScreen();
        showNotification('Ошибка при сбросе данных', 'error');
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ =====

// Основная функция инициализации
async function initAdminApp() {
    console.log('🚀 Инициализация админ-панели...');
    
    try {
        // Инициализация состояния
        if (!initAppState()) {
            throw new Error('Не удалось инициализировать состояние приложения');
        }
        
        // Загрузка данных
        await loadAppData();
        
        // Рендер интерфейса
        if (!await renderAppInterface()) {
            throw new Error('Не удалось загрузить интерфейс');
        }
        
        // Загрузка модулей
        await loadAppModules();
        
        // Инициализация событий
        initAppEvents();
        
        console.log('✅ Админ-панель успешно запущена');
        showNotification('Приложение загружено', 'success');
        
    } catch (error) {
        console.error('❌ Критическая ошибка инициализации:', error);
        
        // Показать экран ошибки
        const appContainer = document.getElementById('admin-app');
        if (appContainer) {
            safeInnerHTML(appContainer, getErrorTemplate(error));
        }
        
        showNotification('Ошибка запуска приложения', 'error');
    }
}

// Загрузка модулей
async function loadAppModules() {
    console.log('📦 Загрузка модулей приложения...');
    
    // Модули загружаются через script теги в index.html
    // Здесь мы просто проверяем их наличие
    
    const modules = ['offers', 'preview', 'settings'];
    
    modules.forEach(module => {
        const moduleName = module.charAt(0).toUpperCase() + module.slice(1) + 'Module';
        if (window[moduleName]) {
            AppState.modules[module] = window[moduleName];
            console.log(`✅ Модуль ${module} загружен`);
        } else {
            console.warn(`⚠️ Модуль ${module} не найден`);
        }
    });
}

// Инициализация событий приложения
function initAppEvents() {
    // Глобальные обработчики клавиш
    document.addEventListener('keydown', handleGlobalKeys);
    
    // Обработка изменения данных
    window.addEventListener('storage', handleStorageChange);
    
    // Обработка вкладок браузера
    document.addEventListener('visibilitychange', handleVisibilityChange);
}

// Обработка глобальных клавиш
function handleGlobalKeys(event) {
    // Ctrl + S - сохранение
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        saveAppData();
    }
    
    // Escape - закрытие модалок
    if (event.key === 'Escape') {
        const modals = document.querySelectorAll('.modal.active');
        if (modals.length > 0) {
            // Закрыть последнее активное модальное окно
            modals[modals.length - 1].classList.remove('active');
        }
    }
}

// Обработка изменения storage
function handleStorageChange(event) {
    if (event.key === APP_CONFIG.storageKey) {
        console.log('🔔 Обнаружено изменение данных в storage');
        
        // Перезагрузка данных
        loadAppData().then(() => {
            updateAppUI();
            showNotification('Данные обновлены', 'info');
        });
    }
}

// Обработка видимости страницы
function handleVisibilityChange() {
    if (document.hidden) {
        console.log('📄 Страница скрыта');
    } else {
        console.log('📄 Страница видима, обновление данных...');
        loadAppData();
    }
}

// ===== ПРИМЕРНЫЕ ДАННЫЕ =====

// Инициализация примерных данных
function initExampleData() {
    console.log('📝 Создание примерных данных...');
    
    AppState.offers = [
        {
            id: generateId(),
            name: 'Моментальные деньги',
            description: 'Займы до 100 000 ₽ на карту',
            status: 'active',
            landing1: true,
            landing2: false,
            income: 50000,
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            features: ['Без проверки КИ', 'За 5 минут', 'На любую карту']
        },
        {
            id: generateId(),
            name: 'Кредитная карта',
            description: 'Кредитный лимит до 500 000 ₽',
            status: 'active',
            landing1: true,
            landing2: true,
            income: 75000,
            deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
            features: ['Кэшбэк 5%', 'Бесплатное обслуживание', 'Льготный период']
        }
    ];
    
    AppState.features = [
        'Без проверки КИ',
        'За 5 минут',
        'На любую карту',
        'Кэшбэк 5%',
        'Бесплатное обслуживание',
        'Льготный период'
    ];
    
    // Сохранение данных
    saveAppData();
    
    console.log('✅ Примерные данные созданы');
}

// ===== ГЛОБАЛЬНЫЙ ДОСТУП =====

// Экспорт API приложения
window.App = {
    // Конфигурация
    config: APP_CONFIG,
    
    // Состояние
    state: AppState,
    
    // Основные функции
    init: initAdminApp,
    save: saveAppData,
    load: loadAppData,
    switchTab: switchTab,
    updateUI: updateAppUI,
    logout: handleLogout,
    
    // Утилиты
    formatNumber: formatNumber,
    generateId: generateId,
    showNotification: showNotification,
    
    // Данные
    getOffers: () => [...AppState.offers],
    getStats: () => ({ ...getCachedStats() }),
    getFeatures: () => [...AppState.features]
};

// Автоматическая инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initAdminApp, 100);
    });
} else {
    setTimeout(initAdminApp, 100);
}

console.log('📦 Основной модуль приложения загружен');
