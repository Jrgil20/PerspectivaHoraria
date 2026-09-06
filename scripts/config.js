// ─── DATOS Y CONSTANTES ────────────────────────────────────────────────────────
const COLORS = [
  '#7c6eff', '#22d3ee', '#4ade80', '#fbbf24', '#f472b6', '#fb923c', '#a78bfa', '#34d399'
];

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAY_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// Horas del grid: 07:00 a 21:00 en bloques de 1 hora → 14 filas
const START_HOUR = 7;
const END_HOUR = 21;
const SLOTS_PER_HOUR = 1; // cada slot = 1 hora
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * SLOTS_PER_HOUR; // 14

function timeToSlotStart(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h - START_HOUR;
}

function timeToSlotEnd(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return (h - START_HOUR) + (m > 0 ? 1 : 0);
}

function timeToSlot(hhmm) {
  return timeToSlotStart(hhmm);
}

// ─── ESTADO GLOBAL ─────────────────────────────────────────────────────────────
let SECTIONS = [];
let availablePeriods = [];
let currentPeriodId = null;
let placedSections = []; // ids de secciones colocadas
let draggingId = null;
let currentSortMode = 'alpha'; // 'alpha' | 'semester'

// ─── MAPEO DE UNIDADES DE CRÉDITO (UC) ─────────────────────────────────────────
const SUBJECT_UC_MAP = {
  // Semestre 1
  'FING-02002': 5,
  'FING-02009': 4,
  'INFO-02030': 3,
  'INFO-02032': 5,
  'UCAB-00001': 3,
  'UCAB-00009': 5,

  // Semestre 2
  'FING-02003': 6,
  'FING-02101': 5,
  'INFO-02000': 6,
  'INFO-02026': 4,
  'INFO-02101': 7,
  'UCAB-00002': 3,

  // Semestre 3
  'FACE-00024': 5,
  'FING-02004': 5,
  'FING-02115': 6,
  'FING-P2115': 0,
  'INFO-02002': 7,
  'INFO-02004': 4,
  'INFO-02005': 5,

  // Semestre 4
  'FING-02011': 5,
  'FING-02016': 4,
  'FING-02105': 6,
  'INFO-02003': 5,
  'INFO-02007': 5,
  'INFO-02010': 5,
  'UCAB-00003': 3,

  // Semestre 5
  'FING-02006': 4,
  'FING-02107': 6,
  'FING-P2107': 0,
  'INFO-02011': 4,
  'INFO-02012': 5,
  'INFO-02013': 4,
  'INFO-02016': 6,
  'INFO-02104': 4,
  'INFO-P2016': 0,

  // Semestre 6
  'FING-02010': 2,
  'INFO-02015': 5,
  'INFO-02017': 4,
  'INFO-02018': 4,
  'INFO-02019': 4,
  'INFO-02024': 3,
  'INFO-02102': 5,
  'INFO-P2102': 0,
  'UCAB-00008': 3,

  // Semestre 7
  'INFO-02020': 4,
  'INFO-02022': 5,
  'INFO-02025': 5,
  'INFO-02028': 5,
  'INFO-P2028': 0,

  // Semestre 8
  'FING-02014': 3,
  'INFO-02027': 4,
  'INFO-02029': 4,

  // Cátedras y Electivas
  'UCAB-02002': 3,
  'ECON-00023': 3,
  'INFO-02021': 3,
  'UCAB-80013': 3,
  'UCAB-80011': 3,
  'UCAB-80012': 3,
  'UCAB-80009': 3,
  'UCAB-80014': 3,
  'UCAB-80008': 3,
  'UCAB-80010': 3
};

