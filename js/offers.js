// ===== МОДУЛЬ ОФФЕРОВ =====

// Состояние
let offers = [];
let filter = {
    status: 'all',
    search: ''
};

// ===== ОСНОВНЫЕ ФУНКЦИИ =====

/**
 * Инициализация модуля
 */
export function initOffers() {
    console.log('📦 Инициализация модуля офферов');
    
    // Загрузка данных из основного приложения
    if (window.App && window.App.state) {
        offers = window.App.state.offers || [];
    }
    
    return true;
}

/**
 * Рендер вкладки офферов
 */
export function renderOffersTab() {
    return `
        <div class="tab-content">
            <div class="card">
                <div class="card-header">
                    <h2><i class="fas fa-gem"></i> Офферы</h2>
                    <button class="btn btn-primary" id="add-offer-btn">
                        <i class="fas fa-plus"></i> Добавить
                    </button>
                </div>
                
                <div class="table-tools">
                    <div class="search-box">
                        <input type="text" id="offers-search" placeholder="Поиск..." 
                               value="${filter.search}">
                        <i class="fas fa-search"></i>
                    </div>
                    <div class="filter-buttons">
                        <button class="btn btn-sm ${filter.status === 'all' ? 'active' : ''}" 
                                onclick="setOfferFilter('status', 'all')">
                            Все
                        </button>
                        <button class="btn btn-sm ${filter.status === 'active' ? 'active' : ''}" 
                                onclick="setOfferFilter('status', 'active')">
                            Активные
                        </button>
                    </div>
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
                    
                    <div class="table-info">
                        Всего: ${getFilteredOffers().length}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Рендер таблицы офферов
 */
function renderOffersTable() {
    const filtered = getFilteredOffers();
    
    if (filtered.length === 0) {
        return `
            <tr>
                <td colspan="5" class="empty">
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>${offers.length === 0 ? 'Нет офферов' : 'Ничего не найдено'}</p>
                    </div>
                </td>
            </tr>
        `;
    }
    
    return filtered.map(offer => `
        <tr data-id="${offer.id}">
            <td><strong>${escapeHtml(offer.name)}</strong></td>
            <td>${escapeHtml(offer.description || '')}</td>
            <td>
                <span class="status-badge ${offer.status === 'active' ? 'active' : 'inactive'}">
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
 * Получение отфильтрованных офферов
 */
function getFilteredOffers() {
    return offers.filter(offer => {
        // Фильтр по статусу
        if (filter.status !== 'all' && offer.status !== filter.status) {
            return false;
        }
        
        // Фильтр по поиску
        if (filter.search) {
            const searchLower = filter.search.toLowerCase();
            const matchesName = offer.name.toLowerCase().includes(searchLower);
            const matchesDesc = offer.description && 
                               offer.description.toLowerCase().includes(searchLower);
            return matchesName || matchesDesc;
        }
        
        return true;
    });
}

/**
 * Установка фильтра
 */
export function setOfferFilter(type, value) {
    filter[type] = value;
    
    // Обновление UI
    const tbody = document.getElementById('offers-table-body');
    if (tbody) {
        tbody.innerHTML = renderOffersTable();
    }
    
    // Обновление счетчика
    const infoEl = document.querySelector('.table-info');
    if (infoEl) {
        infoEl.textContent = `Всего: ${getFilteredOffers().length}`;
    }
    
    // Обновление активных кнопок
    updateFilterButtons();
}

/**
 * Обновление кнопок фильтров
 */
function updateFilterButtons() {
    document.querySelectorAll('.filter-buttons .btn').forEach(btn => {
        const status = btn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        btn.classList.toggle('active', filter.status === status);
    });
}

/**
 * Добавление оффера
 */
export function addOffer() {
    if (window.Modal && window.Modal.open) {
        window.Modal.open('offer', {});
    }
}

/**
 * Редактирование оффера
 */
export function editOffer(id) {
    const offer = offers.find(o => o.id === id);
    if (!offer) return;
    
    if (window.Modal && window.Modal.open) {
        window.Modal.open('offer', { offer });
    }
}

/**
 * Удаление оффера
 */
export function deleteOffer(id) {
    const offer = offers.find(o => o.id === id);
    if (!offer) return;
    
    if (window.Modal && window.Modal.showDeleteConfirm) {
        window.Modal.showDeleteConfirm(id, offer.name);
    } else if (confirm(`Удалить оффер "${offer.name}"?`)) {
        removeOffer(id);
    }
}

/**
 * Удаление оффера (основная логика)
 */
function removeOffer(id) {
    if (window.App && window.App.state) {
        window.App.state.offers = window.App.state.offers.filter(o => o.id !== id);
        
        if (window.App.save) {
            window.App.save();
        }
        
        // Обновление локальных данных
        offers = window.App.state.offers;
        
        // Обновление UI
        const tbody = document.getElementById('offers-table-body');
        if (tbody) {
            tbody.innerHTML = renderOffersTable();
        }
        
        // Уведомление
        if (window.App.showNotification) {
            window.App.showNotification('Оффер удален', 'success');
        }
    }
}

/**
 * Обновление данных офферов
 */
export function updateOffers(newOffers) {
    offers = newOffers || [];
    
    // Обновление UI если он отображен
    const tbody = document.getElementById('offers-table-body');
    if (tbody) {
        tbody.innerHTML = renderOffersTable();
    }
}

/**
 * Инициализация обработчиков вкладки
 */
export function initOffersHandlers() {
    // Поиск
    const searchInput = document.getElementById('offers-search');
    if (searchInput) {
        let timeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                setOfferFilter('search', e.target.value);
            }, 300);
        });
    }
    
    // Кнопка добавления
    const addBtn = document.getElementById('add-offer-btn');
    if (addBtn) {
        addBtn.addEventListener('click', addOffer);
    }
    
    // Инициализация кнопок фильтров
    updateFilterButtons();
}

// ===== УТИЛИТЫ =====

/**
 * Форматирование числа
 */
function formatNumber(num) {
    if (typeof num !== 'number') return '0';
    return num.toLocaleString('ru-RU');
}

/**
 * Экранирование HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== ГЛОБАЛЬНЫЙ ДОСТУП =====

// Автоматическая инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOffers);
} else {
    setTimeout(initOffers, 100);
}

// Экспорт
window.Offers = {
    init: initOffers,
    render: renderOffersTab,
    update: updateOffers,
    add: addOffer,
    edit: editOffer,
    delete: deleteOffer,
    setFilter: setOfferFilter,
    initHandlers: initOffersHandlers
};

console.log('📦 Модуль офферов загружен');
