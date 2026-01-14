// Логика настроек

function renderSettingsTab() {
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
                    <input type="text" class="form-control" id="landing1-title" value="ДеньгиСразу - Получите займ даже если везде отказали">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Заголовок лендинга 2</label>
                    <input type="text" class="form-control" id="landing2-title" value="FinAI - Подберём займ, который точно одобрят">
                </div>
                
                <div style="display: flex; gap: 16px; margin-top: 32px;">
                    <button class="btn btn-success" id="save-settings">
                        <i class="fas fa-save"></i> Сохранить настройки
                    </button>
                    <button class="btn btn-secondary" id="reset-settings">
                        <i class="fas fa-undo"></i> Сбросить настройки
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Остальные функции настроек...
