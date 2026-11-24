/**
 * Receptor de confirmaciones · Cumpleaños de Claudia
 * Proyecto de Apps Script que escribe en la hoja indicada en ID_LIBRO.
 * - Invitados: guarda cada confirmación en la pestaña "Confirmaciones".
 * - Panel (invitados.html): con la clave correcta devuelve la lista.
 * La clave real solo vive en el proyecto de Google, nunca en este repositorio.
 */
const ID_LIBRO = '1feCDSg0dQoKRH4dtYmCxj5dg1N1hAQXrEIS8Y-CQQlc';
const HOJA = 'Confirmaciones';
const CLAVE_PANEL = 'PON_AQUI_LA_CLAVE';
const ENCABEZADOS = ['Fecha', 'Nombre', '¿Asiste?', 'Personas', 'WhatsApp', 'Mensaje para Claudia'];

function doPost(e) {
  let d;
  try { d = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
  catch (x) { return responder({ ok: false, error: 'datos' }); }
  if (d.accion === 'lista') return lista(d);
  const candado = LockService.getScriptLock();
  try {
    candado.waitLock(20000);
    const nombre = limpiar(d.nombre, 80);
    if (nombre.length < 2) return responder({ ok: false, error: 'Falta el nombre' });
    const asiste = d.asiste === 'no' ? 'No' : 'Sí';
    const personas = asiste === 'Sí' ? Math.max(1, Math.min(12, parseInt(d.personas, 10) || 1)) : 0;
    const hoja = obtenerHoja();
    hoja.appendRow([new Date(), nombre, asiste, personas, limpiar(d.telefono, 20), limpiar(d.mensaje, 500)]);
    SpreadsheetApp.flush();
    return responder({ ok: true });
  } catch (err) {
    console.error(err);
    return responder({ ok: false, error: 'No se pudo guardar' });
  } finally {
    try { candado.releaseLock(); } catch (x) {}
  }
}

function lista(d) {
  if (typeof d.clave !== 'string' || d.clave !== CLAVE_PANEL || CLAVE_PANEL === 'PON_AQUI_LA_CLAVE') {
    Utilities.sleep(1500); // frena a quien intente adivinar
    return responder({ ok: false, error: 'clave' });
  }
  const valores = obtenerHoja().getDataRange().getValues().slice(1);
  const filas = valores.filter(r => r[1] !== '').map(r => ({
    fecha: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
    nombre: String(r[1]), asiste: String(r[2]), personas: Number(r[3]) || 0,
    telefono: String(r[4]), mensaje: String(r[5])
  }));
  return responder({ ok: true, filas: filas, actualizado: new Date().toISOString() });
}

function doGet() {
  return responder({ ok: true, servicio: 'Confirmaciones cumpleaños Claudia' });
}

function obtenerHoja() {
  const libro = SpreadsheetApp.openById(ID_LIBRO);
  let hoja = libro.getSheetByName(HOJA);
  if (!hoja) hoja = libro.insertSheet(HOJA);
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(ENCABEZADOS);
    hoja.getRange(1, 1, 1, ENCABEZADOS.length).setFontWeight('bold').setBackground('#4a1424').setFontColor('#ffffff');
    hoja.setFrozenRows(1);
    hoja.getRange('E:E').setNumberFormat('@');
    hoja.setColumnWidth(2, 220);
    hoja.setColumnWidth(6, 380);
  }
  return hoja;
}

// Texto plano, recortado y sin fórmulas (evita que algo como "=..." se ejecute en la hoja)
function limpiar(v, max) {
  let t = String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
  if (/^[=+\-@]/.test(t)) t = "'" + t;
  return t;
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
