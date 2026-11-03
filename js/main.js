// Форма: свой выпадающий список + проверка заполнения.
// Отправка не подключена — адреса обработчика в материалах нет.
const form = document.querySelector('.terminal');

/* ---------- Выпадающий список в стиле сайта ----------
   Настоящий <select> остаётся в форме (скрыт): из него берётся значение
   при отправке. Видимая часть строится из его пунктов. */
function buildDropdown(select) {
  const dd = document.createElement('div');
  dd.className = 'dd';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'dd__btn';
  btn.setAttribute('aria-haspopup', 'listbox');
  btn.setAttribute('aria-expanded', 'false');
  const placeholder = select.options[0] ? select.options[0].text : '';
  btn.textContent = placeholder;

  const list = document.createElement('ul');
  list.className = 'dd__list';
  list.setAttribute('role', 'listbox');
  list.id = `dd-${select.name}`;
  list.hidden = true;
  btn.setAttribute('aria-controls', list.id);

  // «Название: цена» → две колонки, как в реестре
  const makeOption = (opt, isSub) => {
    const li = document.createElement('li');
    li.className = 'dd__opt' + (isSub ? ' dd__opt--sub' : '');
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
    li.dataset.value = opt.value || opt.text;
    const text = opt.text;
    const cut = text.lastIndexOf(': ');
    const label = document.createElement('span');
    label.className = 'dd__label';
    const labelText = cut > -1 ? text.slice(0, cut) : text;
    const pipe = labelText.indexOf(' | ');
    if (pipe > -1) {
      // «КОД | Название» — код жирным, как в реестре
      const code = document.createElement('b');
      code.className = 'dd__code';
      code.textContent = labelText.slice(0, pipe);
      label.append(code, ` | ${labelText.slice(pipe + 3)}`);
    } else {
      label.textContent = labelText;
    }
    li.append(label);
    if (cut > -1) {
      const price = document.createElement('span');
      price.className = 'dd__price';
      price.textContent = text.slice(cut + 2);
      li.append(price);
    }
    return li;
  };

  [...select.children].forEach((node) => {
    if (node.tagName === 'OPTGROUP') {
      const group = document.createElement('li');
      group.className = 'dd__group';
      group.setAttribute('role', 'presentation');
      group.textContent = node.label;
      list.append(group);
      [...node.children].forEach((opt) => list.append(makeOption(opt, true)));
    } else if (!node.disabled) {
      list.append(makeOption(node, false));
    }
  });

  dd.append(btn, list);
  // кнопка должна стоять раньше select: тогда клик по подписи поля открывает список
  select.before(dd);
  select.classList.add('dd__native');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');

  const options = [...list.querySelectorAll('.dd__opt')];
  options.forEach((o, i) => { o.id = `${list.id}-${i}`; });
  let active = -1;

  const setActive = (i) => {
    options.forEach((o) => o.classList.remove('is-active'));
    active = Math.max(0, Math.min(options.length - 1, i));
    options[active].classList.add('is-active');
    options[active].scrollIntoView({ block: 'nearest' });
    list.setAttribute('aria-activedescendant', options[active].id);
  };

  const open = () => {
    list.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    dd.classList.add('is-open');
    const sel = options.findIndex((o) => o.getAttribute('aria-selected') === 'true');
    setActive(sel > -1 ? sel : 0);
    list.tabIndex = -1;
    list.focus();
  };

  const close = (focusBtn = true) => {
    list.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    dd.classList.remove('is-open');
    if (focusBtn) btn.focus();
  };

  const choose = (i) => {
    const li = options[i];
    options.forEach((o) => o.setAttribute('aria-selected', 'false'));
    li.setAttribute('aria-selected', 'true');
    select.value = li.dataset.value;
    btn.textContent = [...li.children].map((c) => c.textContent).join(': ');
    dd.classList.add('has-value');
    select.dispatchEvent(new Event('input', { bubbles: true }));
    close();
  };

  btn.addEventListener('click', () => (list.hidden ? open() : close()));
  btn.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); open(); }
  });

  list.addEventListener('click', (e) => {
    // список лежит внутри <label>: без этого клик по пункту снова «нажимает» кнопку
    e.preventDefault();
    const li = e.target.closest('.dd__opt');
    if (li) choose(options.indexOf(li));
  });
  list.addEventListener('mousemove', (e) => {
    const li = e.target.closest('.dd__opt');
    if (li && options.indexOf(li) !== active) setActive(options.indexOf(li));
  });
  list.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setActive(active + 1); break;
      case 'ArrowUp': e.preventDefault(); setActive(active - 1); break;
      case 'Home': e.preventDefault(); setActive(0); break;
      case 'End': e.preventDefault(); setActive(options.length - 1); break;
      case 'Enter':
      case ' ': e.preventDefault(); choose(active); break;
      case 'Escape': e.preventDefault(); close(); break;
      case 'Tab': close(false); break;
      default:
    }
  });

  document.addEventListener('click', (e) => {
    if (!dd.contains(e.target) && !list.hidden) close(false);
  });

  return btn;
}

const proxies = new Map();
form.querySelectorAll('select').forEach((s) => proxies.set(s, buildDropdown(s)));

/* ---------- Проверка заполнения ---------- */
form.addEventListener('submit', (event) => {
  event.preventDefault();
  let firstInvalid = null;

  form.querySelectorAll('.field').forEach((field) => {
    const control = field.querySelector('input, textarea, select');
    const ok = control.value.trim() !== '';
    field.classList.toggle('is-invalid', !ok);
    if (!ok && !firstInvalid) firstInvalid = proxies.get(control) || control;
  });

  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  // TODO: подключить обработчик (Telegram-бот) после ответа заказчика
  console.info('Форма заполнена, отправка не настроена:', Object.fromEntries(new FormData(form)));
});

form.addEventListener('input', (event) => {
  const field = event.target.closest('.field');
  if (field && event.target.value.trim() !== '') field.classList.remove('is-invalid');
});
