// Логика предпросмотра

function renderPreviewTab() {
    return `
        <div id="preview-content" class="tab-content">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="fas fa-eye"></i>
                        <span>Предпросмотр офферов</span>
                    </h2>
                </div>
                
                <div class="preview-tabs">
                    <div class="preview-tab active" data-preview="landing1">
                        Лендинг 1: ДеньгиСразу
                    </div>
                    <div class="preview-tab" data-preview="landing2">
                        Лендинг 2: FinAI
                    </div>
                    <div class="preview-tab" data-preview="mobile">
                        <i class="fas fa-mobile-alt"></i> Мобильная версия
                    </div>
                    <div class="preview-tab" data-preview="filters">
                        <i class="fas fa-filter"></i> Фильтрация
                    </div>
                </div>
                
                <div class="preview-container">
                    <div class="preview-header">
                        <div style="font-weight: 600; color: #475569;">
                            <span id="preview-offers-count">${window.offers ? window.offers.length : 0}</span> офферов
                            <span style="color: #94a3b8;"> • </span>
                            <span id="preview-update-time">Только что обновлено</span>
                        </div>
                        <button class="btn btn-sm btn-secondary" id="refresh-preview">
                            <i class="fas fa-redo"></i> Обновить
                        </button>
                    </div>
                    
                    <div class="preview-content">
                        <div id="preview-landing1" class="preview-tab-content active">
                            <iframe class="preview-frame" id="preview-frame-1"></iframe>
                        </div>
                        <div id="preview-landing2" class="preview-tab-content" style="display: none;">
                            <iframe class="preview-frame" id="preview-frame-2"></iframe>
                        </div>
                        <div id="preview-mobile" class="preview-tab-content" style="display: none;">
                            <div style="max-width: 375px; margin: 0 auto; padding: 20px; background: white;">
                                <div id="mobile-preview-content"></div>
                            </div>
                        </div>
                        <div id="preview-filters" class="preview-tab-content" style="display: none; padding: 20px;">
                            <div id="filter-preview-content"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
// 🔧 Делаем функцию глобально доступной
window.renderPreviewTab = renderPreviewTab;

// 🔧 Функция переключения вкладок предпросмотра
function switchPreviewTab(tabName) {
    // Скрываем все вкладки
    document.querySelectorAll('.preview-tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Убираем активный класс у всех кнопок
    document.querySelectorAll('.preview-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показываем выбранную вкладку
    const activeTab = document.getElementById(`preview-${tabName}`);
    if (activeTab) {
        activeTab.style.display = 'block';
    }
    
    // Добавляем активный класс кнопке
    const activeBtn = document.querySelector(`.preview-tab[data-preview="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Обновляем содержимое вкладки
    updatePreviewContent(tabName);
}

// 🔧 Функция обновления содержимого вкладки
function updatePreviewContent(tabName) {
    if (!window.offers) return;
    
    const activeOffers = window.offers.filter(o => o.status === 'active');
    
    switch(tabName) {
        case 'landing1':
            updateLanding1Preview(activeOffers.filter(o => o.landing1));
            break;
        case 'landing2':
            updateLanding2Preview(activeOffers.filter(o => o.landing2));
            break;
        case 'mobile':
            updateMobilePreview(activeOffers);
            break;
        case 'filters':
            updateFilterPreview(activeOffers);
            break;
    }
}

// 🔧 Базовая предпросмотр для лендинга 1
function updateLanding1Preview(offers) {
    const frame = document.getElementById('preview-frame-1');
    if (!frame) return;
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head><style>body{font-family:sans-serif;padding:20px;}</style></head>
        <body>
            <h2>Предпросмотр лендинга 1 (${offers.length} офферов)</h2>
            ${offers.length === 0 ? '<p>Нет активных офферов</p>' : 
            offers.map(o => `
                <div style="border:1px solid #ccc;padding:15px;margin:10px 0;border-radius:5px;">
                    <h3>${o.name}</h3>
                    <p>${o.description || 'Нет описания'}</p>
                    <p><strong>Сумма:</strong> ${o.amount_min} - ${o.amount_max} ₽</p>
                </div>
            `).join('')}
        </body>
        </html>
    `;
    
    frame.srcdoc = html;
}

// 🔧 Базовая предпросмотр для лендинга 2
function updateLanding2Preview(offers) {
    const frame = document.getElementById('preview-frame-2');
    if (!frame) return;
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head><style>body{font-family:sans-serif;padding:20px;background:#f5f5f5;}</style></head>
        <body>
            <h2 style="color:#3b82f6;">Предпросмотр лендинга 2 (${offers.length} офферов)</h2>
            ${offers.length === 0 ? '<p>Нет активных офферов для этого лендинга</p>' : 
            offers.map(o => `
                <div style="background:white;border-radius:10px;padding:20px;margin:15px 0;box-shadow:0 2px 5px rgba(0,0,0,0.1);">
                    <h3 style="color:#1e40af;">${o.name}</h3>
                    <p><strong>Рейтинг:</strong> ${o.rating}/5</p>
                    <p><strong>Шанс одобрения:</strong> ${o.approval}%</p>
                </div>
            `).join('')}
        </body>
        </html>
    `;
    
    frame.srcdoc = html;
}

// 🔧 Мобильный предпросмотр
function updateMobilePreview(offers) {
    const container = document.getElementById('mobile-preview-content');
    if (!container) return;
    
    container.innerHTML = `
        <h3 style="text-align:center;">Мобильный вид (${offers.length} офферов)</h3>
        ${offers.slice(0, 3).map(o => `
            <div style="border:1px solid #e5e7eb;border-radius:12px;padding:15px;margin-bottom:10px;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:40px;height:40px;background:#3b82f6;color:white;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                        ${window.icons[o.icon] || '⚡'}
                    </div>
                    <div>
                        <strong>${o.name}</strong><br>
                        <small style="color:#6b7280;">${o.amount_min} - ${o.amount_max} ₽</small>
                    </div>
                </div>
            </div>
        `).join('')}
        ${offers.length === 0 ? '<p style="text-align:center;color:#6b7280;">Нет офферов</p>' : ''}
    `;
}

// 🔧 Предпросмотр фильтров
function updateFilterPreview(offers) {
    const container = document.getElementById('filter-preview-content');
    if (!container) return;
    
    // Простая статистика
    const withOverdue = offers.filter(o => o.overdue_types?.includes('has_overdue')).length;
    const withIncome = offers.filter(o => o.income_types?.includes('has_income')).length;
    
    container.innerHTML = `
        <h3>Фильтрация офферов</h3>
        <p>Всего активных офферов: <strong>${offers.length}</strong></p>
        
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:15px;margin-top:20px;">
            <div style="background:#f0f9ff;padding:15px;border-radius:8px;">
                <h4 style="margin-top:0;">Просрочки</h4>
                <p>С просрочками: <strong>${withOverdue}</strong></p>
                <p>Без просрочек: <strong>${offers.length - withOverdue}</strong></p>
            </div>
            
            <div style="background:#f0fdf4;padding:15px;border-radius:8px;">
                <h4 style="margin-top:0;">Доход</h4>
                <p>С подтверждённым доходом: <strong>${withIncome}</strong></p>
                <p>Без дохода: <strong>${offers.length - withIncome}</strong></p>
            </div>
        </div>
        
        <div style="margin-top:20px;">
            <h4>Пример фильтрации:</h4>
            <p>Офферы для клиентов <em>с просрочками и подтверждённым доходом</em>:</p>
            <ul>
                ${offers
                    .filter(o => o.overdue_types?.includes('has_overdue') && o.income_types?.includes('has_income'))
                    .map(o => `<li>${o.name} (ID: ${o.id})</li>`)
                    .join('') || '<li>Нет подходящих офферов</li>'}
            </ul>
        </div>
    `;
}

// 🔧 Обновление всей статистики предпросмотра
function updatePreview() {
    if (!window.offers) return;
    
    const activeOffers = window.offers.filter(o => o.status === 'active');
    const countElement = document.getElementById('preview-offers-count');
    const timeElement = document.getElementById('preview-update-time');
    
    if (countElement) countElement.textContent = activeOffers.length;
    if (timeElement) {
        const now = new Date();
        timeElement.textContent = `Обновлено: ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Обновляем активную вкладку
    const activeTab = document.querySelector('.preview-tab.active');
    if (activeTab) {
        const tabName = activeTab.getAttribute('data-preview');
        updatePreviewContent(tabName);
    }
}
window.updatePreview = updatePreview;

// 🔧 Инициализация обработчиков предпросмотра
function initPreviewHandlers() {
    // Обработчики для переключения вкладок предпросмотра
    document.addEventListener('click', function(e) {
        if (e.target.closest('.preview-tab')) {
            e.preventDefault();
            const tab = e.target.closest('.preview-tab');
            const tabName = tab.getAttribute('data-preview');
            switchPreviewTab(tabName);
        }
    });
    
    // Кнопка обновления предпросмотра
    const refreshBtn = document.getElementById('refresh-preview');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            updatePreview();
            if (window.showNotification) {
                window.showNotification('Предпросмотр обновлен', 'success');
            }
        });
    }
    
    // Инициализируем первую вкладку
    updatePreview();
}
// 🔧 Делаем функцию глобально доступной
window.initPreviewHandlers = initPreviewHandlers;
