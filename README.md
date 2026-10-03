# MIRA — Multimodal Intelligence Platform for Enterprise Decisions
## Entrega 2: Incremento Funcional Integrado (F5 ↔ F4)

[![Test Suite](https://img.shields.io/badge/Jest%20Tests-11%2F11%20Passing-success)](file:///server/tests)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A518.0.0-blue)](https://nodejs.org)
[![Vite + React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB)](file:///client)
[![Methodology](https://img.shields.io/badge/Methodology-Spec--Driven%20Development%20(SDD)-purple)](file:///specs)

---

## 👥 1. Integrantes y Roles del Proyecto

En conformidad con la metodología **Spec-Driven Development (SDD)** y el esquema de rotación de roles para la Entrega 2:

| Integrante | Rol en Entrega 2 | Responsabilidades Principales |
| :--- | :--- | :--- |
| **Max Latuz** | **Customer Representative (Rotativo)** / Lead QA | Especificación formal del usuario, frontend interactivo (F5 / Visor F4), batería de pruebas funcionales y guía de evaluación. |
| **Joaquín Aguilera** | **Lead Developer** / Arquitecto de Software | Arquitectura de backend, implementación del motor algorítmico F4, persistencia inmutable en base de datos y endpoints REST. |

---

## 🚀 2. Guía de Ejecución Rápida (< 15 Minutos)

El sistema está diseñado para autoinicializarse sin dependencias externas complejas, utilizando **MongoDB Memory Server** embebido con *seeding* automático de la Versión 1 de producción.

### 📋 Prerrequisitos
- **Node.js** v18.0.0 o superior ([Descargar Node.js](https://nodejs.org/)).
- **Git** instalado en el sistema.

---

### Paso 1: Clonar y Acceder al Repositorio
```bash
git clone https://github.com/joaquin-aguilera/proyecto_MIRA.git
cd proyecto_MIRA
```

---

### Paso 2: Ejecutar la Suite de Pruebas Automatizadas (Backend)
Verifica que las 3 suites de pruebas (11 tests unitarios e integrados) pasen al 100%:
```bash
cd server
npm install
npm test
```
> **Resultado esperado:** `3 passed, 3 total, 11 passed, 11 total`.

---

### Paso 3: Levantar el Servidor Backend (API REST)
En una terminal en la carpeta `/server`:
```bash
npm start
```
* El servidor se inicializará en `http://localhost:5000`.
* Se creará automáticamente la **Versión 1 Activa** de umbrales con ponderaciones predeterminadas.

---

### Paso 4: Levantar el Cliente Frontend (React + Vite)
En **otra terminal**, ingresa a la carpeta `/client`:
```bash
cd client
npm install
npm run dev
```
* La aplicación interactiva quedará disponible en: `http://localhost:3000`.

---

## 🖥️ 3. Guía de Demostración del Incremento Funcional

Abre `http://localhost:3000` en tu navegador para interactuar con la plataforma:

```
+-----------------------------------------------------------------------------------+
|  MIRA — Plataforma de Inteligencia Multimodal          [ Perfil: Diseñador / Oficial ]  |
+-----------------------------------------------------------------------------------+
|  [ Panel F5: Regla Activa v1 ]     |  [ Panel F5: Proponer Nueva Regla / Firma ]  |
+------------------------------------+----------------------------------------------+
|  [ Bandeja de Cumplimiento (Propuestas Pendientes de Firma - Cuatro Ojos) ]       |
+-----------------------------------------------------------------------------------+
|  [ ⚡ VISOR Y EVALUADOR INTERACTIVO DE CASOS DIDÁCTICOS (Motor F4 ↔ Reglas F5) ]  |
|  - Selector de casos didácticos (Casos 1, 2, 2B, 3)                               |
|  - Inspector de señales de entrada y flag de fraude                               |
|  - Ejecución algorítmica en tiempo real contra la regla activa o versionada       |
+-----------------------------------------------------------------------------------+
|  [ Historial de Auditoría Inalterable (Políticas Aprobadas y Rechazadas) ]        |
+-----------------------------------------------------------------------------------+
```

### Flujo Demostrativo Recomendado:

1. **Inspección de Reglas Activas (F5):**
   - Observa la Versión 1 activa con Umbral de Aprobación $\ge 80$, Umbral de Rechazo $\le 40$, y pesos: Fraude 40%, Ingresos 35%, Identidad 25%.
2. **Evaluación de Casos en Vivo (Visor F4):**
   - En el panel inferior **"Visor y Evaluador de Casos Didácticos"**, selecciona:
     - **Caso 1:** Aprobación Directa (Puntaje 90.5 pts $\rightarrow$ `APROBADO`).
     - **Caso 2:** Caso intermedio (Puntaje 75.0 pts $\rightarrow$ `DERIVADO`).
     - **Caso 2B:** Señal de identidad $55 < 60$ $\rightarrow$ `DERIVADO` por incumplimiento de mínimo propio.
     - **Caso 3:** Señal de fraude activa $\rightarrow$ `RECHAZADO` por precedencia de fraude.
3. **Principio de Cuatro Ojos y Nueva Propuesta (`RNF-05` / `CU-03`):**
   - Con el perfil **Diseñador de Riesgo**, ajusta los umbrales (ej. Aprobación: 85, Rechazo: 45) y envía a revisión. La propuesta queda en estado `PENDIENTE`.
4. **Firma o Rechazo de Cumplimiento:**
   - Cambia el perfil a **Oficial de Cumplimiento**.
   - Haz clic en **"✕ Rechazar"** para probar el modal con validación estricta de motivo (máximo 300 caracteres, Flujo 5a).
   - O haz clic en **"✓ Firmar y Desplegar"** para activar la Versión 2.
5. **Aislamiento de Versión (`RF-05`):**
   - En el evaluador de casos F4, ingresa `1` en el campo *Aislamiento de Versión* para forzar la evaluación contra la versión histórica v1, comprobando la inmutabilidad y reproducibilidad.

---

## 📁 4. Estructura del Repositorio

```
proyecto_MIRA/
├── README.md                           # Guía principal de ejecución y evaluación
├── specs/                              # Especificación formal bajo metodología SDD
│   ├── 01_Constitucion.md              # Acta de constitución del equipo y roles
│   ├── 02_Alcance_requisitos.md        # RF, RNF y especificación de F5 y F4
│   ├── 03_Casos_uso.md                 # CU-01 a CU-04 con flujos alternativos
│   ├── 04_Arquitectura_decisiones.md   # ADRs, arquitectura REST y modelos de datos
│   ├── 05_Estrategia_pruebas.md        # Plan de pruebas, criterios de aceptación y dataset
│   └── 06_Analisis_consistencia.md     # Validación de consistencia de la especificación
├── server/                             # Backend API REST (Node.js + Express + Mongoose)
│   ├── package.json
│   ├── src/
│   │   ├── server.js                   # Entry point y conexión MongoDB (con fallback en memoria)
│   │   ├── models/                     # Umbral.js, Caso.js, Auditoria.js
│   │   ├── controllers/                # umbralesController.js, casosController.js
│   │   ├── routes/                     # umbralesRoutes.js, casosRoutes.js
│   │   └── data/                       # casos_didacticos.json (Dataset didáctico)
│   └── tests/                          # Suite automatizada Jest / Supertest
│       ├── f5_umbrales.test.js         # Pruebas de ciclo de vida de umbrales
│       ├── f4_casos.test.js            # Pruebas del motor algorítmico F4
│       └── extra_funcional.test.js     # Pruebas de validación de firma y robustez
├── client/                             # Frontend SPA (React 18 + Vite)
│   ├── package.json
│   ├── src/
│   │   ├── App.jsx                     # Interfaz completa F5 + Visor F4 + Gobernanza
│   │   ├── index.css                   # Sistema de diseño y tokens visuales
│   │   └── main.jsx
├── material/                           # Guías de soporte y presentaciones de defensa
│   ├── flujo_pruebas_f5.md             # Protocolo paso a paso para QA y evaluación
│   ├── main.tex                        # Documento LaTeX de la guía de pruebas
│   ├── presentacion/                   # Presentación Beamer (16:9)
│   └── informacion_presentacion/       # Cronograma (15 min) y Matriz de Preguntas de Defensa
└── A2-MIRA-Aguilera_latuz/             # Informe final de la Entrega 2 (LaTeX)
    └── main.tex
```

---

## 🧪 5. Matriz de Cobertura de Requisitos

| Requisito | Descripción | Implementación | Validación |
| :--- | :--- | :--- | :--- |
| **`RF-01` / `RF-02`** | Definición y versionado incremental de umbrales | `server/src/controllers/umbralesController.js` | `f5_umbrales.test.js` |
| **`RF-03` / `RNF-05`** | Principio de cuatro ojos (Firma de Cumplimiento) | `App.jsx` + `PATCH /api/umbrales/:id/firma` | `f5_umbrales.test.js` |
| **`CU-03 Flujo 5a`** | Rechazo formal con motivo obligatorio ($\le 300$ chars) | Modal de rechazo en `App.jsx` + `PATCH /:id/rechazar` | `f5_umbrales.test.js` |
| **`RF-04` / `SPEC-F4`** | Motor de Decisión ($\sum V_i \times W_i$, precedencia fraude) | `server/src/controllers/casosController.js` | `f4_casos.test.js` |
| **`RF-05`** | Aislamiento de versión aplicada a casos | `version_umbral_aplicada` en `Caso.js` | `f4_casos.test.js` |
| **`RNF-02` / `DEC-01`** | Inmutabilidad estricta de auditoría | Hooks pre-save Mongoose contra mutaciones | `extra_funcional.test.js` |

---

## 📄 6. Licencia y Contexto Académico

Proyecto desarrollado como parte de la evaluación de **Arquitectura y Diseño de Software Dirigido por Especificación (SDD)** para la plataforma **MIRA**.
