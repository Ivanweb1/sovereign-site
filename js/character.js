// Вариант «с характером»: огромные слова по ширине, живые схемы, сквозной импульс.
(function () {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 2. Огромное слово подгоняется ровно под ширину блока */
  const words = [...document.querySelectorAll(".mega__word")];
  function fitWords() {
    words.forEach((w) => {
      if (!w.parentElement.clientWidth) return;   // вкладка ещё не разложена — не сжимать слово в 0
      w.style.fontSize = "100px";
      const k = w.parentElement.clientWidth / w.scrollWidth;
      w.style.fontSize = Math.floor(100 * k * 0.995) + "px";
    });
  }

  /* 4. Живые схемы: параметры полёта для каждой частицы */
  document.querySelectorAll(".cell--dissipation .spray line").forEach((l) => {
    const x1 = +l.getAttribute("x1"), y1 = +l.getAttribute("y1");
    const x2 = +l.getAttribute("x2"), y2 = +l.getAttribute("y2");
    const cx = (x1 + x2) / 2 - 40, cy = (y1 + y2) / 2 - 60;   // от начала распада луча
    const len = Math.hypot(cx, cy) || 1;
    const dur = 3.2 + Math.random() * 2.2;
    l.style.setProperty("--dx", (cx / len) * 16 + "px");
    l.style.setProperty("--dy", (cy / len) * 16 + "px");
    l.style.setProperty("--op", l.getAttribute("opacity") || 1);
    l.style.setProperty("--dur", dur.toFixed(2) + "s");
    l.style.setProperty("--delay", (-Math.random() * dur).toFixed(2) + "s");
  });
  /* «Импульс в вектор» (правки 06.11): волна без вектора бежит постоянно.
     Из документа (x=36) выходит небольшой, а примерно через сантиметр уже крупная и перехлёстывает
     границы системы (стенки y=14 и y=106) — пока калибровка не пройдена, поток не успокаивается */
  const wave = document.querySelector(".cell--impulse .wave");
  if (wave) {
    const X0 = 36, X1 = 234, RAMP = 28, AMP = 60, LEN = 72, SPEED = 0.75;   // SPEED — длин волн в секунду
    const shape = (t) => {
      const breath = 1 + 0.08 * Math.sin(t * 1.3);                  // волна «дышит», не застывает
      let d = "";
      for (let x = X0; x <= X1; x += 1.5) {
        const u = Math.min((x - X0) / RAMP, 1);
        const a = AMP * breath * u * u * (3 - 2 * u);                 // плавный выход из документа
        const y = 60 + a * Math.sin(((x - X0) / LEN - t * SPEED) * Math.PI * 2);
        d += (d ? " L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
      }
      wave.setAttribute("d", d);
    };
    if (reduced) shape(0.15);
    else {
      let visible = true;
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(wave.closest(".cell"));
      const tick = (now) => { if (visible) shape(now / 1000); requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-live"); io.unobserve(e.target); } });
  }, { threshold: 0.35 });
  document.querySelectorAll(".cell").forEach((c) => io.observe(c));

  /* 3. Сквозной импульс: линия растёт вниз вместе со скроллом.
     Физика — рассыпается, реестр — сжимается, фильтр — чистая, портал — сигнал и стрела в кнопку */
  const cv = document.querySelector(".thread");
  const ctx = cv.getContext("2d");
  const btn = document.querySelector(".terminal .btn");
  const zoneIds = ["physics", "registry", "filter", "portal"];
  // Линия целиком — приглушённым цветом основного текста (#8C97B3): «незаметная, но она есть» (заказчица 04.11)
  const MUTED = "140,151,179";
  let W = 0, H = 0, dpr = 1, zones = [], startDoc = 0, endDoc = 0, X = 0, btnDocY = 0, btnLeft = 0;

  function docTop(el) { return el.getBoundingClientRect().top + scrollY; }

  function measure() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    zones = zoneIds.map((id) => {
      const el = document.getElementById(id);
      return { id, top: docTop(el), bottom: docTop(el) + el.offsetHeight };
    });
    const frame = document.querySelector(".frame").getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(document.getElementById("physics")).paddingLeft) || 16;
    X = Math.max(6, frame.left + pad * 0.45);
    startDoc = zones[0].top;
    const b = btn.getBoundingClientRect();
    btnDocY = b.top + scrollY + b.height / 2;
    btnLeft = b.left;
    endDoc = btnDocY;
    fitWords();
  }

  function zoneAt(y) {
    for (const z of zones) if (y >= z.top && y < z.bottom) return z.id;
    return y < startDoc ? null : "portal";
  }

  function seg(y1, y2, style) {
    if (y2 <= y1) return;
    const a = y1 - scrollY, b = y2 - scrollY;
    if (b < 0 || a > H) return;
    ctx.save();
    if (style === "physics") {
      // рваный, затухающий контур
      ctx.strokeStyle = `rgba(${MUTED},0.75)`; ctx.lineWidth = 1;
      ctx.setLineDash([9, 7]); ctx.lineDashOffset = -y1;
    } else if (style === "registry") {
      ctx.strokeStyle = `rgba(${MUTED},0.85)`; ctx.lineWidth = 1;
    } else if (style === "filter") {
      ctx.strokeStyle = `rgba(${MUTED},0.9)`; ctx.lineWidth = 1;
    } else {
      ctx.strokeStyle = `rgba(${MUTED},0.95)`; ctx.lineWidth = 1;
    }
    ctx.beginPath(); ctx.moveTo(X, Math.max(a, -2)); ctx.lineTo(X, Math.min(b, H + 2)); ctx.stroke();
    ctx.restore();
    if (style === "registry") {
      // зажимы: регламенты сдавливают канал
      ctx.save(); ctx.strokeStyle = `rgba(${MUTED},0.85)`; ctx.lineWidth = 1;
      const step = 34, first = Math.ceil(y1 / step) * step;
      ctx.beginPath();
      for (let y = first; y < y2; y += step) {
        const sy = y - scrollY; if (sy < -10 || sy > H + 10) continue;
        ctx.moveTo(X - 7, sy - 6); ctx.lineTo(X - 2, sy);
        ctx.moveTo(X + 7, sy - 6); ctx.lineTo(X + 2, sy);
      }
      ctx.stroke(); ctx.restore();
    }
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    // на последнем полуэкране голова опускается к низу окна, чтобы дойти до кнопки
    const maxScroll = document.documentElement.scrollHeight - H;
    const tail = Math.min(Math.max((scrollY - (maxScroll - H * 0.5)) / (H * 0.5), 0), 1);
    const head = Math.min(Math.max(scrollY + H * (0.62 + 0.34 * tail), startDoc), endDoc);
    if (head > startDoc) {
      for (const z of zones) seg(Math.max(z.top, startDoc), Math.min(z.bottom, head), z.id);
    }
    const zone = zoneAt(head);
    const hy = head - scrollY;

    // искры («бенгальский огонь») у головы убраны по просьбе заказчицы 04.11 — в физике остаётся только пунктир
    if (head > startDoc) {
      // голова импульса
      const jitter = zone === "registry" && !reduced ? (Math.random() - 0.5) * 1.6 : 0;
      ctx.save();
      ctx.fillStyle = `rgb(${MUTED})`;
      ctx.shadowColor = `rgba(${MUTED},0.6)`; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(X + jitter, hy, zone === "registry" ? 2 : 3, 0, Math.PI * 2); ctx.fill();
      if (zone === "registry") {
        // канал сжат у самой головы
        ctx.shadowBlur = 0; ctx.strokeStyle = `rgba(${MUTED},0.95)`; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(X - 12, hy - 18); ctx.lineTo(X - 3, hy); ctx.lineTo(X - 12, hy + 18);
        ctx.moveTo(X + 12, hy - 18); ctx.lineTo(X + 3, hy); ctx.lineTo(X + 12, hy + 18);
        ctx.stroke();
      }
      ctx.restore();
    }

    // финал: импульс собирается в стрелу и входит в кнопку
    const arrived = head >= endDoc - 1;
    btn.classList.toggle("is-target", arrived);
    if (arrived) {
      const by = btnDocY - scrollY, tip = Math.max(btnLeft - 4, X + 14);
      ctx.save();
      ctx.strokeStyle = `rgb(${MUTED})`; ctx.fillStyle = `rgb(${MUTED})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(X, by); ctx.lineTo(tip - 6, by); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tip, by); ctx.lineTo(tip - 9, by - 5); ctx.lineTo(tip - 9, by + 5); ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    if (!reduced) requestAnimationFrame(frame);
  }

  measure();
  addEventListener("resize", measure);
  addEventListener("load", measure);
  if (document.fonts) document.fonts.ready.then(measure);
  // высота страницы меняется при открытии выпадающего списка формы
  new ResizeObserver(measure).observe(document.querySelector(".frame"));
  if (reduced) { addEventListener("scroll", () => requestAnimationFrame(frame), { passive: true }); }
  requestAnimationFrame(frame);
})();
