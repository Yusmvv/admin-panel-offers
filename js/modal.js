// Логика модального окна оффера

// 🔧 ИСПРАВЛЕНИЕ 1: Основная функция инициализации с делегированием событий
function initModalHandlers() {
    // Закрытие по клику на крестик или кнопку "Отмена"
    document.addEventListener('click', function(event) {
        const modal = document.getElementById('offer-modal');
        if (!modal) return;
        
        // Крестик закрытия
        if (event.target.closest('#close-modal')) {
            modal.classList.remove('active');
            return;
        }
        
        // Кнопка "Отмена"
        if (event.target.closest('#cancel-btn')) {
            modal.classList.remove('active');
            return;
        }
        
        // Клик вне модального окна (на заднем фоне)
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // 🔧 ИСПРАВЛЕНИЕ 2: Обработка формы с улучшенной логикой
    const form = document.getElementById('offer-form');
    if (form) {
        form.addEventListener('submit', handleOfferFormSubmit);
    }
    
    console.log('Modal handlers initialized');
}

// 🔧 ИСПРАВЛЕНИЕ 3: Отдельная функция для обработки формы
function handleOfferFormSubmit(event) {
    event.preventDefault();
    
    const modal = document.getElementById('offer-modal');
    const offerName = document.getElementById('offer-name').value.trim();
    const description = document.getElementById('description').value.trim();
    
    if (!offerName) {
        alert('Введите название оффера!');
        return;
    }
    
    // 🔧 Базовая логика создания оффера
    const newOffer = {
        id: Date.now(), // Простой ID на основе времени
        name: offerName,
        description: description || `${offerName} - выгодные условия займа`,
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
        landing2: true
    };
    
    // 🔧 Добавляем оффер в глобальный массив
    if (window.offers) {
        window.offers.push(newOffer);
        window.saveData(); // Сохраняем в localStorage
        
        if (window.showNotification) {
            window.showNotification(`Оффер "${offerName}" успешно создан!`, 'success');
        } else {
            alert(`Оффер "${offerName}" успешно создан!`);
        }
    } else {
        console.error('Глобальный массив offers не найден!');
        alert('Ошибка: данные не загружены');
    }
    
    // Закрываем модальное окно
    modal.classList.remove('active');
    
    // 🔧 ИСПРАВЛЕНИЕ 4: Очищаем форму
    form.reset();
}

// 🔧 ИСПРАВЛЕНИЕ 5: Делаем функцию глобально доступной
window.initModalHandlers = initModalHandlers;

// 🔧 ИСПРАВЛЕНИЕ 6: Автоматически инициализируем при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Небольшая задержка для гарантии загрузки DOM
    setTimeout(initModalHandlers, 50);
});

// 🔧 ИСПРАВЛЕНИЕ 7: Функция для открытия модального окна (если нужна из других скриптов)
function showOfferModal() {
    const modal = document.getElementById('offer-modal');
    const title = document.getElementById('modal-title');
    
    if (!modal || !title) {
        console.error('Элементы модального окна не найдены!');
        return;
    }
    
    // Сбрасываем форму
    const form = document.getElementById('offer-form');
    if (form) form.reset();
    
    // Устанавливаем заголовок
    title.innerHTML = '<i class="fas fa-plus-circle" style="margin-right: 12px;"></i><span>Добавить новый оффер</span>';
    
    // Показываем модальное окно
    modal.classList.add('active');
}

// 🔧 Делаем функцию открытия модалки глобально доступной
window.showOfferModal = showOfferModal;
