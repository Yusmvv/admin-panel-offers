// Логика управления офферами

// ===== ФУНКЦИИ РЕНДЕРИНГА =====

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

function renderOffersList() {
    const tbody = document.getElementById('offers-list');
    if (!tbody) return;
    
    if (window.offers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <h3>Нет офферов</h3>
                        <p>Добавьте первый оффер, чтобы начать работу</p>
                        <button class="btn btn-primary" onclick="showOfferModal()">
                            <i class="fas fa-plus"></i> Добавить оффер
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Сортировка по статусу (активные первые)
    const sortedOffers = [...window.offers].sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        return 0;
    });
    
    tbody.innerHTML = sortedOffers.map(offer => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                        ${window.icons[offer.icon] || '⚡'}
                    </div>
                    <div>
                        <div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">${offer.name}</div>
                        <div style="font-size: 13px; color: #64748b;">ID: ${offer.id}</div>
                    </div>
                </div>
            </td>
            <td>
                <div style="font-weight: 600; color: #0f172a;">${window.formatNumber(offer.amount_min)} - ${window.formatNumber(offer.amount_max)} ₽</div>
            </td>
            <td>
                <div style="font-weight: 600; color: #0f172a;">${offer.term_min} - ${offer.term_max} дней</div>
            </td>
            <td>
                <div style="font-weight: 600; color: #10b981;">${offer.rate_display}</div>
            </td>
            <td>
                <div class="overdue-badges">
                    ${offer.overdue_types?.includes('no_overdue') ? '<span class="badge badge-overdue">Нет</span>' : ''}
                    ${offer.overdue_types?.includes('has_overdue') ? '<span class="badge badge-overdue">Есть</span>' : ''}
                    ${offer.overdue_types?.includes('overdue_30plus') ? '<span class="badge badge-overdue">30+</span>' : ''}
                    ${offer.overdue_types?.includes('court_cases') ? '<span class="badge badge-overdue">Суд</span>' : ''}
                </div>
            </td>
            <td>
                <div class="income-badges">
                    ${offer.income_types?.includes('has_income') ? '<span class="badge badge-income">Есть</span>' : ''}
                    ${offer.income_types?.includes('no_income') ? '<span class="badge badge-income">Нет</span>' : ''}
                    ${offer.income_types?.includes('income_unconfirmed') ? '<span class="badge badge-income">?</span>' : ''}
                </div>
            </td>
            <td>
                <span class="status-badge ${offer.status === 'active' ? 'status-active' : 'status-inactive'}">
                    ${offer.status === 'active' ? '<i class="fas fa-check-circle"></i> Активный' : '<i class="fas fa-pause-circle"></i> Неактивный'}
                </span>
            </td>
            <td style="text-align: center;">
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button class="btn btn-sm btn-secondary" onclick="editOffer(${offer.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteOffer(${offer.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="toggleOfferStatus(${offer.id})">
                        <i class="fas fa-power-off"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ===== ФУНКЦИИ РАБОТЫ С ОФФЕРАМИ =====

function showOfferModal(offer = null) {
    window.currentEditOffer = offer;
    const modal = document.getElementById('offer-modal');
    const title = document.getElementById('modal-title');
    
    if (!modal) {
        console.error('Модальное окно с id="offer-modal" не найдено!');
        return;
    }
    
    if (offer) {
        title.innerHTML = '<i class="fas fa-edit" style="margin-right: 12px;"></i><span>Редактировать оффер</span>';
        populateForm(offer);
    } else {
        title.innerHTML = '<i class="fas fa-plus-circle" style="margin-right: 12px;"></i><span>Добавить новый оффер</span>';
        resetForm();
    }
    
    modal.classList.add('active');
}

function editOffer(id) {
    const offer = window.offers.find(o => o.id === id);
    if (offer) {
        showOfferModal(offer);
    }
}

function deleteOffer(id) {
    if (confirm('Вы уверены, что хотите удалить этот оффер? Это действие нельзя отменить.')) {
        const index = window.offers.findIndex(o => o.id === id);
        if (index !== -1) {
            window.offers.splice(index, 1);
            window.saveData();
            window.showNotification('Оффер успешно удален', 'success');
        }
    }
}

function toggleOfferStatus(id) {
    const index = window.offers.findIndex(o => o.id === id);
    if (index !== -1) {
        window.offers[index].status = window.offers[index].status === 'active' ? 'inactive' : 'active';
        window.saveData();
        window.showNotification('Статус оффера изменен', 'success');
    }
}

// ===== ФУНКЦИИ ФОРМЫ =====

function populateForm(offer) {
    // Эта функция будет работать с модальным окном
    console.log('Заполняем форму для оффера:', offer.name);
    // Здесь должен быть код заполнения полей формы
}

function resetForm() {
    // Код сброса формы
    console.log('Сброс формы');
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

function initOffersHandlers() {
    // Кнопка добавления оффера
    const addButton = document.getElementById('add-offer-btn');
    if (addButton) {
        addButton.addEventListener('click', () => showOfferModal());
    }
    
    // Инициализация таблицы офферов
    renderOffersList();
}
