// ===== offers.js =====
// Модуль управления офферами

// ===== КОНФИГУРАЦИЯ =====
const OFFERS_CONFIG = {
    // Селекторы
    selectors: {
        offersContent: '#offers-content',
        offersTable: '#offers-table',
        offersList: '#offers-list',
        addOfferBtn: '#add-offer-btn'
    },
    
    // Классы
    classes: {
        active: 'active',
        inactive: 'inactive',
        loading: 'loading',
        error: 'error'
    },
    
    // Сообщения
    messages: {
        noOffers: 'Нет офферов',
        addFirstOffer: 'Добавьте первый оффер, чтобы начать работу',
        deleteConfirm: 'Вы уверены, что хотите удалить этот оффер?',
        deleteSuccess: 'Оффер успешно удален',
        statusChanged: 'Статус оффера изменен',
        loading: 'Загрузка офферов...',
        error: 'Произошла ошибка'
    },
    
    // Настройки
    itemsPerPage: 20,
    sortBy: 'created_at',
    sortOrder: 'desc',
    autoRefresh: true,
    refreshInterval: 30000 // 30 секунд
};

// ===== СОСТОЯНИЕ =====
const OffersState = {
    offers: [],
    filteredOffers: [],
    currentPage: 1,
    totalPages: 1,
    sortField: OFFERS_CONFIG.sortBy,
    sortDirection: OFFERS_CONFIG.sortOrder,
    filter: {
        status: 'all',
        search: '',
        landing1: false,
        landing2: false
    },
    isLoading: false,
    refreshInterval: null
};

// ===== КОНТРОЛЛЕРЫ ДАННЫХ =====

// Инициализация модуля офферов
function initOffersModule() {
    console.log('📦 Инициализация модуля офферов...');
    
    try {
        // Проверка зависимостей
        checkDependencies();
        
        // Загрузка данных
        loadOffersData();
        
        // Инициализация интервала обновления
        if (OFFERS_CONFIG.autoRefresh) {
            initAutoRefresh();
        }
        
        // Экспорт API
        exportOffersAPI();
        
        console.log('✅ Модуль офферов инициализирован');
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка инициализации модуля офферов:', error);
        return false;
    }
}

// Проверка зависимостей
function checkDependencies() {
    const required = ['App', 'Modal'];
    const missing = required.filter(dep => !window[dep]);
    
    if (missing.length > 0) {
        throw new Error(`Отсутствуют зависимости: ${missing.join(', ')}`);
    }
}

// Загрузка данных офферов
function loadOffersData() {
    if (OffersState.isLoading) {
        console.log('⏳ Данные уже загружаются...');
        return;
    }
    
    OffersState.isLoading = true;
    
    try {
        // Получение данных из основного приложения
        if (window.App && window.App.getOffers) {
            const appOffers = window.App.getOffers();
            
            // Валидация данных
            if (validateOffersData(appOffers)) {
                OffersState.offers = [...appOffers];
                applyFiltersAndSort();
                console.log(`✅ Загружено ${OffersState.offers.length} офферов`);
            } else {
                console.warn('⚠️ Данные офферов не прошли валидацию');
                OffersState.offers = [];
            }
        } else {
            console.warn('⚠️ Основное приложение не предоставляет данные офферов');
            OffersState.offers = [];
        }
        
        OffersState.isLoading = false;
        
        // Обновление UI если он уже отрендерен
        if (isOffersUITendered()) {
            updateOffersUI();
        }
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных офферов:', error);
        OffersState.isLoading = false;
        showOffersError('Не удалось загрузить данные офферов');
    }
}

// Валидация данных офферов
function validateOffersData(offers) {
    if (!Array.isArray(offers)) {
        return false;
    }
    
    try {
        // Базовая проверка каждого оффера
        for (const offer of offers) {
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
            const dangerousPattern = /[<>"'`]/;
            if (dangerousPattern.test(offer.name) || 
                (offer.description && dangerousPattern.test(offer.description))) {
                console.warn('⚠️ Обнаружены потенциально опасные данные в оффере:', offer.id);
                return false;
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('Ошибка валидации данных офферов:', error);
        return false;
    }
}

// Инициализация автоматического обновления
function initAutoRefresh() {
    if (OffersState.refreshInterval) {
        clearInterval(OffersState.refreshInterval);
    }
    
    OffersState.refreshInterval = setInterval(() => {
        if (!document.hidden && isOffersUITendered()) {
            loadOffersData();
        }
    }, OFFERS_CONFIG.refreshInterval);
    
    console.log('🔄 Автоматическое обновление офферов включено');
}

// ===== ФИЛЬТРАЦИЯ И СОРТИРОВКА =====

// Применение фильтров и сортировки
function applyFiltersAndSort() {
    let filtered = [...OffersState.offers];
    
    // Применение фильтров
    filtered = applyFilters(filtered);
    
    // Применение сортировки
    filtered = applySorting(filtered);
    
    // Расчет пагинации
    OffersState.filteredOffers = filtered;
    OffersState.totalPages = Math.ceil(filtered.length / OFFERS_CONFIG.itemsPerPage);
    
    // Корректировка текущей страницы
    if (OffersState.currentPage > OffersState.totalPages) {
        OffersState.currentPage = Math.max(1, OffersState.totalPages);
    }
}

// Применение фильтров
function applyFilters(offers) {
    const { status, search, landing1, landing2 } = OffersState.filter;
    
    return offers.filter(offer => {
        // Фильтр по статусу
        if (status !== 'all' && offer.status !== status) {
            return false;
        }
        
        // Фильтр по поиску
        if (search) {
            const searchLower = search.toLowerCase();
            const matchesName = offer.name.toLowerCase().includes(searchLower);
            const matchesDesc = offer.description && 
                               offer.description.toLowerCase().includes(searchLower);
            const matchesId = offer.id.toLowerCase().includes(searchLower);
            
            if (!matchesName && !matchesDesc && !matchesId) {
                return false;
            }
        }
        
        // Фильтр по landing1
        if (landing1 && !offer.landing1) {
            return false;
        }
        
        // Фильтр по landing2
        if (landing2 && !offer.landing2) {
            return false;
        }
        
        return true;
    });
}

// Применение сортировки
function applySorting(offers) {
    const { sortField, sortDirection } = OffersState;
    
    return [...offers].sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];
        
        // Обработка разных типов данных
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }
        
        // Сравнение значений
        if (aValue < bValue) {
            return sortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
    });
}

// Установка фильтра
function setFilter(filterType, value) {
    OffersState.filter[filterType] = value;
    OffersState.currentPage = 1;
    applyFiltersAndSort();
    updateOffersUI();
}

// Установка сортировки
function setSort(field, direction = null) {
    if (OffersState.sortField === field) {
        // Переключение направления если то же поле
        OffersState.sortDirection = OffersState.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        // Новое поле сортировки
        OffersState.sortField = field;
        OffersState.sortDirection = direction || OFFERS_CONFIG.sortOrder;
    }
    
    applyFiltersAndSort();
    updateOffersUI();
}

// ===== РЕНДЕРИНГ ИНТЕРФЕЙСА =====

// Рендер вкладки офферов
function renderOffersTab() {
    console.log('🎨 Рендер вкладки офферов...');
    
    return `
        <div id="offers-content" class="tab-content" role="region" aria-label="Управление офферами">
            <!-- Заголовок и управление -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title" id="offers-title">
                        <i class="fas fa-gem" aria-hidden="true"></i>
                        <span>Управление офферами</span>
                        <span class="card-subtitle" id="offers-count">Загрузка...</span>
                    </h2>
                    
                    <div class="card-actions">
                        <!-- Поиск -->
                        <div class="search-box">
                            <input 
                                type="text" 
                                id="offers-search" 
                                placeholder="Поиск офферов..."
                                aria-label="Поиск офферов"
                                class="form-control form-control-sm">
                            <i class="fas fa-search search-icon" aria-hidden="true"></i>
                        </div>
                        
                        <!-- Фильтры -->
                        <div class="btn-group" role="group" aria-label="Фильтры офферов">
                            <button class="btn btn-sm ${OffersState.filter.status === 'all' ? 'btn-primary' : 'btn-outline'}" 
                                    onclick="Offers.setFilter('status', 'all')">
                                Все
                            </button>
                            <button class="btn btn-sm ${OffersState.filter.status === 'active' ? 'btn-primary' : 'btn-outline'}" 
                                    onclick="Offers.setFilter('status', 'active')">
                                Активные
                            </button>
                            <button class="btn btn-sm ${OffersState.filter.status === 'inactive' ? 'btn-primary' : 'btn-outline'}" 
                                    onclick="Offers.setFilter('status', 'inactive')">
                                Неактивные
                            </button>
                        </div>
                        
                        <!-- Кнопка добавления -->
                        <button class="btn btn-primary" id="add-offer-btn" aria-label="Добавить новый оффер">
                            <i class="fas fa-plus-circle" aria-hidden="true"></i>
                            <span>Добавить оффер</span>
                        </button>
                    </div>
                </div>
                
                <!-- Таблица офферов -->
                <div class="table-container" role="region" aria-label="Список офферов">
                    <div id="offers-loading" class="table-loading" style="display: none;">
                        <div class="loader"></div>
                        <p>Загрузка офферов...</p>
                    </div>
                    
                    <div id="offers-error" class="table-error" style="display: none;" role="alert"></div>
                    
                    <table id="offers-table" class="data-table" aria-describedby="offers-title">
                        <thead>
                            <tr>
                                <th onclick="Offers.setSort('name')" style="cursor: pointer;">
                                    Оффер 
                                    ${OffersState.sortField === 'name' ? 
                                        `<i class="fas fa-sort-${OffersState.sortDirection === 'asc' ? 'up' : 'down'}"></i>` : 
                                        '<i class="fas fa-sort"></i>'}
                                </th>
                                <th onclick="Offers.setSort('amount_max')" style="cursor: pointer;">
                                    Сумма
                                    ${OffersState.sortField === 'amount_max' ? 
                                        `<i class="fas fa-sort-${OffersState.sortDirection === 'asc' ? 'up' : 'down'}"></i>` : 
                                        '<i class="fas fa-sort"></i>'}
                                </th>
                                <th onclick="Offers.setSort('term_max')" style="cursor: pointer;">
                                    Срок
                                    ${OffersState.sortField === 'term_max' ? 
                                        `<i class="fas fa-sort-${OffersState.sortDirection === 'asc' ? 'up' : 'down'}"></i>` : 
                                        '<i class="fas fa-sort"></i>'}
                                </th>
                                <th>Ставка</th>
                                <th>Просрочки</th>
                                <th>Доход</th>
                                <th onclick="Offers.setSort('status')" style="cursor: pointer;">
                                    Статус
                                    ${OffersState.sortField === 'status' ? 
                                        `<i class="fas fa-sort-${OffersState.sortDirection === 'asc' ? 'up' : 'down'}"></i>` : 
                                        '<i class="fas fa-sort"></i>'}
                                </th>
                                <th style="text-align: center;" aria-label="Действия">Действия</th>
                            </tr>
                        </thead>
                        <tbody id="offers-list">
                            <!-- Список офферов будет загружен динамически -->
                        </tbody>
                    </table>
                    
                    <!-- Пагинация -->
                    ${renderPagination()}
                </div>
            </div>
        </div>
    `;
}

// Рендер пагинации
function renderPagination() {
    if (OffersState.totalPages <= 1) {
        return '';
    }
    
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, OffersState.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(OffersState.totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    // Предыдущая страница
    pages.push(`
        <li class="page-item ${OffersState.currentPage === 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="Offers.goToPage(${OffersState.currentPage - 1})" 
                    aria-label="Предыдущая страница" ${OffersState.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        </li>
    `);
    
    // Первая страница
    if (startPage > 1) {
        pages.push(`
            <li class="page-item">
                <button class="page-link" onclick="Offers.goToPage(1)">1</button>
            </li>
        `);
        if (startPage > 2) {
            pages.push('<li class="page-item disabled"><span class="page-link">...</span></li>');
        }
    }
    
    // Страницы
    for (let i = startPage; i <= endPage; i++) {
        pages.push(`
            <li class="page-item ${OffersState.currentPage === i ? 'active' : ''}">
                <button class="page-link" onclick="Offers.goToPage(${i})" 
                        aria-label="Страница ${i}" ${OffersState.currentPage === i ? 'aria-current="page"' : ''}>
                    ${i}
                </button>
            </li>
        `);
    }
    
    // Последняя страница
    if (endPage < OffersState.totalPages) {
        if (endPage < OffersState.totalPages - 1) {
            pages.push('<li class="page-item disabled"><span class="page-link">...</span></li>');
        }
        pages.push(`
            <li class="page-item">
                <button class="page-link" onclick="Offers.goToPage(${OffersState.totalPages})">
                    ${OffersState.totalPages}
                </button>
            </li>
        `);
    }
    
    // Следующая страница
    pages.push(`
        <li class="page-item ${OffersState.currentPage === OffersState.totalPages ? 'disabled' : ''}">
            <button class="page-link" onclick="Offers.goToPage(${OffersState.currentPage + 1})" 
                    aria-label="Следующая страница" ${OffersState.currentPage === OffersState.totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        </li>
    `);
    
    return `
        <nav aria-label="Навигация по страницам" class="table-pagination">
            <ul class="pagination">
                ${pages.join('')}
            </ul>
            <div class="pagination-info">
                Показано ${getVisibleItemsRange()} из ${OffersState.filteredOffers.length} офферов
            </div>
        </nav>
    `;
}

// Получение диапазона видимых элементов
function getVisibleItemsRange() {
    const start = (OffersState.currentPage - 1) * OFFERS_CONFIG.itemsPerPage + 1;
    const end = Math.min(OffersState.currentPage * OFFERS_CONFIG.itemsPerPage, OffersState.filteredOffers.length);
    return `${start}-${end}`;
}

// Рендер списка офферов
function renderOffersList() {
    const tbody = document.getElementById('offers-list');
    if (!tbody) return;
    
    if (OffersState.isLoading) {
        showOffersLoading();
        return;
    }
    
    if (OffersState.filteredOffers.length === 0) {
        renderNoOffers(tbody);
        return;
    }
    
    try {
        // Получение офферов для текущей страницы
        const startIndex = (OffersState.currentPage - 1) * OFFERS_CONFIG.itemsPerPage;
        const endIndex = startIndex + OFFERS_CONFIG.itemsPerPage;
        const pageOffers = OffersState.filteredOffers.slice(startIndex, endIndex);
        
        // Безопасный рендер
        tbody.innerHTML = pageOffers.map(offer => renderOfferRow(offer)).join('');
        
        // Обновление информации о количестве
        updateOffersCount();
        
    } catch (error) {
        console.error('❌ Ошибка рендера списка офферов:', error);
        renderError(tbody, 'Не удалось загрузить список офферов');
    }
}

// Рендер строки оффера
function renderOfferRow(offer) {
    const icon = getOfferIcon(offer.icon);
    const statusClass = offer.status === 'active' ? 'status-active' : 'status-inactive';
    const statusText = offer.status === 'active' ? 'Активный' : 'Неактивный';
    const statusIcon = offer.status === 'active' ? 'fa-check-circle' : 'fa-pause-circle';
    
    // Безопасное экранирование текста
    const safeName = escapeHtml(offer.name || '');
    const safeId = escapeHtml(offer.id || '');
    const safeDescription = escapeHtml(offer.description || '');
    
    return `
        <tr data-offer-id="${safeId}" role="row">
            <td role="cell">
                <div class="offer-info">
                    <div class="offer-icon" aria-hidden="true">${icon}</div>
                    <div class="offer-details">
                        <div class="offer-name" title="${safeDescription}">${safeName}</div>
                        <div class="offer-id">ID: ${safeId.substring(0, 8)}...</div>
                    </div>
                </div>
            </td>
            <td role="cell">
                <div class="offer-amount">
                    ${formatNumber(offer.amount_min || 0)} - ${formatNumber(offer.amount_max || 0)} ₽
                </div>
            </td>
            <td role="cell">
                <div class="offer-term">
                    ${offer.term_min || 0} - ${offer.term_max || 0} дней
                </div>
            </td>
            <td role="cell">
                <div class="offer-rate ${offer.rate_max > 0.5 ? 'rate-high' : 'rate-low'}">
                    ${offer.rate_display || '0%'}
                </div>
            </td>
            <td role="cell">
                <div class="overdue-badges" role="list" aria-label="Типы просрочек">
                    ${renderOverdueBadges(offer.overdue_types)}
                </div>
            </td>
            <td role="cell">
                <div class="income-badges" role="list" aria-label="Типы доходов">
                    ${renderIncomeBadges(offer.income_types)}
                </div>
            </td>
            <td role="cell">
                <span class="status-badge ${statusClass}" role="status" aria-label="Статус: ${statusText}">
                    <i class="fas ${statusIcon}" aria-hidden="true"></i>
                    ${statusText}
                </span>
            </td>
            <td role="cell">
                <div class="action-buttons" role="group" aria-label="Действия с оффером">
                    <button class="btn btn-sm btn-secondary" 
                            onclick="Offers.editOffer('${safeId}')"
                            aria-label="Редактировать оффер ${safeName}">
                        <i class="fas fa-edit" aria-hidden="true"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" 
                            onclick="Offers.deleteOffer('${safeId}')"
                            aria-label="Удалить оффер ${safeName}">
                        <i class="fas fa-trash" aria-hidden="true"></i>
                    </button>
                    <button class="btn btn-sm ${offer.status === 'active' ? 'btn-warning' : 'btn-success'}" 
                            onclick="Offers.toggleOfferStatus('${safeId}')"
                            aria-label="${offer.status === 'active' ? 'Деактивировать' : 'Активировать'} оффер ${safeName}">
                        <i class="fas fa-power-off" aria-hidden="true"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// Рендер бейджей просрочек
function renderOverdueBadges(overdueTypes = []) {
    const badges = {
        'no_overdue': { text: 'Нет', class: 'badge-success' },
        'has_overdue': { text: 'Есть', class: 'badge-warning' },
        'overdue_30plus': { text: '30+', class: 'badge-danger' },
        'court_cases': { text: 'Суд', class: 'badge-danger' }
    };
    
    return overdueTypes
        .filter(type => badges[type])
        .map(type => `
            <span class="badge ${badges[type].class}" role="listitem">
                ${badges[type].text}
            </span>
        `)
        .join('');
}

// Рендер бейджей доходов
function renderIncomeBadges(incomeTypes = []) {
    const badges = {
        'has_income': { text: 'Есть', class: 'badge-success' },
        'no_income': { text: 'Нет', class: 'badge-warning' },
        'income_unconfirmed': { text: '?', class: 'badge-secondary' }
    };
    
    return incomeTypes
        .filter(type => badges[type])
        .map(type => `
            <span class="badge ${badges[type].class}" role="listitem">
                ${badges[type].text}
            </span>
        `)
        .join('');
}

// Рендер состояния "нет офферов"
function renderNoOffers(container) {
    container.innerHTML = `
        <tr>
            <td colspan="8">
                <div class="empty-state" role="alert">
                    <i class="fas fa-inbox" aria-hidden="true"></i>
                    <h3>${OFFERS_CONFIG.messages.noOffers}</h3>
                    <p>${OFFERS_CONFIG.messages.addFirstOffer}</p>
                    <button class="btn btn-primary" onclick="Offers.addOffer()" aria-label="Добавить первый оффер">
                        <i class="fas fa-plus" aria-hidden="true"></i> Добавить оффер
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// Рендер ошибки
function renderError(container, message) {
    container.innerHTML = `
        <tr>
            <td colspan="8">
                <div class="error-state" role="alert">
                    <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
                    <h3>Ошибка</h3>
                    <p>${message}</p>
                    <button class="btn btn-secondary" onclick="Offers.refresh()">
                        <i class="fas fa-redo" aria-hidden="true"></i> Обновить
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// Показать загрузку
function showOffersLoading() {
    const loadingEl = document.getElementById('offers-loading');
    const table = document.getElementById('offers-table');
    
    if (loadingEl && table) {
        loadingEl.style.display = 'flex';
        table.style.opacity = '0.5';
    }
}

// Скрыть загрузку
function hideOffersLoading() {
    const loadingEl = document.getElementById('offers-loading');
    const table = document.getElementById('offers-table');
    
    if (loadingEl && table) {
        loadingEl.style.display = 'none';
        table.style.opacity = '1';
    }
}

// Показать ошибку
function showOffersError(message) {
    const errorEl = document.getElementById('offers-error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

// Скрыть ошибку
function hideOffersError() {
    const errorEl = document.getElementById('offers-error');
    if (errorEl) {
        errorEl.style.display = 'none';
    }
}

// Обновление счетчика офферов
function updateOffersCount() {
    const countEl = document.getElementById('offers-count');
    if (countEl) {
        const total = OffersState.offers.length;
        const filtered = OffersState.filteredOffers.length;
        const text = filtered === total ? 
            `${total} офферов` : 
            `${filtered} из ${total} офферов`;
        
        countEl.textContent = text;
    }
}

// ===== ОБРАБОТЧИКИ ДЕЙСТВИЙ =====

// Добавление оффера
function addOffer() {
    if (window.Modal && window.Modal.openOfferModal) {
        window.Modal.openOfferModal({ isEdit: false });
    } else {
        console.warn('⚠️ Модуль модальных окон не загружен');
    }
}

// Редактирование оффера
function editOffer(offerId) {
    const offer = OffersState.offers.find(o => o.id === offerId);
    if (!offer) {
        console.error(`❌ Оффер с ID ${offerId} не найден`);
        return;
    }
    
    if (window.Modal && window.Modal.openOfferModal) {
        window.Modal.openOfferModal({ 
            isEdit: true, 
            offer: { ...offer } 
        });
    } else {
        console.warn('⚠️ Модуль модальных окон не загружен');
    }
}

// Удаление оффера
function deleteOffer(offerId) {
    const offer = OffersState.offers.find(o => o.id === offerId);
    if (!offer) {
        console.error(`❌ Оффер с ID ${offerId} не найден`);
        return;
    }
    
    if (window.Modal && window.Modal.showDeleteConfirmation) {
        window.Modal.showDeleteConfirmation(offerId, offer.name);
    } else {
        // Fallback на стандартный confirm
        if (confirm(OFFERS_CONFIG.messages.deleteConfirm)) {
            performDeleteOffer(offerId);
        }
    }
}

// Выполнение удаления оффера
function performDeleteOffer(offerId) {
    try {
        // Удаление через основное приложение
        if (window.App && window.App.state) {
            const index = window.App.state.offers.findIndex(o => o.id === offerId);
            if (index !== -1) {
                window.App.state.offers.splice(index, 1);
                window.App.save();
                
                // Обновление локального состояния
                loadOffersData();
                
                // Уведомление
                if (window.App.showNotification) {
                    window.App.showNotification(OFFERS_CONFIG.messages.deleteSuccess, 'success');
                }
            }
        }
    } catch (error) {
        console.error('❌ Ошибка удаления оффера:', error);
        if (window.App && window.App.showNotification) {
            window.App.showNotification(OFFERS_CONFIG.messages.error, 'error');
        }
    }
}

// Переключение статуса оффера
function toggleOfferStatus(offerId) {
    const offer = OffersState.offers.find(o => o.id === offerId);
    if (!offer) {
        console.error(`❌ Оффер с ID ${offerId} не найден`);
        return;
    }
    
    try {
        // Обновление через основное приложение
        if (window.App && window.App.state) {
            const index = window.App.state.offers.findIndex(o => o.id === offerId);
            if (index !== -1) {
                const newStatus = window.App.state.offers[index].status === 'active' ? 'inactive' : 'active';
                window.App.state.offers[index].status = newStatus;
                window.App.save();
                
                // Обновление локального состояния
                loadOffersData();
                
                // Уведомление
                if (window.App.showNotification) {
                    window.App.showNotification(OFFERS_CONFIG.messages.statusChanged, 'success');
                }
            }
        }
    } catch (error) {
        console.error('❌ Ошибка изменения статуса оффера:', error);
        if (window.App && window.App.showNotification) {
            window.App.showNotification(OFFERS_CONFIG.messages.error, 'error');
        }
    }
}

// Переход на страницу
function goToPage(page) {
    if (page >= 1 && page <= OffersState.totalPages && page !== OffersState.currentPage) {
        OffersState.currentPage = page;
        updateOffersUI();
        
        // Прокрутка к верху таблицы
        const table = document.getElementById('offers-table');
        if (table) {
            table.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

// Обновление UI
function updateOffersUI() {
    renderOffersList();
    
    // Обновление пагинации
    const paginationContainer = document.querySelector('.table-pagination');
    if (paginationContainer) {
        const newPagination = renderPagination();
        paginationContainer.innerHTML = newPagination;
    }
    
    // Обновление счетчика
    updateOffersCount();
}

// Обновление данных
function refresh() {
    loadOffersData();
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
        'credit-card': '💳'
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

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Проверка рендера UI
function isOffersUITendered() {
    return document.getElementById('offers-content') !== null;
}

// ===== API МОДУЛЯ =====

// Экспорт функций API
function exportOffersAPI() {
    window.OffersModule = {
        // Рендер
        render: renderOffersTab,
        
        // Инициализация
        init: initOffersModule,
        initUI: () => {
            loadOffersData();
            initOffersHandlers();
        },
        
        // Управление данными
        refresh: refresh,
        load: loadOffersData,
        
        // Управление UI
        update: updateOffersUI,
        
        // Действия
        addOffer: addOffer,
        editOffer: editOffer,
        deleteOffer: deleteOffer,
        toggleOfferStatus: toggleOfferStatus,
        
        // Фильтры и сортировка
        setFilter: setFilter,
        setSort: setSort,
        goToPage: goToPage,
        
        // Утилиты
        getState: () => ({ ...OffersState }),
        getOffers: () => [...OffersState.offers],
        getFilteredOffers: () => [...OffersState.filteredOffers]
    };
    
    // Для обратной совместимости
    window.renderOffersTab = renderOffersTab;
    window.renderOffersList = renderOffersList;
    window.initOffersHandlers = () => window.OffersModule.initUI();
}

// ===== ИНИЦИАЛИЗАЦИЯ ОБРАБОТЧИКОВ UI =====

function initOffersHandlers() {
    // Поиск с debounce
    const searchInput = document.getElementById('offers-search');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                setFilter('search', e.target.value);
            }, 300);
        });
    }
    
    // Кнопка добавления
    const addButton = document.getElementById('add-offer-btn');
    if (addButton) {
        addButton.addEventListener('click', addOffer);
    }
    
    // Инициализация таблицы
    renderOffersList();
    
    console.log('✅ Обработчики офферов инициализированы');
}

// ===== АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ =====

// Инициализация при загрузке модуля
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initOffersModule, 100);
    });
} else {
    setTimeout(initOffersModule, 100);
}

console.log('📦 Модуль управления офферами загружен');
