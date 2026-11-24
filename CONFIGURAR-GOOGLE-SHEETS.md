# Cómo activar las confirmaciones en Google Sheets

Son 5 minutos y se hace una sola vez, desde la computadora y con tu cuenta de Google.

1. Entra a <https://sheets.new> y ponle de nombre a la hoja **Cumpleaños Claudia – Confirmaciones**.
2. En el menú, ve a **Extensiones → Apps Script**.
3. Borra todo lo que aparece y pega completo el contenido del archivo `receptor-google-sheets.gs`. Guarda con el disquete.
4. Arriba a la derecha: **Implementar → Nueva implementación**.
   - En el engrane, elige **Aplicación web**.
   - **Ejecutar como:** Yo.
   - **Quién tiene acceso:** Cualquier usuario.
   - Pulsa **Implementar** y autoriza con tu cuenta. Si sale "Google no verificó esta app", pulsa **Configuración avanzada → Ir a (no seguro)**: es tu propio código.
5. Copia la **URL de la aplicación web** (termina en `/exec`) y pásamela.

Yo la pongo en `app.js` (línea `const SHEETS_URL = ''`) y publico de nuevo.

Las confirmaciones aparecerán en la pestaña **Confirmaciones**: fecha, nombre, si asiste, cuántas personas, WhatsApp y el mensaje para Claudia. Esos mensajes se pueden imprimir y regalárselos el día de la comida.

Mientras la URL esté vacía, el formulario funciona en **modo prueba**: muestra el agradecimiento pero no guarda nada.
