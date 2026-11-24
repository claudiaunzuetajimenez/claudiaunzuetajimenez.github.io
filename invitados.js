/* Panel privado de invitados · Cumpleaños de Claudia
   La lista solo llega si el receptor de Google acepta la clave. */
const RECEPTOR = 'https://script.google.com/macros/s/AKfycbzu6POC1umdGJ4yyuJw4tjcTfOmrUztpRpaOAfNBEIg4FlhRQAcyyiBT1cM-cnv3JPP/exec';

(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const zona = 'America/Mexico_City';
  let clave = sessionStorage.getItem('panel-clau') || '';
  let filas = [], actualizado = null, filtro = 'todos';

  const fechaCorta = v => {
    const d = new Date(v);
    return isNaN(d) ? '' : new Intl.DateTimeFormat('es-MX', { timeZone: zona, dateStyle: 'medium', timeStyle: 'short' }).format(d);
  };
  const esSi = f => f.asiste === 'Sí';

  async function pedirLista() {
    const r = await fetch(RECEPTOR, { method: 'POST', body: JSON.stringify({ accion: 'lista', clave }) });
    return r.json();
  }

  /* ---------- Acceso ---------- */
  const formClave = $('#form-clave'), inputClave = $('#clave'), errorClave = $('#error-clave'), entrar = $('#entrar');
  $('#ver-clave').addEventListener('click', e => {
    const ver = inputClave.type === 'password';
    inputClave.type = ver ? 'text' : 'password';
    e.currentTarget.setAttribute('aria-pressed', String(ver));
    e.currentTarget.setAttribute('aria-label', ver ? 'Ocultar la clave' : 'Mostrar la clave');
  });
  formClave.addEventListener('submit', async e => {
    e.preventDefault();
    errorClave.hidden = true;
    clave = inputClave.value.trim();
    if (!clave) return;
    entrar.disabled = true; entrar.textContent = 'Revisando…';
    try {
      const j = await pedirLista();
      if (!j.ok) throw new Error(j.error);
      sessionStorage.setItem('panel-clau', clave);
      abrirPanel(j);
    } catch (err) {
      errorClave.textContent = err.message === 'clave' ? 'Esa clave no es correcta. Revísala e inténtalo de nuevo.' : 'No se pudo conectar. Revisa tu internet e inténtalo de nuevo.';
      errorClave.hidden = false;
    } finally {
      entrar.disabled = false; entrar.textContent = 'Entrar';
    }
  });

  function abrirPanel(j) {
    filas = j.filas || []; actualizado = j.actualizado;
    $('#acceso').hidden = true; $('#panel').hidden = false;
    pintar();
  }

  /* ---------- Panel ---------- */
  function visibles() {
    const q = $('#buscar').value.trim().toLowerCase();
    return filas
      .filter(f => filtro === 'todos' || (filtro === 'si' && esSi(f)) || (filtro === 'no' && !esSi(f)) || (filtro === 'mensajes' && f.mensaje))
      .filter(f => !q || f.nombre.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }

  function pintar() {
    const si = filas.filter(esSi);
    $('#t-personas').textContent = si.reduce((s, f) => s + (f.personas || 0), 0);
    $('#t-si').textContent = si.length;
    $('#t-no').textContent = filas.length - si.length;
    $('#t-mensajes').textContent = filas.filter(f => f.mensaje).length;
    $('#estado').textContent = `${filas.length} ${filas.length === 1 ? 'respuesta' : 'respuestas'} · actualizado ${fechaCorta(actualizado)}`;

    const lista = $('#lista');
    lista.replaceChildren();
    const v = visibles();
    if (!v.length) {
      const p = document.createElement('p');
      p.className = 'vacio';
      p.textContent = filas.length ? 'No hay invitados con ese filtro.' : 'Todavía no hay confirmaciones. ¡Ya llegarán!';
      lista.append(p);
      return;
    }
    for (const f of v) {
      const art = document.createElement('article');
      art.className = 'invitado' + (esSi(f) ? '' : ' no');
      const top = document.createElement('div'); top.className = 'inv-top';
      const n = document.createElement('span'); n.className = 'inv-nombre'; n.textContent = f.nombre;
      const et = document.createElement('span'); et.className = 'etiqueta';
      et.textContent = esSi(f) ? `Asistirá · ${f.personas} ${f.personas === 1 ? 'persona' : 'personas'}` : 'No asistirá';
      top.append(n, et);
      const datos = document.createElement('p'); datos.className = 'inv-datos';
      datos.append(fechaCorta(f.fecha));
      const tel = String(f.telefono || '').replace(/\D/g, '');
      if (tel.length >= 10) {
        datos.append(' · ');
        const a = document.createElement('a');
        a.href = 'https://wa.me/' + (tel.length === 10 ? '52' + tel : tel);
        a.target = '_blank'; a.rel = 'noopener';
        a.textContent = 'WhatsApp ' + f.telefono;
        datos.append(a);
      } else if (f.telefono) datos.append(' · ' + f.telefono);
      art.append(top, datos);
      if (f.mensaje) {
        const m = document.createElement('p'); m.className = 'inv-mensaje'; m.textContent = '“' + f.mensaje + '”';
        art.append(m);
      }
      lista.append(art);
    }
  }

  document.querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => {
    filtro = b.dataset.filtro;
    document.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c === b)));
    pintar();
  }));
  $('#buscar').addEventListener('input', pintar);

  $('#actualizar').addEventListener('click', async e => {
    const b = e.currentTarget; b.disabled = true; b.textContent = 'Actualizando…';
    try {
      const j = await pedirLista();
      if (!j.ok) throw new Error(j.error);
      filas = j.filas || []; actualizado = j.actualizado; pintar();
    } catch (err) {
      if (err.message === 'clave') return salir();
      $('#estado').textContent = 'No se pudo actualizar. Revisa tu internet.';
    } finally { b.disabled = false; b.textContent = 'Actualizar'; }
  });

  function salir() {
    sessionStorage.removeItem('panel-clau'); clave = ''; filas = [];
    $('#panel').hidden = true; $('#acceso').hidden = false; inputClave.value = ''; inputClave.focus();
  }
  $('#salir').addEventListener('click', salir);

  /* ---------- PDF ---------- */
  const txt = v => String(v == null ? '' : v).normalize('NFC').replace(/\r\n?/g, '\n').replace(/[^ -ɏ -⁯\n]/gu, '');
  $('#pdf').addEventListener('click', () => {
    const v = visibles();
    if (!v.length) { $('#estado').textContent = 'No hay invitados para el PDF con este filtro.'; return; }
    const { jsPDF } = window.jspdf, fuentes = window.GuestPdfFonts;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    for (const [k, fam, est] of [['sans', 'Sans', 'normal'], ['bold', 'Sans', 'bold'], ['serif', 'Serif', 'normal']]) {
      doc.addFileToVFS(k + '.ttf', fuentes[k]); doc.addFont(k + '.ttf', fam, est);
    }
    const vino = [74, 20, 36], oro = [176, 140, 70];
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 14, C = W / 2;
    const t = (s, x, y, size, fam = 'Sans', est = 'normal', al = 'left', col = vino) => { doc.setFont(fam, est).setFontSize(size).setTextColor(...col); doc.text(txt(s), x, y, { align: al }); };
    t('CUMPLEAÑOS DE CLAUDIA · 29 DE NOVIEMBRE DE 2026', C, 18, 8, 'Sans', 'normal', 'center', oro);
    t('Lista de invitados', C, 30, 26, 'Serif', 'normal', 'center');
    const si = v.filter(esSi);
    const cajas = [['PERSONAS', si.reduce((s, f) => s + f.personas, 0)], ['SÍ ASISTIRÁN', si.length], ['NO ASISTIRÁN', v.length - si.length], ['MENSAJES', v.filter(f => f.mensaje).length]];
    const gap = 4, cw = (W - M * 2 - gap * 3) / 4;
    cajas.forEach(([n, val], i) => {
      const x = M + i * (cw + gap);
      doc.setFillColor(251, 246, 240).setDrawColor(230, 207, 156).setLineWidth(.2).roundedRect(x, 37, cw, 18, 1.5, 1.5, 'FD');
      t(n, x + cw / 2, 43, 7, 'Sans', 'normal', 'center', oro);
      t(String(val), x + cw / 2, 51.5, 16, 'Serif', 'normal', 'center');
    });
    const nombresFiltro = { todos: 'Todas las respuestas', si: 'Solo quienes asistirán', no: 'Solo quienes no asistirán', mensajes: 'Solo con mensaje' };
    t(`${nombresFiltro[filtro]} · Actualizado ${fechaCorta(actualizado)}`, C, 62, 8, 'Sans', 'normal', 'center');
    const conMensajes = $('#pdf-mensajes').checked, body = [];
    v.forEach(f => {
      body.push([txt(f.nombre), esSi(f) ? 'Sí' : 'No', esSi(f) ? String(f.personas) : '-', txt(f.telefono || '-'), fechaCorta(f.fecha)]);
      if (conMensajes && f.mensaje) body.push([{ content: txt('“' + f.mensaje + '”'), colSpan: 5, styles: { font: 'Serif', fontSize: 10.5, fillColor: [251, 246, 240], textColor: [90, 60, 66] } }]);
    });
    doc.autoTable({
      startY: 67, margin: { left: M, right: M, top: 20, bottom: 18 },
      head: [['Invitado / Familia', 'Asiste', 'Personas', 'WhatsApp', 'Confirmó']], body,
      foot: [[{ content: 'TOTAL DE PERSONAS QUE ASISTIRÁN', colSpan: 2 }, String(cajas[0][1]), '', '']],
      showHead: 'everyPage', showFoot: 'lastPage', rowPageBreak: 'avoid', theme: 'plain',
      styles: { font: 'Sans', fontSize: 9, textColor: vino, cellPadding: 2.6, valign: 'middle', lineColor: [240, 223, 226], lineWidth: { bottom: .2 } },
      headStyles: { fillColor: vino, textColor: [255, 245, 240], fontStyle: 'bold' },
      footStyles: { fillColor: [247, 228, 230], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 62 }, 1: { cellWidth: 16, halign: 'center' }, 2: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }, 3: { cellWidth: 34 } },
      didParseCell(d) { if (d.section !== 'body' && [1, 2].includes(d.column.index)) d.cell.styles.halign = 'center'; },
      willDrawPage(d) { if (d.pageNumber > 1) t('Lista de invitados · Claudia', M, 13, 11, 'Serif'); }
    });
    const n = doc.getNumberOfPages();
    for (let p = 1; p <= n; p++) {
      doc.setPage(p).setDrawColor(...oro).setLineWidth(.2).line(M, H - 12, W - M, H - 12);
      t('Familia Sánchez Unzueta · 29.11.2026', M, H - 7, 8);
      t(`Página ${p} de ${n}`, W - M, H - 7, 8, 'Sans', 'normal', 'right');
    }
    const partes = Object.fromEntries(new Intl.DateTimeFormat('es-MX', { timeZone: zona, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(p => [p.type, p.value]));
    const nombre = `Invitados Claudia [${partes.day}-${partes.month}-${partes.year} ${partes.hour}-${partes.minute}].pdf`;
    const url = URL.createObjectURL(doc.output('blob'));
    const a = document.createElement('a'); a.href = url; a.download = nombre; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    $('#estado').textContent = 'PDF descargado: ' + nombre;
  });

  /* ---------- Entrada automática si ya había clave en esta pestaña ---------- */
  if (clave) {
    inputClave.value = clave;
    pedirLista().then(j => j.ok ? abrirPanel(j) : sessionStorage.removeItem('panel-clau')).catch(() => {});
  }
})();
