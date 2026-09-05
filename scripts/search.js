// ─── GESTIÓN Y LÓGICA DEL MINI BUSCADOR DE SECCIONES ──────────────────────────
let searchQuery = '';
let isSearchOpen = false;

/**
 * Normaliza un texto eliminando diacríticos (tildes, acentos) y convirtiéndolo a minúsculas.
 * @param {string} str - Cadena de texto a normalizar.
 * @returns {string} Texto sin acentos y en minúsculas.
 */
function normalizeText(str) {
  if (!str) return '';
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Alterna la visibilidad de la barra de búsqueda en el sidebar.
 */
function toggleSearch() {
  isSearchOpen = !isSearchOpen;
  const container = document.getElementById('search-container');
  const btn = document.getElementById('btn-search-toggle');
  const input = document.getElementById('search-input');

  if (!container || !btn || !input) return;

  if (isSearchOpen) {
    container.classList.add('open');
    btn.classList.add('active');
    setTimeout(() => input.focus(), 100);
  } else {
    container.classList.remove('open');
    btn.classList.remove('active');
    if (searchQuery !== '') {
      clearSearch();
    }
  }
}

/**
 * Maneja el evento input del buscador en tiempo real.
 * @param {string} value - Valor ingresado en el input.
 */
function handleSearchInput(value) {
  searchQuery = value.trim();
  const clearBtn = document.getElementById('search-clear-btn');
  if (clearBtn) {
    clearBtn.style.display = searchQuery.length > 0 ? 'inline-flex' : 'none';
  }
  buildSidebar();
}

/**
 * Limpia el filtro de búsqueda y refresca la lista.
 */
function clearSearch() {
  searchQuery = '';
  const input = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear-btn');
  if (input) input.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  buildSidebar();
}

/**
 * Filtra la lista de secciones por profesor, NRC, código o materia.
 * @param {Array} sections - Lista de objetos de sección.
 * @param {string} query - Término de búsqueda.
 * @returns {Array} Secciones que coinciden con el filtro.
 */
function filterSections(sections, query) {
  if (!query || query.trim() === '') return sections;
  const q = normalizeText(query);

  return sections.filter(sec => {
    const prof = normalizeText(sec.prof || '');
    const nrc = normalizeText(sec.nrc || '');
    const code = normalizeText(sec.code || '');
    const subject = normalizeText(sec.subject || '');

    return prof.includes(q) || nrc.includes(q) || code.includes(q) || subject.includes(q);
  });
}
