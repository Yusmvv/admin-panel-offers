// Конфигурация авторизации
const AUTH_CONFIG = {
    defaultUsername: 'admin',
    defaultPassword: 'admin123',
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 часа
    storageKey: 'admin_auth_data'
};

// Состояние авторизации
let authState = {
    isAuthenticated: false,
    user: null,
    loginTime: null
};

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Проверка сохраненной сессии
    checkSavedSession();
    
    // Инициализация обработчиков
    initAuthHandlers();
});

// Проверить сохраненную сессию
function checkSavedSession() {
    try {
        const saved = localStorage.getItem(AUTH_CONFIG.storageKey);
        if (saved) {
            const authData = JSON.parse(saved);
            
            // Проверка времени сессии
            const now = Date.now();
            const sessionAge = now - authData.loginTime;
            
            if (sessionAge < AUTH_CONFIG.sessionTimeout) {
                // Сессия действительна
                authState = authData;
                
                // Если мы на странице авторизации - редирект
                if (window.location.pathname.includes('auth.html')) {
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 500);
                }
            } else {
                // Сессия истекла
                clearAuthData();
            }
        }
    } catch (error) {
        console.error('Ошибка при проверке сессии:', error);
        clearAuthData();
    }
}

// Инициализация обработчиков
function initAuthHandlers() {
    // Форма входа
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Кнопка показа пароля
    const showPasswordBtn = document.getElementById('show-password');
    if (showPasswordBtn) {
        showPasswordBtn.addEventListener('click', togglePasswordVisibility);
    }
    
    // Забыли пароль
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', handleForgotPassword);
    }
}

// Обработка входа
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    const errorMessage = document.getElementById('error-message');
    
    // Валидация
    if (!username || !password) {
        showError('Заполните все поля');
        return;
    }
    
    // Проверка учетных данных
    if (username === AUTH_CONFIG.defaultUsername && 
        password === AUTH_CONFIG.defaultPassword) {
        
        // Успешный вход
        authState = {
            isAuthenticated: true,
            user: {
                username: username,
                role: 'admin'
            },
            loginTime: Date.now()
        };
        
        // Сохранение сессии
        if (remember) {
            localStorage.setItem(AUTH_CONFIG.storageKey, JSON.stringify(authState));
        } else {
            sessionStorage.setItem(AUTH_CONFIG.storageKey, JSON.stringify(authState));
        }
        
        // Редирект на главную
        showSuccess('Вход выполнен успешно!');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } else {
        // Неверные учетные данные
        showError('Неверный логин или пароль');
    }
}

// Переключение видимости пароля
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const icon = this.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Обработка "Забыли пароль"
function handleForgotPassword(event) {
    event.preventDefault();
    
    const errorMessage = document.getElementById('error-message');
    errorMessage.innerHTML = `
        <div style="text-align: center;">
            <p><strong>Данные для входа по умолчанию:</strong></p>
            <p>Логин: <code>${AUTH_CONFIG.defaultUsername}</code></p>
            <p>Пароль: <code>${AUTH_CONFIG.defaultPassword}</code></p>
            <p style="margin-top: 10px; font-size: 12px; color: #64748b;">
                Для смены пароля отредактируйте файл js/auth.js
            </p>
        </div>
    `;
    errorMessage.style.color = '#3b82f6';
}

// Показать ошибку
function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.color = '#ef4444';
    errorElement.style.opacity = '1';
    
    // Анимация ошибки
    errorElement.style.animation = 'shake 0.5s ease';
    setTimeout(() => {
        errorElement.style.animation = '';
    }, 500);
}

// Показать успех
function showSuccess(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.color = '#10b981';
    errorElement.style.opacity = '1';
}

// Очистить данные авторизации
function clearAuthData() {
    localStorage.removeItem(AUTH_CONFIG.storageKey);
    sessionStorage.removeItem(AUTH_CONFIG.storageKey);
    authState = {
        isAuthenticated: false,
        user: null,
        loginTime: null
    };
}

// Проверка авторизации (для других страниц)
function checkAuth() {
    try {
        const saved = localStorage.getItem(AUTH_CONFIG.storageKey) || 
                     sessionStorage.getItem(AUTH_CONFIG.storageKey);
        
        if (saved) {
            const authData = JSON.parse(saved);
            const now = Date.now();
            const sessionAge = now - authData.loginTime;
            
            if (sessionAge < AUTH_CONFIG.sessionTimeout) {
                // 🔧 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Обновляем глобальное состояние
                authState = authData;
                return true;
            } else {
                clearAuthData();
            }
        }
    } catch (error) {
        console.error('Ошибка при проверке авторизации:', error);
    }
    
    return false;
}

// Выход из системы
function logout() {
    clearAuthData();
    window.location.href = 'auth.html';
}

// Добавить стили для анимации ошибки
if (!document.querySelector('#auth-styles')) {
    const style = document.createElement('style');
    style.id = 'auth-styles';
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
}
