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

// Другие функции из оригинального кода остаются здесь...
// (loadData, saveData, initExampleData, updateUI, formatNumber и т.д.)
