// ─── LÓGICA DE LA FUNCIÓN "EVITAR PROFESOR" (ESCUDO ANTI-PROFESOR) ───────────────

let activeShieldState = {
  profName: null,
  shieldSectionId: null,
  targetSubject: null,
  targetCode: null
};

/**
 * Abre el modal de Evitar Profesor. Si no hay cédula activa, advierte y abre el modal de cédula.
 */
function openAvoidProfModal() {
  if (typeof activeCedula === 'undefined' || !activeCedula || !cedulaFilteredSet || cedulaFilteredSet.size === 0) {
    if (typeof showToast === 'function') {
      showToast('⚠️ Debes activar tu filtro por cédula primero para usar Evitar Profesor', 3500);
    }
    if (typeof openCedulaModal === 'function') {
      openCedulaModal();
    }
    return;
  }

  const modal = document.getElementById('avoid-prof-modal');
  const select = document.getElementById('avoid-prof-select');

  if (!modal || !select) return;

  // Cargar lista de profesores de la oferta proyectada del alumno
  populateProfessorsDropdown(select);

  // Ejecutar diagnóstico inicial
  onProfSelectChange();

  modal.classList.add('open');
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
 * Llena el selector desplegable con los profesores disponibles en las materias proyectadas.
 */
function populateProfessorsDropdown(selectEl) {
  selectEl.innerHTML = '';

  // Filtrar secciones correspondientes a la proyección del alumno
  const projectedSections = SECTIONS.filter(sec => {
    const code = normStr(sec.code);
    const subject = normStr(sec.subject);
    const nrc = normStr(sec.nrc);
    return cedulaFilteredSet.has(code) || cedulaFilteredSet.has(subject) || cedulaFilteredSet.has(nrc);
  });

  const profsSet = new Set();
  projectedSections.forEach(sec => {
    if (sec.prof && sec.prof !== 'Por Asignar' && sec.prof !== 'Sin Asignar') {
      profsSet.add(sec.prof.trim());
    }
  });

  const sortedProfs = Array.from(profsSet).sort();

  if (sortedProfs.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'No hay profesores disponibles';
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

  const analysis = analyzeProfShield(profName);

  if (analysis.viable) {
    diagContainer.innerHTML = `
      <div class="shield-diagnostic-card viable">
        <div class="shield-diag-title">
          <span>🛡️ ESCUDO VIABLE DISPONIBLE</span>
        </div>
        <p class="shield-diag-detail">
          Se encontró una materia proyectada que coincide exactamente con el horario del <strong>Prof. ${profName}</strong> en <strong>${analysis.unwantedSection.subject}</strong>.
        </p>
        <div class="shield-diag-item">
          <div>
            <div><strong>Materia Escudo:</strong> ${analysis.shieldSection.subject} (${analysis.shieldSection.code})</div>
            <div style="font-size:0.68rem; color:var(--cyan);">Profesor: ${analysis.shieldSection.prof}</div>
          </div>
          <span style="font-size:0.7rem; color:var(--green); font-weight:bold;">SOLAPAMIENTO DETECTADO</span>
        </div>
      </div>
    `;
    if (btnApply) btnApply.disabled = false;
  } else {
    diagContainer.innerHTML = `
      <div class="shield-diagnostic-card unviable">
        <div class="shield-diag-title" style="color: var(--accent2);">
          <span>⚠️ NO ES POSIBLE GENERAR ESCUDO</span>
        </div>
        <p class="shield-diag-detail">
          ${analysis.reason}
        </p>
      </div>
    `;
    if (btnApply) btnApply.disabled = true;
  }
}

/**
 * Analiza la posibilidad de generar un escudo de conflicto contra un profesor no deseado.
 */
function analyzeProfShield(profName) {
  // 1. Obtener secciones dictadas por el profesor no deseado
  const unwantedSections = SECTIONS.filter(s => s.prof && s.prof.trim() === profName.trim());

  if (unwantedSections.length === 0) {
    return { viable: false, reason: "No se encontraron secciones dictadas por este profesor en el período." };
  }

  // Verificar si este profesor es el ÚNICO que dicta alguna materia
  for (const unwSec of unwantedSections) {
    const allSecsForSubject = SECTIONS.filter(s => s.code === unwSec.code);
    const uniqueProfs = new Set(allSecsForSubject.map(s => s.prof));
    if (uniqueProfs.size === 1 && uniqueProfs.has(profName)) {
      return {
        viable: false,
        reason: `El Prof. <strong>${profName}</strong> es el único profesor que dicta <strong>${unwSec.subject} (${unwSec.code})</strong>. No puedes evitarlo a menos que decidas no inscribir esa materia.`
      };
    }
  }

  // 2. Obtener materias proyectadas del alumno (excluyendo las materias del profesor no deseado)
  const projectedCandidates = SECTIONS.filter(sec => {
    if (sec.prof && sec.prof.trim() === profName.trim()) return false;
    const code = normStr(sec.code);
    const subject = normStr(sec.subject);
    const nrc = normStr(sec.nrc);
    return (cedulaFilteredSet.has(code) || cedulaFilteredSet.has(subject) || cedulaFilteredSet.has(nrc)) && sec.slots && sec.slots.length > 0;
  });

  // 3. Buscar superposición de horarios entre la sección del profesor no deseado y alguna materia proyectada
  for (const unwSec of unwantedSections) {
    if (!unwSec.slots || unwSec.slots.length === 0) continue;

    for (const candSec of projectedCandidates) {
      // No usar la misma materia que dicta el profesor no deseado como escudo
      if (candSec.code === unwSec.code) continue;

      // Verificar si chocan en algún slot de día y hora
      for (const unwSlot of unwSec.slots) {
        for (const candSlot of candSec.slots) {
          if (unwSlot.day === candSlot.day && slotsOverlap(unwSlot.start, unwSlot.end, candSlot.start, candSlot.end)) {
            return {
              viable: true,
              unwantedSection: unwSec,
              shieldSection: candSec
            };
          }
        }
      }
    }
  }

  return {
    viable: false,
    reason: `No hay ninguna materia proyectada en tu horario disponible que choque en el mismo bloque con las clases del Prof. <strong>${profName}</strong>.`
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
  if (!select || !select.value) return;

  const profName = select.value;
  const analysis = analyzeProfShield(profName);

  if (!analysis.viable) {
    if (typeof showToast === 'function') {
      showToast('⚠️ No se puede aplicar el escudo para este profesor');
    }
    return;
  }

  const shieldSec = analysis.shieldSection;
  const unwSec = analysis.unwantedSection;

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
    showToast(`🛡️ Escudo activado contra Prof. ${profName}`, 4000);
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
