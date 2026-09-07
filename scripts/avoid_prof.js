// ─── LÓGICA DE LA FUNCIÓN "EVITAR PROFESOR" (ESCUDO ANTI-PROFESOR) ───────────────

let activeShieldState = {
  profName: null,
  shieldSectionId: null,
  targetSubject: null,
  targetCode: null
};

/**
 * Obtiene las secciones disponibles para evaluar en el escudo,
 * aplicando el filtro de cédula si estuviese activo.
 */
function getAvailableSectionsForShield() {
  // NOTA: Filtrado por cédula deshabilitado ya que el período de inscripciones ha finalizado.
  // Se evalúa la totalidad de las secciones disponibles (SECTIONS).
  return SECTIONS;
}

/**
 * Abre el modal de Evitar Profesor.
 */
function openAvoidProfModal() {
  const modal = document.getElementById('avoid-prof-modal');
  if (!modal) return;

  modal.classList.add('open');

  const select = document.getElementById('avoid-prof-select');
  if (select) {
    try {
      populateProfessorsDropdown(select);
      onProfSelectChange();
    } catch (e) {
      console.error("Error al poblar profesores:", e);
    }
  }
}

/**
 * Cierra el modal de Evitar Profesor.
 */
function closeAvoidProfModal() {
  const modal = document.getElementById('avoid-prof-modal');
  if (modal) {
    modal.classList.remove('open');
  }
}

/**
 * Llena el selector desplegable con todos los profesores de la oferta actual (o filtrados por cédula).
 */
function populateProfessorsDropdown(selectEl) {
  selectEl.innerHTML = '';

  const hasCedulaFilter = typeof activeCedula !== 'undefined' && activeCedula && cedulaFilteredSet && cedulaFilteredSet.size > 0;
  const availableSections = getAvailableSectionsForShield();

  // Actualizar o crear badge informativo de cédula en el modal
  let badgeEl = document.getElementById('avoid-prof-cedula-notice');
  if (!badgeEl) {
    badgeEl = document.createElement('div');
    badgeEl.id = 'avoid-prof-cedula-notice';
    badgeEl.className = 'shield-cedula-notice';
    selectEl.parentNode.insertBefore(badgeEl, selectEl);
  }

  if (hasCedulaFilter) {
    badgeEl.style.display = 'block';
    badgeEl.innerHTML = `📌 <span>Filtrando profesores por materias proyectadas de la Cédula <strong>V-${activeCedula}</strong></span>`;
  } else {
    badgeEl.style.display = 'none';
    badgeEl.innerHTML = '';
  }

  const profsSet = new Set();
  availableSections.forEach(sec => {
    if (sec.prof && sec.prof.trim() !== '' && sec.prof !== 'Por Asignar' && sec.prof !== 'Sin Asignar') {
      profsSet.add(sec.prof.trim());
    }
  });

  const sortedProfs = Array.from(profsSet).sort((a, b) => a.localeCompare(b));

  if (sortedProfs.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = hasCedulaFilter ? 'No hay profesores con materias proyectadas' : 'No hay profesores disponibles';
    selectEl.appendChild(opt);
    return;
  }

  sortedProfs.forEach(prof => {
    const opt = document.createElement('option');
    opt.value = prof;
    opt.textContent = prof;
    selectEl.appendChild(opt);
  });
}

/**
 * Handler cuando cambia el profesor seleccionado en el modal.
 */
let currentShieldAnalysis = null;
let selectedShieldIndex = 0;

/**
 * Handler cuando cambia el profesor seleccionado en el modal.
 */
function onProfSelectChange() {
  const select = document.getElementById('avoid-prof-select');
  const diagContainer = document.getElementById('shield-diag-container');
  const btnApply = document.getElementById('shield-apply-btn');

  if (!select || !diagContainer) return;

  const profName = select.value;
  if (!profName) {
    diagContainer.innerHTML = '<p class="shield-diag-detail">Selecciona un profesor para evaluar el escudo de conflicto.</p>';
    if (btnApply) btnApply.disabled = true;
    return;
  }

  currentShieldAnalysis = analyzeProfShield(profName);
  selectedShieldIndex = 0;

  if (currentShieldAnalysis.viable && currentShieldAnalysis.options.length > 0) {
    renderShieldOptionsList(currentShieldAnalysis, profName);
    if (btnApply) btnApply.disabled = false;
  } else {
    diagContainer.innerHTML = `
      <div class="shield-diagnostic-card unviable">
        <div class="shield-diag-title" style="color: var(--accent2);">
          <span>⚠️ NO ES POSIBLE GENERAR ESCUDO</span>
        </div>
        <p class="shield-diag-detail">
          ${currentShieldAnalysis.reason}
        </p>
      </div>
    `;
    if (btnApply) btnApply.disabled = true;
  }
}

/**
 * Renderiza la lista de opciones de escudo disponibles dentro del modal.
 */
function renderShieldOptionsList(analysis, profName) {
  const diagContainer = document.getElementById('shield-diag-container');
  if (!diagContainer) return;

  const dayShort = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  let html = `
    <div class="shield-diagnostic-card viable">
      <div class="shield-diag-title">
        <span>🛡️ ${analysis.options.length} ESCUDO(S) DISPONIBLE(S)</span>
      </div>
      <p class="shield-diag-detail">
        Selecciona la materia que deseas colocar como conflicto a la misma hora del <strong>Prof. ${profName}</strong>:
      </p>
      <div class="shield-options-list">
  `;

  analysis.options.forEach((opt, idx) => {
    const isSelected = idx === selectedShieldIndex;
    const dayName = typeof DAY_FULL !== 'undefined' ? DAY_FULL[opt.overlapDay] : dayShort[opt.overlapDay];

    html += `
      <div class="shield-option-card ${isSelected ? 'selected' : ''}" onclick="selectShieldOption(${idx})">
        <div class="shield-radio"></div>
        <div class="shield-option-info">
          <div class="shield-option-title">${opt.shieldSection.subject} (${opt.shieldSection.code})</div>
          <div class="shield-option-meta">
            <span>NRC ${opt.shieldSection.nrc} · Prof. ${opt.shieldSection.prof || 'Por Asignar'}</span>
          </div>
        </div>
        <span class="shield-overlap-tag">${dayName ? dayName.substring(0, 3) : ''} ${opt.overlapTime}</span>
      </div>
    `;
  });

  html += `</div></div>`;
  diagContainer.innerHTML = html;
}

/**
 * Selecciona una opción de escudo por su índice en la lista.
 */
function selectShieldOption(index) {
  selectedShieldIndex = index;
  const cards = document.querySelectorAll('.shield-option-card');
  cards.forEach((card, idx) => {
    card.classList.toggle('selected', idx === index);
  });
}

/**
 * Analiza la posibilidad de generar un escudo de conflicto contra un profesor no deseado.
 * Devuelve TODAS las opciones posibles de solapamiento.
 */
function analyzeProfShield(profName) {
  const availableSections = getAvailableSectionsForShield();
  const hasCedulaFilter = typeof activeCedula !== 'undefined' && activeCedula && cedulaFilteredSet && cedulaFilteredSet.size > 0;

  // 1. Obtener secciones dictadas por el profesor no deseado dentro del universo disponible (cédula o global)
  const unwantedSections = availableSections.filter(s => s.prof && s.prof.trim() === profName.trim());

  if (unwantedSections.length === 0) {
    return {
      viable: false,
      options: [],
      reason: `No se encontraron secciones dictadas por este profesor ${hasCedulaFilter ? 'en tus materias proyectadas.' : 'en el período.'}`
    };
  }

  // Verificar si este profesor es el ÚNICO que dicta alguna materia dentro de las disponibles
  for (const unwSec of unwantedSections) {
    const allSecsForSubject = availableSections.filter(s => s.code === unwSec.code);
    const uniqueProfs = new Set(allSecsForSubject.map(s => s.prof));
    if (uniqueProfs.size === 1 && uniqueProfs.has(profName)) {
      return {
        viable: false,
        options: [],
        reason: `El Prof. <strong>${profName}</strong> es el único profesor que dicta <strong>${unwSec.subject} (${unwSec.code})</strong>. No puedes evitarlo a menos que decidas no inscribir esa materia.`
      };
    }
  }

  // 2. Obtener lista de materias candidatas a escudo dentro de las disponibles
  const candidates = availableSections.filter(sec => {
    if (sec.prof && sec.prof.trim() === profName.trim()) return false;
    if (!sec.slots || sec.slots.length === 0) return false;
    return true;
  });

  // 3. Buscar TODAS las superposiciones de horarios
  const options = [];
  const addedNrcs = new Set();

  for (const unwSec of unwantedSections) {
    if (!unwSec.slots || unwSec.slots.length === 0) continue;

    for (const candSec of candidates) {
      if (candSec.code === unwSec.code) continue; // Misma materia no sirve de escudo
      if (addedNrcs.has(candSec.nrc)) continue; // Evitar duplicar la misma sección

      for (const unwSlot of unwSec.slots) {
        for (const candSlot of candSec.slots) {
          if (unwSlot.day === candSlot.day && slotsOverlap(unwSlot.start, unwSlot.end, candSlot.start, candSlot.end)) {
            addedNrcs.add(candSec.nrc);
            options.push({
              shieldSection: candSec,
              unwantedSection: unwSec,
              overlapDay: candSlot.day,
              overlapTime: `${candSlot.start}–${candSlot.end}`,
              unwantedTime: `${unwSlot.start}–${unwSlot.end}`
            });
            break;
          }
        }
      }
    }
  }

  if (options.length > 0) {
    return {
      viable: true,
      options: options,
      isProjected: hasCedulaFilter
    };
  }

  return {
    viable: false,
    options: [],
    reason: `No hay materias ${hasCedulaFilter ? 'proyectadas ' : ''}disponibles que coincidan en horario para bloquear al Prof. <strong>${profName}</strong>.`
  };
}

/**
 * Comprueba si dos rangos de horas ("HH:MM") se solapan.
 */
function slotsOverlap(startA, endA, startB, endB) {
  const sA = timeToSlot(startA);
  const eA = timeToSlot(endA);
  const sB = timeToSlot(startB);
  const eB = timeToSlot(endB);

  return Math.max(sA, sB) < Math.min(eA, eB);
}

/**
 * Aplica el escudo colocándolo automáticamente en el horario.
 */
function applyProfShield() {
  const select = document.getElementById('avoid-prof-select');
  if (!select || !select.value || !currentShieldAnalysis || !currentShieldAnalysis.viable) return;

  const profName = select.value;
  const options = currentShieldAnalysis.options;

  if (!options || options.length === 0) {
    if (typeof showToast === 'function') {
      showToast('⚠️ No se puede aplicar el escudo para este profesor');
    }
    return;
  }

  const selectedOpt = options[selectedShieldIndex] || options[0];
  const shieldSec = selectedOpt.shieldSection;
  const unwSec = selectedOpt.unwantedSection;

  // Agregar la sección del escudo a placedSections si no estaba ya
  if (!placedSections.includes(shieldSec.id)) {
    placedSections.push(shieldSec.id);
  }

  // Guardar estado del escudo activo
  activeShieldState = {
    profName: profName,
    shieldSectionId: shieldSec.id,
    targetSubject: unwSec.subject,
    targetCode: unwSec.code
  };

  // Re-renderizar sidebar y horario
  if (typeof buildSidebar === 'function') buildSidebar();
  if (typeof renderGrid === 'function') renderGrid();
  if (typeof updateStats === 'function') updateStats();

  closeAvoidProfModal();

  if (typeof showToast === 'function') {
    showToast(`🛡️ Escudo activado (${shieldSec.subject}) vs Prof. ${profName}`, 4000);
  }
}

/**
 * Remueve el escudo activo.
 */
function removeProfShield() {
  activeShieldState = {
    profName: null,
    shieldSectionId: null,
    targetSubject: null,
    targetCode: null
  };

  if (typeof buildSidebar === 'function') buildSidebar();
  if (typeof renderGrid === 'function') renderGrid();
  if (typeof updateStats === 'function') updateStats();

  if (typeof showToast === 'function') {
    showToast('Escudo anti-profesor desactivado');
  }
}
