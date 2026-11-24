/**
 * Receptor de confirmaciones · Cumpleaños de Claudia
 * Proyecto de Apps Script que escribe en la hoja indicada en ID_LIBRO.
 * Guarda cada confirmación en la pestaña "Confirmaciones".
 */
const ID_LIBRO = '1feCDSg0dQoKRH4dtYmCxj5dg1N1hAQXrEIS8Y-CQQlc'; // hoja "Cumpleaños Claudia - Confirmaciones"
const HOJA = 'Confirmaciones';
const ENCABEZADOS = ['Fecha', 'Nombre', '¿Asiste?', 'Personas', 'WhatsApp', 'Mensaje para Claudia'];

function doPost(e) {
  const candado = LockService.getScriptLock();
  try {
    candado.waitLock(20000);
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
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
    try { candado.releaseLock(); } catch (_) {}
  }
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
