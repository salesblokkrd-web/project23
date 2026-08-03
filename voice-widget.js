/* Голосовой помощник сайта ПРОЕКТ 23 (прототип, как у STRON из референса 5401).
   Микрофон браузера → расшифровка → мозги (DeepSeek через наш прокси на Beget)
   → голосовой ответ + действия на странице (скролл к секции). */
(function () {
  const API = "https://law.radarstats.ru/p23voice/chat";
  const API_TTS = "https://law.radarstats.ru/p23voice/tts";
  const SECTIONS = {
    "#who": "для кого мы работаем", "#how": "как мы работаем (3 шага)",
    "#works": "живые работы: Новокран, РБУ, метрики", "#bulat": "БУЛАТ — ИИ-помощник руководителя",
    "#agents": "ИИ-агенты под каждый отдел", "#price": "цены", "#contact": "контакты",
  };
  const SYSTEM = `Ты — голосовой помощник сайта веб-студии «ПРОЕКТ 23» (Краснодар, project23.ru).
Твоя база знаний (говори ТОЛЬКО это, ничего не выдумывай):
• Кто мы: веб-студия для промышленных компаний Юга России — техника и аренда, стройматериалы,
услуги и монтаж, инжиниринг. Знаем производство изнутри: у основателя собственный
производственный бизнес, все решения обкатаны на нём.
• Сайт под ключ — 25 000 рублей: дизайн под нишу клиента, перенос всего контента (товары,
цены, объекты), домен, хостинг, аналитика, кнопки мессенджеров, мобильная версия.
Срок 2-3 дня. Оплата половина вперёд, половина после сдачи. Сначала бесплатный разбор
текущего сайта и прототип — даже если клиент не будет работать с нами.
• Дополнительно ИИ-агент в Telegram и MAX — 25 000 рублей: сам отвечает клиентам
круглосуточно, задаёт вопросы, считает и передаёт заявки менеджеру.
• БУЛАТ — ИИ-помощник руководителя по подписке: живёт в Telegram и MAX, помнит дела
и договорённости, понимает голосовые, ведёт задачи и напоминания, готовит отчёты.
Уже работает у реальных клиентов. Цену НЕ называй — скажи, что подберём под задачи.
• ИИ-агенты под отделы (всё уже работает у нас или клиентов): механик автопарка
(история машин, ТО, износ резины, ГЛОНАСС и контроль топлива), документы и письма,
отдел продаж, метрики и отчёты каждое утро, контент и соцсети, финансы и учёт.
• Живые работы: НОВОКРАН (аренда башенных кранов), РБУ БетонСервис (бетонный завод),
метрики блогера с живым демо-дашбордом — всё можно открыть в разделе работ.
• Наведение порядка в CRM (Битрикс24, amoCRM и другие): чистим дубли и зависшие
сделки, перестраиваем воронки, настраиваем автоматизацию и связываем CRM с сайтом
и мессенджерами. Цену НЕ называй — скажи, что посчитаем под конкретную CRM.
ПРАВИЛА ИНТЕРВЬЮ: отвечай коротко и живо, 1-3 устных предложения, как приветливый
менеджер. Если ответа НЕТ в базе знаний — честно скажи «это лучше обсудить с основателем
напрямую» и направь в контакты (action scroll:#contact). Цифры кроме двух цен не называй.
ЗАПРЕЩЕНО выдумывать контакты: никаких адресов почты, телефонов и юзернеймов —
для связи всегда направляй в раздел контактов сайта (там кнопки MAX и Telegram).
ФОРМАТ ОТВЕТА — СТРОГО JSON без пояснений: {"say":"ответ","action":"scroll:#секция или null"}
Секции: ${Object.entries(SECTIONS).map(([k, v]) => k + " (" + v + ")").join(", ")}.
Про цену/работы/контакты — говори ответ И ставь action на секцию.`;

  const css = document.createElement("style");
  css.textContent = `
  .vw-btn{position:fixed;right:22px;bottom:22px;z-index:99;display:flex;align-items:center;gap:10px;
    padding:14px 20px;border:none;border-radius:40px;cursor:pointer;font:700 15px 'Onest',sans-serif;
    color:#06231f;background:#2DD4BF;box-shadow:0 10px 30px rgba(45,212,191,.45);transition:.2s}
  .vw-btn:hover{filter:brightness(1.08);transform:translateY(-2px)}
  .vw-btn.rec{background:#ff7a6b;color:#2b0a06;animation:vwpulse 1.2s infinite}
  @keyframes vwpulse{50%{box-shadow:0 0 0 14px rgba(255,122,107,.15)}}
  .vw-panel{position:fixed;right:22px;bottom:86px;z-index:99;width:min(340px,calc(100vw - 44px));
    background:rgba(9,17,27,.94);border:1px solid rgba(45,212,191,.35);border-radius:16px;
    backdrop-filter:blur(14px);padding:16px;display:none;color:#F0F5F9;font:400 14px 'Onest',sans-serif}
  .vw-panel.on{display:block}
  .vw-status{font:700 11px 'JBMono',monospace;letter-spacing:.14em;text-transform:uppercase;color:#2DD4BF;margin-bottom:10px}
  .vw-log{max-height:180px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;margin-bottom:12px}
  .vw-m{padding:8px 12px;border-radius:10px;font-size:13px;line-height:1.45}
  .vw-m.u{background:rgba(45,212,191,.14);align-self:flex-end}
  .vw-m.a{background:rgba(255,255,255,.07);align-self:flex-start}
  .vw-row{display:flex;gap:8px}
  .vw-in{flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16);border-radius:9px;
    color:#F0F5F9;padding:9px 12px;font:400 13px 'Onest',sans-serif;outline:none}
  .vw-send{border:none;border-radius:9px;background:#2DD4BF;color:#06231f;font-weight:800;padding:0 14px;cursor:pointer}
  .vw-hl{outline:3px solid rgba(45,212,191,.75);outline-offset:6px;border-radius:8px;transition:outline .3s}`;
  document.head.appendChild(css);

  const btn = document.createElement("button");
  btn.className = "vw-btn";
  btn.innerHTML = "🎙 Поговорить с сайтом";
  const panel = document.createElement("div");
  panel.className = "vw-panel";
  panel.innerHTML = `<div class="vw-status" id="vwst">Готов слушать</div>
    <div class="vw-log" id="vwlog"></div>
    <div class="vw-row"><input class="vw-in" id="vwin" placeholder="Или напишите текстом…">
    <button class="vw-send" id="vwsend">→</button></div>`;
  document.body.append(panel, btn);
  const st = panel.querySelector("#vwst"), log = panel.querySelector("#vwlog"),
        inp = panel.querySelector("#vwin"), send = panel.querySelector("#vwsend");
  const hist = [{ role: "system", content: SYSTEM }];

  function add(cls, text) {
    const d = document.createElement("div");
    d.className = "vw-m " + cls;
    d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }
  let player = null;
  async function speak(text) {
    // студийный голос через наш TTS; браузерная озвучка — только аварийный запасной
    try {
      if (player) { player.pause(); player = null; }
      st.textContent = "Озвучиваю…";
      const r = await fetch(API_TTS, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 400) }),
      });
      const ct = r.headers.get("Content-Type") || "";
      let src;
      if (ct.startsWith("audio/")) {
        src = URL.createObjectURL(await r.blob());   // локальный Silero — сразу звук
      } else {
        const d = await r.json();
        if (!d.url) throw new Error("no url");
        src = d.url;                                  // фоллбек MiniMax
      }
      player = new Audio(src);
      player.onended = () => { st.textContent = "Готов слушать"; };
      await player.play();
    } catch (e) {
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "ru-RU";
        u.rate = 1.05;
        speechSynthesis.speak(u);
      } catch (e2) {}
      st.textContent = "Готов слушать";
    }
  }
  // гарантированная навигация по ключевым словам (даже если мозги забыли action)
  function localNav(text) {
    const t = text.toLowerCase();
    const MAP = [
      [/цен|стоим|сколько|прайс|тариф/, "#price"],
      [/работ[ыу]|пример|портфол|кейс|новокран|бетон/, "#works"],
      [/булат/, "#bulat"],
      [/агент|автоматиз|механик|рутин/, "#agents"],
      [/контакт|связ|написать|позвонить|телефон/, "#contact"],
      [/как.*(работ|дела)|процесс|этап|срок/, "#how"],
      [/для кого|ниш|отрасл/, "#who"],
    ];
    for (const [re, sel] of MAP) if (re.test(t)) return "scroll:" + sel;
    return null;
  }
  function act(action) {
    if (!action || typeof action !== "string") return;
    const m = action.match(/scroll:(#[\w-]+)/);
    if (!m) return;
    const el = document.querySelector(m[1]);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("vw-hl");
    setTimeout(() => el.classList.remove("vw-hl"), 2600);
  }
  async function ask(text) {
    add("u", text);
    hist.push({ role: "user", content: text });
    st.textContent = "Думаю…";
    try {
      const r = await fetch(API, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: hist.slice(0, 1).concat(hist.slice(-9)) }),
      });
      const d = await r.json();
      let say = d.text || "Не расслышал, повторите, пожалуйста.";
      let action = null;
      try {
        const j = JSON.parse((say.match(/\{[\s\S]*\}/) || [say])[0]);
        if (j.say) { say = j.say; action = j.action; }
      } catch (e) {}
      hist.push({ role: "assistant", content: say });
      add("a", say);
      speak(say);
      act(action || localNav(text));
    } catch (e) {
      st.textContent = "Ошибка сети";
      add("a", "Связь прервалась, попробуйте ещё раз.");
    }
  }

  // распознавание речи (Chrome/Safari); нет — остаётся текстовый ввод
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, recOn = false;
  if (SR) {
    rec = new SR();
    rec.lang = "ru-RU";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = e => { const t = e.results[0][0].transcript; if (t) ask(t); };
    rec.onend = () => { recOn = false; btn.classList.remove("rec"); btn.innerHTML = "🎙 Поговорить с сайтом"; };
    rec.onerror = () => { st.textContent = "Микрофон недоступен — пишите текстом"; };
  }
  btn.onclick = () => {
    panel.classList.add("on");
    if (!rec) { st.textContent = "Голос не поддерживается — пишите текстом"; inp.focus(); return; }
    if (recOn) { rec.stop(); return; }
    speechSynthesis.cancel();
    recOn = true;
    btn.classList.add("rec");
    btn.innerHTML = "⏺ Говорите…";
    st.textContent = "Слушаю…";
    try { rec.start(); } catch (e) {}
  };
  send.onclick = () => { if (inp.value.trim()) { ask(inp.value.trim()); inp.value = ""; } };
  inp.addEventListener("keydown", e => { if (e.key === "Enter") send.onclick(); });
})();
