// Форма: проверка заполнения. Отправка не подключена — адреса обработчика в материалах нет.
const form = document.querySelector('.terminal');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  let firstInvalid = null;

  form.querySelectorAll('.field').forEach((field) => {
    const control = field.querySelector('input, textarea, select');
    const ok = control.value.trim() !== '';
    field.classList.toggle('is-invalid', !ok);
    if (!ok && !firstInvalid) firstInvalid = control;
  });

  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  // TODO: подключить обработчик (почта / CRM / Telegram) после ответа заказчика
  console.info('Форма заполнена, отправка не настроена:', Object.fromEntries(new FormData(form)));
});

form.addEventListener('input', (event) => {
  const field = event.target.closest('.field');
  if (field && event.target.value.trim() !== '') field.classList.remove('is-invalid');
});
