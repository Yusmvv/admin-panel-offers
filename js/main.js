// Основная логика приложения
let offers = [];
let currentEditOffer = null;
let features = [];

// Иконки
const icons = {
    'bolt': '⚡',
    'shield-alt': '🛡️',
    'star': '⭐',
    'rocket': '🚀',
    'wallet': '💰',
    'clock': '⏱️',
    'gem': '💎',
    'trophy': '🏆'
};

const reviewIcons = {
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
            offers = JSON.parse(savedOffers);
        }
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        offers = [];
    }
}

// Сохранение данных
function saveData() {
    try {
        localStorage.setItem('admin_offers_v2_1', JSON.stringify(offers));
        updateUI();
        updatePreview();
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        showNotification('Ошибка сохранения данных', 'error');
    }
}

// Инициализация примеров данных
function initExampleData() {
    offers = [
        {
            id: 1,
            name: "МоментальныеДеньги",
            description: "Лидер по скорости выдачи. Деньги приходят на карту за 3 минуты",
            amount_min: 1000,
            amount_max: 50000,
            term_min: 7,
            term_max: 30,
            rate_min: 0,
            rate_max: 0.8,
            rate_display: "0 - 0.8% в день",
            speed: 3,
            approval: 96,
            rating: 4.8,
            reviews_count: 12847,
            reviews_icon: "star",
            icon: "bolt",
            features: ["Первый займ 0%", "Круглосуточно", "Без справок"],
            link_landing1: "https://tracking.com/offer1?source=landing1&utm_source=money_now",
            link_landing2: "https://tracking.com/offer1?source=landing2&utm_source=fin_ai",
            overdue_types: ["no_overdue", "has_overdue"],
            income_types: ["has_income", "income_unconfirmed"],
            status: "active",
            landing1: true,
            landing2: true
        },
        {
            id: 2,
            name: "ДеньгиОнлайн",
            description: "Самый высокий шанс одобрения при плохой кредитной истории",
            amount_min: 2000,
            amount_max: 30000,
            term_min: 1,
            term_max: 60,
            rate_min: 0.5,
            rate_max: 1,
            rate_display: "0.5 - 1% в день",
            speed: 5,
            approval: 94,
            rating: 4.6,
            reviews_count: 8924,
            reviews_icon: "thumbs-up",
            icon: "shield-alt",
            features: ["Без отказа", "Для плохой КИ", "На карту МИР"],
            link_landing1: "https://tracking.com/offer2?source=landing1&utm_source=money_now",
            link_landing2: "https://tracking.com/offer2?source=landing2&utm_source=fin_ai",
            overdue_types: ["no_overdue", "has_overdue", "overdue_30plus", "court_cases"],
            income_types: ["has_income", "no_income", "income_unconfirmed"],
            status: "active",
            landing1: true,
            landing2: true
        },
        {
            id: 3,
            name: "ЗаймЭкспресс",
            description: "Только для клиентов с чистой кредитной историей",
            amount_min: 5000,
            amount_max: 100000,
            term_min: 30,
            term_max: 365,
            rate_min: 0.1,
            rate_max: 0.5,
            rate_display: "0.1 - 0.5% в день",
            speed: 15,
            approval: 99,
            rating: 4.9,
            reviews_count: 21450,
            reviews_icon: "award",
            icon: "gem",
            features: ["Низкая ставка", "Долгий срок", "Крупная сумма"],
            link_landing1: "https://tracking.com/offer3?source=landing1&utm_source=money_now",
            link_landing2: "https://tracking.com/offer3?source=landing2&utm_source=fin_ai",
            overdue_types: ["no_overdue"],
            income_types: ["has_income"],
            status: "active",
            landing1: false,
            landing2: true
        }
    ];
    saveData();
}

// Форматирование числа
function formatNumber(num) {
    const number = parseFloat(num);
    if (isNaN(number)) return '0';
    
    // Для больших чисел используем разделители
    if (number >= 1000) {
        return number.toLocaleString('ru-RU');
    }
    
    // Для десятичных чисел
    if (number % 1 !== 0) {
        return number.toFixed(1).replace('.', ',');
    }
    
    return number.toString();
}

// Показать уведомление
function showNotification(message, type = 'info') {
    // Создание уведомления
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        padding: 16px 24px;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Удаление через 3 секунды
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
    
    // Добавление стилей анимации
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// ===== ОСНОВНЫЕ ФУНКЦИИ ПРИЛОЖЕНИЯ =====

// Инициализация приложения
function initAdminApp() {
    // Загрузка данных
    loadData();
    
    // Инициализация примера данных если нет сохраненных
    if (offers.length === 0) {
        initExampleData();
    }
    
    // Рендер интерфейса
    renderAdminInterface();
    
    // Обновление UI
    updateUI();
    
    // Инициализация обработчиков
    initEventHandlers();
}

// Рендер интерфейса админ-панели
function renderAdminInterface() {
    const appContainer = document.getElementById('admin-app');
    
    // Получение информации о пользователе
    const authData = JSON.parse(localStorage.getItem('admin_auth_data') || 
                               sessionStorage.getItem('admin_auth_data') || '{}');
    const username = authData.user?.username || 'Администратор';
    
    appContainer.innerHTML = `
        <div class="admin-container">
            <!-- Боковая панель -->
            <div class="sidebar">
                <div class="logo">
                    <h1>
                        <i class="fas fa-cogs"></i>
                        <span>Админ-панель</span>
                        <span class="logo-badge">2.1</span>
                    </h1>
                </div>
                
                <div class="nav-menu">
                    <a href="#" class="nav-item active" data-tab="offers">
                        <i class="fas fa-gem"></i>
                        <span>Управление офферами</span>
                    </a>
                    <a href="#" class="nav-item" data-tab="preview">
                        <i class="fas fa-eye"></i>
                        <span>Предпросмотр</span>
                    </a>
                    <a href="#" class="nav-item" data-tab="settings">
                        <i class="fas fa-sliders-h"></i>
                        <span>Настройки</span>
                    </a>
                    
                    <div class="user-panel">
                        <div class="user-info">
                            <div class="user-avatar">${username.charAt(0).toUpperCase()}</div>
                            <div>
                                <div style="font-weight: 600;">${username}</div>
                                <div style="font-size: 12px; color: rgba(255, 255, 255, 0.7);">Администратор</div>
                            </div>
                        </div>
                        <button class="logout-btn" id="logout-btn">
                            <i class="fas fa-sign-out-alt"></i>
                            Выйти
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Основной контент -->
            <div class="main-content">
                <!-- Статистика -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon stat-icon-1">
                            <i class="fas fa-gem"></i>
                        </div>
                        <div class="stat-value" id="total-offers">0</div>
                        <div class="stat-label">Всего офферов</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon stat-icon-2">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-value" id="active-offers">0</div>
                        <div class="stat-label">Активных офферов</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon stat-icon-3">
                            <i class="fas fa-desktop"></i>
                        </div>
                        <div class="stat-value" id="landing1-count">0</div>
                        <div class="stat-label">На лендинге 1</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon stat-icon-4">
                            <i class="fas fa-laptop-code"></i>
                        </div>
                        <div class="stat-value" id="landing2-count">0</div>
                        <div class="stat-label">На лендинге 2</div>
                    </div>
                </div>
                
                <!-- Контентные области будут загружены динамически -->
                <div id="content-area"></div>
            </div>
        </div>
    `;
    
    // Показываем начальную вкладку
    switchTab('offers');
}

// Инициализация обработчиков событий
function initEventHandlers() {
    // Навигация
    document.addEventListener('click', function(e) {
        // Навигация по вкладкам
        if (e.target.closest('.nav-item')) {
            e.preventDefault();
            const navItem = e.target.closest('.nav-item');
            const tab = navItem.getAttribute('data-tab');
            
            // Убираем активный класс
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            navItem.classList.add('active');
            
            // Переключаем вкладки
            switchTab(tab);
        }
        
        // Кнопка выхода
        if (e.target.closest('#logout-btn')) {
            e.preventDefault();
            if (confirm('Вы уверены, что хотите выйти?')) {
                logout();
            }
        }
    });
}

// Переключение вкладок
function switchTab(tab) {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;
    
    // Скрываем все контенты
    contentArea.innerHTML = '';
    
    // Показываем выбранный контент
    if (tab === 'offers') {
        contentArea.innerHTML = renderOffersTab();
        initOffersHandlers();
    } else if (tab === 'preview') {
        contentArea.innerHTML = renderPreviewTab();
        initPreviewHandlers();
    } else if (tab === 'settings') {
        contentArea.innerHTML = renderSettingsTab();
        initSettingsHandlers();
    }
}

// Обновить UI
function updateUI() {
    renderOffersList();
    updateStats();
}

// Обновить статистику
function updateStats() {
    const totalOffers = offers.length;
    const activeOffers = offers.filter(o => o.status === 'active').length;
    const landing1Offers = offers.filter(o => o.landing1 && o.status === 'active').length;
    const landing2Offers = offers.filter(o => o.landing2 && o.status === 'active').length;
    
    const totalElement = document.getElementById('total-offers');
    const activeElement = document.getElementById('active-offers');
    const landing1Element = document.getElementById('landing1-count');
    const landing2Element = document.getElementById('landing2-count');
    
    if (totalElement) totalElement.textContent = totalOffers;
    if (activeElement) activeElement.textContent = activeOffers;
    if (landing1Element) landing1Element.textContent = landing1Offers;
    if (landing2Element) landing2Element.textContent = landing2Offers;
}

// Выход из системы (должна быть доступна глобально)
function logout() {
    localStorage.removeItem('admin_auth_data');
    sessionStorage.removeItem('admin_auth_data');
    window.location.href = 'auth.html';
}
