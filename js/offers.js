// Логика управления офферами

function renderOffersTab() {
    return `
        <div id="offers-content" class="tab-content">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="fas fa-gem"></i>
                        <span>Управление офферами</span>
                    </h2>
                    <button class="btn btn-primary" id="add-offer-btn">
                        <i class="fas fa-plus-circle"></i>
                        <span>Добавить оффер</span>
                    </button>
                </div>
                
                <div style="overflow-x: auto;">
                    <table id="offers-table">
                        <thead>
                            <tr>
                                <th>Оффер</th>
                                <th>Сумма</th>
                                <th>Срок</th>
                                <th>Ставка</th>
                                <th>Просрочки</th>
                                <th>Доход</th>
                                <th>Статус</th>
                                <th style="text-align: center;">Действия</th>
                            </tr>
                        </thead>
                        <tbody id="offers-list">
                            <!-- Список офферов будет сгенерирован JavaScript -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function initOffersHandlers() {
    // Кнопка добавления оффера
    document.getElementById('add-offer-btn')?.addEventListener('click', showOfferModal);
    
    // Инициализация таблицы офферов
    renderOffersList();
}

// Остальные функции управления офферами...
