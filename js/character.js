// Вариант «с характером»: огромные слова по ширине, живые схемы, сквозной импульс.
(function () {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 2. Огромное слово подгоняется ровно под ширину блока */
  const words = [...document.querySelectorAll(".mega__word")];
  function fitWords() {
    words.forEach((w) => {
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
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-live"); io.unobserve(e.target); } });
  }, { threshold: 0.35 });
  document.querySelectorAll(".cell").forEach((c) => io.observe(c));

  /* 3. Сквозной импульс (вертикальная линия слева) убран целиком по просьбе заказчицы 04.11 */
  fitWords();
  addEventListener("resize", fitWords);
  addEventListener("load", fitWords);
  if (document.fonts) document.fonts.ready.then(fitWords);
})();
