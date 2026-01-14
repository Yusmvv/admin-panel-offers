// ===== auth-check.js =====
// Проверка и контроль авторизации для админ-панели

// ===== КОНФИГУРАЦИЯ =====
const AUTH_CHECK_CONFIG = {
    // Страница входа
    authPage: 'auth.html',
    
    // Главная страница
    mainPage: 'index.html',
    
    // Ключи хранения
    sessionKey: 'admin_auth_token',
    redirectKey: 'auth_redirect_path',
    
    // Таймауты
    checkInterval: 100, // Проверка загрузки main.js
    maxChecks: 50,      // Максимум попыток проверки
    redirectDelay: 100, // Задержка перед редиректом
    
    // Сообщения
    messages: {
        loading: 'Загрузка системы безопасности...',
        authError: 'Ошибка загрузки модуля авторизации',
        sessionExpired: 'Сессия истекла. Требуется повторный вход.',
        accessDenied: 'Доступ запрещен'
    }
};

// ===== СОСТОЯНИЕ =====
let authCheckState = {
    isChecking: false,
    checkCount: 0,
    lastCheck: null,
    authModuleLoaded: false
};

// ===== УТИЛИТЫ =====

// Безопасная проверка на странице авторизации
function isAuthPage() {
    const path = window.location.pathname;
    const hash = window.location.hash;
    
    // Проверяем по разным признакам
    return (
        path.endsWith(AUTH_CHECK_CONFIG.authPage) ||
        path.includes('/' + AUTH_CHECK_CONFIG.authPage) ||
        document.querySelector('#login-form, .auth-container') !== null ||
        hash.includes('auth') ||
        document.title.toLowerCase().includes('вход')
    );
}

// Безопасный редирект
function safeRedirect(url, delay = AUTH_CHECK_CONFIG.redirectDelay) {
    try {
        // Сохраняем текущий путь для возврата после входа
        if (!isAuthPage() && url.includes(AUTH_CHECK_CONFIG.authPage)) {
            sessionStorage.setItem(
                AUTH_CHECK_CONFIG.redirectKey,
                window.location.pathname + window.location.search
            );
        }
        
        setTimeout(() => {
            window.location.href = url;
        }, delay);
    } catch (error) {
        console.error('Ошибка редиректа:', error);
        window.location.href = url; // Fallback
    }
}

// Показать сообщение о загрузке
function showLoadingMessage(message = AUTH_CHECK_CONFIG.messages.loading) {
    const appContainer = document.getElementById('admin-app');
    if (!appContainer) return;
    
    // Безопасное создание HTML
    appContainer.innerHTML = '';
    
    const loader = document.createElement('div');
    loader.className = 'loading-screen';
    loader.innerHTML = `
        <div class="loader-container">
            <div class="loader"></div>
            <p class="loading-text">${message}</p>
        </div>
    `;
    
    appContainer.appendChild(loader);
}

// Показать сообщение об ошибке
function showErrorMessage(message, showRetry = true) {
    const appContainer = document.getElementById('admin-app');
    if (!appContainer) return;
    
    appContainer.innerHTML = '';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-screen';
    errorDiv.innerHTML = `
        <div class="error-container">
            <div class="error-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h2 class="error-title">Ошибка</h2>
            <p class="error-message">${message}</p>
            ${showRetry ? `
                <div class="error-actions">
                    <button class="btn btn-primary" id="retry-auth-check">
                        <i class="fas fa-redo"></i> Повторить
                    </button>
                    <a href="${AUTH_CHECK_CONFIG.authPage}" class="btn btn-secondary">
                        <i class="fas fa-sign-in-alt"></i> Страница входа
                    </a>
                </div>
            ` : ''}
        </div>
    `;
    
    appContainer.appendChild(errorDiv);
    
    // Обработчик для кнопки повтора
    if (showRetry) {
        setTimeout(() => {
            const retryBtn = document.getElementById('retry-auth-check');
            if (retryBtn) {
                retryBtn.addEventListener('click', initAuthCheck);
            }
        }, 100);
    }
}

// Проверка загрузки auth.js
function isAuthModuleLoaded() {
    return typeof window.auth !== 'undefined' && 
           typeof window.auth.checkAuth === 'function';
}

// Проверка загрузки main.js
function isMainModuleLoaded() {
    return typeof window.initAdminApp === 'function';
}

// ===== ОСНОВНАЯ ЛОГИКА =====

// Инициализация проверки
function initAuthCheck() {
    // Защита от множественных вызовов
    if (authCheckState.isChecking) {
        return;
    }
    
    authCheckState.isChecking = true;
    authCheckState.checkCount++;
    authCheckState.lastCheck = Date.now();
    
    try {
        // Если мы на странице входа - пропускаем проверку
        if (isAuthPage()) {
            console.log('📋 Страница авторизации, проверка пропущена');
            authCheckState.isChecking = false;
            return;
        }
        
        console.log('🔐 Начинаем проверку авторизации...');
        
        // Показываем экран загрузки
        showLoadingMessage();
        
        // Проверяем загрузку модуля auth.js
        if (!isAuthModuleLoaded()) {
            handleAuthModuleNotLoaded();
            return;
        }
        
        // Проверяем авторизацию
        checkAuthorization();
        
    } catch (error) {
        console.error('❌ Ошибка при проверке авторизации:', error);
        handleCheckError(error);
    }
}

// Обработка отсутствия модуля auth.js
function handleAuthModuleNotLoaded() {
    console.warn('⚠️ Модуль авторизации не загружен');
    
    if (authCheckState.checkCount >= 3) {
        // После 3 попыток показываем ошибку
        showErrorMessage(AUTH_CHECK_CONFIG.messages.authError);
        authCheckState.isChecking = false;
        return;
    }
    
    // Ждем и пробуем снова
    setTimeout(() => {
        authCheckState.isChecking = false;
        initAuthCheck();
    }, 500);
}

// Проверка авторизации
function checkAuthorization() {
    try {
        // Проверяем авторизацию через auth.js
        const isAuthenticated = window.auth.checkAuth();
        
        if (!isAuthenticated) {
            console.log('🚫 Пользователь не авторизован');
            handleUnauthorized();
            return;
        }
        
        console.log('✅ Пользователь авторизован');
        handleAuthorized();
        
    } catch (error) {
        console.error('❌ Ошибка при проверке авторизации:', error);
        handleAuthError(error);
    }
}

// Обработка неавторизованного пользователя
function handleUnauthorized() {
    // Показываем сообщение
    showErrorMessage(AUTH_CHECK_CONFIG.messages.sessionExpired, false);
    
    // Чистим данные
    if (window.auth && typeof window.auth.clearAuthData === 'function') {
        window.auth.clearAuthData();
    }
    
    // Редирект на страницу входа с задержкой
    setTimeout(() => {
        safeRedirect(AUTH_CHECK_CONFIG.authPage, 1500);
    }, 2000);
}

// Обработка авторизованного пользователя
function handleAuthorized() {
    // Загружаем основное приложение
    loadAdminApp();
}

// Загрузка основного приложения
function loadAdminApp() {
    console.log('🚀 Загрузка основного приложения...');
    
    // Проверяем загрузку main.js
    checkMainModule();
}

// Проверка загрузки main.js
function checkMainModule() {
    if (isMainModuleLoaded()) {
        // Модуль загружен, запускаем приложение
        launchAdminApp();
    } else {
        // Модуль не загружен, ждем и проверяем снова
        waitForMainModule();
    }
}

// Ожидание загрузки main.js
function waitForMainModule() {
    authCheckState.checkCount++;
    
    // Проверяем лимит попыток
    if (authCheckState.checkCount > AUTH_CHECK_CONFIG.maxChecks) {
        showErrorMessage('Не удалось загрузить основное приложение');
        authCheckState.isChecking = false;
        return;
    }
    
    // Обновляем сообщение загрузки
    const message = `Загрузка приложения... (${authCheckState.checkCount}/${AUTH_CHECK_CONFIG.maxChecks})`;
    showLoadingMessage(message);
    
    // Проверяем снова через интервал
    setTimeout(() => {
        if (isMainModuleLoaded()) {
            launchAdminApp();
        } else {
            waitForMainModule();
        }
    }, AUTH_CHECK_CONFIG.checkInterval);
}

// Запуск основного приложения
function launchAdminApp() {
    console.log('🎯 Запуск основного приложения');
    
    try {
        // Запускаем инициализацию приложения
        window.initAdminApp();
        authCheckState.isChecking = false;
        
    } catch (error) {
        console.error('❌ Ошибка при запуске приложения:', error);
        handleAppError(error);
    }
}

// ===== ОБРАБОТКА ОШИБОК =====

function handleCheckError(error) {
    console.error('Ошибка проверки:', error);
    
    // Показываем понятное сообщение
    let errorMessage = AUTH_CHECK_CONFIG.messages.accessDenied;
    
    if (error.message.includes('auth')) {
        errorMessage = 'Ошибка модуля авторизации';
    } else if (error.message.includes('load')) {
        errorMessage = 'Ошибка загрузки ресурсов';
    }
    
    showErrorMessage(`${errorMessage}: ${error.message}`);
    authCheckState.isChecking = false;
}

function handleAuthError(error) {
    console.error('Ошибка авторизации:', error);
    
    // Пробуем редирект на страницу входа
    safeRedirect(AUTH_CHECK_CONFIG.authPage);
}

function handleAppError(error) {
    console.error('Ошибка приложения:', error);
    
    showErrorMessage(`Ошибка приложения: ${error.message}`, true);
    authCheckState.isChecking = false;
}

// ===== CSS ДЛЯ СООБЩЕНИЙ =====
function injectAuthCheckStyles() {
    if (document.getElementById('auth-check-styles')) {
        return;
    }
    
    const style = document.createElement('style');
    style.id = 'auth-check-styles';
    style.textContent = `
        .loading-screen {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .loader-container {
            text-align: center;
            color: white;
            max-width: 400px;
            padding: 40px;
        }
        
        .loader {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
            margin: 0 auto 20px;
        }
        
        .loading-text {
            font-size: 18px;
            font-weight: 500;
            margin: 0;
            opacity: 0.9;
        }
        
        .error-screen {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
        }
        
        .error-container {
            background: white;
            border-radius: 16px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            width: 100%;
        }
        
        .error-icon {
            font-size: 48px;
            color: #ef4444;
            margin-bottom: 20px;
        }
        
        .error-title {
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 16px;
        }
        
        .error-message {
            font-size: 16px;
            color: #64748b;
            margin-bottom: 24px;
            line-height: 1.5;
        }
        
        .error-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .btn {
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            font-size: 15px;
            text-decoration: none;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
        }
        
        .btn-secondary {
            background: #64748b;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #475569;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @media (max-width: 600px) {
            .error-container {
                padding: 30px 20px;
            }
            
            .error-actions {
                flex-direction: column;
            }
            
            .btn {
                width: 100%;
                justify-content: center;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

// Основная точка входа
function initAuthCheckSystem() {
    // Внедряем стили
    injectAuthCheckStyles();
    
    // Запускаем проверку когда DOM готов
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initAuthCheck, 10);
        });
    } else {
        setTimeout(initAuthCheck, 10);
    }
}

// Защита от повторной инициализации
if (!window.authCheckInitialized) {
    window.authCheckInitialized = true;
    
    // Делаем функции доступными глобально
    window.authCheck = {
        init: initAuthCheck,
        reload: () => {
            authCheckState.isChecking = false;
            initAuthCheck();
        },
        getState: () => ({ ...authCheckState }),
        forceLogout: () => {
            if (window.auth && window.auth.logout) {
                window.auth.logout();
            } else {
                safeRedirect(AUTH_CHECK_CONFIG.authPage);
            }
        }
    };
    
    // Автоматическая инициализация
    initAuthCheckSystem();
}

console.log('🔒 Система проверки авторизации загружена');
