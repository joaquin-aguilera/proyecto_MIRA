# Especificacion Funcional de Requerimientos 

## Funcionalidades Integradas: F4 (Puntaje/Umbrales) y F5 (Gestion de Reglas)

### 1. Funcionalidad F5: Gestion de Reglas y Umbrales
- **ID Especificacion:** SPEC-F5
- **Requisitos Origen:** RNF-02, RNF-05, CU-03.
- **Descripcion:** Permite al Administrador del sistema visualizar, crear y actualizar los umbrales de decision y los pesos de las señales de riesgo en la base de datos MongoDB Atlas.
- **Entradas:**
  - `umbral_aprobacion` (Numero entre 0 y 100): Valor minimo para aprobacion directa.
  - `umbral_rechazo` (Numero entre 0 y 100): Valor por debajo del cual se rechaza/deriva automaticamente.
  - `pesos_señales` (Objeto JSON): Ponderacion asignada a cada señal de riesgo.
  - `autor_modificacion` (String): Identificador del usuario que propone el cambio.
- **Salidas:**
  - Objeto JSON con el estado de la actualizacion (Pendiente de firma) y timestamp de solicitud.
- **Criterios de Aceptacion (para validacion del cliente):**
  - **AC-F5-01:** La interfaz React debe permitir proponer la modificacion de los valores de umbral sin necesidad de reiniciar el servidor backend, quedando en estado pendiente de firma de Cumplimiento.
  - **AC-F5-02:** Los datos deben persistirse en la coleccion `configuraciones` de MongoDB Atlas, registrando estrictamente el valor historico anterior del umbral.
  - **AC-F5-03:** No se deben permitir umbrales negativos ni `umbral_rechazo` mayor que `umbral_aprobacion`.

---

### 2. Funcionalidad F4: Puntaje y Decision por Umbrales
- **ID Especificacion:** SPEC-F4
- **Requisitos Origen:** RF-01, RF-02, RF-05, CU-01.
- **Descripcion:** Motor de evaluacion que recibe los datos de un caso, consulta los umbrales vigentes creados en F5 y calcula el puntaje final y la decision resultante.
- **Entradas:**
  - `caso_id` (String): Identificador unico del caso a evaluar.
  - `datos_evaluacion` (Objeto JSON): Señales detectadas en el procesamiento asincronico (DEC-03).
- **Logica de Calculo y Reglas de Decision:**
  - $\text{Puntaje Total} = \sum (\text{Valor Señal}_i \times \text{Peso}_i)$
  - Si `[Señal de Fraude Activa] == TRUE` $\rightarrow$ **RECHAZADO** inmediato (Ignora precedencia de puntaje total).
  - Si `[Valor Señal_i] < [Mínimo_Propio_i]` $\rightarrow$ **DERIVADO** inmediato a revisión manual.
  - Si $\text{Puntaje Total} \ge \text{Umbral Aprobacion}$ $\rightarrow$ **APROBADO**
  - Si $\text{Puntaje Total} \le \text{Umbral Rechazo}$ $\rightarrow$ **RECHAZADO**
  - Si $\text{Umbral Rechazo} < \text{Puntaje Total} < \text{Umbral Aprobacion}$ $\rightarrow$ **DERIVADO A REVISION MANUAL**
- **Salidas:**
  - `puntaje_obtenido` (Numero).
  - `estado_decision` ("APROBADO", "RECHAZADO", "DERIVADO").
  - `desglose_señales` (Array con el detalle de cada contribucion al puntaje).
- **Criterios de Aceptacion (para validacion del cliente):**
  - **AC-F4-01:** El calculo debe consumir estrictamente la version de la configuracion de F5 que estaba vigente en el instante exacto en que el caso inicio su procesamiento, para aislar casos en progreso ante cambios en caliente (RF-05).
  - **AC-F4-02:** Si un caso cae en rango intermedio o incumple un mínimo por señal, su estado cambia automaticamente a `DERIVADO` para quedar disponible en la bandeja (F1 / CU-01).