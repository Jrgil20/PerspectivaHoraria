/**
 * Módulo de Exportación de Horario Consolidado
 * Soporta exportación en PNG, JPEG, PDF y HTML standalone.
 */

// Estado del formato actual y menú desplegable
let currentExportFormat = 'PNG';
let isExportMenuOpen = false;

/**
 * Actualiza la etiqueta del botón derecho según si está extendido o cerrado
 */
function updateExportButtonLabel() {
  const arrowBtn = document.getElementById('btn-export-arrow');
  const dropdown = document.getElementById('export-dropdown');
  if (!arrowBtn || !dropdown) return;

  if (isExportMenuOpen) {
    arrowBtn.innerText = '▼';
    arrowBtn.classList.add('open');
    dropdown.classList.add('show');
  } else {
    arrowBtn.innerText = currentExportFormat;
    arrowBtn.classList.remove('open');
    dropdown.classList.remove('show');
  }
}

/**
 * Alterna el estado del menú desplegable de opciones de formato
 */
function toggleExportMenu(event) {
  if (event) {
    event.stopPropagation();
  }
  isExportMenuOpen = !isExportMenuOpen;
  updateExportButtonLabel();
}

/**
 * Cierra el menú desplegable de exportación
 */
function closeExportMenu() {
  isExportMenuOpen = false;
  updateExportButtonLabel();
}

/**
 * Clic fuera para cerrar el menú desplegable
 */
document.addEventListener('click', function (event) {
  const splitGroup = document.getElementById('export-split-btn');
  if (splitGroup && !splitGroup.contains(event.target)) {
    closeExportMenu();
  }
});

/**
 * Maneja la selección desde el menú desplegable
 */
function selectExportFormat(format) {
  currentExportFormat = format.toUpperCase();
  closeExportMenu();
  exportSchedule(format.toLowerCase());
}

/**
 * Ejecuta la exportación con el formato activo actual
 */
function exportActiveFormat() {
  exportSchedule(currentExportFormat.toLowerCase());
}

/**
 * Función principal de exportación
 * @param {string} format 'png' | 'jpeg' | 'pdf' | 'html'
 */
async function exportSchedule(format = 'png') {
  const statsBar = document.getElementById('stats-bar');
  const gridWrap = document.querySelector('.grid-wrap');

  if (!statsBar || !gridWrap) {
    if (typeof showToast === 'function') {
      showToast('Error: No se encontró la grilla de horario para exportar');
    }
    return;
  }

  if (typeof showToast === 'function') {
    showToast(`⏳ Generando exportación (${format.toUpperCase()})...`);
  }

  try {
    if (format === 'html') {
      exportAsHTML(statsBar, gridWrap);
      return;
    }

    // Generar canvas con html2canvas
    const canvas = await generateScheduleCanvas(statsBar, gridWrap);

    if (format === 'png') {
      const link = document.createElement('a');
      link.download = `horario_consolidado_${getTimestamp()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      if (typeof showToast === 'function') showToast('✅ Horario exportado como PNG');
    } else if (format === 'jpeg') {
      const link = document.createElement('a');
      link.download = `horario_consolidado_${getTimestamp()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.92);
      link.click();
      if (typeof showToast === 'function') showToast('✅ Horario exportado como JPEG');
    } else if (format === 'pdf') {
      const { jsPDF } = window.jspdf || {};
      if (!jsPDF) {
        throw new Error('Librería jsPDF no disponible');
      }

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Crear PDF proporcional a la captura
      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [imgWidth, imgHeight]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`horario_consolidado_${getTimestamp()}.pdf`);
      if (typeof showToast === 'function') showToast('✅ Horario exportado como PDF');
    }
  } catch (err) {
    console.error('Error al exportar horario:', err);
    if (typeof showToast === 'function') {
      showToast('❌ Error durante la exportación: ' + (err.message || 'Error desconocido'));
    }
  }
}

/**
 * Genera un canvas a alta resolución a partir de las estadísticas y la grilla del horario
 */
async function generateScheduleCanvas(statsBar, gridWrap) {
  if (typeof html2canvas === 'undefined') {
    throw new Error('Librería html2canvas no cargada');
  }

  // Crear wrapper temporal para unificar stats-bar y grilla
  const tempWrapper = document.createElement('div');
  tempWrapper.style.position = 'absolute';
  tempWrapper.style.left = '-9999px';
  tempWrapper.style.top = '-9999px';
  tempWrapper.style.background = '#0d0d0f';
  tempWrapper.style.color = '#e8e8f0';
  tempWrapper.style.padding = '24px';
  tempWrapper.style.borderRadius = '8px';
  tempWrapper.style.fontFamily = "'Syne', sans-serif";
  tempWrapper.style.width = Math.max(gridWrap.scrollWidth + 48, 800) + 'px';

  // Título explicativo dentro de la captura exportada
  const headerDiv = document.createElement('div');
  headerDiv.style.marginBottom = '16px';
  headerDiv.style.borderBottom = '1px solid #2a2a32';
  headerDiv.style.paddingBottom = '10px';
  headerDiv.innerHTML = `
    <h2 style="font-family:'Syne',sans-serif;font-size:1.2rem;color:#7c6eff;margin:0 0 4px 0;">⬡ HORARIO UNIVERSITARIO CONSOLIDADO</h2>
    <span style="font-family:'Space Mono',monospace;font-size:0.7rem;color:#6b6b7e;">Exportado desde Perspectiva Horaria</span>
  `;
  tempWrapper.appendChild(headerDiv);

  // Clonar stats-bar
  const statsClone = statsBar.cloneNode(true);
  statsClone.style.marginBottom = '16px';
  tempWrapper.appendChild(statsClone);

  // Clonar grid-wrap
  const gridClone = gridWrap.cloneNode(true);
  gridClone.style.overflow = 'visible';
  gridClone.style.maxWidth = 'none';
  gridClone.style.width = '100%';
  tempWrapper.appendChild(gridClone);

  document.body.appendChild(tempWrapper);

  try {
    const canvas = await html2canvas(tempWrapper, {
      backgroundColor: '#0d0d0f',
      scale: 2, // Alta definición (Retina)
      useCORS: true,
      logging: false,
      width: tempWrapper.offsetWidth,
      height: tempWrapper.offsetHeight
    });

    return canvas;
  } finally {
    document.body.removeChild(tempWrapper);
  }
}

/**
 * Exporta el horario como documento HTML autónomo (.html)
 */
function exportAsHTML(statsBar, gridWrap) {
  const statsHTML = statsBar.outerHTML;
  const gridHTML = gridWrap.outerHTML;

  const fullHTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Horario Universitario Consolidado</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0d0d0f;
      --surface: #141418;
      --surface2: #1c1c22;
      --border: #2a2a32;
      --accent: #7c6eff;
      --accent2: #ff6b6b;
      --text: #e8e8f0;
      --text-dim: #6b6b7e;
      --cyan: #22d3ee;
      --yellow: #fbbf24;
      --green: #4ade80;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Syne', sans-serif;
      padding: 30px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }
    .container {
      width: 100%;
      max-width: 1100px;
    }
    header {
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
    }
    h1 {
      font-size: 1.4rem;
      color: var(--accent);
      font-family: 'Syne', sans-serif;
    }
    .subtitle {
      font-family: 'Space Mono', monospace;
      font-size: 0.75rem;
      color: var(--text-dim);
    }
    .stats-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .stat-chip {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 4px 12px;
      font-family: 'Space Mono', monospace;
      font-size: 0.65rem;
      color: var(--text-dim);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .stat-chip .val { color: var(--accent); font-weight: 700; }
    .grid-wrap {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow-x: auto;
    }
    .grid-table {
      display: grid;
      grid-template-columns: 70px repeat(6, 1fr);
      min-width: 700px;
    }
    .grid-col-header {
      background: var(--surface2);
      padding: 10px 6px;
      text-align: center;
      font-size: 0.68rem;
      font-weight: 700;
      font-family: 'Space Mono', monospace;
      color: var(--text-dim);
      border-bottom: 1px solid var(--border);
      border-right: 1px solid var(--border);
    }
    .time-label {
      background: var(--surface2);
      border-right: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Space Mono', monospace;
      font-size: 0.62rem;
      font-weight: 700;
      color: var(--text-dim);
    }
    .grid-cell {
      border-right: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      min-height: 3.6rem;
      position: relative;
    }
    .placed-block {
      position: absolute;
      inset: 2px;
      border-radius: 5px;
      padding: 4px 6px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .placed-block .pb-nrc { font-family: 'Space Mono', monospace; font-size: 0.55rem; opacity: 0.8; }
    .placed-block .pb-name { font-size: 0.65rem; font-weight: 700; line-height: 1.2; }
    .placed-block .pb-time { font-family: 'Space Mono', monospace; font-size: 0.55rem; opacity: 0.75; margin-top: 1px; }
    .placed-block .pb-remove { display: none !important; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>⬡ HORARIO UNIVERSITARIO CONSOLIDADO</h1>
      <div class="subtitle">Exportación autónoma HTML · Generado el ${new Date().toLocaleDateString('es-ES')}</div>
    </header>
    ${statsHTML}
    ${gridHTML}
  </div>
</body>
</html>`;

  const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `horario_consolidado_${getTimestamp()}.html`;
  link.click();
  URL.revokeObjectURL(url);

  if (typeof showToast === 'function') showToast('✅ Horario exportado como HTML');
}

/**
 * Obtiene un timestamp formateado para nombres de archivos
 */
function getTimestamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
}
