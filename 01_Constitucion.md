# Constitución del Sistema MIRA - Entrega 2

## Principios de Diseño e Implementación
1. **Retención Documental Legal (DEC-01):**
   - La arquitectura de MongoDB Atlas debe contemplar la persistencia inalterable de los expedientes y la evidencia por 5 años sin eliminación prematura, cumpliendo normativas legales de auditoría.
2. **Stack Tecnológico Obligatorio (DEC-05):**
   - Frontend: React.js.
   - Backend: Node.js (Express) con arquitectura REST/JSON.
   - Base de Datos: MongoDB Atlas (instancia Cloud para ejecución directa sin dependencias locales).
3. **Parametrización Dinámica de Umbrales (DEC-06):**
   - La toma de decisiones (F4) debe consultar dinámicamente las reglas y valores límites configurados desde el módulo de administración (F5), eliminando valores estáticos (*hardcoded*).
4. **Representación del Cliente:**
   - La validación de requerimientos y criterios de aceptación en esta fase la ejerce Max Latuz (rotación obligatoria).
5. **Metodología y Trazabilidad SDD:**
   - Desarrollo guiado por especificaciones con método iterativo SDD.
   - Todo artefacto de código, tarea y prueba debe enlazar explícitamente a una especificación de las funcionalidades F4 o F5 conservando el ID original de la Entrega 1.