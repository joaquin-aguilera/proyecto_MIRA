# Constitución del Sistema MIRA - Entrega 2

## Principios de Diseño e Implementación
1. **Stack Tecnológico Obligatorio (DEC-01 / E2):**
   - Frontend: React.js.
   - Backend: Node.js (Express) con arquitectura REST/JSON.
   - Base de Datos: MongoDB Atlas (instancia Cloud para ejecución directa sin dependencias locales).
2. **Parametrización Dinámica de Umbrales (Resolución de Hallazgo E1 / DEC-02):**
   - La toma de decisiones (F4) debe consultar dinámicamente las reglas y valores límites configurados desde el módulo de administración (F5), eliminando valores estáticos (*hardcoded*).
3. **Representación del Cliente:**
   - La validación de requerimientos y criterios de aceptación en esta fase la ejerce Max Latuz (rotación obligatoria).
4. **Metodología y Trazabilidad SDD:**
   - Desarrollo guiado por especificaciones con GitHub Spec Kit.
   - Todo artefacto de código, tarea y prueba debe enlazar explícitamente a una especificación de las funcionalidades F4 o F5.