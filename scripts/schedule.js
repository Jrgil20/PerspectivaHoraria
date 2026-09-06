// ─── CONSTRUCCIÓN DE LA GRILLA ──────────────────────────────────────────────────
function buildGrid() {
  const table = document.getElementById('grid-table');
  table.innerHTML = '';

  // Headers row
  const cornerCell = document.createElement('div');
  cornerCell.className = 'grid-col-header';
  cornerCell.style.background = 'var(--bg)';
  table.appendChild(cornerCell);

  DAYS.forEach(d => {
    const h = document.createElement('div');
    h.className = 'grid-col-header';
    h.textContent = d;
    table.appendChild(h);
  });

  // Time rows
  for (let slot = 0; slot < TOTAL_SLOTS; slot++) {
    const h = START_HOUR + slot;

    const timeLabel = document.createElement('div');
    timeLabel.className = 'time-label';
    timeLabel.textContent = `${String(h).padStart(2, '0')}:00`;
    table.appendChild(timeLabel);

    for (let day = 0; day < 7; day++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell drop-target';
      cell.dataset.day = day;
      cell.dataset.slot = slot;

      cell.addEventListener('dragover', e => {
        e.preventDefault();
        cell.classList.add('drag-over');
      });
      cell.addEventListener('dragleave', () => cell.classList.remove('drag-over'));
      cell.addEventListener('drop', e => {
        e.preventDefault();
        cell.classList.remove('drag-over');
        if (draggingId) handleDrop(draggingId);
      });

      table.appendChild(cell);
    }
  }

  // Re-render placed blocks
  renderPlacedBlocks();
}

// ─── COLOCAR / REMOVER SECCIONES ──────────────────────────────────────────────
function handleDrop(secId) {
  const sec = SECTIONS.find(s => s.id === secId);
  if (!sec || placedSections.includes(secId)) return;

  // Check conflicts
  const conflict = checkConflict(sec);
  if (conflict) {
    showToast(`⚠ Conflicto con ${conflict.subject} (${conflict.nrc})`);
  }

  placedSections.push(secId);
  buildSidebar();
  renderPlacedBlocks();
  updateStats();
  draggingId = null;
}

function removeSection(secId) {
  placedSections = placedSections.filter(id => id !== secId);
  buildSidebar();
  renderPlacedBlocks();
  updateStats();
}

function clearAll() {
  placedSections = [];
  buildSidebar();
  renderPlacedBlocks();
  updateStats();
}

function checkConflict(newSec) {
  for (const pid of placedSections) {
    const placed = SECTIONS.find(s => s.id === pid);
    for (const ns of newSec.slots) {
      for (const ps of placed.slots) {
        if (ns.day !== ps.day) continue;
        const ns0 = timeToSlotStart(ns.start), ns1 = timeToSlotEnd(ns.end);
        const ps0 = timeToSlotStart(ps.start), ps1 = timeToSlotEnd(ps.end);
        if (ns0 < ps1 && ns1 > ps0) return placed;
      }
    }
  }
  return null;
}

// ─── RENDER BLOQUES COLOCADOS ─────────────────────────────────────────────────
function renderPlacedBlocks() {
  // Clear all placed blocks
  document.querySelectorAll('.placed-block, .conflict-overlay').forEach(el => el.remove());

  // Track occupancy for conflict detection
  const occupancy = {}; // key: `day-slot` → [secIds]

  placedSections.forEach(secId => {
    const sec = SECTIONS.find(s => s.id === secId);
    sec.slots.forEach(sl => {
      const s0 = timeToSlotStart(sl.start);
      const s1 = timeToSlotEnd(sl.end);
      for (let s = s0; s < s1; s++) {
        const key = `${sl.day}-${s}`;
        if (!occupancy[key]) occupancy[key] = [];
        occupancy[key].push(secId);
      }
    });
  });

  placedSections.forEach(secId => {
    const sec = SECTIONS.find(s => s.id === secId);
    sec.slots.forEach(sl => {
      const s0 = timeToSlotStart(sl.start);
      const s1 = timeToSlotEnd(sl.end);

      // Find the first cell of the span
      const firstCell = document.querySelector(
        `.grid-cell[data-day="${sl.day}"][data-slot="${s0}"]`
      );
      if (!firstCell) return;

      const spanLen = Math.max(1, s1 - s0);

      const isShieldBlock = typeof activeShieldState !== 'undefined' && activeShieldState && activeShieldState.shieldSectionId === secId;

      const block = document.createElement('div');
      block.className = 'placed-block' + (isShieldBlock ? ' shield-block' : '');
      block.style.background = sec.color + 'cc';
      block.style.borderLeft = `3px solid ${sec.color}`;
      block.style.color = '#fff';
      block.style.height = `calc(${spanLen} * 100% + ${spanLen - 1}px)`;
      block.style.zIndex = 10;

      block.innerHTML = `
        <div class="pb-nrc">NRC ${sec.nrc}</div>
        <div class="pb-name">${sec.subject}</div>
        <div class="pb-time">${sl.start}–${sl.end}</div>
        <div class="pb-remove">✕</div>
      `;

      if (isShieldBlock) {
        block.title = `🛡️ ESTA MATERIA EVITA LA SECCIÓN DE ${activeShieldState.targetSubject} (${activeShieldState.targetCode}) CON EL PROF. ${activeShieldState.profName}\nClick para eliminar`;
      } else {
        block.title = `${sec.subject} · ${sec.prof}\nClick para eliminar`;
      }

      block.addEventListener('click', () => removeSection(secId));

      // Check conflict at this slot
      const hasConflict = Array.from({ length: spanLen }, (_, i) => {
        const key = `${sl.day}-${s0 + i}`;
        return (occupancy[key] || []).length > 1;
      }).some(Boolean);

      firstCell.style.position = 'relative';
      firstCell.appendChild(block);

      if (hasConflict) {
        const overlay = document.createElement('div');
        overlay.className = 'conflict-overlay';
        overlay.textContent = '!';
        firstCell.appendChild(overlay);
      }
    });
  });

  // Show/hide conflict chip
  const hasAnyConflict = Object.values(occupancy).some(v => v.length > 1);
  document.getElementById('stat-conflict').style.display = hasAnyConflict ? 'flex' : 'none';
}

// ─── ESTADÍSTICAS ─────────────────────────────────────────────────────────────
function updateStats() {
  document.getElementById('stat-placed').textContent = placedSections.length;

  let totalMinutes = 0;
  placedSections.forEach(id => {
    const sec = SECTIONS.find(s => s.id === id);
    if (!sec) return;
    sec.slots.forEach(sl => {
      const [h0, m0] = sl.start.split(':').map(Number);
      const [h1, m1] = sl.end.split(':').map(Number);
      totalMinutes += (h1 * 60 + m1) - (h0 * 60 + m0);
    });
  });
  document.getElementById('stat-hours').textContent =
    (totalMinutes / 60).toFixed(1) + 'h';

  // Mostrar / ocultar chip de escudo activo en la barra de estadísticas
  const statsBar = document.getElementById('stats-bar');
  let shieldChip = document.getElementById('stat-shield-chip');

  if (typeof activeShieldState !== 'undefined' && activeShieldState && activeShieldState.profName) {
    if (!shieldChip && statsBar) {
      shieldChip = document.createElement('div');
      shieldChip.id = 'stat-shield-chip';
      shieldChip.className = 'stat-chip stat-chip-shield';
      statsBar.appendChild(shieldChip);
    }
    if (shieldChip) {
      shieldChip.innerHTML = `
        <span>🛡️ Escudo vs Prof. <strong>${activeShieldState.profName}</strong></span>
        <button class="stat-chip-shield-btn" onclick="removeProfShield()" title="Remover escudo">✕</button>
      `;
      shieldChip.style.display = 'inline-flex';
    }
  } else if (shieldChip) {
    shieldChip.style.display = 'none';
  }
}

// ─── NOTIFICACIONES TOAST ─────────────────────────────────────────────────────
function showToast(msg, color) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.borderLeftColor = color || 'var(--accent2)';
  t.style.color = color || 'var(--accent2)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ─── COPIAR NRCs ──────────────────────────────────────────────────────────────
function copyNRCs() {
  if (placedSections.length === 0) {
    showToast('⚠ No hay secciones colocadas aún');
    return;
  }
  const nrcs = placedSections.map(id => {
    const sec = SECTIONS.find(s => s.id === id);
    return sec.nrc;
  });
  const text = nrcs.join(', ');
  navigator.clipboard.writeText(text).then(() => {
    showToast(`✓ ${nrcs.length} NRC${nrcs.length > 1 ? 's' : ''} copiados: ${text}`, 'var(--green)');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(`✓ NRCs copiados: ${text}`, 'var(--green)');
  });
}
