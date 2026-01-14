// ===== modal.js =====
// Модуль управления модальными окнами

// ===== КОНФИГУРАЦИЯ =====
const MODAL_CONFIG = {
    // Селекторы
    selectors: {
        offerModal: '#offer-modal',
        confirmModal: '#confirm-modal',
        modalOverlay: '.modal-overlay',
        modalClose: '.modal-close, [data-modal-close]',
        modalCancel: '[data-modal-cancel]',
        offerForm: '#offer-form',
        offerName: '#offer-name',
        description: '#description',
        offerId: '#offer-id'
    },
    
    // Классы
    classes: {
        active: 'active',
        closing: 'closing',
        loading: 'loading',
        error: 'error',
        success: 'success'
    },
    
    // Сообщения
    messages: {
        offerCreated: 'Оффер успешно создан',
        offerUpdated: 'Оффер успешно обновлен',
        offerDeleted: 'Оффер успешно удален',
        validationError: 'Заполните обязательные поля',
        loading: 'Сохранение...',
        error: 'Произошла ошибка'
    },
    
    // Настройки
    animationDuration: 300,
    escapeToClose: true,
    clickOutsideToClose: true,
    autoFocus: true
};

// ===== СОСТОЯНИЕ =====
const ModalState = {
    currentModal: null,
    currentForm: null,
    isSubmitting: false,
    pendingAction: null,
    escapeHandler: null,
    modals: {}
};

// ===== КОНТРОЛЛЕРЫ МОДАЛОК =====

// Инициализация системы модальных окон
function initModalSystem() {
    console.log('🪟 Инициализация системы модальных окон...');
    
    try {
        // Регистрация модальных окон
        registerModals();
        
        // Инициализация обработчиков
        initModalHandlers();
        
        // Инициализация горячих клавиш
        if (MODAL_CONFIG.escapeToClose) {
            initEscapeHandler();
        }
        
        // Экспорт API
        exportModalAPI();
        
        console.log('✅ Система модальных окон инициализирована');
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка инициализации системы модальных окон:', error);
        return false;
    }
}

// Регистрация всех модальных окон
function registerModals() {
    // Регистрация модалки оффера
    ModalState.modals.offer = {
        id: 'offer-modal',
        element: document.querySelector(MODAL_CONFIG.selectors.offerModal),
        type: 'form',
        handlers: {
            submit: handleOfferFormSubmit,
            open: onOfferModalOpen,
            close: onOfferModalClose
        }
    };
    
    // Регистрация модалки подтверждения
    ModalState.modals.confirm = {
        id: 'confirm-modal',
        element: document.querySelector(MODAL_CONFIG.selectors.confirmModal),
        type: 'confirm',
        handlers: {
            confirm: null, // Устанавливается динамически
            cancel: onConfirmModalCancel
        }
    };
    
    // Проверка регистрации
    Object.values(ModalState.modals).forEach(modal => {
        if (!modal.element) {
            console.warn(`⚠️ Модальное окно ${modal.id} не найдено в DOM`);
        }
    });
}

// Инициализация обработчиков событий
function initModalHandlers() {
    // Делегирование событий закрытия
    document.addEventListener('click', handleModalClick);
    
    // Обработка форм в модалках
    const offerForm = document.querySelector(MODAL_CONFIG.selectors.offerForm);
    if (offerForm) {
        offerForm.addEventListener('submit', handleOfferFormSubmit);
    }
    
    // Обработка подтверждения удаления
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
    }
    
    // Обработка нажатия Escape
    if (MODAL_CONFIG.escapeToClose) {
        initEscapeHandler();
    }
    
    // Обработка отправки формы по Enter
    document.addEventListener('keydown', handleModalKeydown);
}

// Обработка кликов в модальных окнах
function handleModalClick(event) {
    const target = event.target;
    
    // Закрытие по клику на крестик
    if (target.closest(MODAL_CONFIG.selectors.modalClose)) {
        event.preventDefault();
        const modal = findParentModal(target);
        if (modal) {
            closeModal(modal);
        }
        return;
    }
    
    // Закрытие по клику на кнопку отмены
    if (target.closest(MODAL_CONFIG.selectors.modalCancel)) {
        event.preventDefault();
        const modal = findParentModal(target);
        if (modal) {
            closeModal(modal);
        }
        return;
    }
    
    // Закрытие по клику вне модалки
    if (MODAL_CONFIG.clickOutsideToClose && 
        target.classList.contains('modal-overlay')) {
        const modal = target.closest('.modal');
        if (modal) {
            closeModal(modal);
        }
        return;
    }
}

// Обработка клавиатуры
function handleModalKeydown(event) {
    // Закрытие по Escape
    if (event.key === 'Escape' && MODAL_CONFIG.escapeToClose) {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            event.preventDefault();
            closeModal(activeModal);
        }
        return;
    }
    
    // Отправка формы по Ctrl+Enter
    if (event.ctrlKey && event.key === 'Enter') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            const form = activeModal.querySelector('form');
            if (form && !ModalState.isSubmitting) {
                event.preventDefault();
                form.dispatchEvent(new Event('submit'));
            }
        }
    }
}

// Инициализация обработчика Escape
function initEscapeHandler() {
    ModalState.escapeHandler = (event) => {
        if (event.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                event.preventDefault();
                closeModal(activeModal);
            }
        }
    };
    
    document.addEventListener('keydown', ModalState.escapeHandler);
}

// ===== УПРАВЛЕНИЕ МОДАЛЬНЫМИ ОКНАМИ =====

// Открытие модального окна
function openModal(modalId, options = {}) {
    const modal = ModalState.modals[modalId];
    
    if (!modal || !modal.element) {
        console.error(`❌ Модальное окно ${modalId} не найдено`);
        return false;
    }
    
    try {
        // Сохраняем текущую модалку
        ModalState.currentModal = modal;
        
        // Подготовка модалки к открытию
        prepareModalForOpen(modal, options);
        
        // Показываем модалку
        modal.element.classList.add(MODAL_CONFIG.classes.active);
        
        // Фокус на первом поле ввода
        if (MODAL_CONFIG.autoFocus && modal.type === 'form') {
            setTimeout(() => {
                const firstInput = modal.element.querySelector('input, textarea, select');
                if (firstInput) {
                    firstInput.focus();
                }
            }, MODAL_CONFIG.animationDuration);
        }
        
        // Вызов обработчика открытия
        if (modal.handlers && modal.handlers.open) {
            modal.handlers.open(options);
        }
        
        // Блокируем скролл страницы
        document.body.style.overflow = 'hidden';
        
        console.log(`✅ Модальное окно ${modalId} открыто`);
        return true;
        
    } catch (error) {
        console.error(`❌ Ошибка открытия модального окна ${modalId}:`, error);
        return false;
    }
}

// Подготовка модалки к открытию
function prepareModalForOpen(modal, options) {
    // Сброс состояния
    modal.element.classList.remove(MODAL_CONFIG.classes.error);
    modal.element.classList.remove(MODAL_CONFIG.classes.success);
    
    // Установка данных из options
    if (options.data) {
        setModalData(modal.element, options.data);
    }
    
    // Установка обработчика подтверждения
    if (options.onConfirm && modal.type === 'confirm') {
        ModalState.pendingAction = options.onConfirm;
    }
    
    // Обновление заголовка
    if (options.title) {
        updateModalTitle(modal.element, options.title);
    }
}

// Закрытие модального окна
function closeModal(modalElement) {
    if (!modalElement || !modalElement.classList.contains(MODAL_CONFIG.classes.active)) {
        return;
    }
    
    try {
        // Анимация закрытия
        modalElement.classList.add(MODAL_CONFIG.classes.closing);
        modalElement.classList.remove(MODAL_CONFIG.classes.active);
        
        // Вызов обработчика закрытия
        const modal = getModalByElement(modalElement);
        if (modal && modal.handlers && modal.handlers.close) {
            modal.handlers.close();
        }
        
        // Сброс состояния
        setTimeout(() => {
            modalElement.classList.remove(MODAL_CONFIG.classes.closing);
            
            // Разблокировка скролла
            const anyModalOpen = document.querySelector('.modal.active');
            if (!anyModalOpen) {
                document.body.style.overflow = '';
            }
            
            // Сброс текущей модалки
            if (ModalState.currentModal && ModalState.currentModal.element === modalElement) {
                ModalState.currentModal = null;
            }
            
            // Сброс pending action
            if (modalElement.id === 'confirm-modal') {
                ModalState.pendingAction = null;
            }
            
            console.log(`✅ Модальное окно ${modalElement.id} закрыто`);
        }, MODAL_CONFIG.animationDuration);
        
    } catch (error) {
        console.error(`❌ Ошибка закрытия модального окна:`, error);
        modalElement.classList.remove(MODAL_CONFIG.classes.active);
        document.body.style.overflow = '';
    }
}

// Получение модалки по элементу
function getModalByElement(element) {
    return Object.values(ModalState.modals).find(
        modal => modal.element === element
    );
}

// Поиск родительской модалки
function findParentModal(element) {
    return element.closest('.modal');
}

// ===== ОБРАБОТКА ФОРМ ОФФЕРОВ =====

// Обработка отправки формы оффера
async function handleOfferFormSubmit(event) {
    event.preventDefault();
    
    if (ModalState.isSubmitting) {
        console.log('⏳ Форма уже отправляется...');
        return;
    }
    
    const form = event.target;
    const modal = form.closest('.modal');
    
    if (!form || !modal) {
        console.error('❌ Форма или модальное окно не найдены');
        return;
    }
    
    // Валидация формы
    if (!validateOfferForm(form)) {
        return;
    }
    
    try {
        // Начинаем отправку
        ModalState.isSubmitting = true;
        setModalLoading(modal, true);
        
        // Сбор данных формы
        const formData = getFormData(form);
        
        // Обработка данных
        const result = await processOfferFormData(formData);
        
        if (result.success) {
            // Успешное сохранение
            await handleOfferSaveSuccess(modal, result.data);
        } else {
            // Ошибка сохранения
            throw new Error(result.message || MODAL_CONFIG.messages.error);
        }
        
    } catch (error) {
        console.error('❌ Ошибка при сохранении оффера:', error);
        handleOfferSaveError(modal, error);
        
    } finally {
        // Завершаем отправку
        ModalState.isSubmitting = false;
        setModalLoading(modal, false);
    }
}

// Валидация формы оффера
function validateOfferForm(form) {
    const offerName = form.querySelector('#offer-name');
    const errorElement = form.querySelector('.form-error') || createErrorElement(form);
    
    // Очистка предыдущих ошибок
    clearFormErrors(form);
    
    // Проверка названия
    if (!offerName || !offerName.value.trim()) {
        showFormError(offerName, 'Введите название оффера');
        return false;
    }
    
    // Проверка длины названия
    if (offerName.value.trim().length < 2) {
        showFormError(offerName, 'Название должно содержать минимум 2 символа');
        return false;
    }
    
    if (offerName.value.trim().length > 100) {
        showFormError(offerName, 'Название не должно превышать 100 символов');
        return false;
    }
    
    // Проверка на опасные символы
    const dangerousPattern = /[<>"'`]/;
    if (dangerousPattern.test(offerName.value)) {
        showFormError(offerName, 'Название содержит недопустимые символы');
        return false;
    }
    
    return true;
}

// Сбор данных формы
function getFormData(form) {
    const formData = {};
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        if (input.name) {
            if (input.type === 'checkbox') {
                formData[input.name] = input.checked;
            } else {
                formData[input.name] = input.value.trim();
            }
        }
    });
    
    return formData;
}

// Обработка данных формы оффера
async function processOfferFormData(formData) {
    // Имитация асинхронной обработки
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                // Проверка глобального состояния
                if (!window.App || !window.App.state) {
                    throw new Error('Приложение не инициализировано');
                }
                
                const offerId = formData['offer-id'];
                const isEdit = offerId && offerId !== '';
                
                // Создание/обновление оффера
                const offer = createOfferFromFormData(formData);
                
                // Добавление/обновление в глобальном состоянии
                if (isEdit) {
                    updateExistingOffer(offer);
                } else {
                    addNewOffer(offer);
                }
                
                resolve({
                    success: true,
                    data: offer,
                    message: isEdit ? 
                        MODAL_CONFIG.messages.offerUpdated : 
                        MODAL_CONFIG.messages.offerCreated
                });
                
            } catch (error) {
                reject(error);
            }
        }, 800); // Имитация задержки сети
    });
}

// Создание объекта оффера из данных формы
function createOfferFromFormData(formData) {
    const now = Date.now();
    const isEdit = formData['offer-id'] && formData['offer-id'] !== '';
    
    const offer = {
        id: isEdit ? formData['offer-id'] : generateOfferId(),
        name: formData['offer-name'],
        description: formData.description || `${formData['offer-name']} - выгодные условия займа`,
        amount_min: 1000,
        amount_max: 50000,
        term_min: 7,
        term_max: 30,
        rate_min: 0,
        rate_max: 0.8,
        rate_display: "0 - 0.8% в день",
        speed: 5,
        approval: 95,
        rating: 4.5,
        reviews_count: 1000,
        reviews_icon: "star",
        icon: "bolt",
        features: [],
        link_landing1: "https://tracking.com/offer?source=landing1",
        link_landing2: "https://tracking.com/offer?source=landing2",
        overdue_types: ["no_overdue", "has_overdue"],
        income_types: ["has_income", "income_unconfirmed"],
        status: "active",
        landing1: true,
        landing2: true,
        created_at: isEdit ? undefined : now,
        updated_at: now
    };
    
    return offer;
}

// Генерация ID для оффера
function generateOfferId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `offer_${timestamp}_${random}`;
}

// Добавление нового оффера
function addNewOffer(offer) {
    if (!window.App || !window.App.state) {
        throw new Error('Приложение не инициализировано');
    }
    
    window.App.state.offers.push(offer);
    window.App.save();
}

// Обновление существующего оффера
function updateExistingOffer(updatedOffer) {
    if (!window.App || !window.App.state) {
        throw new Error('Приложение не инициализировано');
    }
    
    const index = window.App.state.offers.findIndex(o => o.id === updatedOffer.id);
    if (index !== -1) {
        window.App.state.offers[index] = {
            ...window.App.state.offers[index],
            ...updatedOffer,
            created_at: window.App.state.offers[index].created_at || Date.now()
        };
        window.App.save();
    } else {
        throw new Error('Оффер для обновления не найден');
    }
}

// Обработка успешного сохранения
async function handleOfferSaveSuccess(modal, offer) {
    // Показать успех
    setModalSuccess(modal, true);
    
    // Показать уведомление
    if (window.App && window.App.showNotification) {
        window.App.showNotification(
            `Оффер "${offer.name}" успешно ${offer.id.includes('edit') ? 'обновлен' : 'создан'}!`,
            'success'
        );
    }
    
    // Обновить UI
    if (window.App && window.App.updateUI) {
        window.App.updateUI();
    }
    
    // Закрыть модалку с задержкой
    await sleep(1200);
    closeModal(modal);
    
    // Сбросить форму
    const form = modal.querySelector('form');
    if (form) {
        form.reset();
        clearFormErrors(form);
    }
}

// Обработка ошибки сохранения
function handleOfferSaveError(modal, error) {
    // Показать ошибку
    setModalError(modal, true);
    
    // Показать уведомление
    if (window.App && window.App.showNotification) {
        window.App.showNotification(
            error.message || MODAL_CONFIG.messages.error,
            'error'
        );
    }
    
    // Сбросить ошибку через время
    setTimeout(() => {
        setModalError(modal, false);
    }, 3000);
}

// ===== ОБРАБОТКА ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ =====

// Показать модалку подтверждения удаления
function showDeleteConfirmation(offerId, offerName) {
    const modal = ModalState.modals.confirm;
    
    if (!modal || !modal.element) {
        console.error('❌ Модальное окно подтверждения не найдено');
        return false;
    }
    
    // Обновление сообщения
    const messageElement = modal.element.querySelector('.confirm-message');
    if (messageElement) {
        messageElement.textContent = `Вы уверены, что хотите удалить оффер "${offerName}"? Это действие необратимо.`;
    }
    
    // Установка обработчика подтверждения
    ModalState.pendingAction = () => handleOfferDelete(offerId, offerName);
    
    // Открытие модалки
    return openModal('confirm');
}

// Обработка подтверждения удаления
async function handleConfirmDelete() {
    if (!ModalState.pendingAction) {
        console.error('❌ Нет действия для подтверждения');
        return;
    }
    
    try {
        // Выполнение действия
        await ModalState.pendingAction();
        
        // Закрытие модалки
        const modal = ModalState.modals.confirm.element;
        closeModal(modal);
        
    } catch (error) {
        console.error('❌ Ошибка при выполнении действия:', error);
        
        // Показать ошибку
        if (window.App && window.App.showNotification) {
            window.App.showNotification('Ошибка при удалении', 'error');
        }
    }
}

// Обработка отмены подтверждения
function onConfirmModalCancel() {
    ModalState.pendingAction = null;
}

// Удаление оффера
async function handleOfferDelete(offerId, offerName) {
    try {
        if (!window.App || !window.App.state) {
            throw new Error('Приложение не инициализировано');
        }
        
        // Удаление из состояния
        const initialLength = window.App.state.offers.length;
        window.App.state.offers = window.App.state.offers.filter(o => o.id !== offerId);
        
        if (window.App.state.offers.length === initialLength) {
            throw new Error('Оффер для удаления не найден');
        }
        
        // Сохранение
        await window.App.save();
        
        // Уведомление
        if (window.App.showNotification) {
            window.App.showNotification(
                `Оффер "${offerName}" успешно удален`,
                'success'
            );
        }
        
        // Обновление UI
        if (window.App.updateUI) {
            window.App.updateUI();
        }
        
    } catch (error) {
        console.error('❌ Ошибка удаления оффера:', error);
        throw error;
    }
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ МОДАЛОК =====

// При открытии модалки оффера
function onOfferModalOpen(options = {}) {
    const modal = ModalState.currentModal.element;
    
    if (!modal) return;
    
    // Обновление заголовка
    const title = modal.querySelector('.modal-title span');
    if (title) {
        title.textContent = options.isEdit ? 'Редактировать оффер' : 'Добавить новый оффер';
    }
    
    // Заполнение формы если редактирование
    if (options.isEdit && options.offer) {
        fillOfferForm(modal, options.offer);
    } else {
        // Сброс формы
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
            clearFormErrors(form);
        }
    }
}

// При закрытии модалки оффера
function onOfferModalClose() {
    // Очистка временных данных
    const modal = ModalState.currentModal.element;
    if (modal) {
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
            clearFormErrors(form);
        }
    }
}

// Заполнение формы оффера
function fillOfferForm(modal, offer) {
    const form = modal.querySelector('form');
    if (!form) return;
    
    // Заполнение полей
    const nameInput = form.querySelector('#offer-name');
    const descInput = form.querySelector('#description');
    const idInput = form.querySelector('#offer-id');
    
    if (nameInput) nameInput.value = offer.name || '';
    if (descInput) descInput.value = offer.description || '';
    if (idInput) idInput.value = offer.id || '';
}

// ===== УТИЛИТЫ ДЛЯ РАБОТЫ С ФОРМАМИ =====

// Создание элемента ошибки
function createErrorElement(form) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error';
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'polite');
    form.appendChild(errorDiv);
    return errorDiv;
}

// Показать ошибку в поле
function showFormError(inputElement, message) {
    if (!inputElement) return;
    
    // Создаем или находим элемент ошибки
    let errorElement = inputElement.parentNode.querySelector('.form-error');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'form-error';
        errorElement.setAttribute('role', 'alert');
        inputElement.parentNode.appendChild(errorElement);
    }
    
    // Устанавливаем сообщение
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Добавляем класс ошибки к полю
    inputElement.classList.add('is-invalid');
    
    // Фокус на поле с ошибкой
    inputElement.focus();
}

// Очистка ошибок формы
function clearFormErrors(form) {
    const errors = form.querySelectorAll('.form-error');
    errors.forEach(error => {
        error.textContent = '';
        error.style.display = 'none';
    });
    
    const invalidInputs = form.querySelectorAll('.is-invalid');
    invalidInputs.forEach(input => {
        input.classList.remove('is-invalid');
    });
}

// ===== УТИЛИТЫ ДЛЯ МОДАЛОК =====

// Установка данных в модалку
function setModalData(modal, data) {
    // Реализация в зависимости от типа модалки
}

// Обновление заголовка модалки
function updateModalTitle(modal, title) {
    const titleElement = modal.querySelector('.modal-title span');
    if (titleElement) {
        titleElement.textContent = title;
    }
}

// Установка состояния загрузки
function setModalLoading(modal, isLoading) {
    if (isLoading) {
        modal.classList.add(MODAL_CONFIG.classes.loading);
        
        // Блокировка кнопок
        const buttons = modal.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.disabled = true;
        });
    } else {
        modal.classList.remove(MODAL_CONFIG.classes.loading);
        
        // Разблокировка кнопок
        const buttons = modal.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.disabled = false;
        });
    }
}

// Установка состояния успеха
function setModalSuccess(modal, isSuccess) {
    if (isSuccess) {
        modal.classList.add(MODAL_CONFIG.classes.success);
    } else {
        modal.classList.remove(MODAL_CONFIG.classes.success);
    }
}

// Установка состояния ошибки
function setModalError(modal, isError) {
    if (isError) {
        modal.classList.add(MODAL_CONFIG.classes.error);
    } else {
        modal.classList.remove(MODAL_CONFIG.classes.error);
    }
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

// Задержка
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== API МОДУЛЯ =====

// Экспорт функций API
function exportModalAPI() {
    window.Modal = {
        // Управление модалками
        open: openModal,
        close: closeModal,
        
        // Офферы
        openOfferModal: (options = {}) => openModal('offer', options),
        showDeleteConfirmation,
        
        // Утилиты
        showLoading: (modal, isLoading) => setModalLoading(modal, isLoading),
        showSuccess: (modal, isSuccess) => setModalSuccess(modal, isSuccess),
        showError: (modal, isError) => setModalError(modal, isError),
        
        // Состояние
        getState: () => ({ ...ModalState }),
        isOpen: (modalId) => {
            const modal = ModalState.modals[modalId];
            return modal && modal.element.classList.contains(MODAL_CONFIG.classes.active);
        }
    };
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

// Автоматическая инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initModalSystem, 100);
    });
} else {
    setTimeout(initModalSystem, 100);
}

console.log('🪟 Модуль модальных окон загружен');
