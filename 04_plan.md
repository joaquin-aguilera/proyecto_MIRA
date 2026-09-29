# Plan Técnico - Incremento MIRA (F4 y F5)

## 1. Arquitectura y Stack Tecnológico
*   **Frontend:** React.js para los paneles de administración de umbrales.
*   **Backend:** Node.js (Express) para el motor de reglas y validación de firma.
*   **Base de Datos:** MongoDB Atlas (Cloud).
*   **Entorno:** Despliegue de servicios en entorno local (Windows) para la comprobación de la API REST.

## 2. Modelo de Datos (Esquemas Base)
*   `Umbrales`: Almacenará `umbral_aprobacion`, `umbral_rechazo`, `pesos_señales`, `estado_publicacion` (Pendiente/Activo), `version`, y referencias a autor y aprobador (Oficial Cumplimiento).
*   `Casos`: Almacenará `caso_id`, `puntaje_total`, `estado_resolucion`, y el número de `version_umbral` bajo el cual ingresó el caso para garantizar el aislamiento exigido por RF-05.
*   `Auditoria`: Colección de solo inserción (Append-only) para cumplir con la retención legal de 5 años (DEC-01) y asegurar la inalterabilidad (RNF-02).

## 3. Cobertura y Verificación de Requisitos No Funcionales (RNF)
*   **RNF-01 (Límites y Asincronía):** El backend de F4 se implementará mediante endpoints asincrónicos, simulando colas de procesamiento para evitar caídas bajo límite de peticiones (DEC-03).
*   **RNF-02 (Seguridad y Auditoría inalterable):** Se implementará un middleware en Mongoose que intercepte todas las actualizaciones de `Umbrales` (F5) y Decisiones (F4), insertando un registro inmutable antes de procesar el guardado.
*   **RNF-05 (Firma de Cumplimiento):** El endpoint de guardado en F5 generará un token de autorización. El flujo no pasará a "Activo" hasta que se valide dicho token en un endpoint secundario simulando la firma electrónica.