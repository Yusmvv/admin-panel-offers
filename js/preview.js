// ===== ПРОСТОЙ МОДУЛЬ ПРЕДПРОСМОТРА =====

let offers = [];

/**
 * Инициализация модуля
 */
export function initPreview() {
    console.log('👁️ Инициализация предпросмотра');
    
    // Получение данных из основного приложения
    if (window.App && window.App.state) {
        offers = window.App.state.offers || [];
    }
    
    return true;
}

/**
 * Рендер вкладки предпросмотра
 */
export function renderPreviewTab() {
    const activeOffers = offers.filter(o => o.status === 'active');
    const landing1Count = activeOffers.filter(o => o.landing1).length;
    const landing2Count = activeOffers.filter(o => o.landing2).length;
    
    return `
        <div class="tab-content">
            <div class="card">
                <div class="card-header">
                    <h2><i class="fas fa-eye"></i> Предпросмотр</h2>
                </div>
                
                <div class="preview-info">
                    <div class="stats-row">
                        <div class="stat">
                            <div class="stat-value">${activeOffers.length}</div>
                            <div class="stat-label">Активных офферов</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${landing1Count}</div>
                            <div class="stat-label">Для лендинга 1</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${landing2Count}</div>
                            <div class="stat-label">Для лендинга 2</div>
                        </div>
                    </div>
                </div>
                
                <div class="preview-tabs">
                    <button class="preview-tab active" data-tab="list">
                        <i class="fas fa-list"></i>
                        <span>Список офферов</span>
                    </button>
                    <button class="preview-tab" data-tab="summary">
                        <i class="fas fa-chart-bar"></i>
                        <span>Сводка</span>
                    </button>
                </div>
                
                <div class="preview-content">
                    <div class="preview-tab-content active" data-tab="list">
                        ${renderOffersList(activeOffers)}
                    </div>
                    <div class="preview-tab-content" data-tab="summary">
                        ${renderSummary(activeOffers)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Рендер списка офферов для предпросмотра
 */
function renderOffersList(offersList) {
    if (offersList.length === 0) {
        return `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>Нет активных офферов для отображения</p>
            </div>
        `;
    }
    
    return `
        <div class="preview-list">
            ${offersList.map(offer => `
                <div class="preview-item">
                    <div class="offer-preview">
                        <div class="offer-header">
                            <div class="offer-icon">${getOfferIcon(offer.icon)}</div>
                            <div>
                                <h4>${escapeHtml(offer.name)}</h4>
                                <p class="offer-description">${escapeHtml(offer.description || '')}</p>
                            </div>
                        </div>
                        
                        <div class="offer-details">
                            <span class="detail">
                                <i class="fas fa-wallet"></i>
                                ${formatNumber(offer.amount_min || 0)} - ${formatNumber(offer.amount_max || 0)} ₽
                            </span>
                            <span class="detail">
                                <i class="fas fa-clock"></i>
                                ${offer.term_min || 0} - ${offer.term_max || 0} дней
                            </span>
                            <span class="detail">
                                <i class="fas fa-percentage"></i>
                                ${offer.rate_display || '0%'}
                            </span>
                        </div>
                        
                        <div class="offer-badges">
                            ${offer.landing1 ? '<span class="badge">Лендинг 1</span>' : ''}
                            ${offer.landing2 ? '<span class="badge">Лендинг 2</span>' : ''}
                            ${offer.status === 'active' ? '<span class="badge badge-success">Активен</span>' : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="preview-info">
            Всего офферов: ${offersList.length}
        </div>
    `;
}

/**
 * Рендер сводки
 */
function renderSummary(offersList) {
    if (offersList.length === 0) {
        return '<p>Нет данных для анализа</p>';
    }
    
    // Простая статистика
    const avgAmountMin = offersList.reduce((sum, o) => sum + (o.amount_min || 0), 0) / offersList.length;
    const avgAmountMax = offersList.reduce((sum, o) => sum + (o.amount_max || 0), 0) / offersList.length;
    const landing1Percent = Math.round((offersList.filter(o => o.landing1).length / offersList.length) * 100);
    const landing2Percent = Math.round((offersList.filter(o => o.landing2).length / offersList.length) * 100);
    
    return `
        <div class="summary">
            <h3>Статистика офферов</h3>
            
            <div class="summary-stats">
                <div class="summary-stat">
                    <div class="stat-value">${formatNumber(avgAmountMin, 0)} - ${formatNumber(avgAmountMax, 0)} ₽</div>
                    <div class="stat-label">Средняя сумма</div>
                </div>
                
                <div class="summary-stat">
                    <div class="stat-value">${landing1Percent}%</div>
                    <div class="stat-label">Для лендинга 1</div>
                </div>
                
                <div class="summary-stat">
                    <div class="stat-value">${landing2Percent}%</div>
                    <div class="stat-label">Для лендинга 2</div>
                </div>
            </div>
            
            <div class="summary-list">
                <h4>Распределение по суммам:</h4>
                <ul>
                    ${getAmountDistribution(offersList).map(item => `
                        <li>${item.range}: ${item.count} офферов</li>
                    `).join('')}
                </ul>
            </div>
        </div>
    `;
}

/**
 * Получение распределения по суммам
 */
function getAmountDistribution(offersList) {
    const distribution = [
        { range: 'до 10 000 ₽', min: 0, max: 10000, count: 0 },
        { range: '10 000 - 50 000 ₽', min: 10000, max: 50000, count: 0 },
        { range: '50 000 - 100 000 ₽', min: 50000, max: 100000, count: 0 },
        { range: 'свыше 100 000 ₽', min: 100000, max: Infinity, count: 0 }
    ];
    
    offersList.forEach(offer => {
        const avgAmount = ((offer.amount_min || 0) + (offer.amount_max || 0)) / 2;
        for (const item of distribution) {
            if (avgAmount >= item.min && avgAmount < item.max) {
                item.count++;
                break;
            }
        }
    });
    
    return distribution.filter(item => item.count > 0);
}

/**
 * Инициализация обработчиков вкладки
 */
export function initPreviewHandlers() {
    // Переключение вкладок
    document.addEventListener('click', (e) => {
        const tabBtn = e.target.closest('.preview-tab');
        if (tabBtn) {
            e.preventDefault();
            const tab = tabBtn.dataset.tab;
            
            // Обновление активной вкладки
            document.querySelectorAll('.preview-tab').forEach(t => {
                t.classList.remove('active');
            });
            tabBtn.classList.add('active');
            
            // Показ содержимого вкладки
            document.querySelectorAll('.preview-tab-content').forEach(c => {
                c.classList.remove('active');
            });
            const content = document.querySelector(`.preview-tab-content[data-tab="${tab}"]`);
            if (content) {
                content.classList.add('active');
            }
        }
    });
}

/**
 * Обновление данных предпросмотра
 */
export function updatePreview(newOffers) {
    offers = newOffers || [];
    
    // Обновление UI если он отображен
    const previewContent = document.querySelector('.preview-content');
    if (previewContent) {
        const activeOffers = offers.filter(o => o.status === 'active');
        const listContent = document.querySelector('.preview-tab-content[data-tab="list"]');
        if (listContent) {
            listContent.innerHTML = renderOffersList(activeOffers);
        }
        
        const summaryContent = document.querySelector('.preview-tab-content[data-tab="summary"]');
        if (summaryContent) {
            summaryContent.innerHTML = renderSummary(activeOffers);
        }
    }
}

// ===== УТИЛИТЫ =====

/**
 * Получение иконки оффера
 */
function getOfferIcon(iconName) {
    const icons = {
        'bolt': '⚡',
        'star': '⭐',
        'wallet': '💰',
        'credit-card': '💳',
        'gem': '💎'
    };
    return icons[iconName] || '📋';
}

/**
 * Форматирование числа
 */
function formatNumber(num, decimals = 0) {
    if (typeof num !== 'number') return '0';
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

// ===== ГЛОБАЛЬНЫЙ ДОСТУП =====

// Автоматическая инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPreview);
} else {
    setTimeout(initPreview, 100);
}

// Экспорт
window.Preview = {
    init: initPreview,
    render: renderPreviewTab,
    update: updatePreview,
    initHandlers: initPreviewHandlers
};

console.log('👁️ Модуль предпросмотра загружен');
