# Lista de Tareas de Implementación

- [ ] **Tarea 1 (Modelado DB):** Crear esquemas de Mongoose para `Umbrales`, `Casos` y `Auditoria`, asegurando el versionado de los documentos (Soporta RF-05 y RNF-02).
- [ ] **Tarea 2 (Backend F5 - Gestión):** Crear endpoint `POST /api/umbrales` que guarde la propuesta en estado inactivo y registre la acción en Auditoría. (Soporta SPEC-F5).
- [ ] **Tarea 3 (Backend F5 - Firma):** Crear endpoint `PATCH /api/umbrales/:id/firma` que simule la firma electrónica del Oficial de Cumplimiento y pase el umbral a estado Activo (Soporta RNF-05 y CU-03).
- [ ] **Tarea 4 (Backend F4 - Motor):** Crear endpoint asincrónico `POST /api/casos/evaluar` que calcule la fórmula de puntajes usando la versión específica del umbral que el caso tenía al iniciar, cambiando el estado a APROBADO, RECHAZADO o DERIVADO (Soporta RF-01, RF-02 y RF-05).
- [ ] **Tarea 5 (Frontend F5):** Desarrollar la vista en React.js que consuma `GET /api/umbrales` y permita enviar modificaciones con validación de que el rechazo no supere a la aprobación (AC-F5-03).
- [ ] **Tarea 6 (Pruebas Automatizadas):** Escribir tests en Jest/Supertest que cubran las pruebas funcionales PF-01 (Cálculo de puntaje), PF-02 (Derivación) y PF-05 (Aislamiento de versión ante actualización).