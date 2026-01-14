// Проверка авторизации при загрузке главной страницы
document.addEventListener('DOMContentLoaded', function() {
    // Проверка, находимся ли мы на главной странице
    if (!window.location.pathname.includes('auth.html')) {
        // Функция проверки авторизации из auth.js
        if (typeof checkAuth === 'function') {
            if (!checkAuth()) {
                // Не авторизован - редирект на страницу входа
                window.location.href = 'auth.html';
                return;
            }
        } else {
            // Если функция не загружена, показываем ошибку
            document.getElementById('admin-app').innerHTML = `
                <div style="text-align: center; padding: 100px 20px;">
                    <h1 style="color: #ef4444;">Ошибка загрузки</h1>
                    <p>Не удалось загрузить модуль авторизации</p>
                    <a href="auth.html" style="color: #3b82f6;">Перейти на страницу входа</a>
                </div>
            `;
            return;
        }
        
        // Авторизация успешна, можно загружать основное приложение
        loadAdminApp();
    }
});

// Загрузка основного приложения
function loadAdminApp() {
    // Эта функция будет вызвана из main.js
    if (typeof initAdminApp === 'function') {
        initAdminApp();
    }
}
