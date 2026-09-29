# Especificacion Funcional de Requerimientos 

## Funcionalidades Integradas: F4 (Puntaje/Umbrales) y F5 (Gestion de Reglas)

### 1. Funcionalidad F5: Gestion de Reglas y Umbrales
- **ID Especificacion:** SPEC-F5
- **Descripcion:** Permite al Administrador del sistema visualizar, crear y actualizar los umbrales de decision y los pesos de las señales de riesgo en la base de datos MongoDB Atlas.
- **Entradas:**
  - `umbral_aprobacion` (Numero entre 0 y 100): Valor minimo para aprobacion directa.
  - `umbral_rechazo` (Numero entre 0 y 100): Valor por debajo del cual se rechaza/deriva automaticamente.
  - `pesos_señales` (Objeto JSON): Ponderacion asignada a cada señal de riesgo.
- **Salidas:**
  - Objeto JSON con el estado de la actualizacion y timestamp de vigencia.
- **Criterios de Aceptacion (para validacion del cliente):**
  - **AC-F5-01:** La interfaz React debe permitir modificar los valores de umbral sin necesidad de reiniciar el servidor backend.
  - **AC-F5-02:** Los datos deben persistirse en la coleccion `configuraciones` de MongoDB Atlas.
  - **AC-F5-03:** No se deben permitir umbrales negativos ni `umbral_rechazo` mayor que `umbral_aprobacion`.

---

### 2. Funcionalidad F4: Puntaje y Decision por Umbrales
- **ID Especificacion:** SPEC-F4
- **Descripcion:** Motor de evaluacion que recibe los datos de un caso, consulta los umbrales vigentes creados en F5 y calcula el puntaje final y la decision resultante.
- **Entradas:**
  - `caso_id` (String): Identificador unico del caso a evaluar.
  - `datos_evaluacion` (Objeto JSON): Señales detectadas en el procesamiento asincronico (DEC-03).
- **Logica de Calculo:**
  $$\text{Puntaje Total} = \sum (\text{Valor Señal}_i \times \text{Peso}_i)$$
  - **Regla de Decision:**
    - Si $\text{Puntaje Total} \ge \text{Umbral Aprobacion} \rightarrow$ **APROBADO**
    - Si $\text{Puntaje Total} \le \text{Umbral Rechazo} \rightarrow$ **RECHAZADO**
    - Si $\text{Umbral Rechazo} < \text{Puntaje Total} < \text{Umbral Aprobacion} \rightarrow$ **DERIVADO A REVISION MANUAL** (DEC-02)
- **Salidas:**
  - `puntaje_obtenido` (Numero).
  - `estado_decision` ("APROBADO", "RECHAZADO", "DERIVADO").
  - `desglose_señales` (Array con el detalle de cada contribucion al puntaje).
- **Criterios de Aceptacion (para validacion del cliente):**
  - **AC-F4-01:** El calculo debe consumir siempre la ultima configuracion guardada en F5.
  - **AC-F4-02:** Si un caso cae en rango intermedio, su estado cambia automaticamente a `DERIVADO` para quedar disponible en la bandeja (F1 / CU-01).

---

### 3. Casos de Prueba Didacticos (Dataset MIRA)
1. **Caso 1 (Aprobacion Automatica):**
   - Configuracion: Umbral Aprobacion = 70, Umbral Rechazo = 40.
   - Evaluacion: Puntaje obtenido = 85 $\rightarrow$ Estado: `APROBADO`.
2. **Caso 2 (Derivacion a Revision Manual - DEC-02):**
   - Configuracion: Umbral Aprobacion = 70, Umbral Rechazo = 40.
   - Evaluacion: Puntaje obtenido = 55 $\rightarrow$ Estado: `DERIVADO`.
3. **Caso 3 (Rechazo/Derivacion Directa):**
   - Configuracion: Umbral Aprobacion = 70, Umbral Rechazo = 40.
   - Evaluacion: Puntaje obtenido = 30 $\rightarrow$ Estado: `RECHAZADO`.