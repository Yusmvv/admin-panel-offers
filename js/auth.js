// ===== КОНФИГУРАЦИЯ БЕЗОПАСНОСТИ =====
const AUTH_CONFIG = {
    
    // Настройки безопасности
    sessionTimeout: 8 * 60 * 60 * 1000, // 8 часов (вместо 24)
    storageKey: 'admin_auth_token',
    maxAttempts: 5, // Максимум попыток входа
    lockoutTime: 15 * 60 * 1000, // 15 минут блокировки
    tokenSecret: 'secure_admin_token_key_' + location.hostname,
    
    // Настройки хранения
    useLocalStorage: true, // true для localStorage, false для sessionStorage
    encryptStorage: true // Шифрование данных в storage
};

// ===== СОСТОЯНИЕ АВТОРИЗАЦИИ =====
let authState = {
    isAuthenticated: false,
    user: null,
    loginTime: null,
    attempts: 0,
    lockedUntil: null
};

// ===== КЕШ БЛОКИРОВОК =====
const loginAttempts = {
    attempts: 0,
    lastAttempt: null,
    locked: false,
    lockTime: null
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Система авторизации инициализирована');
    
    try {
        // Проверка браузера
        checkBrowserSupport();
        
        // Инициализация состояния
        initAuthState();
        
        // Проверка сохраненной сессии
        const hasValidSession = checkSavedSession();
        
        // Если на странице авторизации и есть валидная сессия - редирект
        if (hasValidSession && isAuthPage()) {
            console.log('📋 Перенаправление на главную страницу...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
        
        // Инициализация обработчиков
        initAuthHandlers();
        
        // Обновление UI
        updateAuthUI();
        
    } catch (error) {
        console.error('❌ Ошибка инициализации авторизации:', error);
        showError('Ошибка инициализации системы. Перезагрузите страницу.');
    }
});

// ===== ПРОВЕРКА ПОДДЕРЖКИ БРАУЗЕРА =====
function checkBrowserSupport() {
    const requiredFeatures = [
        'localStorage',
        'sessionStorage',
        'JSON',
        'Promise'
    ];
    
    const unsupported = requiredFeatures.filter(feature => !window[feature]);
    
    if (unsupported.length > 0) {
        throw new Error(`Браузер не поддерживает: ${unsupported.join(', ')}`);
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ СОСТОЯНИЯ =====
function initAuthState() {
    try {
        // Загрузка попыток входа
        const attemptsData = localStorage.getItem('login_attempts');
        if (attemptsData) {
            Object.assign(loginAttempts, JSON.parse(attemptsData));
            
            // Проверка блокировки
            if (loginAttempts.locked && loginAttempts.lockTime) {
                const lockTime = new Date(loginAttempts.lockTime).getTime();
                const now = Date.now();
                
                if (now < lockTime + AUTH_CONFIG.lockoutTime) {
                    loginAttempts.locked = true;
                } else {
                    // Разблокировка по истечении времени
                    loginAttempts.locked = false;
                    loginAttempts.attempts = 0;
                    saveLoginAttempts();
                }
            }
        }
    } catch (error) {
        console.warn('Не удалось загрузить состояние попыток входа:', error);
        resetLoginAttempts();
    }
}

// ===== ПРОВЕРКА СОХРАНЕННОЙ СЕССИИ =====
function checkSavedSession() {
    try {
        const token = getStorageItem(AUTH_CONFIG.storageKey);
        
        if (!token) {
            return false;
        }
        
        // Декодирование токена
        const authData = decodeToken(token);
        
        if (!authData || !authData.isAuthenticated) {
            return false;
        }
        
        // Проверка времени сессии
        const now = Date.now();
        const sessionAge = now - authData.loginTime;
        
        if (sessionAge >= AUTH_CONFIG.sessionTimeout) {
            console.log('Сессия истекла');
            clearAuthData();
            return false;
        }
        
        // Проверка IP (базовая)
        if (authData.ip !== getClientIP()) {
            console.warn('IP адрес изменился, требуется повторный вход');
            clearAuthData();
            return false;
        }
        
        // Обновление состояния
        authState = {
            ...authData,
            loginTime: now // Обновляем время входа
        };
        
        // Обновление токена
        saveAuthToken();
        
        console.log('✅ Сессия восстановлена');
        return true;
        
    } catch (error) {
        console.error('Ошибка при проверке сессии:', error);
        clearAuthData();
        return false;
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ ОБРАБОТЧИКОВ =====
function initAuthHandlers() {
    // Форма входа
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        
        // Автофокус на логине
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            setTimeout(() => usernameInput.focus(), 100);
        }
    }
    
    // Кнопка показа пароля
    const showPasswordBtn = document.getElementById('show-password');
    if (showPasswordBtn) {
        showPasswordBtn.addEventListener('click', togglePasswordVisibility);
        showPasswordBtn.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                togglePasswordVisibility.call(showPasswordBtn);
            }
        });
    }
    
    // Забыли пароль
    const forgotPasswordLink = document.getElementById('forgot-password-link') || 
                              document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', handleForgotPassword);
    }
    
    // Восстановление сохраненного логина
    const savedUsername = localStorage.getItem('saved_username');
    const rememberChecked = localStorage.getItem('remember_login') === 'true';
    
    if (savedUsername && rememberChecked) {
        const usernameInput = document.getElementById('username');
        const rememberCheckbox = document.getElementById('remember');
        
        if (usernameInput) usernameInput.value = savedUsername;
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }
}

// ===== ОБРАБОТКА ВХОДА =====
async function handleLogin(event) {
    event.preventDefault();
    
    // Проверка блокировки
    if (loginAttempts.locked) {
        const remainingTime = calculateRemainingLockTime();
        showError(`Слишком много попыток. Попробуйте через ${remainingTime}`);
        return;
    }
    
    // Получение данных формы
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember') ? 
                     document.getElementById('remember').checked : false;
    
    // Валидация
    if (!validateLoginForm(username, password)) {
        return;
    }
    
    // Показать индикатор загрузки
    const loginBtn = document.getElementById('login-btn');
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Проверка...';
    loginBtn.disabled = true;
    
    try {
        // Имитация задержки сети
        await sleep(800);
        
        // Проверка учетных данных
        const isValid = await validateCredentials(username, password);
        
        if (isValid) {
            // Успешный вход
            await handleSuccessfulLogin(username, remember);
        } else {
            // Неудачная попытка
            handleFailedLogin();
        }
    } catch (error) {
        console.error('Ошибка при входе:', error);
        showError('Ошибка сервера. Попробуйте позже.');
    } finally {
        // Восстановление кнопки
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
    }
}

// ===== ВАЛИДАЦИЯ ФОРМЫ =====
function validateLoginForm(username, password) {
    const errorElement = document.getElementById('error-message');
    
    // Очистка предыдущих ошибок
    if (errorElement) {
        errorElement.textContent = '';
    }
    
    // Проверка логина
    if (!username) {
        showError('Введите логин');
        return false;
    }
    
    if (username.length < 3 || username.length > 50) {
        showError('Логин должен быть от 3 до 50 символов');
        return false;
    }
    
    if (!/^[A-Za-z0-9_.-]+$/.test(username)) {
        showError('Логин содержит недопустимые символы');
        return false;
    }
    
    // Проверка пароля
    if (!password) {
        showError('Введите пароль');
        return false;
    }
    
    if (password.length < 6) {
        showError('Пароль должен содержать минимум 6 символов');
        return false;
    }
    
    return true;
}

// ===== ПРОВЕРКА УЧЕТНЫХ ДАННЫХ =====
async function validateCredentials(username, password) {
    // ⚠️ ВНИМАНИЕ: Это НЕбезопасно для продакшена!
    // В реальном приложении используйте:
    // 1. HTTPS
    // 2. Запрос к бэкенду
    // 3. Хэширование паролей
    // 4. Защиту от брутфорса
    
    // Для демонстрации используем простую проверку
    return username === AUTH_CONFIG.defaultUsername && 
           password === AUTH_CONFIG.defaultPassword;
}

// ===== УСПЕШНЫЙ ВХОД =====
async function handleSuccessfulLogin(username, remember) {
    // Сброс счетчика попыток
    resetLoginAttempts();
    
    // Сохранение логина если нужно
    if (remember) {
        localStorage.setItem('saved_username', username);
        localStorage.setItem('remember_login', 'true');
    } else {
        localStorage.removeItem('saved_username');
        localStorage.removeItem('remember_login');
    }
    
    // Создание токена
    authState = {
        isAuthenticated: true,
        user: {
            username: username,
            role: 'admin',
            id: generateUserId(username)
        },
        loginTime: Date.now(),
        ip: getClientIP(),
        userAgent: navigator.userAgent
    };
    
    // Сохранение токена
    saveAuthToken();
    
    // Показать успех
    showSuccess('Вход выполнен успешно!');
    
    // Редирект с задержкой
    await sleep(1200);
    window.location.href = 'index.html';
}

// ===== НЕУДАЧНАЯ ПОПЫТКА ВХОДА =====
function handleFailedLogin() {
    // Увеличиваем счетчик попыток
    loginAttempts.attempts++;
    loginAttempts.lastAttempt = new Date().toISOString();
    
    // Проверка на блокировку
    if (loginAttempts.attempts >= AUTH_CONFIG.maxAttempts) {
        loginAttempts.locked = true;
        loginAttempts.lockTime = new Date().toISOString();
        showError(`Слишком много попыток. Аккаунт заблокирован на 15 минут.`);
    } else {
        const remaining = AUTH_CONFIG.maxAttempts - loginAttempts.attempts;
        showError(`Неверный логин или пароль. Осталось попыток: ${remaining}`);
    }
    
    // Сохранение состояния попыток
    saveLoginAttempts();
}

// ===== ПЕРЕКЛЮЧЕНИЕ ВИДИМОСТИ ПАРОЛЯ =====
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const icon = this.querySelector('i');
    const isVisible = passwordInput.type === 'text';
    
    if (isVisible) {
        passwordInput.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
        this.setAttribute('aria-label', 'Показать пароль');
    } else {
        passwordInput.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
        this.setAttribute('aria-label', 'Скрыть пароль');
    }
    
    // Обновление состояния ARIA
    this.setAttribute('aria-pressed', !isVisible);
}

// ===== ЗАБЫЛИ ПАРОЛЬ =====
function handleForgotPassword(event) {
    event.preventDefault();
    
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        errorMessage.innerHTML = `
            <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 8px; margin: 10px 0;">
                <p style="margin-bottom: 8px;"><strong>Данные для входа:</strong></p>
                <p>Логин: <code>${AUTH_CONFIG.defaultUsername}</code></p>
                <p>Пароль: <code>${AUTH_CONFIG.defaultPassword}</code></p>
                <p style="margin-top: 12px; font-size: 12px; color: #64748b;">
                    ⚠️ Для смены пароля отредактируйте файл js/auth.js
                </p>
            </div>
        `;
        errorMessage.style.color = '#3b82f6';
    }
}

// ===== УТИЛИТЫ БЕЗОПАСНОСТИ =====

// Генерация ID пользователя
function generateUserId(username) {
    return 'user_' + btoa(username).replace(/[=+/]/g, '').substring(0, 10);
}

// Получение IP клиента (упрощенное)
function getClientIP() {
    // В реальном приложении получайте IP через бэкенд
    return 'local'; // Заглушка
}

// Кодирование токена
function encodeToken(data) {
    try {
        const json = JSON.stringify(data);
        return btoa(unescape(encodeURIComponent(json + AUTH_CONFIG.tokenSecret)));
    } catch (error) {
        console.error('Ошибка кодирования токена:', error);
        return null;
    }
}

// Декодирование токена
function decodeToken(token) {
    try {
        const decoded = decodeURIComponent(escape(atob(token)));
        const json = decoded.replace(AUTH_CONFIG.tokenSecret, '');
        return JSON.parse(json);
    } catch (error) {
        console.error('Ошибка декодирования токена:', error);
        return null;
    }
}

// Сохранение токена
function saveAuthToken() {
    const token = encodeToken(authState);
    if (token) {
        setStorageItem(AUTH_CONFIG.storageKey, token);
    }
}

// Получение/установка данных в storage с шифрованием
function getStorageItem(key) {
    try {
        const value = AUTH_CONFIG.useLocalStorage ? 
                     localStorage.getItem(key) : 
                     sessionStorage.getItem(key);
        
        if (!value) return null;
        
        if (AUTH_CONFIG.encryptStorage) {
            // Простое шифрование для демонстрации
            return atob(value);
        }
        
        return value;
    } catch (error) {
        console.error('Ошибка чтения из storage:', error);
        return null;
    }
}

function setStorageItem(key, value) {
    try {
        let storageValue = value;
        
        if (AUTH_CONFIG.encryptStorage) {
            // Простое шифрование для демонстрации
            storageValue = btoa(value);
        }
        
        if (AUTH_CONFIG.useLocalStorage) {
            localStorage.setItem(key, storageValue);
        } else {
            sessionStorage.setItem(key, storageValue);
        }
    } catch (error) {
        console.error('Ошибка записи в storage:', error);
    }
}

// ===== УТИЛИТЫ =====

// Задержка
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Сброс попыток входа
function resetLoginAttempts() {
    loginAttempts.attempts = 0;
    loginAttempts.locked = false;
    loginAttempts.lockTime = null;
    saveLoginAttempts();
}

// Сохранение попыток входа
function saveLoginAttempts() {
    try {
        localStorage.setItem('login_attempts', JSON.stringify(loginAttempts));
    } catch (error) {
        console.warn('Не удалось сохранить попытки входа:', error);
    }
}

// Расчет оставшегося времени блокировки
function calculateRemainingLockTime() {
    if (!loginAttempts.lockTime) return '0 мин';
    
    const lockTime = new Date(loginAttempts.lockTime).getTime();
    const now = Date.now();
    const elapsed = now - lockTime;
    const remaining = AUTH_CONFIG.lockoutTime - elapsed;
    
    if (remaining <= 0) {
        resetLoginAttempts();
        return '0 мин';
    }
    
    const minutes = Math.ceil(remaining / (60 * 1000));
    return `${minutes} мин`;
}

// Проверка страницы авторизации
function isAuthPage() {
    return window.location.pathname.includes('auth.html') || 
           window.location.pathname.endsWith('auth.html');
}

// Обновление UI
function updateAuthUI() {
    if (loginAttempts.locked) {
        const remaining = calculateRemainingLockTime();
        showError(`Система заблокирована. Попробуйте через ${remaining}`);
        
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-lock"></i> Заблокировано';
        }
    }
}

// ===== ОТОБРАЖЕНИЕ СООБЩЕНИЙ =====
function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (!errorElement) return;
    
    errorElement.textContent = message;
    errorElement.className = 'error-message';
    errorElement.style.display = 'block';
    
    // Анимация
    errorElement.style.animation = 'shake 0.5s ease';
    setTimeout(() => {
        errorElement.style.animation = '';
    }, 500);
}

function showSuccess(message) {
    const errorElement = document.getElementById('error-message');
    if (!errorElement) return;
    
    errorElement.textContent = message;
    errorElement.className = 'success-message';
    errorElement.style.display = 'block';
}

// ===== ОЧИСТКА ДАННЫХ =====
function clearAuthData() {
    // Очистка storage
    localStorage.removeItem(AUTH_CONFIG.storageKey);
    sessionStorage.removeItem(AUTH_CONFIG.storageKey);
    
    // Очистка сохраненного логина
    localStorage.removeItem('saved_username');
    localStorage.removeItem('remember_login');
    
    // Сброс состояния
    authState = {
        isAuthenticated: false,
        user: null,
        loginTime: null
    };
    
    console.log('🗑️ Данные авторизации очищены');
}

// ===== ПРОВЕРКА АВТОРИЗАЦИИ (для других страниц) =====
function checkAuth() {
    return checkSavedSession();
}

// ===== ВЫХОД =====
function logout() {
    clearAuthData();
    resetLoginAttempts();
    
    // Редирект на страницу входа
    window.location.href = 'auth.html';
}

// ===== ГЛОБАЛЬНЫЙ ДОСТУП =====
// Экспорт необходимых функций для других модулей
window.auth = {
    checkAuth,
    logout,
    getUser: () => authState.user,
    isAuthenticated: () => authState.isAuthenticated,
    clearAuthData
};

// ===== АНИМАЦИИ =====
if (!document.querySelector('#auth-styles')) {
    const style = document.createElement('style');
    style.id = 'auth-styles';
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .success-message {
            color: #10b981 !important;
            background: rgba(16, 185, 129, 0.1);
            padding: 12px;
            border-radius: 8px;
            border-left: 4px solid #10b981;
            margin: 10px 0;
        }
        
        .error-message {
            color: #ef4444 !important;
            background: rgba(239, 68, 68, 0.1);
            padding: 12px;
            border-radius: 8px;
            border-left: 4px solid #ef4444;
            margin: 10px 0;
        }
        
        .fa-spin {
            animation: fa-spin 1s linear infinite;
        }
        
        @keyframes fa-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

// ===== ЗАЩИТА ОТ ВМЕШАТЕЛЬСТВА =====
// Защита от изменения объектов через консоль
if (process.env.NODE_ENV === 'production') {
    Object.freeze(AUTH_CONFIG);
    Object.seal(authState);
}

console.log('🔒 Система авторизации загружена');
