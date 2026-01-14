// ===== МОДУЛЬ МОДАЛЬНЫХ ОКОН =====

// Состояние
const modals = {
    offer: null,
    confirm: null,
    current: null
};

// ===== ОСНОВНЫЕ ФУНКЦИИ =====

/**
 * Инициализация модальных окон
 */
export function initModals() {
    console.log('🪟 Инициализация модальных окон');
    
    // Получаем элементы модалок
    modals.offer = document.getElementById('offer-modal');
    modals.confirm = document.getElementById('confirm-modal');
    
    // Инициализация обработчиков
    initModalHandlers();
    
    return true;
}

/**
 * Инициализация обработчиков
 */
function initModalHandlers() {
    // Закрытие по клику на overlay
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeCurrentModal();
        }
        
        if (e.target.closest('.close-modal') || e.target.closest('.cancel-btn')) {
            closeCurrentModal();
        }
    });
    
    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modals.current) {
            closeCurrentModal();
        }
    });
    
    // Обработка подтверждения удаления
    const confirmBtn = document.getElementById('confirm-delete');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', handleDeleteConfirm);
    }
}

/**
 * Открытие модального окна
 */
export function openModal(type, options = {}) {
    const modal = modals[type];
    if (!modal) return false;
    
    // Закрываем текущую модалку
    if (modals.current) {
        closeModal(modals.current);
    }
    
    // Подготовка модалки
    prepareModal(modal, options);
    
    // Показываем
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modals.current = modal;
    
    // Фокус на первом поле
    if (type === 'offer') {
        setTimeout(() => {
            const input = modal.querySelector('input');
            if (input) input.focus();
        }, 50);
    }
    
    return true;
}

/**
 * Подготовка модалки
 */
function prepareModal(modal, options) {
    if (modal.id === 'offer-modal') {
        prepareOfferModal(modal, options);
    } else if (modal.id === 'confirm-modal') {
        prepareConfirmModal(modal, options);
    }
}

/**
 * Подготовка модалки оффера
 */
function prepareOfferModal(modal, options) {
    const form = modal.querySelector('form');
    if (!form) return;
    
    form.reset();
    
    // Заполнение данных для редактирования
    if (options.offer) {
        modal.querySelector('#offer-id').value = options.offer.id || '';
        modal.querySelector('#offer-name').value = options.offer.name || '';
        modal.querySelector('#description').value = options.offer.description || '';
        
        // Обновление заголовка
        const title = modal.querySelector('.modal-title span');
        if (title) {
            title.textContent = 'Редактировать оффер';
        }
    } else {
        // Обновление заголовка для добавления
        const title = modal.querySelector('.modal-title span');
        if (title) {
            title.textContent = 'Добавить новый оффер';
        }
    }
    
    // Очистка ошибок
    clearFormErrors(form);
}

/**
 * Подготовка модалки подтверждения
 */
function prepareConfirmModal(modal, options) {
    if (options.message) {
        const msgEl = modal.querySelector('.confirm-message');
        if (msgEl) {
            msgEl.textContent = options.message;
        }
    }
    
    if (options.onConfirm) {
        modal.dataset.onConfirm = options.onConfirm;
    }
    
    if (options.offerName) {
        const msgEl = modal.querySelector('.confirm-message');
        if (msgEl) {
            msgEl.textContent = `Вы уверены, что хотите удалить оффер "${options.offerName}"? Это действие необратимо.`;
        }
    }
}

/**
 * Закрытие текущей модалки
 */
function closeCurrentModal() {
    if (modals.current) {
        closeModal(modals.current);
    }
}

/**
 * Закрытие модального окна
 */
export function closeModal(modal) {
    if (!modal) return;
    
    modal.hidden = true;
    modals.current = null;
    document.body.style.overflow = '';
    
    // Очистка данных
    if (modal.id === 'confirm-modal') {
        delete modal.dataset.onConfirm;
    }
}

/**
 * Показать модалку подтверждения удаления
 */
export function showDeleteConfirm(offerId, offerName) {
    return openModal('confirm', {
        offerName,
        onConfirm: () => {
            // Вызов глобальной функции удаления
            if (window.App && window.App.deleteOffer) {
                window.App.deleteOffer(offerId);
            }
            return true;
        }
    });
}

/**
 * Обработка подтверждения удаления
 */
function handleDeleteConfirm() {
    const modal = modals.confirm;
    if (!modal) return;
    
    const onConfirm = modal.dataset.onConfirm;
    
    try {
        if (onConfirm) {
            // Выполнить функцию подтверждения
            const success = eval(`(${onConfirm})`)();
            if (success) {
                closeModal(modal);
            }
        }
    } catch (error) {
        console.error('Ошибка подтверждения:', error);
        closeModal(modal);
    }
}

/**
 * Получить данные формы оффера
 */
export function getOfferFormData() {
    const modal = modals.offer;
    if (!modal) return null;
    
    const form = modal.querySelector('form');
    if (!form) return null;
    
    const id = form.querySelector('#offer-id').value;
    const name = form.querySelector('#offer-name').value.trim();
    const description = form.querySelector('#description').value.trim();
    
    if (!name) {
        showFormError(form, 'Введите название оффера');
        return null;
    }
    
    return {
        id: id || generateId(),
        name,
        description: description || `${name} - выгодные условия займа`,
        status: 'active',
        income: 0,
        createdAt: id ? undefined : Date.now(),
        updatedAt: Date.now()
    };
}

/**
 * Валидация формы
 */
function validateForm(form) {
    const nameInput = form.querySelector('#offer-name');
    if (!nameInput || !nameInput.value.trim()) {
        showFormError(form, 'Введите название оффера');
        return false;
    }
    return true;
}

/**
 * Показать ошибку в форме
 */
function showFormError(form, message) {
    const errorDiv = form.querySelector('.form-error') || createErrorElement(form);
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    const input = form.querySelector('#offer-name');
    if (input) {
        input.focus();
    }
}

/**
 * Очистка ошибок формы
 */
function clearFormErrors(form) {
    const errors = form.querySelectorAll('.form-error');
    errors.forEach(error => {
        error.textContent = '';
        error.style.display = 'none';
    });
}

/**
 * Создание элемента ошибки
 */
function createErrorElement(form) {
    const div = document.createElement('div');
    div.className = 'form-error';
    div.setAttribute('role', 'alert');
    form.appendChild(div);
    return div;
}

/**
 * Генерация ID
 */
function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
}

// ===== ГЛОБАЛЬНЫЙ ДОСТУП =====

// Инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModals);
} else {
    setTimeout(initModals, 100);
}

// Экспорт
window.Modal = {
    init: initModals,
    open: openModal,
    close: closeModal,
    showDeleteConfirm,
    getOfferFormData
};

console.log('🪟 Модуль модальных окон загружен');
