// Логика модального окна оффера
function initModalHandlers() {
    // Закрытие модального окна
    const closeBtn = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const modal = document.getElementById('offer-modal');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }
    
    // Закрытие по клику вне окна
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
    
    // Обработка формы
    const form = document.getElementById('offer-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Форма отправлена! В реальном приложении здесь будет сохранение оффера.');
            modal.classList.remove('active');
        });
    }
    
    console.log('Modal handlers initialized');
}
