// ===== КОНФИГУРАЦИЯ =====
const AUTH_CONFIG = {
    // Демо данные (в продакшене удалить!)
    DEMO_USERNAME: 'admin',
    DEMO_PASSWORD: 'admin123',
    
    // Настройки
    STORAGE_KEY: 'admin_auth',
    SESSION_TIMEOUT: 8 * 60 * 60 * 1000, // 8 часов
    MAX_ATTEMPTS: 5,
    LOCKOUT_TIME: 15 * 60 * 1000 // 15 минут
};

// ===== СОСТОЯНИЕ =====
let authState = {
    isAuthenticated: false,
    user: null,
    loginTime: null
};

let loginAttempts = {
    count: 0,
    lockedUntil: null
};

// ===== ОСНОВНЫЕ ФУНКЦИИ =====

/**
 * Инициализация системы авторизации
 */
export function initAuth() {
    console.log('🔐 Инициализация авторизации');
    
    // Восстановление сессии
    if (restoreSession()) {
        if (isAuthPage()) {
            redirectToMain();
        }
        return true;
    }
    
    // Настройка страницы входа
    if (isAuthPage()) {
        setupLoginPage();
    }
    
    return false;
}

/**
 * Вход в систему
 */
export async function login(username, password) {
    // Проверка блокировки
    if (isAccountLocked()) {
        throw new Error(`Слишком много попыток. Попробуйте через ${getRemainingLockTime()}`);
    }
    
    // Валидация
    validateCredentials(username, password);
    
    // Проверка демо данных
    if (username !== AUTH_CONFIG.DEMO_USERNAME || password !== AUTH_CONFIG.DEMO_PASSWORD) {
        handleFailedLogin();
        throw new Error('Неверный логин или пароль');
    }
    
    // Успешный вход
    return handleSuccessfulLogin(username);
}

/**
 * Выход из системы
 */
export function logout() {
    clearAuthData();
    window.location.href = 'auth.html';
}

/**
 * Проверка авторизации
 */
export function isAuthenticated() {
    return authState.isAuthenticated && !isSessionExpired();
}

/**
 * Получить данные пользователя
 */
export function getUser() {
    return authState.user;
}

// ===== ВНУТРЕННИЕ ФУНКЦИИ =====

/**
 * Восстановление сессии из localStorage
 */
function restoreSession() {
    try {
        const data = localStorage.getItem(AUTH_CONFIG.STORAGE_KEY);
        if (!data) return false;
        
        const session = JSON.parse(data);
        
        // Проверка срока действия
        if (isSessionExpired(session.loginTime)) {
            clearAuthData();
            return false;
        }
        
        authState = session;
        console.log('✅ Сессия восстановлена');
        return true;
    } catch (error) {
        console.error('Ошибка восстановления сессии:', error);
        clearAuthData();
        return false;
    }
}

/**
 * Сохранение сессии
 */
function saveSession(username) {
    authState = {
        isAuthenticated: true,
        user: { username, role: 'admin' },
        loginTime: Date.now()
    };
    
    localStorage.setItem(AUTH_CONFIG.STORAGE_KEY, JSON.stringify(authState));
}

/**
 * Обработка успешного входа
 */
function handleSuccessfulLogin(username) {
    // Сброс счетчика попыток
    loginAttempts = { count: 0, lockedUntil: null };
    saveLoginAttempts();
    
    // Сохранение сессии
    saveSession(username);
    
    return { success: true, user: authState.user };
}

/**
 * Обработка неудачного входа
 */
function handleFailedLogin() {
    loginAttempts.count++;
    
    if (loginAttempts.count >= AUTH_CONFIG.MAX_ATTEMPTS) {
        loginAttempts.lockedUntil = Date.now() + AUTH_CONFIG.LOCKOUT_TIME;
    }
    
    saveLoginAttempts();
    
    // Сообщение об ошибке
    const remaining = AUTH_CONFIG.MAX_ATTEMPTS - loginAttempts.count;
    const message = remaining > 0 
        ? `Неверный логин или пароль. Осталось попыток: ${remaining}`
        : `Слишком много попыток. Попробуйте через ${getRemainingLockTime()}`;
    
    return { success: false, message };
}

/**
 * Проверка блокировки аккаунта
 */
function isAccountLocked() {
    if (!loginAttempts.lockedUntil) return false;
    
    if (Date.now() > loginAttempts.lockedUntil) {
        loginAttempts = { count: 0, lockedUntil: null };
        saveLoginAttempts();
        return false;
    }
    
    return true;
}

/**
 * Проверка истечения сессии
 */
function isSessionExpired(loginTime = authState.loginTime) {
    if (!loginTime) return true;
    return Date.now() - loginTime > AUTH_CONFIG.SESSION_TIMEOUT;
}

/**
 * Валидация учетных данных
 */
function validateCredentials(username, password) {
    const errors = [];
    
    if (!username || username.length < 3) {
        errors.push('Логин должен содержать минимум 3 символа');
    }
    
    if (!password || password.length < 6) {
        errors.push('Пароль должен содержать минимум 6 символов');
    }
    
    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }
}

/**
 * Очистка данных авторизации
 */
function clearAuthData() {
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEY);
    authState = { isAuthenticated: false, user: null, loginTime: null };
}

/**
 * Сохранение попыток входа
 */
function saveLoginAttempts() {
    try {
        localStorage.setItem('login_attempts', JSON.stringify(loginAttempts));
    } catch (error) {
        console.warn('Не удалось сохранить попытки входа:', error);
    }
}

/**
 * Загрузка попыток входа
 */
function loadLoginAttempts() {
    try {
        const data = localStorage.getItem('login_attempts');
        if (data) {
            loginAttempts = JSON.parse(data);
        }
    } catch (error) {
        console.warn('Не удалось загрузить попытки входа:', error);
    }
}

/**
 * Получение оставшегося времени блокировки
 */
function getRemainingLockTime() {
    if (!loginAttempts.lockedUntil) return '0 минут';
    
    const remaining = loginAttempts.lockedUntil - Date.now();
    if (remaining <= 0) return '0 минут';
    
    const minutes = Math.ceil(remaining / (60 * 1000));
    return `${minutes} минут`;
}

/**
 * Проверка текущей страницы
 */
function isAuthPage() {
    return window.location.pathname.includes('auth.html');
}

/**
 * Перенаправление на главную
 */
function redirectToMain() {
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 100);
}

/**
 * Настройка страницы входа
 */
function setupLoginPage() {
    // Восстановление попыток
    loadLoginAttempts();
    
    // Настройка формы
    const form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Настройка показа пароля
    const toggleBtn = document.querySelector('.toggle-password');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', togglePasswordVisibility);
    }
    
    // Автофокус
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
        setTimeout(() => usernameInput.focus(), 50);
    }
    
    // Проверка блокировки
    if (isAccountLocked()) {
        disableLoginForm();
        showMessage(`Система заблокирована. Попробуйте через ${getRemainingLockTime()}`, 'error');
    }
    
    // Восстановление логина
    const savedUsername = localStorage.getItem('saved_username');
    const rememberChecked = localStorage.getItem('remember_login') === 'true';
    
    if (savedUsername && usernameInput) {
        usernameInput.value = savedUsername;
        const rememberCheckbox = document.getElementById('remember');
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }
}

/**
 * Обработчик отправки формы
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember')?.checked || false;
    const loginBtn = document.getElementById('login-btn');
    
    // Показать загрузку
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...';
    }
    
    try {
        // Сохранение логина
        if (remember) {
            localStorage.setItem('saved_username', username);
            localStorage.setItem('remember_login', 'true');
        } else {
            localStorage.removeItem('saved_username');
            localStorage.removeItem('remember_login');
        }
        
        // Выполнить вход
        await login(username, password);
        
        // Успех
        showMessage('Вход выполнен успешно!', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        // Ошибка
        showMessage(error.message, 'error');
        
        // Восстановить кнопку
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>Войти</span>';
        }
    }
}

/**
 * Показать/скрыть пароль
 */
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const icon = this.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
        this.setAttribute('aria-label', 'Скрыть пароль');
    } else {
        passwordInput.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
        this.setAttribute('aria-label', 'Показать пароль');
    }
}

/**
 * Отображение сообщений
 */
function showMessage(message, type = 'error') {
    const container = document.getElementById('auth-notification');
    if (!container) return;
    
    container.textContent = message;
    container.className = `notification ${type}`;
    container.style.display = 'block';
    
    // Скрыть через 5 секунд
    if (type === 'error') {
        setTimeout(() => {
            container.style.display = 'none';
        }, 5000);
    }
}

/**
 * Отключение формы входа
 */
function disableLoginForm() {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-lock"></i> Заблокировано';
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
// Автоматическая инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}

// ===== ГЛОБАЛЬНЫЙ ДОСТУП (для совместимости) =====
window.auth = {
    login,
    logout,
    isAuthenticated,
    getUser,
    initAuth
};
