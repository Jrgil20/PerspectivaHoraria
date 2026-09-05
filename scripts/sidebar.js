// ─── GESTIÓN Y RENDERIZADO DEL SIDEBAR ─────────────────────────────────────────
const SEMESTER_LABELS = {
  '01SE': 'SEMESTRE 1',
  '02SE': 'SEMESTRE 2',
  '03SE': 'SEMESTRE 3',
  '04SE': 'SEMESTRE 4',
  '05SE': 'SEMESTRE 5',
  '06SE': 'SEMESTRE 6',
  '07SE': 'SEMESTRE 7',
  '08SE': 'SEMESTRE 8',
  'ELECTIVA': 'ELECTIVAS / OTROS'
};
const SEMESTER_ORDER = ['01SE', '02SE', '03SE', '04SE', '05SE', '06SE', '07SE', '08SE', 'ELECTIVA'];

function setSortMode(mode) {
  if (currentSortMode === mode) return;
  currentSortMode = mode;
  document.getElementById('btn-sort-alpha').classList.toggle('active', mode === 'alpha');
  document.getElementById('btn-sort-sem').classList.toggle('active', mode === 'semester');
  buildSidebar();
}

function buildSidebar() {
  const container = document.getElementById('sidebar-content');
  container.innerHTML = '';

  if (currentSortMode === 'alpha') {
    const groups = {};
    SECTIONS.forEach(s => {
      if (!groups[s.code]) groups[s.code] = [];
      groups[s.code].push(s);
    });

    const sortedCodes = Object.keys(groups).sort();
    sortedCodes.forEach(code => {
      renderSubjectGroup(container, code, groups[code]);
    });
  } else {
    const semGroups = {};
    SECTIONS.forEach(s => {
      const sem = s.semester || 'ELECTIVA';
      if (!semGroups[sem]) semGroups[sem] = {};
      if (!semGroups[sem][s.code]) semGroups[sem][s.code] = [];
      semGroups[sem][s.code].push(s);
    });

    SEMESTER_ORDER.forEach(semKey => {
      if (!semGroups[semKey] || Object.keys(semGroups[semKey]).length === 0) return;

      const semHeader = document.createElement('div');
      semHeader.className = 'semester-header';
      semHeader.textContent = `// ${SEMESTER_LABELS[semKey] || semKey}`;
      container.appendChild(semHeader);

      const sortedCodes = Object.keys(semGroups[semKey]).sort();
      sortedCodes.forEach(code => {
        renderSubjectGroup(container, code, semGroups[semKey][code]);
      });
    });
  }
}

function renderSubjectGroup(container, code, sections) {
  const g = document.createElement('div');
  g.className = 'subject-group';

  const hdr = document.createElement('div');
  hdr.className = 'subject-header';
  hdr.textContent = code;
  g.appendChild(hdr);

  sections.forEach(sec => {
    const card = document.createElement('div');
    const isPlaced = placedSections.includes(sec.id);
    const hasSlots = sec.slots && sec.slots.length > 0;

    card.className = 'section-card' + (isPlaced ? ' placed' : '');
    card.id = 'card-' + sec.id;
    card.style.borderLeftColor = sec.color;
    card.draggable = !isPlaced && hasSlots;

    let slotsHtml = '';
    if (hasSlots) {
      slotsHtml = sec.slots.map(sl =>
        `<span class="slot-badge">${DAY_FULL[sl.day].substring(0, 3)} ${sl.start}–${sl.end}</span>`
      ).join('');
    } else {
      slotsHtml = `<span class="slot-badge no-slots">⚠ Sin horario definido</span>`;
    }

    card.innerHTML = `
      <div class="nrc">NRC ${sec.nrc}</div>
      <div class="name">${sec.subject}</div>
      <div class="prof">${sec.prof}</div>
      <div class="slots">${slotsHtml}</div>
    `;

    if (!isPlaced) {
      if (hasSlots) {
        card.addEventListener('dragstart', e => {
          draggingId = sec.id;
          card.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'copy';
        });
        card.addEventListener('dragend', () => {
          card.classList.remove('dragging');
        });
        card.addEventListener('click', () => {
          handleDrop(sec.id);
        });
      } else {
        card.addEventListener('click', () => {
          showToast(`⚠ '${sec.subject}' (NRC ${sec.nrc}) no tiene horario asignado aún.`, 'var(--accent2)');
        });
      }
    }

    g.appendChild(card);
  });

  container.appendChild(g);
}
