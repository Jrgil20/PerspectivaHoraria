// ─── GESTIÓN DE PERÍODOS ACADÉMICOS ──────────────────────────────────────────
async function initPeriods() {
  try {
    const res = await fetch('data/periods.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    availablePeriods = await res.json();

    const selectEl = document.getElementById('period-select');
    selectEl.innerHTML = '';
    availablePeriods.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      selectEl.appendChild(opt);
    });

    if (availablePeriods.length > 0) {
      await loadPeriod(availablePeriods[0].id);
    }
  } catch (err) {
    console.error('Error cargando los períodos:', err);
    showToast('⚠ Error al cargar los períodos', 'var(--accent2)');
  }
}

async function loadPeriod(periodId) {
  const period = availablePeriods.find(p => p.id === periodId);
  if (!period) return;

  try {
    const res = await fetch(period.file);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    SECTIONS = await res.json();
    currentPeriodId = periodId;

    if (typeof loadScheduleFromStorage === 'function') {
      loadScheduleFromStorage();
    } else {
      clearAll();
    }
    showToast(`✓ Cargado: ${period.name}`, 'var(--green)');
  } catch (err) {
    console.error(`Error cargando el período ${periodId}:`, err);
    showToast(`⚠ Error al cargar las materias del período`, 'var(--accent2)');
  }
}

async function changePeriod(periodId) {
  if (periodId !== currentPeriodId) {
    await loadPeriod(periodId);
  }
}
