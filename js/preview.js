// ===== preview.js =====
// Модуль предпросмотра офферов

// ===== КОНФИГУРАЦИЯ =====
const PREVIEW_CONFIG = {
    // Селекторы
    selectors: {
        previewContent: '#preview-content',
        previewTabs: '.preview-tab',
        previewTabContent: '.preview-tab-content',
        previewFrames: '.preview-frame',
        mobilePreview: '#mobile-preview-content',
        filterPreview: '#filter-preview-content',
        offersCount: '#preview-offers-count',
        updateTime: '#preview-update-time',
        refreshBtn: '#refresh-preview'
    },
    
    // Настройки вкладок
    tabs: [
        { id: 'landing1', name: 'Лендинг 1: ДеньгиСразу', icon: 'fa-globe' },
        { id: 'landing2', name: 'Лендинг 2: FinAI', icon: 'fa-rocket' },
        { id: 'mobile', name: 'Мобильная версия', icon: 'fa-mobile-alt' },
        { id: 'filters', name: 'Фильтрация', icon: 'fa-filter' },
        { id: 'analytics', name: 'Аналитика', icon: 'fa-chart-bar' },
        { id: 'export', name: 'Экспорт', icon: 'fa-download' }
    ],
    
    // Настройки предпросмотра
    preview: {
        landing1: {
            title: 'ДеньгиСразу - моментальные займы',
            theme: 'light',
            style: 'modern'
        },
        landing2: {
            title: 'FinAI - умные финансы',
            theme: 'dark',
            style: 'corporate'
        },
        mobile: {
            width: 375,
            height: 667,
            device: 'iphone'
        },
        autoRefresh: true,
        refreshInterval: 30000, // 30 секунд
        cacheDuration: 5000     // 5 секунд
    },
    
    // Сообщения
    messages: {
        noOffers: 'Нет активных офферов для отображения',
        loading: 'Загрузка предпросмотра...',
        updated: 'Предпросмотр обновлен',
        error: 'Ошибка загрузки предпросмотра'
    }
};

// ===== СОСТОЯНИЕ =====
const PreviewState = {
    activeTab: 'landing1',
    offers: [],
    filteredOffers: [],
    previewCache: {},
    lastUpdate: null,
    isLoading: false,
    refreshInterval: null,
    
    // Статистика
    stats: {
        total: 0,
        active: 0,
        landing1: 0,
        landing2: 0,
        mobileReady: 0,
        withOverdue: 0,
        withIncome: 0
    }
};

// ===== КОНТРОЛЛЕРЫ ДАННЫХ =====

// Инициализация модуля предпросмотра
function initPreviewModule() {
    console.log('👁️ Инициализация модуля предпросмотра...');
    
    try {
        // Проверка зависимостей
        checkPreviewDependencies();
        
        // Загрузка данных
        loadPreviewData();
        
        // Инициализация кэша
        initPreviewCache();
        
        // Инициализация автообновления
        if (PREVIEW_CONFIG.preview.autoRefresh) {
            initAutoRefresh();
        }
        
        // Экспорт API
        exportPreviewAPI();
        
        console.log('✅ Модуль предпросмотра инициализирован');
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка инициализации модуля предпросмотра:', error);
        return false;
    }
}

// Проверка зависимостей
function checkPreviewDependencies() {
    const required = ['App', 'OffersModule'];
    const missing = required.filter(dep => !window[dep]);
    
    if (missing.length > 0) {
        console.warn(`⚠️ Отсутствуют зависимости: ${missing.join(', ')}`);
    }
}

// Загрузка данных для предпросмотра
function loadPreviewData() {
    if (PreviewState.isLoading) {
        console.log('⏳ Данные уже загружаются...');
        return;
    }
    
    PreviewState.isLoading = true;
    
    try {
        // Получение данных офферов
        let offers = [];
        
        if (window.OffersModule && window.OffersModule.getOffers) {
            offers = window.OffersModule.getOffers();
        } else if (window.App && window.App.getOffers) {
            offers = window.App.getOffers();
        } else if (window.offers) {
            offers = [...window.offers];
        }
        
        // Валидация данных
        if (validatePreviewData(offers)) {
            PreviewState.offers = [...offers];
            PreviewState.filteredOffers = getFilteredOffers();
            updatePreviewStats();
            PreviewState.lastUpdate = new Date();
            
            console.log(`✅ Загружено ${offers.length} офферов для предпросмотра`);
        } else {
            console.warn('⚠️ Данные офферов не прошли валидацию для предпросмотра');
            PreviewState.offers = [];
            PreviewState.filteredOffers = [];
        }
        
        // Очистка кэша
        clearPreviewCache();
        
        PreviewState.isLoading = false;
        
        // Обновление UI если он отрендерен
        if (isPreviewUITendered()) {
            updatePreviewUI();
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных предпросмотра:', error);
        PreviewState.isLoading = false;
        showPreviewError(PREVIEW_CONFIG.messages.error);
    }
}

// Валидация данных для предпросмотра
function validatePreviewData(offers) {
    if (!Array.isArray(offers)) {
        return false;
    }
    
    try {
        // Базовая проверка
        for (const offer of offers) {
            if (!offer || typeof offer !== 'object') {
                return false;
            }
            
            // Проверка необходимых полей
            if (!offer.id || typeof offer.id !== 'string') {
                return false;
            }
            
            if (!offer.name || typeof offer.name !== 'string') {
                return false;
            }
            
            // Безопасность: проверка на XSS
            const dangerousPattern = /[<>"'`]/;
            if (dangerousPattern.test(offer.name) || 
                (offer.description && dangerousPattern.test(offer.description))) {
                console.warn('⚠️ Обнаружены опасные данные в оффере:', offer.id);
                return false;
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('Ошибка валидации данных предпросмотра:', error);
        return false;
    }
}

// Получение отфильтрованных офферов
function getFilteredOffers() {
    return PreviewState.offers.filter(offer => 
        offer.status === 'active' && (offer.landing1 || offer.landing2)
    );
}

// Обновление статистики
function updatePreviewStats() {
    const { offers } = PreviewState;
    
    PreviewState.stats = {
        total: offers.length,
        active: offers.filter(o => o.status === 'active').length,
        landing1: offers.filter(o => o.landing1 && o.status === 'active').length,
        landing2: offers.filter(o => o.landing2 && o.status === 'active').length,
        mobileReady: offers.filter(o => o.status === 'active' && 
            (o.amount_min <= 50000 && o.amount_max >= 1000)).length,
        withOverdue: offers.filter(o => o.overdue_types?.includes('has_overdue')).length,
        withIncome: offers.filter(o => o.income_types?.includes('has_income')).length
    };
}

// Инициализация кэша
function initPreviewCache() {
    PreviewState.previewCache = {
        landing1: null,
        landing2: null,
        mobile: null,
        filters: null,
        analytics: null,
        export: null,
        timestamp: null
    };
}

// Очистка кэша
function clearPreviewCache() {
    Object.keys(PreviewState.previewCache).forEach(key => {
        PreviewState.previewCache[key] = null;
    });
    PreviewState.previewCache.timestamp = null;
}

// Инициализация автообновления
function initAutoRefresh() {
    if (PreviewState.refreshInterval) {
        clearInterval(PreviewState.refreshInterval);
    }
    
    PreviewState.refreshInterval = setInterval(() => {
        if (!document.hidden && isPreviewUITendered()) {
            loadPreviewData();
        }
    }, PREVIEW_CONFIG.preview.refreshInterval);
    
    console.log('🔄 Автообновление предпросмотра включено');
}

// ===== РЕНДЕРИНГ ИНТЕРФЕЙСА =====

// Рендер вкладки предпросмотра
function renderPreviewTab() {
    console.log('🎨 Рендер вкладки предпросмотра...');
    
    return `
        <div id="preview-content" class="tab-content" role="region" aria-label="Предпросмотр офферов">
            <!-- Основная карточка -->
            <div class="card">
                <!-- Заголовок -->
                <div class="card-header">
                    <h2 class="card-title" id="preview-title">
                        <i class="fas fa-eye" aria-hidden="true"></i>
                        <span>Предпросмотр офферов</span>
                        <span class="card-subtitle" id="preview-stats">Загрузка...</span>
                    </h2>
                    
                    <!-- Действия -->
                    <div class="card-actions">
                        <!-- Статус обновления -->
                        <div class="update-status" role="status" aria-live="polite">
                            <i class="fas fa-sync-alt" aria-hidden="true"></i>
                            <span id="preview-update-status">Загрузка...</span>
                        </div>
                        
                        <!-- Кнопка обновления -->
                        <button class="btn btn-sm btn-secondary" id="refresh-preview" 
                                aria-label="Обновить предпросмотр">
                            <i class="fas fa-redo" aria-hidden="true"></i>
                            <span>Обновить</span>
                        </button>
                        
                        <!-- Кнопка настроек -->
                        <button class="btn btn-sm btn-outline" id="preview-settings" 
                                aria-label="Настройки предпросмотра">
                            <i class="fas fa-cog" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Вкладки предпросмотра -->
                <div class="preview-tabs" role="tablist" aria-label="Типы предпросмотра">
                    ${renderPreviewTabs()}
                </div>
                
                <!-- Контейнер предпросмотра -->
                <div class="preview-container">
                    <!-- Заголовок предпросмотра -->
                    <div class="preview-header">
                        <div class="preview-info">
                            <span class="preview-count" id="preview-offers-count">0</span>
                            <span class="preview-separator">•</span>
                            <span class="preview-time" id="preview-update-time">Не обновлялось</span>
                            <span class="preview-separator">•</span>
                            <span class="preview-tab-name" id="preview-tab-name">Лендинг 1</span>
                        </div>
                        
                        <div class="preview-controls">
                            <!-- Кнопки управления -->
                            <div class="btn-group btn-group-sm" role="group">
                                <button class="btn btn-outline" id="preview-zoom-in" 
                                        aria-label="Увеличить масштаб">
                                    <i class="fas fa-search-plus"></i>
                                </button>
                                <button class="btn btn-outline" id="preview-zoom-out" 
                                        aria-label="Уменьшить масштаб">
                                    <i class="fas fa-search-minus"></i>
                                </button>
                                <button class="btn btn-outline" id="preview-fullscreen" 
                                        aria-label="Полноэкранный режим">
                                    <i class="fas fa-expand"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Содержимое предпросмотра -->
                    <div class="preview-content" id="preview-content-area">
                        <!-- Контент будет загружен динамически -->
                        <div class="preview-loading" id="preview-loading">
                            <div class="loader"></div>
                            <p>${PREVIEW_CONFIG.messages.loading}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Рендер вкладок
function renderPreviewTabs() {
    return PREVIEW_CONFIG.tabs.map(tab => `
        <button class="preview-tab ${PreviewState.activeTab === tab.id ? 'active' : ''}" 
                data-preview="${tab.id}"
                role="tab"
                aria-selected="${PreviewState.activeTab === tab.id}"
                aria-controls="preview-${tab.id}">
            <i class="fas ${tab.icon}" aria-hidden="true"></i>
            <span>${tab.name}</span>
            ${renderTabBadge(tab.id)}
        </button>
    `).join('');
}

// Рендер бейджа для вкладки
function renderTabBadge(tabId) {
    const count = getTabOffersCount(tabId);
    if (count === 0) return '';
    
    return `<span class="tab-badge" aria-label="${count} офферов">${count}</span>`;
}

// Получение количества офферов для вкладки
function getTabOffersCount(tabId) {
    switch(tabId) {
        case 'landing1':
            return PreviewState.stats.landing1;
        case 'landing2':
            return PreviewState.stats.landing2;
        case 'mobile':
            return PreviewState.stats.mobileReady;
        case 'filters':
            return PreviewState.stats.active;
        case 'analytics':
            return PreviewState.stats.total;
        case 'export':
            return PreviewState.stats.active;
        default:
            return 0;
    }
}

// ===== УПРАВЛЕНИЕ ВКЛАДКАМИ =====

// Переключение вкладки предпросмотра
function switchPreviewTab(tabId) {
    if (!tabId || PreviewState.activeTab === tabId) {
        return;
    }
    
    console.log(`🔄 Переключение на вкладку: ${tabId}`);
    
    try {
        // Обновление активной вкладки
        updateActiveTab(tabId);
        
        // Обновление состояния
        PreviewState.activeTab = tabId;
        
        // Загрузка содержимого вкладки
        loadTabContent(tabId);
        
    } catch (error) {
        console.error(`❌ Ошибка переключения вкладки ${tabId}:`, error);
        showPreviewError(`Не удалось загрузить вкладку: ${tabId}`);
    }
}

// Обновление активной вкладки в UI
function updateActiveTab(tabId) {
    // Обновление кнопок
    const tabButtons = document.querySelectorAll('.preview-tab');
    tabButtons.forEach(button => {
        const isActive = button.dataset.preview === tabId;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-selected', isActive);
        button.setAttribute('tabindex', isActive ? '0' : '-1');
    });
    
    // Обновление названия вкладки
    const tabNameElement = document.getElementById('preview-tab-name');
    if (tabNameElement) {
        const tab = PREVIEW_CONFIG.tabs.find(t => t.id === tabId);
        tabNameElement.textContent = tab ? tab.name : tabId;
    }
}

// Загрузка содержимого вкладки
function loadTabContent(tabId) {
    const contentArea = document.getElementById('preview-content-area');
    if (!contentArea) {
        console.error('❌ Область содержимого предпросмотра не найдена');
        return;
    }
    
    // Показать загрузку
    showPreviewLoading(true);
    
    // Очистка предыдущего содержимого
    contentArea.innerHTML = '';
    
    try {
        let content = '';
        
        switch(tabId) {
            case 'landing1':
                content = renderLanding1Preview();
                break;
            case 'landing2':
                content = renderLanding2Preview();
                break;
            case 'mobile':
                content = renderMobilePreview();
                break;
            case 'filters':
                content = renderFiltersPreview();
                break;
            case 'analytics':
                content = renderAnalyticsPreview();
                break;
            case 'export':
                content = renderExportPreview();
                break;
            default:
                content = renderErrorPreview(`Вкладка "${tabId}" не найдена`);
        }
        
        // Безопасный рендер
        setTimeout(() => {
            safeInnerHTML(contentArea, content);
            showPreviewLoading(false);
            
            // Инициализация обработчиков вкладки
            initTabHandlers(tabId);
            
            console.log(`✅ Вкладка ${tabId} загружена`);
        }, 100);
        
    } catch (error) {
        console.error(`❌ Ошибка загрузки вкладки ${tabId}:`, error);
        contentArea.innerHTML = renderErrorPreview(`Ошибка загрузки: ${error.message}`);
        showPreviewLoading(false);
    }
}

// ===== РЕНДЕРИНГ ПРЕДПРОСМОТРА =====

// Рендер предпросмотра лендинга 1
function renderLanding1Preview() {
    const offers = PreviewState.filteredOffers.filter(o => o.landing1);
    const stats = PreviewState.stats;
    
    // Проверка кэша
    if (PreviewState.previewCache.landing1 && 
        Date.now() - PreviewState.previewCache.timestamp < PREVIEW_CONFIG.preview.cacheDuration) {
        return PreviewState.previewCache.landing1;
    }
    
    const html = generateLandingHTML({
        title: PREVIEW_CONFIG.preview.landing1.title,
        theme: PREVIEW_CONFIG.preview.landing1.theme,
        style: PREVIEW_CONFIG.preview.landing1.style,
        offers: offers,
        stats: stats
    });
    
    // Кэширование
    PreviewState.previewCache.landing1 = html;
    PreviewState.previewCache.timestamp = Date.now();
    
    return html;
}

// Рендер предпросмотра лендинга 2
function renderLanding2Preview() {
    const offers = PreviewState.filteredOffers.filter(o => o.landing2);
    const stats = PreviewState.stats;
    
    if (PreviewState.previewCache.landing2 && 
        Date.now() - PreviewState.previewCache.timestamp < PREVIEW_CONFIG.preview.cacheDuration) {
        return PreviewState.previewCache.landing2;
    }
    
    const html = generateLandingHTML({
        title: PREVIEW_CONFIG.preview.landing2.title,
        theme: PREVIEW_CONFIG.preview.landing2.theme,
        style: PREVIEW_CONFIG.preview.landing2.style,
        offers: offers,
        stats: stats
    });
    
    PreviewState.previewCache.landing2 = html;
    PreviewState.previewCache.timestamp = Date.now();
    
    return html;
}

// Генерация HTML для лендинга
function generateLandingHTML(config) {
    const { title, theme, style, offers, stats } = config;
    const offersCount = offers.length;
    
    const landingHTML = `
        <div class="preview-landing preview-theme-${theme} preview-style-${style}" role="document">
            <!-- Информация о предпросмотре -->
            <div class="preview-info-bar">
                <div class="preview-meta">
                    <span class="preview-badge">Предпросмотр</span>
                    <span class="preview-separator">•</span>
                    <span class="preview-count">${offersCount} офферов</span>
                    <span class="preview-separator">•</span>
                    <span class="preview-time">${formatTime(PreviewState.lastUpdate)}</span>
                </div>
                <button class="preview-close" onclick="window.parent.Preview.hidePreviewInfo()" 
                        aria-label="Скрыть информацию">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <!-- Заголовок лендинга -->
            <header class="landing-header">
                <h1 class="landing-title">${escapeHtml(title)}</h1>
                <p class="landing-subtitle">Лучшие финансовые предложения</p>
            </header>
            
            <!-- Статистика -->
            <div class="landing-stats">
                <div class="stat-card">
                    <div class="stat-value">${stats.active}</div>
                    <div class="stat-label">Активных офферов</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.landing1}</div>
                    <div class="stat-label">Для лендинга 1</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.landing2}</div>
                    <div class="stat-label">Для лендинга 2</div>
                </div>
            </div>
            
            <!-- Список офферов -->
            <main class="landing-content">
                ${offersCount === 0 ? 
                    `<div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <h3>${PREVIEW_CONFIG.messages.noOffers}</h3>
                        <p>Добавьте офферы для отображения на лендинге</p>
                    </div>` :
                    offers.map(offer => renderLandingOffer(offer)).join('')
                }
            </main>
            
            <!-- Футер -->
            <footer class="landing-footer">
                <p>Предпросмотр сгенерирован автоматически • Актуально на ${formatDateTime(PreviewState.lastUpdate)}</p>
            </footer>
        </div>
    `;
    
    // Создание iframe с безопасным контентом
    return `
        <div class="preview-frame-container">
            <iframe class="preview-frame" 
                    id="preview-frame" 
                    title="Предпросмотр ${title}"
                    sandbox="allow-same-origin allow-scripts"
                    srcdoc="${encodeURIComponent(landingHTML)}">
            </iframe>
            <div class="preview-frame-overlay" role="note">
                <p>Это предпросмотр. Изменения в офферах отразятся здесь после обновления.</p>
            </div>
        </div>
    `;
}

// Рендер оффера для лендинга
function renderLandingOffer(offer) {
    const safeName = escapeHtml(offer.name || '');
    const safeDescription = escapeHtml(offer.description || 'Без описания');
    const icon = getOfferIcon(offer.icon);
    const rating = offer.rating || 0;
    const approval = offer.approval || 0;
    
    return `
        <article class="offer-card" data-offer-id="${offer.id}">
            <div class="offer-header">
                <div class="offer-icon" aria-hidden="true">${icon}</div>
                <div class="offer-info">
                    <h3 class="offer-title">${safeName}</h3>
                    <p class="offer-description">${safeDescription}</p>
                </div>
                <div class="offer-badge ${offer.status === 'active' ? 'badge-success' : 'badge-secondary'}">
                    ${offer.status === 'active' ? 'Активен' : 'Неактивен'}
                </div>
            </div>
            
            <div class="offer-details">
                <div class="detail-row">
                    <span class="detail-label">Сумма:</span>
                    <span class="detail-value">${formatNumber(offer.amount_min)} - ${formatNumber(offer.amount_max)} ₽</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Срок:</span>
                    <span class="detail-value">${offer.term_min} - ${offer.term_max} дней</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Ставка:</span>
                    <span class="detail-value">${offer.rate_display || '0%'}</span>
                </div>
            </div>
            
            <div class="offer-stats">
                <div class="stat">
                    <i class="fas fa-star" aria-hidden="true"></i>
                    <span>${rating}/5</span>
                </div>
                <div class="stat">
                    <i class="fas fa-check-circle" aria-hidden="true"></i>
                    <span>${approval}% одобрения</span>
                </div>
                <div class="stat">
                    <i class="fas fa-bolt" aria-hidden="true"></i>
                    <span>${offer.speed || 5} мин</span>
                </div>
            </div>
            
            <div class="offer-features">
                ${renderOfferFeatures(offer)}
            </div>
            
            <div class="offer-actions">
                <button class="btn btn-primary" onclick="window.parent.Preview.selectOffer('${offer.id}')">
                    Выбрать
                </button>
                <button class="btn btn-outline" onclick="window.parent.Preview.viewDetails('${offer.id}')">
                    Подробнее
                </button>
            </div>
        </article>
    `;
}

// Рендер фич оффера
function renderOfferFeatures(offer) {
    const features = [];
    
    if (offer.overdue_types?.includes('no_overdue')) {
        features.push('<span class="feature-tag tag-success">Без просрочек</span>');
    }
    if (offer.income_types?.includes('has_income')) {
        features.push('<span class="feature-tag tag-info">С подтверждённым доходом</span>');
    }
    if (offer.landing1) {
        features.push('<span class="feature-tag tag-primary">Лендинг 1</span>');
    }
    if (offer.landing2) {
        features.push('<span class="feature-tag tag-secondary">Лендинг 2</span>');
    }
    
    return features.join('');
}

// Рендер мобильного предпросмотра
function renderMobilePreview() {
    const offers = PreviewState.filteredOffers.slice(0, 5); // Только 5 для мобильного вида
    const stats = PreviewState.stats;
    
    return `
        <div class="preview-mobile" role="region" aria-label="Мобильный предпросмотр">
            <!-- Эмулятор устройства -->
            <div class="mobile-device" style="width: ${PREVIEW_CONFIG.preview.mobile.width}px;">
                <div class="mobile-status-bar">
                    <span>${formatTime(new Date())}</span>
                    <div class="mobile-signal">
                        <i class="fas fa-signal"></i>
                        <i class="fas fa-wifi"></i>
                        <i class="fas fa-battery-full"></i>
                    </div>
                </div>
                
                <div class="mobile-header">
                    <h2>Финансовые предложения</h2>
                    <p>${stats.active} активных офферов</p>
                </div>
                
                <div class="mobile-content">
                    ${offers.length === 0 ? 
                        `<div class="mobile-empty">
                            <i class="fas fa-search"></i>
                            <p>Нет доступных офферов</p>
                        </div>` :
                        offers.map(offer => renderMobileOffer(offer)).join('')
                    }
                </div>
                
                <div class="mobile-footer">
                    <div class="mobile-nav">
                        <button class="nav-item active">
                            <i class="fas fa-home"></i>
                            <span>Главная</span>
                        </button>
                        <button class="nav-item">
                            <i class="fas fa-search"></i>
                            <span>Поиск</span>
                        </button>
                        <button class="nav-item">
                            <i class="fas fa-user"></i>
                            <span>Профиль</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Информация о мобильной версии -->
            <div class="mobile-info">
                <h3>Мобильная оптимизация</h3>
                <ul>
                    <li>Всего офферов: ${stats.total}</li>
                    <li>Оптимизировано для мобильных: ${stats.mobileReady}</li>
                    <li>Рекомендуемая ширина: 375px (iPhone)</li>
                    <li>Загрузка: ~1.5 сек (3G)</li>
                </ul>
            </div>
        </div>
    `;
}

// Рендер оффера для мобильного вида
function renderMobileOffer(offer) {
    const safeName = escapeHtml(offer.name || '');
    const icon = getOfferIcon(offer.icon);
    
    return `
        <div class="mobile-offer">
            <div class="offer-icon">${icon}</div>
            <div class="offer-content">
                <h4>${safeName}</h4>
                <p>${formatNumber(offer.amount_min)} - ${formatNumber(offer.amount_max)} ₽</p>
                <div class="offer-meta">
                    <span class="meta-item">
                        <i class="fas fa-clock"></i> ${offer.term_min} дней
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-percentage"></i> ${offer.rate_max}%
                    </span>
                </div>
            </div>
            <button class="offer-action" onclick="window.parent.Preview.selectOffer('${offer.id}')">
                <i class="fas fa-arrow-right"></i>
            </button>
        </div>
    `;
}

// Рендер предпросмотра фильтров
function renderFiltersPreview() {
    const { stats } = PreviewState;
    const offers = PreviewState.filteredOffers;
    
    return `
        <div class="preview-filters" role="region" aria-label="Предпросмотр фильтров">
            <h3>Фильтрация и сегментация</h3>
            
            <!-- Статистика фильтров -->
            <div class="filter-stats">
                <div class="stat-card">
                    <div class="stat-value">${stats.withOverdue}</div>
                    <div class="stat-label">С просрочками</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.withIncome}</div>
                    <div class="stat-label">С доходом</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.landing1}</div>
                    <div class="stat-label">Для лендинга 1</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.landing2}</div>
                    <div class="stat-label">Для лендинга 2</div>
                </div>
            </div>
            
            <!-- Примеры фильтров -->
            <div class="filter-examples">
                <h4>Примеры сегментов аудитории:</h4>
                
                <div class="filter-example">
                    <h5>Клиенты с просрочками</h5>
                    <p>Офферы, доступные клиентам с плохой кредитной историей:</p>
                    <div class="filter-results">
                        ${offers
                            .filter(o => o.overdue_types?.includes('has_overdue'))
                            .slice(0, 3)
                            .map(o => `<span class="filter-tag">${escapeHtml(o.name)}</span>`)
                            .join('') || '<em>Нет подходящих офферов</em>'
                        }
                    </div>
                </div>
                
                <div class="filter-example">
                    <h5>Клиенты с подтверждённым доходом</h5>
                    <p>Премиальные офферы для надёжных клиентов:</p>
                    <div class="filter-results">
                        ${offers
                            .filter(o => o.income_types?.includes('has_income'))
                            .slice(0, 3)
                            .map(o => `<span class="filter-tag">${escapeHtml(o.name)}</span>`)
                            .join('') || '<em>Нет подходящих офферов</em>'
                        }
                    </div>
                </div>
                
                <div class="filter-example">
                    <h5>Срочные займы</h5>
                    <p>Офферы с минимальным временем одобрения:</p>
                    <div class="filter-results">
                        ${offers
                            .filter(o => o.speed && o.speed <= 5)
                            .slice(0, 3)
                            .map(o => `<span class="filter-tag">${escapeHtml(o.name)}</span>`)
                            .join('') || '<em>Нет подходящих офферов</em>'
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Рендер аналитики
function renderAnalyticsPreview() {
    const { stats } = PreviewState;
    
    return `
        <div class="preview-analytics" role="region" aria-label="Аналитика">
            <h3>Аналитика офферов</h3>
            
            <!-- Ключевые метрики -->
            <div class="analytics-metrics">
                <div class="metric-card metric-primary">
                    <div class="metric-value">${stats.active}</div>
                    <div class="metric-label">Активных офферов</div>
                    <div class="metric-change">${getActiveChange()}%</div>
                </div>
                
                <div class="metric-card metric-success">
                    <div class="metric-value">${Math.round((stats.active / stats.total) * 100)}%</div>
                    <div class="metric-label">Конверсия</div>
                    <div class="metric-change">+5%</div>
                </div>
                
                <div class="metric-card metric-warning">
                    <div class="metric-value">${stats.withOverdue}</div>
                    <div class="metric-label">С просрочками</div>
                    <div class="metric-change">${getOverdueChange()}%</div>
                </div>
            </div>
            
            <!-- Диаграмма распределения -->
            <div class="analytics-chart">
                <h4>Распределение по лендингам</h4>
                <div class="chart-container">
                    <div class="chart-bar" style="width: ${(stats.landing1 / stats.active) * 100 || 0}%">
                        <span>Лендинг 1: ${stats.landing1}</span>
                    </div>
                    <div class="chart-bar" style="width: ${(stats.landing2 / stats.active) * 100 || 0}%">
                        <span>Лендинг 2: ${stats.landing2}</span>
                    </div>
                </div>
            </div>
            
            <!-- Рекомендации -->
            <div class="analytics-recommendations">
                <h4>Рекомендации</h4>
                <ul>
                    ${stats.landing1 < 3 ? '<li>✅ Добавьте больше офферов для лендинга 1</li>' : ''}
                    ${stats.withIncome < 2 ? '<li>✅ Увеличьте количество офферов с подтверждённым доходом</li>' : ''}
                    ${stats.mobileReady < stats.active * 0.8 ? '<li>✅ Оптимизируйте офферы для мобильных устройств</li>' : ''}
                    <li>📊 Обновляйте статистику каждые 24 часа</li>
                </ul>
            </div>
        </div>
    `;
}

// Рендер экспорта
function renderExportPreview() {
    const offers = PreviewState.filteredOffers;
    
    return `
        <div class="preview-export" role="region" aria-label="Экспорт данных">
            <h3>Экспорт офферов</h3>
            
            <!-- Форматы экспорта -->
            <div class="export-formats">
                <div class="format-card" onclick="Preview.exportData('json')">
                    <i class="fas fa-file-code"></i>
                    <h5>JSON</h5>
                    <p>Полные данные в формате JSON</p>
                    <small>${offers.length} записей</small>
                </div>
                
                <div class="format-card" onclick="Preview.exportData('csv')">
                    <i class="fas fa-file-csv"></i>
                    <h5>CSV</h5>
                    <p>Табличные данные для Excel</p>
                    <small>${offers.length} строк</small>
                </div>
                
                <div class="format-card" onclick="Preview.exportData('html')">
                    <i class="fas fa-file-code"></i>
                    <h5>HTML</h5>
                    <p>Готовый HTML для вставки</p>
                    <small>Готовая верстка</small>
                </div>
            </div>
            
            <!-- Предпросмотр данных -->
            <div class="export-preview">
                <h4>Предпросмотр данных (первые 3 оффера):</h4>
                <pre><code>${JSON.stringify(offers.slice(0, 3), null, 2)}</code></pre>
            </div>
        </div>
    `;
}

// Рендер ошибки
function renderErrorPreview(message) {
    return `
        <div class="preview-error" role="alert">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Ошибка предпросмотра</h3>
            <p>${escapeHtml(message)}</p>
            <button class="btn btn-secondary" onclick="Preview.refresh()">
                <i class="fas fa-redo"></i> Попробовать снова
            </button>
        </div>
    `;
}

// ===== ОБРАБОТЧИКИ ИНТЕРФЕЙСА =====

// Инициализация обработчиков предпросмотра
function initPreviewHandlers() {
    // Обработчики вкладок
    document.addEventListener('click', function(e) {
        const tab = e.target.closest('.preview-tab');
        if (tab) {
            e.preventDefault();
            const tabId = tab.dataset.preview;
            switchPreviewTab(tabId);
        }
    });
    
    // Кнопка обновления
    const refreshBtn = document.getElementById('refresh-preview');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshPreview);
    }
    
    // Кнопки масштабирования
    const zoomInBtn = document.getElementById('preview-zoom-in');
    const zoomOutBtn = document.getElementById('preview-zoom-out');
    const fullscreenBtn = document.getElementById('preview-fullscreen');
    
    if (zoomInBtn) zoomInBtn.addEventListener('click', zoomInPreview);
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOutPreview);
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreenPreview);
    
    // Кнопка настроек
    const settingsBtn = document.getElementById('preview-settings');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', showPreviewSettings);
    }
    
    // Инициализация первой вкладки
    setTimeout(() => {
        loadTabContent(PreviewState.activeTab);
        updatePreviewUI();
    }, 100);
}

// Инициализация обработчиков вкладки
function initTabHandlers(tabId) {
    switch(tabId) {
        case 'landing1':
        case 'landing2':
            initLandingHandlers();
            break;
        case 'mobile':
            initMobileHandlers();
            break;
        case 'filters':
            initFilterHandlers();
            break;
        case 'analytics':
            initAnalyticsHandlers();
            break;
        case 'export':
            initExportHandlers();
            break;
    }
}

// Инициализация обработчиков лендинга
function initLandingHandlers() {
    // Обработчики для iframe будут добавлены после загрузки
}

// Инициализация обработчиков мобильной версии
function initMobileHandlers() {
    const mobileOffers = document.querySelectorAll('.mobile-offer .offer-action');
    mobileOffers.forEach(btn => {
        btn.addEventListener('click', function() {
            const offerId = this.closest('.mobile-offer').dataset.offerId;
            selectOffer(offerId);
        });
    });
}

// Инициализация обработчиков фильтров
function initFilterHandlers() {
    // Можно добавить обработчики для фильтров
}

// Инициализация обработчиков аналитики
function initAnalyticsHandlers() {
    // Можно добавить обработчики для аналитики
}

// Инициализация обработчиков экспорта
function initExportHandlers() {
    const exportCards = document.querySelectorAll('.format-card');
    exportCards.forEach(card => {
        card.addEventListener('click', function() {
            const format = this.dataset.format || 'json';
            exportData(format);
        });
    });
}

// ===== ДЕЙСТВИЯ ПРЕДПРОСМОТРА =====

// Обновление предпросмотра
function refreshPreview() {
    loadPreviewData();
    
    if (window.App && window.App.showNotification) {
        window.App.showNotification(PREVIEW_CONFIG.messages.updated, 'success');
    }
}

// Увеличение масштаба
function zoomInPreview() {
    const frame = document.querySelector('.preview-frame');
    if (frame) {
        const currentZoom = parseFloat(frame.style.transform?.replace('scale(', '') || 1);
        const newZoom = Math.min(currentZoom + 0.1, 2);
        frame.style.transform = `scale(${newZoom})`;
    }
}

// Уменьшение масштаба
function zoomOutPreview() {
    const frame = document.querySelector('.preview-frame');
    if (frame) {
        const currentZoom = parseFloat(frame.style.transform?.replace('scale(', '') || 1);
        const newZoom = Math.max(currentZoom - 0.1, 0.5);
        frame.style.transform = `scale(${newZoom})`;
    }
}

// Переключение полноэкранного режима
function toggleFullscreenPreview() {
    const container = document.querySelector('.preview-frame-container');
    if (!container) return;
    
    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
            console.error('Ошибка полноэкранного режима:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// Показать настройки предпросмотра
function showPreviewSettings() {
    if (window.Modal && window.Modal.open) {
        window.Modal.open('settings', {
            title: 'Настройки предпросмотра',
            data: {
                autoRefresh: PREVIEW_CONFIG.preview.autoRefresh,
                refreshInterval: PREVIEW_CONFIG.preview.refreshInterval / 1000,
                cacheDuration: PREVIEW_CONFIG.preview.cacheDuration / 1000
            }
        });
    }
}

// Выбор оффера
function selectOffer(offerId) {
    const offer = PreviewState.offers.find(o => o.id === offerId);
    if (!offer) {
        console.error(`❌ Оффер с ID ${offerId} не найден`);
        return;
    }
    
    console.log(`✅ Выбран оффер: ${offer.name}`);
    
    if (window.App && window.App.showNotification) {
        window.App.showNotification(`Выбран оффер: ${offer.name}`, 'info');
    }
    
    // Можно добавить дополнительную логику выбора
}

// Просмотр деталей оффера
function viewDetails(offerId) {
    const offer = PreviewState.offers.find(o => o.id === offerId);
    if (!offer) return;
    
    if (window.Modal && window.Modal.open) {
        window.Modal.open('offer-details', {
            title: `Детали оффера: ${offer.name}`,
            data: { offer }
        });
    }
}

// Экспорт данных
function exportData(format = 'json') {
    const { filteredOffers } = PreviewState;
    
    try {
        let data, filename, mimeType;
        
        switch(format) {
            case 'json':
                data = JSON.stringify(filteredOffers, null, 2);
                filename = `offers_${formatDateTime(new Date(), 'file')}.json`;
                mimeType = 'application/json';
                break;
                
            case 'csv':
                data = convertToCSV(filteredOffers);
                filename = `offers_${formatDateTime(new Date(), 'file')}.csv`;
                mimeType = 'text/csv';
                break;
                
            case 'html':
                data = convertToHTML(filteredOffers);
                filename = `offers_${formatDateTime(new Date(), 'file')}.html`;
                mimeType = 'text/html';
                break;
                
            default:
                throw new Error(`Неизвестный формат: ${format}`);
        }
        
        // Создание ссылки для скачивания
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log(`✅ Данные экспортированы в формате ${format}`);
        
        if (window.App && window.App.showNotification) {
            window.App.showNotification(`Данные экспортированы (${filteredOffers.length} записей)`, 'success');
        }
        
    } catch (error) {
        console.error('❌ Ошибка экспорта данных:', error);
        if (window.App && window.App.showNotification) {
            window.App.showNotification('Ошибка экспорта данных', 'error');
        }
    }
}

// Конвертация в CSV
function convertToCSV(offers) {
    const headers = ['ID', 'Название', 'Сумма мин', 'Сумма макс', 'Статус', 'Лендинг 1', 'Лендинг 2'];
    const rows = offers.map(offer => [
        offer.id,
        `"${offer.name.replace(/"/g, '""')}"`,
        offer.amount_min,
        offer.amount_max,
        offer.status,
        offer.landing1 ? 'Да' : 'Нет',
        offer.landing2 ? 'Да' : 'Нет'
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// Конвертация в HTML
function convertToHTML(offers) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Офферы - ${formatDateTime(new Date())}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                tr:nth-child(even) { background-color: #f9f9f9; }
            </style>
        </head>
        <body>
            <h1>Офферы (${offers.length})</h1>
            <p>Экспортировано: ${formatDateTime(new Date())}</p>
            <table>
                <thead>
                    <tr>
                        <th>Название</th>
                        <th>Сумма</th>
                        <th>Срок</th>
                        <th>Статус</th>
                        <th>Лендинг 1</th>
                        <th>Лендинг 2</th>
                    </tr>
                </thead>
                <tbody>
                    ${offers.map(offer => `
                        <tr>
                            <td>${escapeHtml(offer.name)}</td>
                            <td>${offer.amount_min} - ${offer.amount_max} ₽</td>
                            <td>${offer.term_min} - ${offer.term_max} дней</td>
                            <td>${offer.status === 'active' ? 'Активен' : 'Неактивен'}</td>
                            <td>${offer.landing1 ? '✓' : '✗'}</td>
                            <td>${offer.landing2 ? '✓' : '✗'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `;
}

// ===== УПРАВЛЕНИЕ UI =====

// Обновление UI предпросмотра
function updatePreviewUI() {
    // Обновление счетчиков
    updatePreviewCounters();
    
    // Обновление времени
    updatePreviewTime();
    
    // Обновление активной вкладки
    updateActiveTabContent();
    
    // Обновление статистики
    updatePreviewStatsDisplay();
}

// Обновление счетчиков
function updatePreviewCounters() {
    const countElement = document.getElementById('preview-offers-count');
    if (countElement) {
        countElement.textContent = PreviewState.filteredOffers.length;
    }
    
    const statsElement = document.getElementById('preview-stats');
    if (statsElement) {
        const { stats } = PreviewState;
        statsElement.textContent = `${stats.active} активных • ${stats.landing1}+${stats.landing2} лендинги`;
    }
}

// Обновление времени
function updatePreviewTime() {
    const timeElement = document.getElementById('preview-update-time');
    if (timeElement && PreviewState.lastUpdate) {
        timeElement.textContent = formatTime(PreviewState.lastUpdate);
    }
    
    const statusElement = document.getElementById('preview-update-status');
    if (statusElement) {
        statusElement.textContent = PreviewState.isLoading ? 
            'Обновление...' : `Обновлено: ${formatTime(PreviewState.lastUpdate)}`;
    }
}

// Обновление содержимого активной вкладки
function updateActiveTabContent() {
    if (isPreviewUITendered()) {
        loadTabContent(PreviewState.activeTab);
    }
}

// Обновление отображения статистики
function updatePreviewStatsDisplay() {
    // Обновление бейджей на вкладках
    PREVIEW_CONFIG.tabs.forEach(tab => {
        const badge = document.querySelector(`.preview-tab[data-preview="${tab.id}"] .tab-badge`);
        if (badge) {
            const count = getTabOffersCount(tab.id);
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-flex' : 'none';
        }
    });
}

// Показать/скрыть загрузку
function showPreviewLoading(show) {
    const loadingElement = document.getElementById('preview-loading');
    if (loadingElement) {
        loadingElement.style.display = show ? 'flex' : 'none';
    }
}

// Показать ошибку
function showPreviewError(message) {
    const contentArea = document.getElementById('preview-content-area');
    if (contentArea) {
        contentArea.innerHTML = renderErrorPreview(message);
    }
}

// ===== УТИЛИТЫ =====

// Получение иконки оффера
function getOfferIcon(iconName) {
    const icons = {
        'bolt': '⚡',
        'shield-alt': '🛡️',
        'star': '⭐',
        'rocket': '🚀',
        'wallet': '💰',
        'clock': '⏱️',
        'gem': '💎',
        'trophy': '🏆',
        'money-bill': '💵',
        'credit-card': '💳',
        'home': '🏠',
        'car': '🚗'
    };
    
    return icons[iconName] || '📋';
}

// Форматирование числа
function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) {
        return '0';
    }
    
    return num.toLocaleString('ru-RU');
}

// Форматирование времени
function formatTime(date) {
    if (!date) return '--:--';
    
    const d = new Date(date);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// Форматирование даты и времени
function formatDateTime(date, format = 'display') {
    if (!date) return '--.--.---- --:--';
    
    const d = new Date(date);
    
    if (format === 'file') {
        return `${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}_${d.getHours().toString().padStart(2, '0')}${d.getMinutes().toString().padStart(2, '0')}`;
    }
    
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth()+1).toString().padStart(2, '0')}.${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// Изменение активных офферов (заглушка)
function getActiveChange() {
    return '+12';
}

// Изменение просрочек (заглушка)
function getOverdueChange() {
    return '-5';
}

// Экранирование HTML
function escapeHtml(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

// Проверка рендера UI
function isPreviewUITendered() {
    return document.getElementById('preview-content') !== null;
}

// ===== API МОДУЛЯ =====

// Экспорт функций API
function exportPreviewAPI() {
    window.PreviewModule = {
        // Рендер
        render: renderPreviewTab,
        
        // Инициализация
        init: initPreviewModule,
        initUI: initPreviewHandlers,
        
        // Управление данными
        refresh: refreshPreview,
        load: loadPreviewData,
        
        // Управление вкладками
        switchTab: switchPreviewTab,
        updateUI: updatePreviewUI,
        
        // Действия
        selectOffer: selectOffer,
        viewDetails: viewDetails,
        exportData: exportData,
        
        // Управление предпросмотром
        zoomIn: zoomInPreview,
        zoomOut: zoomOutPreview,
        toggleFullscreen: toggleFullscreenPreview,
        
        // Утилиты
        getState: () => ({ ...PreviewState }),
        getStats: () => ({ ...PreviewState.stats }),
        getOffers: () => [...PreviewState.filteredOffers]
    };
    
    // Для обратной совместимости
    window.renderPreviewTab = renderPreviewTab;
    window.updatePreview = refreshPreview;
    window.initPreviewHandlers = initPreviewHandlers;
}

// ===== АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ =====

// Инициализация при загрузке модуля
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initPreviewModule, 100);
    });
} else {
    setTimeout(initPreviewModule, 100);
}

console.log('👁️ Модуль предпросмотра загружен');
