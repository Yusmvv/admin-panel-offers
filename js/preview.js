// Логика предпросмотра

function renderPreviewTab() {
    return `
        <div id="preview-content" class="tab-content">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="fas fa-eye"></i>
                        <span>Предпросмотр офферов</span>
                    </h2>
                </div>
                
                <div class="preview-tabs">
                    <div class="preview-tab active" data-preview="landing1">
                        Лендинг 1: ДеньгиСразу
                    </div>
                    <div class="preview-tab" data-preview="landing2">
                        Лендинг 2: FinAI
                    </div>
                    <div class="preview-tab" data-preview="mobile">
                        <i class="fas fa-mobile-alt"></i> Мобильная версия
                    </div>
                    <div class="preview-tab" data-preview="filters">
                        <i class="fas fa-filter"></i> Фильтрация
                    </div>
                </div>
                
                <div class="preview-container">
                    <div class="preview-header">
                        <div style="font-weight: 600; color: #475569;">
                            <span id="preview-offers-count">0</span> офферов
                            <span style="color: #94a3b8;"> • </span>
                            <span id="preview-update-time">Только что обновлено</span>
                        </div>
                        <button class="btn btn-sm btn-secondary" id="refresh-preview">
                            <i class="fas fa-redo"></i> Обновить
                        </button>
                    </div>
                    
                    <div class="preview-content">
                        <div id="preview-landing1" class="preview-tab-content active">
                            <iframe class="preview-frame" id="preview-frame-1"></iframe>
                        </div>
                        <div id="preview-landing2" class="preview-tab-content" style="display: none;">
                            <iframe class="preview-frame" id="preview-frame-2"></iframe>
                        </div>
                        <div id="preview-mobile" class="preview-tab-content" style="display: none;">
                            <div style="max-width: 375px; margin: 0 auto; padding: 20px; background: white;">
                                <div id="mobile-preview-content"></div>
                            </div>
                        </div>
                        <div id="preview-filters" class="preview-tab-content" style="display: none; padding: 20px;">
                            <div id="filter-preview-content"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Остальные функции предпросмотра...
