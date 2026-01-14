// ===== КОНФИГУРАЦИЯ =====
const CONFIG = {
    AUTH_PAGE: 'auth.html',
    MAIN_PAGE: 'index.html',
    STORAGE_KEY: 'admin_auth'
};

// ===== УТИЛИТЫ =====

/**
 * Проверка текущей страницы
 */
function isAuthPage() {
    return window.location.pathname.includes(CONFIG.AUTH_PAGE);
}

/**
 * Проверка авторизации
 */
function checkAuth() {
    try {
        const data = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (!data) return false;
        
        const session = JSON.parse(data);
        const now = Date.now();
        const eightHours = 8 * 60 * 60 * 1000;
        
        // Проверка срока действия (8 часов)
        if (now - session.loginTime > eightHours) {
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        return false;
    }
}

/**
 * Перенаправление
 */
function redirect(page, delay = 100) {
    setTimeout(() => {
        window.location.href = page;
    }, delay);
}

/**
 * Показать экран загрузки
 */
function showLoading() {
    const app = document.getElementById('admin-app');
    if (!app) return;
    
    app.innerHTML = `
        <div class="loading-screen">
            <div class="loader"></div>
            <p>Проверка авторизации...</p>
        </div>
    `;
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
            <div class="error-actions">
                <button onclick="window.location.href='${CONFIG.AUTH_PAGE}'" class="btn">
                    Перейти к входу
                </button>
            </div>
        </div>
    `;
}

// ===== ОСНОВНАЯ ЛОГИКА =====

/**
 * Инициализация проверки авторизации
 */
function initAuthCheck() {
    console.log('🔐 Проверка авторизации...');
    
    // Если на странице входа - ничего не делаем
    if (isAuthPage()) {
        console.log('На странице входа, проверка не требуется');
        return;
    }
    
    // Показываем загрузку
    showLoading();
    
    // Проверяем авторизацию
    setTimeout(() => {
        if (checkAuth()) {
            console.log('✅ Авторизован');
            // Главный скрипт сам покажет контент
            // или скроет loading-screen
        } else {
            console.log('🚫 Не авторизован');
            showError('Требуется авторизация');
            
            setTimeout(() => {
                redirect(CONFIG.AUTH_PAGE, 2000);
            }, 1500);
        }
    }, 500);
}

/**
 * Выход из системы
 */
function logout() {
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    redirect(CONFIG.AUTH_PAGE);
}

// ===== CSS СТИЛИ =====
function injectStyles() {
    if (document.getElementById('auth-check-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'auth-check-styles';
    style.textContent = `
        .loading-screen {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            color: #334155;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .loader {
            width: 50px;
            height: 50px;
            border: 4px solid #e2e8f0;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }
        
        .error-screen {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            color: #334155;
            text-align: center;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .error-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        
        .error-screen h3 {
            font-size: 24px;
            margin-bottom: 10px;
            color: #0f172a;
        }
        
        .error-screen p {
            font-size: 16px;
            color: #64748b;
            margin-bottom: 30px;
            max-width: 400px;
        }
        
        .btn {
            padding: 12px 24px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .btn:hover {
            background: #1d4ed8;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

// Автоматический запуск
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        injectStyles();
        initAuthCheck();
    });
} else {
    injectStyles();
    initAuthCheck();
}

// ===== ГЛОБАЛЬНЫЙ ДОСТУП =====
window.authCheck = {
    check: checkAuth,
    logout,
    init: initAuthCheck
};

console.log('🔒 Проверка авторизации загружена');
