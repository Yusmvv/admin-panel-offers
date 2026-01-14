// Логика настроек

// 🔧 Конфигурация настроек по умолчанию
const DEFAULT_SETTINGS = {
    landing1Title: 'ДеньгиСразу - Получите займ даже если везде отказали',
    landing2Title: 'FinAI - Подберём займ, который точно одобрят',
    primaryColor: '#3b82f6',
    autoSave: true
};

// 🔧 Загрузка сохранённых настроек
function loadSettings() {
    try {
        const saved = localStorage.getItem('admin_settings');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
    }
    return { ...DEFAULT_SETTINGS };
}

// 🔧 Сохранение настроек
function saveSettingsToStorage(settings) {
    try {
        localStorage.setItem('admin_settings', JSON.stringify(settings));
        return true;
    } catch (error) {
        console.error('Ошибка сохранения настроек:', error);
        return false;
    }
}

function renderSettingsTab() {
    // Загружаем текущие настройки
    const currentSettings = loadSettings();
    
    return `
        <div id="settings-content" class="tab-content">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="fas fa-sliders-h"></i>
                        <span>Настройки системы</span>
                    </h2>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Заголовок лендинга 1</label>
                    <input type="text" class="form-control" id="landing1-title" 
                           value="${currentSettings.landing1Title || DEFAULT_SETTINGS.landing1Title}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Заголовок лендинга 2</label>
                    <input type="text" class="form-control" id="landing2-title" 
                           value="${currentSettings.landing2Title || DEFAULT_SETTINGS.landing2Title}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Основной цвет интерфейса</label>
                    <input type="color" class="form-control" id="primary-color" 
                           value="${currentSettings.primaryColor || DEFAULT_SETTINGS.primaryColor}" 
                           style="width: 80px; height: 40px; padding: 5px;">
                </div>
                
                <div class="form-group">
                    <label class="checkbox" style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" id="auto-save" 
                               ${currentSettings.autoSave !== false ? 'checked' : ''}>
                        <span>Автоматически сохранять изменения</span>
                    </label>
                </div>
                
                <div style="display: flex; gap: 16px; margin-top: 32px;">
                    <button class="btn btn-success" id="save-settings">
                        <i class="fas fa-save"></i> Сохранить настройки
                    </button>
                    <button class="btn btn-secondary" id="reset-settings">
                        <i class="fas fa-undo"></i> Сбросить настройки
                    </button>
                    <button class="btn btn-primary" id="test-settings">
                        <i class="fas fa-check"></i> Тест сохранения
                    </button>
                </div>
                
                <div id="settings-status" style="margin-top: 20px; padding: 10px; border-radius: 8px; display: none;"></div>
            </div>
        </div>
    `;
}
// 🔧 Делаем функцию глобально доступной
window.renderSettingsTab = renderSettingsTab;

// 🔧 Функция сохранения настроек
function saveSettings() {
    const settings = {
        landing1Title: document.getElementById('landing1-title').value.trim(),
        landing2Title: document.getElementById('landing2-title').value.trim(),
        primaryColor: document.getElementById('primary-color').value,
        autoSave: document.getElementById('auto-save').checked
    };
    
    // Валидация
    if (!settings.landing1Title || !settings.landing2Title) {
        showSettingsMessage('Заполните все поля заголовков!', 'error');
        return false;
    }
    
    const success = saveSettingsToStorage(settings);
    
    if (success) {
        showSettingsMessage('Настройки успешно сохранены!', 'success');
        
        // 🔧 Применяем цвет интерфейса
        applyInterfaceColor(settings.primaryColor);
        
        // 🔧 Показываем уведомление, если есть глобальная функция
        if (window.showNotification) {
            window.showNotification('Настройки системы сохранены', 'success');
        }
        
        return true;
    } else {
        showSettingsMessage('Ошибка при сохранении настроек', 'error');
        return false;
    }
}

// 🔧 Функция сброса настроек
function resetSettings() {
    if (confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?')) {
        // Удаляем сохранённые настройки
        localStorage.removeItem('admin_settings');
        
        // Сбрасываем поля формы
        document.getElementById('landing1-title').value = DEFAULT_SETTINGS.landing1Title;
        document.getElementById('landing2-title').value = DEFAULT_SETTINGS.landing2Title;
        document.getElementById('primary-color').value = DEFAULT_SETTINGS.primaryColor;
        document.getElementById('auto-save').checked = DEFAULT_SETTINGS.autoSave;
        
        // Применяем цвет по умолчанию
        applyInterfaceColor(DEFAULT_SETTINGS.primaryColor);
        
        showSettingsMessage('Настройки сброшены к значениям по умолчанию', 'success');
        
        if (window.showNotification) {
            window.showNotification('Настройки сброшены', 'success');
        }
    }
}

// 🔧 Применение цвета интерфейса
function applyInterfaceColor(color) {
    // Простой пример применения цвета к основным элементам
    const styleId = 'dynamic-colors';
    let style = document.getElementById(styleId);
    
    if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        document.head.appendChild(style);
    }
    
    // 🔧 Применяем цвет к основным кнопкам и элементам
    style.textContent = `
        .btn-primary, .nav-item.active, .logo-badge {
            background: linear-gradient(135deg, ${color} 0%, ${adjustColor(color, -20)} 100%) !important;
        }
        .btn-primary:hover {
            box-shadow: 0 8px 20px ${color}40 !important;
        }
        .stat-icon-1 { background: linear-gradient(135deg, ${adjustColor(color, 40)} 0%, ${adjustColor(color, 20)} 100%) !important; }
    `;
}

// 🔧 Вспомогательная функция для настройки цвета
function adjustColor(color, percent) {
    // Упрощённая функция для затемнения/осветления цвета
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return '#' + (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
}

// 🔧 Показать сообщение в настройках
function showSettingsMessage(text, type = 'info') {
    const statusEl = document.getElementById('settings-status');
    if (!statusEl) return;
    
    statusEl.textContent = text;
    statusEl.style.display = 'block';
    statusEl.style.background = type === 'success' ? '#d1fae5' : 
                               type === 'error' ? '#fee2e2' : '#e0e7ff';
    statusEl.style.color = type === 'success' ? '#065f46' : 
                          type === 'error' ? '#991b1b' : '#3730a3';
    statusEl.style.border = `1px solid ${type === 'success' ? '#a7f3d0' : 
                          type === 'error' ? '#fecaca' : '#c7d2fe'}`;
    
    // Автоскрытие для успешных сообщений
    if (type === 'success') {
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 3000);
    }
}

// 🔧 Тестовая функция для проверки
function testSettings() {
    const currentSettings = loadSettings();
    showSettingsMessage(`
        Текущие настройки:<br>
        • Лендинг 1: "${currentSettings.landing1Title}"<br>
        • Лендинг 2: "${currentSettings.landing2Title}"<br>
        • Цвет: ${currentSettings.primaryColor}<br>
        • Автосохранение: ${currentSettings.autoSave ? 'Вкл' : 'Выкл'}
    `, 'info');
}

// 🔧 Инициализация обработчиков настроек
function initSettingsHandlers() {
    // Кнопка сохранения настроек
    const saveBtn = document.getElementById('save-settings');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveSettings);
    }
    
    // Кнопка сброса настроек
    const resetBtn = document.getElementById('reset-settings');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSettings);
    }
    
    // Тестовая кнопка
    const testBtn = document.getElementById('test-settings');
    if (testBtn) {
        testBtn.addEventListener('click', testSettings);
    }
    
    // 🔧 Автоматическое сохранение при изменении (если включено)
    const autoSaveCheckbox = document.getElementById('auto-save');
    if (autoSaveCheckbox) {
        const inputs = ['landing1-title', 'landing2-title', 'primary-color'];
        
        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('change', function() {
                    if (autoSaveCheckbox.checked) {
                        setTimeout(saveSettings, 500); // Задержка для дебаунса
                    }
                });
            }
        });
    }
    
    // 🔧 Применяем сохранённый цвет при загрузке
    const currentSettings = loadSettings();
    applyInterfaceColor(currentSettings.primaryColor);
    
    console.log('Settings handlers initialized');
}
// 🔧 Делаем функцию глобально доступной
window.initSettingsHandlers = initSettingsHandlers;

// 🔧 Делаем ключевые функции глобально доступными для других скриптов
window.saveSettings = saveSettings;
window.resetSettings = resetSettings;
