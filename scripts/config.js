// ─── DATOS Y CONSTANTES ────────────────────────────────────────────────────────
const COLORS = [
  '#7c6eff', '#22d3ee', '#4ade80', '#fbbf24', '#f472b6', '#fb923c', '#a78bfa', '#34d399'
];

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAY_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// Horas del grid: 07:00 a 21:00 en bloques de 30 min → 28 filas
const START_HOUR = 7;
const END_HOUR = 21;
const SLOTS_PER_HOUR = 2; // cada slot = 30 min
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * SLOTS_PER_HOUR; // 28

function timeToSlot(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return (h - START_HOUR) * SLOTS_PER_HOUR + Math.floor(m / 30);
}

// ─── ESTADO GLOBAL ─────────────────────────────────────────────────────────────
let SECTIONS = [];
let availablePeriods = [];
let currentPeriodId = null;
let placedSections = []; // ids de secciones colocadas
let draggingId = null;
let currentSortMode = 'alpha'; // 'alpha' | 'semester'
