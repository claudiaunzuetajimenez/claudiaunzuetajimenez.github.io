/* =========================================================
   Invitación · Claudia 45 años
   CONFIGURACIÓN: pega aquí la URL del receptor de Google Sheets
   (ver CONFIGURAR-GOOGLE-SHEETS.md). Mientras esté vacía,
   el formulario funciona en "modo prueba" y no guarda nada.
   ========================================================= */
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzu6POC1umdGJ4yyuJw4tjcTfOmrUztpRpaOAfNBEIg4FlhRQAcyyiBT1cM-cnv3JPP/exec';
const FECHA_EVENTO = new Date('2026-11-29T15:00:00-06:00'); // 3:00 p. m., hora del centro de México

(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sobre + música ---------- */
  const sobre = $('#sobre'), carta = $('#carta'), audio = $('#audio'), btnMusica = $('#musica');
  audio.volume = 0.75;

  function ponerEstadoMusica(sonando) {
    btnMusica.setAttribute('aria-pressed', String(sonando));
    btnMusica.setAttribute('aria-label', sonando ? 'Pausar música' : 'Reproducir música');
  }
  function abrir() {
    if (carta.classList.contains('abierta')) return;
    carta.classList.add('abierta');
    audio.play().then(() => ponerEstadoMusica(true)).catch(() => ponerEstadoMusica(false));
    lluviaPetalos(true);
    setTimeout(() => {
      sobre.classList.add('fuera');
      document.body.classList.remove('bloqueado');
      btnMusica.hidden = false;
      revisarVisibles();
    }, 1100);
    setTimeout(() => sobre.remove(), 2400);
  }
  $('#abrir').addEventListener('click', abrir);
  carta.addEventListener('click', abrir);

  btnMusica.addEventListener('click', () => {
    if (audio.paused) audio.play().then(() => ponerEstadoMusica(true)).catch(() => {});
    else { audio.pause(); ponerEstadoMusica(false); }
  });
  // Pausa si la pestaña se oculta y retoma al volver
  let pausadaPorOcultar = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !audio.paused) { audio.pause(); pausadaPorOcultar = true; }
    else if (!document.hidden && pausadaPorOcultar) { pausadaPorOcultar = false; audio.play().catch(() => {}); }
  });

  /* ---------- Pétalos de rosa ---------- */
  const colores = ['#c2445f', '#e8a3b2', '#b4304f', '#f2c6cf', '#d96a83'];
  function lluviaPetalos(inicial) {
    if (reducido) return;
    const cont = $('#petalos');
    const n = innerWidth < 600 ? 14 : 24;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('div');
      p.className = 'petalo';
      p.style.left = Math.random() * 100 + 'vw';
      p.style.setProperty('--t', (12 + Math.random() * 16) + 'px');
      p.style.setProperty('--c', colores[i % colores.length]);
      p.style.setProperty('--d', (9 + Math.random() * 9) + 's');
      p.style.setProperty('--r', (inicial ? Math.random() * 3 : Math.random() * 12) + 's');
      p.style.setProperty('--x', (Math.random() * 30 - 15) + 'vw');
      p.innerHTML = '<svg viewBox="0 0 40 40"><use href="#petalo"/></svg>';
      cont.appendChild(p);
    }
  }

  /* ---------- Aparecer al hacer scroll ---------- */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { threshold: 0.15 })
    : null;
  function revisarVisibles() {
    document.querySelectorAll('.aparecer:not(.visto)').forEach(el => io ? io.observe(el) : el.classList.add('visto'));
  }
  revisarVisibles();

  /* ---------- Carrusel ---------- */
  const pista = $('#pista'), puntos = $('#puntos');
  let diapos = [], actual = 0, timer = null;

  function armarCarrusel() {
    diapos = [...pista.querySelectorAll('.diapo')];
    puntos.innerHTML = '';
    diapos.forEach((d, i) => {
      d.setAttribute('role', 'group');
      d.setAttribute('aria-label', `Foto ${i + 1} de ${diapos.length}`);
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', `Ver foto ${i + 1}`);
      b.addEventListener('click', () => { ir(i); reiniciar(); });
      puntos.appendChild(b);
    });
    marcar(Math.min(actual, diapos.length - 1));
  }
  // Si alguna foto no existe, se quita del carrusel sin dejar hueco
  pista.querySelectorAll('img').forEach(img => {
    const quitar = () => { if (!img.isConnected) return; img.closest('.diapo').remove(); armarCarrusel(); };
    if (img.hasAttribute('data-opcional')) {
      const prueba = new Image();
      prueba.onerror = quitar;
      prueba.src = img.src;
    } else img.addEventListener('error', quitar, { once: true });
  });

  function marcar(i) {
    actual = i;
    [...puntos.children].forEach((b, j) => b.setAttribute('aria-selected', String(j === i)));
  }
  function ir(i) {
    const n = diapos.length;
    i = (i + n) % n;
    pista.scrollTo({ left: diapos[i].offsetLeft - pista.offsetLeft, behavior: reducido ? 'auto' : 'smooth' });
    marcar(i);
  }
  let espera;
  pista.addEventListener('scroll', () => {
    clearTimeout(espera);
    espera = setTimeout(() => marcar(Math.round(pista.scrollLeft / pista.clientWidth)), 80);
  }, { passive: true });
  $('#ant').addEventListener('click', () => { ir(actual - 1); reiniciar(); });
  $('#sig').addEventListener('click', () => { ir(actual + 1); reiniciar(); });
  ['touchstart', 'pointerdown'].forEach(ev => pista.addEventListener(ev, reiniciar, { passive: true }));

  function reiniciar() {
    clearInterval(timer);
    if (!reducido) timer = setInterval(() => ir(actual + 1), 5500);
  }
  armarCarrusel();
  reiniciar();

  /* ---------- Cuenta regresiva ---------- */
  const reloj = { d: $('#d'), h: $('#h'), m: $('#m'), s: $('#s') };
  function tic() {
    let falta = FECHA_EVENTO - Date.now();
    if (falta <= 0) { $('#reloj').hidden = true; $('#cuenta-fin').hidden = false; return; }
    const d = Math.floor(falta / 864e5); falta -= d * 864e5;
    const h = Math.floor(falta / 36e5); falta -= h * 36e5;
    const m = Math.floor(falta / 6e4); falta -= m * 6e4;
    const s = Math.floor(falta / 1e3);
    reloj.d.textContent = d;
    reloj.h.textContent = String(h).padStart(2, '0');
    reloj.m.textContent = String(m).padStart(2, '0');
    reloj.s.textContent = String(s).padStart(2, '0');
    setTimeout(tic, 1000);
  }
  tic();

  /* ---------- Calendario ---------- */
  const cal = new URL('https://calendar.google.com/calendar/render');
  cal.searchParams.set('action', 'TEMPLATE');
  cal.searchParams.set('text', 'Cumpleaños de Claudia 🌹');
  cal.searchParams.set('dates', '20261129T210000Z/20261130T030000Z');
  cal.searchParams.set('details', 'Comida para celebrar los 45 años de Claudia. Con cariño, Familia Sánchez Unzueta.');
  cal.searchParams.set('location', 'Salón de Eventos Cacali, https://maps.app.goo.gl/XoTdakJqyJoJcSpt9');
  $('#calendario').href = cal.toString();

  /* ---------- Confirmación ---------- */
  const form = $('#form'), personas = $('#f-personas'), error = $('#form-error'), enviar = $('#enviar');
  const gracias = $('#gracias'), campoPersonas = $('#campo-personas');
  const limitar = v => Math.max(1, Math.min(12, parseInt(v, 10) || 1));
  $('#menos').addEventListener('click', () => { personas.value = limitar(+personas.value - 1); });
  $('#mas').addEventListener('click', () => { personas.value = limitar(+personas.value + 1); });
  personas.addEventListener('change', () => { personas.value = limitar(personas.value); });
  form.addEventListener('change', e => {
    if (e.target.name === 'asiste') campoPersonas.hidden = e.target.value === 'no';
  });

  function mostrarGracias(datos) {
    const si = datos.asiste === 'si';
    $('#gracias-titulo').textContent = si ? '¡Gracias por confirmar!' : '¡Gracias por avisarnos!';
    $('#gracias-texto').textContent = si
      ? `${datos.nombre}, tu lugar ya está apartado con cariño (${datos.personas} ${datos.personas == 1 ? 'persona' : 'personas'}). ¡Nos vemos el domingo 29!`
      : `${datos.nombre}, te vamos a extrañar. Le haremos llegar tu cariño a Claudia.`;
    form.hidden = true; gracias.hidden = false; gracias.focus();
  }
  $('#otra').addEventListener('click', () => {
    form.reset(); campoPersonas.hidden = false; gracias.hidden = true; form.hidden = false;
    localStorage.removeItem('rsvp-claudia');
  });
  try {
    const previa = JSON.parse(localStorage.getItem('rsvp-claudia') || 'null');
    if (previa) mostrarGracias(previa);
  } catch (_) {}

  form.addEventListener('submit', async e => {
    e.preventDefault();
    error.hidden = true;
    const f = new FormData(form);
    const datos = {
      nombre: String(f.get('nombre') || '').trim(),
      asiste: f.get('asiste') === 'no' ? 'no' : 'si',
      personas: f.get('asiste') === 'no' ? 0 : limitar(f.get('personas')),
      telefono: String(f.get('telefono') || '').trim(),
      mensaje: String(f.get('mensaje') || '').trim(),
    };
    if (datos.nombre.length < 2) {
      error.textContent = 'Escribe tu nombre para saber quién nos acompaña.';
      error.hidden = false; $('#f-nombre').focus(); return;
    }
    enviar.disabled = true; enviar.textContent = 'Enviando…';
    try {
      if (SHEETS_URL) {
        const r = await fetch(SHEETS_URL, { method: 'POST', body: JSON.stringify(datos) });
        const j = await r.json();
        if (!j.ok) throw new Error(j.error || 'rechazado');
      } else {
        console.info('[Modo prueba] Confirmación no guardada:', datos);
        await new Promise(r => setTimeout(r, 600));
      }
      localStorage.setItem('rsvp-claudia', JSON.stringify(datos));
      mostrarGracias(datos);
    } catch (err) {
      console.error(err);
      error.textContent = 'No pudimos guardar tu confirmación. Revisa tu internet e inténtalo de nuevo; tus datos siguen aquí.';
      error.hidden = false;
    } finally {
      enviar.disabled = false; enviar.textContent = 'Enviar confirmación';
    }
  });
})();
