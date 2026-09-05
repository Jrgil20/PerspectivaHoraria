// ─── INTEGRACIÓN CON SUPABASE Y FILTRO POR CÉDULA ────────────────────────────────
const SUPABASE_URL = "https://zmvecicbbxbpuhbnexiz.supabase.co/rest/v1";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdmVjaWNiYnhicHVoYm5leGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODQzMzAsImV4cCI6MjA4NTQ2MDMzMH0.m5lHEASg8lCo4qjajA4yLzjqYN12g3tlNkZh4h_vBmE";

const SUPABASE_HEADERS = {
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json"
};

// Estado del filtro por Cédula
let activeCedula = null;
let cedulaFilteredSet = null; // Set de nombres, códigos y NRCs permitidos

/**
 * Carga el filtro por cédula guardado en localStorage al iniciar la aplicación.
 */
function initCedulaFilter() {
  try {
    const saved = localStorage.getItem('ph_cedula_filter');
    if (saved) {
      const data = JSON.parse(saved);
      if (data && data.cedula && Array.isArray(data.allowedKeys)) {
        activeCedula = data.cedula;
        cedulaFilteredSet = new Set(data.allowedKeys);
        updateCedulaBadgeUI();
      }
    }
  } catch (e) {
    console.error("Error al cargar filtro de cédula guardado:", e);
  }
}

/**
 * Guarda el estado del filtro en localStorage.
 */
function saveCedulaFilterToStorage(cedula, allowedKeys) {
  try {
    localStorage.setItem('ph_cedula_filter', JSON.stringify({
      cedula: cedula,
      allowedKeys: Array.from(allowedKeys)
    }));
  } catch (e) {
    console.error("Error al guardar filtro de cédula:", e);
  }
}

/**
 * Limpia el filtro por cédula activo y restaura la vista completa del sidebar.
 */
function clearCedulaFilter() {
  activeCedula = null;
  cedulaFilteredSet = null;
  localStorage.removeItem('ph_cedula_filter');
  updateCedulaBadgeUI();
  if (typeof buildSidebar === 'function') {
    buildSidebar();
  }
  if (typeof showToast === 'function') {
    showToast('Filtro por cédula remido');
  }
}

/**
 * Actualiza el indicador visual (Badge) en la parte superior del sidebar.
 */
function updateCedulaBadgeUI() {
  const container = document.getElementById('cedula-badge-container');
  const valEl = document.getElementById('cedula-badge-val');
  const btnToggle = document.getElementById('btn-cedula-toggle');

  if (activeCedula && cedulaFilteredSet && cedulaFilteredSet.size > 0) {
    if (container) {
      container.style.display = 'block';
      container.classList.add('visible');
    }
    if (valEl) valEl.textContent = activeCedula;
    if (btnToggle) btnToggle.classList.add('active');
  } else {
    if (container) {
      container.style.display = 'none';
      container.classList.remove('visible');
    }
    if (valEl) valEl.textContent = '';
    if (btnToggle) btnToggle.classList.remove('active');
  }
}

/**
 * Normaliza un texto para comparación (sin acentos, minúsculas, sin espacios extra).
 */
function normStr(str) {
  if (!str) return '';
  return str.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/**
 * Consulta la proyección del estudiante y la oferta de electivas desde Supabase.
 */
async function consultarCedulaSupabase(cedula, carreraId = 2) {
  const cedulaNum = parseInt(cedula, 10);
  if (isNaN(cedulaNum) || cedulaNum <= 0) {
    throw new Error("Por favor ingresa un número de cédula válido.");
  }

  // 1. Consultar proyecciones del estudiante
  const respProy = await fetch(`${SUPABASE_URL}/rpc/er_get_student_projections`, {
    method: "POST",
    headers: SUPABASE_HEADERS,
    body: JSON.stringify({ p_cedula: cedulaNum })
  });

  if (!respProy.ok) {
    throw new Error(`Error consultando cédula (${respProy.status}). Verifique el número ingresado.`);
  }

  const dataProy = await respProy.json();
  const subjectsProyectadas = (dataProy && Array.isArray(dataProy.subjects)) ? dataProy.subjects : [];
  
  if (subjectsProyectadas.length === 0) {
    throw new Error(`No se encontraron materias proyectadas registradas para la cédula ${cedulaNum}. Verifica que la cédula sea correcta.`);
  }

  const materiasProyectadasIds = subjectsProyectadas.map(s => s.id || s.mat_cod || s.code).filter(Boolean);

  // 2. Consultar electivas de la carrera
  let materiasElectivasIds = [];
  try {
    const urlElec = `${SUPABASE_URL}/materia_carrera?select=materia:materia_id(mat_cod)&carrera_id=eq.${carreraId}&mat_sec_is_elective=eq.true`;
    const respElec = await fetch(urlElec, { headers: SUPABASE_HEADERS });
    if (respElec.ok) {
      const dataElec = await respElec.json();
      materiasElectivasIds = dataElec
        .filter(item => item && item.materia)
        .map(item => item.materia.mat_cod);
    }
  } catch (e) {
    console.warn("No se pudieron cargar electivas complementarias:", e);
  }

  const todosLosIds = Array.from(new Set([...materiasProyectadasIds, ...materiasElectivasIds]));

  // 3. Consultar horarios reales de Supabase
  let ofertaCruda = [];
  try {
    const respHorarios = await fetch(`${SUPABASE_URL}/rpc/er_get_subject_schedules`, {
      method: "POST",
      headers: SUPABASE_HEADERS,
      body: JSON.stringify({ p_mat_ids: todosLosIds })
    });

    if (respHorarios.ok) {
      ofertaCruda = await respHorarios.json();
    }
  } catch (e) {
    console.warn("Error consultando horarios reales:", e);
  }

  // Extraer claves permitidas (códigos de materia, nombres de materias y NRCs)
  const allowedKeys = new Set();

  // 1. Agregar de la respuesta de proyecciones
  subjectsProyectadas.forEach(s => {
    if (s.name) allowedKeys.add(normStr(s.name));
    if (s.subject_name) allowedKeys.add(normStr(s.subject_name));
    if (s.id) allowedKeys.add(normStr(s.id));
    if (s.code) allowedKeys.add(normStr(s.code));
    if (s.mat_cod) allowedKeys.add(normStr(s.mat_cod));
  });

  // 2. Agregar de la oferta devuelta por Supabase
  if (Array.isArray(ofertaCruda)) {
    ofertaCruda.forEach(row => {
      if (row.subject_name) allowedKeys.add(normStr(row.subject_name));
      if (row.subject_code) allowedKeys.add(normStr(row.subject_code));
      if (row.crn) allowedKeys.add(normStr(row.crn));
      if (row.mat_cod) allowedKeys.add(normStr(row.mat_cod));
    });
  }

  // 3. Emparejar flexiblemente con la oferta cargada en la aplicación (SECTIONS)
  if (typeof SECTIONS !== 'undefined' && Array.isArray(SECTIONS)) {
    SECTIONS.forEach(sec => {
      const normSecSubject = normStr(sec.subject);
      const normSecCode = normStr(sec.code);

      subjectsProyectadas.forEach(s => {
        const sName = normStr(s.name || s.subject_name);
        const sCode = normStr(s.id || s.code || s.mat_cod);

        if (
          (sName && (normSecSubject.includes(sName) || sName.includes(normSecSubject))) ||
          (sCode && (normSecCode === sCode || normSecCode.includes(sCode) || sCode.includes(normSecCode)))
        ) {
          allowedKeys.add(normSecCode);
          allowedKeys.add(normSecSubject);
          if (sec.nrc) allowedKeys.add(normStr(sec.nrc));
        }
      });
    });
  }

  return allowedKeys;
}

// ─── CONTROLADORES DEL MODAL DE CÉDULA ─────────────────────────────────────────

function openCedulaModal() {
  const modal = document.getElementById('cedula-modal');
  const input = document.getElementById('cedula-input');
  const statusEl = document.getElementById('modal-status-msg');

  if (!modal) return;

  if (statusEl) {
    statusEl.className = 'modal-status';
    statusEl.style.display = 'none';
    statusEl.innerHTML = '';
  }

  if (input) {
    input.value = activeCedula || '';
  }

  modal.classList.add('open');
  setTimeout(() => {
    if (input) input.focus();
  }, 100);
}

function closeCedulaModal() {
  const modal = document.getElementById('cedula-modal');
  if (modal) {
    modal.classList.remove('open');
  }
}

async function handleCedulaSubmit(event) {
  if (event) event.preventDefault();

  const input = document.getElementById('cedula-input');
  const btnSubmit = document.getElementById('modal-submit-btn');
  const statusEl = document.getElementById('modal-status-msg');

  const cedulaVal = input ? input.value.trim() : '';

  if (!cedulaVal) {
    showModalStatus('Por favor ingresa tu número de cédula.', 'error');
    return;
  }

  // Mostrar spinner de carga
  showModalStatus('<span class="spinner"></span> Consultando proyecciones en Supabase...', 'loading');
  if (btnSubmit) btnSubmit.disabled = true;

  try {
    const allowedKeys = await consultarCedulaSupabase(cedulaVal);

    // Guardar y activar el filtro
    activeCedula = cedulaVal;
    cedulaFilteredSet = allowedKeys;
    saveCedulaFilterToStorage(activeCedula, cedulaFilteredSet);

    updateCedulaBadgeUI();
    if (typeof buildSidebar === 'function') {
      buildSidebar();
    }

    showModalStatus('✓ Proyección cargada con éxito', 'success');

    setTimeout(() => {
      closeCedulaModal();
      if (typeof showToast === 'function') {
        showToast(`Filtro por cédula ${activeCedula} aplicado`);
      }
    }, 600);

  } catch (err) {
    showModalStatus(err.message || 'Ocurrió un error inesperado.', 'error');
  } finally {
    if (btnSubmit) btnSubmit.disabled = false;
  }
}

function showModalStatus(htmlContent, type) {
  const statusEl = document.getElementById('modal-status-msg');
  if (!statusEl) return;

  statusEl.className = `modal-status ${type}`;
  statusEl.innerHTML = htmlContent;
  statusEl.style.display = 'flex';
}

// Inicialización cuando carga la página
document.addEventListener('DOMContentLoaded', () => {
  initCedulaFilter();
});
