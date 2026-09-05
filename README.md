# PerspectivaHoraria ⬡

Una herramienta web interactiva y moderna para la planificación y consolidación de horarios universitarios en la Escuela de Ingeniería en Informática (UCAB Caracas).

Permite visualizar la oferta académica de múltiples períodos, organizar las secciones mediante **drag & drop** o **click/tap**, detectar conflictos de horarios automáticamente, calcular la carga de horas semanales y copiar fácilmente los NRCs seleccionados al portapapeles.

---

## 🚀 Características Principales

- 📅 **Soporte Multi-Período:** Selección dinámica de lapsos académicos cargados desde archivos JSON (`data/periods.json`).
  - **Septiembre 2026 - Enero 2027** *(Predeterminado)*.
  - **Marzo - Julio 2026**.
- 🔀 **Modos de Ordenamiento en Barra Lateral:**
  - **`A` (Alfabético):** Agrupa las secciones ordenadas alfabéticamente por código de asignatura.
  - **`S` (Por Semestre):** Clasifica las materias por su nivel dentro del plan de estudios (`Semestre 1` a `Semestre 8` y `Electivas / Otros`).
- 🖱️ **Interacción Flexible (Drag & Drop + Click/Tap):** Arrastra secciones hacia la cuadrícula o simplemente haz click/tap sobre las tarjetas (ideal para dispositivos móviles y pantallas táctiles).
- ⚠️ **Detección de Conflictos & Advertencias:**
  - Resaltado visual en rojo e indicación de solapamientos entre bloques horarios.
  - Insignia explícita `⚠ Sin horario definido` para secciones pendientes por asignar.
- 📱 **Diseño Adaptativo (Responsive):** Ajuste optimizado de layout para pantallas de escritorio, tablets y móviles con desplazamiento horizontal legible en el horario.
- 📋 **Copia Rápida de NRCs:** Copia en un solo click la lista de NRCs de las materias colocadas para agilizar el proceso de inscripción.

---

## 📁 Estructura del Proyecto

```text
PerspectivaHoraria/
├── index.html                   # Aplicación principal (HTML5, Vanilla CSS3 y JS)
├── README.md                    # Documentación del proyecto
└── data/
    ├── periods.json             # Manifiesto de períodos disponibles
    ├── sep26_enero27.json       # Oferta académica Septiembre 2026 - Enero 2027
    └── marzo_julio_2026.json    # Oferta académica Marzo - Julio 2026
```

---

## 🛠️ Cómo Ejecutar Localmente

Debido a que la aplicación utiliza la API `fetch()` para consumir los archivos JSON de datos, los navegadores requieren que la página sea entregada a través de un servidor HTTP local para evitar restricciones de seguridad (CORS).

Puedes iniciar un servidor local con cualquiera de las siguientes opciones:

### Opción 1: Python HTTP Server
```bash
python3 -m http.server 8080
```
Luego abre en tu navegador: `http://localhost:8080`

### Opción 2: PNPM Serve
```bash
pnpm dlx serve -p 8080
```
Luego abre en tu navegador: `http://localhost:8080`

### Opción 3: Extensiones de Editor
Utiliza extensiones como **Live Server** en VS Code o entornos equivalentes.

---

## 📌 Fuentes de Datos & Créditos

- **Datos de Oferta Académica:** Escuela de Ingeniería en Informática - UCAB Caracas.
- **Fuentes Tipográficas:** *Syne* y *Space Mono* (Google Fonts).
