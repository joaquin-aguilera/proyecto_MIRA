import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  // Estados para Umbrales y Gobernanza F5
  const [activo, setActivo] = useState(null);
  const [pendientes, setPendientes] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Perfil Operativo (Simulación de Roles)
  const [rolActivo, setRolActivo] = useState('ADMIN'); // 'ADMIN' (Diseñador) o 'CUMPLIMIENTO' (Oficial)
  const [autor, setAutor] = useState('Max Latuz (Diseñador)');
  const [oficial, setOficial] = useState('Max Latuz (Oficial Cumplimiento)');
  const [tokenFirma, setTokenFirma] = useState('FIRM-OFICIAL-SEC-2026-X');

  // Formulario de Propuesta F5
  const [aprobacion, setAprobacion] = useState(80);
  const [rechazo, setRechazo] = useState(40);
  const [errorValidacion, setErrorValidacion] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // Modal de Rechazo Normativo (CU-03 Flujo 5a)
  const [modalRechazoAbierto, setModalRechazoAbierto] = useState(false);
  const [idRechazoActual, setIdRechazoActual] = useState(null);
  const [motivoRechazoTexto, setMotivoRechazoTexto] = useState('');

  // Estados para Visor y Evaluador de Casos F4
  const [casoSeleccionado, setCasoSeleccionado] = useState('caso_01');
  const [resultadoF4, setResultadoF4] = useState(null);
  const [evaluandoF4, setEvaluandoF4] = useState(false);
  const [versionFijadaManual, setVersionFijadaManual] = useState('');

  // Casos didácticos predefinidos para la demo (Cap. 4.3 de la pauta)
  const casosDidacticosDemo = {
    caso_01: {
      id: 'CASO-DIDACTICO-001',
      titulo: 'Caso 1: Aprobación Directa (Señales altas: 95, 90, 85)',
      senales: [
        { nombre: 'fraude', valor: 95, minimo_propio: 60 },
        { nombre: 'ingresos', valor: 90, minimo_propio: 60 },
        { nombre: 'identidad', valor: 85, minimo_propio: 60 }
      ],
      fraude_activo: false
    },
    caso_02: {
      id: 'CASO-DIDACTICO-002',
      titulo: 'Caso 2: Derivado a Revisión Manual (Puntaje intermedio: 75 pts)',
      senales: [
        { nombre: 'fraude', valor: 75, minimo_propio: 60 },
        { nombre: 'ingresos', valor: 80, minimo_propio: 60 },
        { nombre: 'identidad', valor: 70, minimo_propio: 60 }
      ],
      fraude_activo: false
    },
    caso_02_minimo: {
      id: 'CASO-DIDACTICO-002-MINIMO',
      titulo: 'Caso 2B: Derivado por Mínimo Propio Incumplido (Identidad = 55 < 60)',
      senales: [
        { nombre: 'fraude', valor: 95, minimo_propio: 60 },
        { nombre: 'ingresos', valor: 90, minimo_propio: 60 },
        { nombre: 'identidad', valor: 55, minimo_propio: 60 }
      ],
      fraude_activo: false
    },
    caso_03: {
      id: 'CASO-DIDACTICO-003',
      titulo: 'Caso 3: Rechazo Directo por Precedencia de Fraude (Fraude = TRUE)',
      senales: [
        { nombre: 'fraude', valor: 95, minimo_propio: 60 },
        { nombre: 'ingresos', valor: 95, minimo_propio: 60 },
        { nombre: 'identidad', valor: 95, minimo_propio: 60 }
      ],
      fraude_activo: true
    }
  };

  // Cargar datos del backend
  const cargarDatos = async () => {
    try {
      const res = await fetch(`${API_BASE}/umbrales`);
      const data = await res.json();

      if (data.success) {
        if (data.activo) {
          setActivo(data.activo);
          setAprobacion(data.activo.umbral_aprobacion);
          setRechazo(data.activo.umbral_rechazo);
        } else {
          setActivo(null);
        }
        if (data.pendientes) setPendientes(data.pendientes);
        if (data.historial) setHistorial(data.historial);
      }
    } catch (err) {
      console.error('Error al conectar con la API de MIRA:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Validación de regla de negocio en tiempo real (AC-F5-03)
  useEffect(() => {
    const valAprob = Number(aprobacion);
    const valRech = Number(rechazo);

    if (valAprob <= valRech) {
      setErrorValidacion('Inconsistencia: El Umbral de Aprobación debe ser estrictamente MAYOR que el Umbral de Rechazo.');
    } else if (valAprob < 0 || valAprob > 100 || valRech < 0 || valRech > 100) {
      setErrorValidacion('Rango Inválido: Los umbrales deben situarse entre 0 y 100 puntos.');
    } else {
      setErrorValidacion('');
    }
  }, [aprobacion, rechazo]);

  // Manejador para proponer nuevo umbral (Pasa a PENDIENTE)
  const handleProponer = async (e) => {
    e.preventDefault();
    if (errorValidacion) return;

    try {
      const res = await fetch(`${API_BASE}/umbrales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          umbral_aprobacion: Number(aprobacion),
          umbral_rechazo: Number(rechazo),
          autor_modificacion: autor,
          pesos_senales: activo ? activo.pesos_senales : { fraude: 0.4, ingresos: 0.35, identidad: 0.25 }
        })
      });

      const data = await res.json();
      if (data.success) {
        setMensajeExito(`✓ Propuesta de Versión ${data.data.version} enviada a Cumplimiento.`);
        setTimeout(() => setMensajeExito(''), 5000);
        cargarDatos();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Error de conexión al enviar la propuesta: ' + err.message);
    }
  };

  // Manejador para firmar y activar propuesta
  const handleFirmar = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/umbrales/${id}/firma`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firmado_por: oficial,
          token_autorizacion: tokenFirma
        })
      });

      const data = await res.json();
      if (data.success) {
        setMensajeExito(`✓ ¡Éxito! Versión ${data.data.version} aprobada y desplegada como ACTIVA en producción.`);
        setTimeout(() => setMensajeExito(''), 5000);
        cargarDatos();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Error al firmar la política: ' + err.message);
    }
  };

  // Manejador para abrir modal de rechazo
  const abrirModalRechazo = (id) => {
    setIdRechazoActual(id);
    setMotivoRechazoTexto('');
    setModalRechazoAbierto(true);
  };

  // Confirmar rechazo normativo (Flujo 5a)
  const confirmarRechazo = async () => {
    if (!motivoRechazoTexto.trim()) {
      alert('Debe especificar un motivo legal o técnico para el rechazo.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/umbrales/${idRechazoActual}/rechazar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motivo_rechazo: motivoRechazoTexto,
          rechazado_por: oficial
        })
      });

      const data = await res.json();
      if (data.success) {
        setModalRechazoAbierto(false);
        setMensajeExito(`✕ Propuesta rechazada y archivada con motivo formal.`);
        setTimeout(() => setMensajeExito(''), 5000);
        cargarDatos();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Error al procesar el rechazo: ' + err.message);
    }
  };

  // Evaluar caso contra Motor F4 (POST /api/casos/evaluar)
  const handleEvaluarCasoF4 = async () => {
    try {
      setEvaluandoF4(true);
      const caso = casosDidacticosDemo[casoSeleccionado];
      
      const payload = {
        caso_id: caso.id,
        datos_evaluacion: {
          senales: caso.senales,
          senal_fraude_activa: caso.fraude_activo
        },
        autor: rolActivo === 'ADMIN' ? autor : oficial
      };

      if (versionFijadaManual) {
        payload.version_umbral = Number(versionFijadaManual);
      }

      const res = await fetch(`${API_BASE}/casos/evaluar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setResultadoF4(data.data);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Error evaluando caso en F4: ' + err.message);
    } finally {
      setEvaluandoF4(false);
    }
  };

  if (cargando) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h2>Conectando con la plataforma MIRA...</h2>
        <p style={{ color: 'var(--text-muted)' }}>Cargando motor de decisiones y configuración de umbrales.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <div>
          <h1>MIRA — Plataforma de Inteligencia Multimodal</h1>
          <p style={{ color: 'var(--text-muted)' }}>Incremento Integrado: Gestión de Reglas (F5) y Motor de Decisión (F4)</p>
        </div>
        
        {/* SELECTOR DE PERFILES PARA DEMOSTRACIÓN */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Perfil Operativo:</span>
          <select 
            value={rolActivo} 
            onChange={(e) => setRolActivo(e.target.value)}
            style={{ width: 'auto', background: '#1E293B', fontWeight: 600, color: '#60A5FA', borderColor: '#3B82F6' }}
          >
            <option value="ADMIN">👤 Diseñador de Riesgo (Propone)</option>
            <option value="CUMPLIMIENTO">🛡️ Oficial de Cumplimiento (Audita y Firma)</option>
          </select>
        </div>
      </header>

      {mensajeExito && <div className="alert alert-success">{mensajeExito}</div>}

      <div className="grid-layout">
        {/* COLUMNA 1: ESTADO ACTIVO ACTUAL */}
        <div className="card">
          <div className="card-title">
            <span>Configuración Activa en Producción (F5)</span>
            {activo && <span className="badge badge-success">Versión {activo.version}</span>}
          </div>

          {activo ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="stat-box">
                  <div className="stat-value" style={{ color: 'var(--success)' }}>≥ {activo.umbral_aprobacion}</div>
                  <div className="stat-label">Aprobación Automática</div>
                </div>
                <div className="stat-box">
                  <div className="stat-value" style={{ color: 'var(--danger)' }}>≤ {activo.umbral_rechazo}</div>
                  <div className="stat-label">Rechazo Automático</div>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label>Ponderación de Señales de Riesgo:</label>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <div>• Fraude: <strong>{(activo.pesos_senales?.fraude * 100).toFixed(0)}%</strong></div>
                  <div>• Ingresos: <strong>{(activo.pesos_senales?.ingresos * 100).toFixed(0)}%</strong></div>
                  <div>• Identidad: <strong>{(activo.pesos_senales?.identidad * 100).toFixed(0)}%</strong></div>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <div>Firmado por: <strong style={{ color: '#60A5FA' }}>{activo.firma_cumplimiento?.firmado_por || 'Sistema'}</strong></div>
                <div>Fecha de entrada en vigor: {new Date(activo.updatedAt).toLocaleString()}</div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No hay un umbral activo actualmente en producción.
            </div>
          )}
        </div>

        {/* COLUMNA 2: ACCIÓN SEGÚN EL PERFIL SELECCIONADO */}
        {rolActivo === 'ADMIN' ? (
          <div className="card">
            <div className="card-title">
              <span>Proponer Nueva Política de Umbrales</span>
              <span className="badge badge-warning">Perfil: Diseñador</span>
            </div>

            {errorValidacion && <div className="alert alert-danger">{errorValidacion}</div>}

            <form onSubmit={handleProponer}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Umbral Aprobación (0 - 100)</label>
                  <input
                    type="number"
                    value={aprobacion}
                    onChange={(e) => setAprobacion(e.target.value)}
                    min="0"
                    max="100"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Umbral Rechazo (0 - 100)</label>
                  <input
                    type="number"
                    value={rechazo}
                    onChange={(e) => setRechazo(e.target.value)}
                    min="0"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Autor de la Modificación</label>
                <input
                  type="text"
                  value={autor}
                  onChange={(e) => setAutor(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={!!errorValidacion}
              >
                Enviar a Revisión de Cumplimiento (Pasa a Pendiente)
              </button>
            </form>
          </div>
        ) : (
          <div className="card" style={{ borderColor: 'var(--border-focus)' }}>
            <div className="card-title">
              <span>Panel del Oficial de Cumplimiento</span>
              <span className="badge badge-success">Perfil: Max Latuz</span>
            </div>

            <div className="form-group">
              <label>Identificación de Firma Digital:</label>
              <input 
                type="text" 
                value={oficial} 
                onChange={(e) => setOficial(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Token Criptográfico de Autorización:</label>
              <input 
                type="text" 
                value={tokenFirma} 
                onChange={(e) => setTokenFirma(e.target.value)} 
                required 
              />
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              🛡️ <em>Como Oficial de Cumplimiento, su rol es auditar las propuestas técnicas en la bandeja inferior y autorizar o rechazar su paso a producción.</em>
            </p>
          </div>
        )}
      </div>

      {/* BANDEJA DE PROPUESTAS PENDIENTES DE CUMPLIMIENTO */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-title">
          <span>Bandeja de Cumplimiento (Propuestas Pendientes de Firma - RNF-05)</span>
          <span className="badge badge-warning">{pendientes.length} Pendiente(s)</span>
        </div>

        {pendientes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No hay propuestas pendientes de revisión.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Versión Solicitada</th>
                  <th>Rangos Propuestos</th>
                  <th>Autor Técnico</th>
                  <th>Fecha Solicitud</th>
                  <th>Decisión de Cumplimiento</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.map((p) => (
                  <tr key={p._id}>
                    <td><strong>Versión {p.version}</strong></td>
                    <td>≥ {p.umbral_aprobacion} / ≤ {p.umbral_rechazo}</td>
                    <td>{p.autor_modificacion}</td>
                    <td>{new Date(p.createdAt).toLocaleTimeString()}</td>
                    <td>
                      {rolActivo === 'CUMPLIMIENTO' ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleFirmar(p._id)}
                            className="btn btn-success"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                          >
                            ✓ Firmar y Desplegar
                          </button>
                          <button
                            onClick={() => abrirModalRechazo(p._id)}
                            className="btn btn-primary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', backgroundColor: '#DC2626' }}
                          >
                            ✕ Rechazar
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          🔒 Requiere rol Oficial de Cumplimiento
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VISOR Y EVALUADOR INTERACTIVO: MOTOR DE DECISIÓN F4 EN VIVO */}
      <div className="card" style={{ marginBottom: '2rem', border: '1px solid #3B82F6', background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)' }}>
        <div className="card-title" style={{ color: '#60A5FA' }}>
          <span>⚡ Visor y Evaluador de Casos Didácticos (Motor F4 ↔ Reglas F5)</span>
          <span className="badge badge-blue">Regla 4.2: Productor F5 → Consumidor F4</span>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
          Demuestra la conexión directa del incremento: El motor algorítmico F4 consume dinámicamente la versión activa de F5 (o una versión archivada para aislamiento <code>RF-05</code>) y ejecuta la evaluación multicriterio.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
          {/* LADO IZQUIERDO: SELECTOR E INSPECTOR VISUAL DE ENTRADA */}
          <div>
            <div className="form-group">
              <label>Seleccionar Caso Didáctico de Prueba (Cap. 4.3):</label>
              <select 
                value={casoSeleccionado} 
                onChange={(e) => { setCasoSeleccionado(e.target.value); setResultadoF4(null); }}
                style={{ background: '#1E293B', color: '#F1F5F9', fontWeight: 600 }}
              >
                <option value="caso_01">Caso 1: Aprobación Directa (Puntaje alto 90.5 pts)</option>
                <option value="caso_02">Caso 2: Derivación a Revisión Manual (Puntaje 75 pts)</option>
                <option value="caso_02_minimo">Caso 2B: Derivación por Mínimo Propio Incumplido (Identidad 55 &lt; 60)</option>
                <option value="caso_03">Caso 3: Rechazo Directo por Precedencia de Fraude</option>
              </select>
            </div>

            {/* VISOR DE PARÁMETROS ENTRANTES */}
            {casosDidacticosDemo[casoSeleccionado] && (
              <div style={{ background: '#0F172A', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    Inspección de Entrada ({casosDidacticosDemo[casoSeleccionado].id})
                  </span>
                  {casosDidacticosDemo[casoSeleccionado].fraude_activo ? (
                    <span className="badge badge-danger">⚠️ Fraude: ACTIVO</span>
                  ) : (
                    <span className="badge badge-success">✓ Fraude: Inactivo</span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                  {casosDidacticosDemo[casoSeleccionado].senales.map((s) => (
                    <div key={s.nombre} style={{ background: '#1E293B', padding: '0.4rem', borderRadius: '4px', border: s.valor < s.minimo_propio ? '1px solid #EF4444' : '1px solid #334155' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{s.nombre}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: s.valor < s.minimo_propio ? '#F87171' : '#60A5FA' }}>{s.valor}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Mín: {s.minimo_propio}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Aislamiento de Versión (RF-05 / Opcional):</label>
              <input 
                type="number" 
                placeholder="Dejar vacío para usar versión activa actual" 
                value={versionFijadaManual}
                onChange={(e) => setVersionFijadaManual(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Permite evaluar el caso contra políticas archivadas para garantizar reproducibilidad legal.</span>
            </div>

            <button 
              onClick={handleEvaluarCasoF4} 
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontWeight: 600, fontSize: '0.95rem' }}
              disabled={evaluandoF4}
            >
              {evaluandoF4 ? 'Evaluando caso en el motor...' : '🚀 Ejecutar Evaluación en Motor F4'}
            </button>
          </div>

          {/* LADO DERECHO: VISOR DE VEREDICTO RESULTANTE */}
          <div style={{ background: 'var(--bg-card-subtle)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <h4 style={{ fontSize: '0.95rem', margin: 0, color: '#E2E8F0' }}>Veredicto Emitido por F4:</h4>
                {resultadoF4 && (
                  <span className="badge badge-success">Versión Aplicada: v{resultadoF4.version_umbral_aplicada}</span>
                )}
              </div>
              
              {resultadoF4 ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', background: '#0F172A', padding: '0.7rem 1rem', borderRadius: '6px' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                      {resultadoF4.estado_decision === 'APROBADO' && <span style={{ color: 'var(--success)' }}>🟢 APROBADO</span>}
                      {resultadoF4.estado_decision === 'DERIVADO' && <span style={{ color: 'var(--warning)' }}>🟡 DERIVADO</span>}
                      {resultadoF4.estado_decision === 'RECHAZADO' && <span style={{ color: 'var(--danger)' }}>🔴 RECHAZADO</span>}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>| Puntaje: <strong style={{ color: '#F8FAFC' }}>{resultadoF4.puntaje_obtenido} pts</strong></span>
                  </div>

                  <div style={{ fontSize: '0.85rem', lineHeight: '1.5', color: '#CBD5E1' }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#94A3B8' }}>Justificación / Motivo:</strong>
                      <div style={{ background: '#1E293B', padding: '0.5rem', borderRadius: '4px', marginTop: '0.3rem', fontSize: '0.8rem', borderLeft: '3px solid #3B82F6' }}>
                        {resultadoF4.motivo_decision}
                      </div>
                    </div>

                    <div style={{ marginTop: '0.8rem', borderTop: '1px solid var(--border)', paddingTop: '0.6rem', fontSize: '0.8rem' }}>
                      <span style={{ color: '#94A3B8', fontWeight: 600 }}>Desglose Ponderado (Σ Valor × Peso):</span>
                      <div style={{ marginTop: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {resultadoF4.desglose_senales?.map((s, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '0.75rem', background: '#0F172A', padding: '0.2rem 0.5rem', borderRadius: '3px' }}>
                            <span>• {s.nombre}: {s.valor_obtenido} × {(s.peso_aplicado * 100).toFixed(0)}%</span>
                            <span style={{ color: '#60A5FA', fontWeight: 600 }}>+{s.aporte_puntaje} pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>
                    Seleccione un caso didáctico a la izquierda y presione <strong>"Ejecutar Evaluación"</strong> para visualizar el veredicto del motor algorítmico.
                  </p>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Motor: <code>POST /api/casos/evaluar</code></span>
              <span>Inmutabilidad: <code>RNF-02</code></span>
            </div>
          </div>
        </div>
      </div>

      {/* HISTORIAL DE AUDITORÍA Y VERSIONES ANTERIORES */}
      {historial.length > 0 && (
        <div className="card">
          <div className="card-title">Historial de Políticas Archivadas y Decisiones (Auditoría inalterable)</div>
          <div className="table-container">
            <table style={{ tableLayout: 'fixed', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '12%' }}>Versión</th>
                  <th style={{ width: '15%' }}>Rangos</th>
                  <th style={{ width: '18%' }}>Autor Original</th>
                  <th style={{ width: '38%' }}>Estado / Resolución</th>
                  <th style={{ width: '17%', textAlign: 'right' }}>Fecha Registro</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h) => (
                  <tr key={h._id}>
                    <td><strong>Versión {h.version}</strong></td>
                    <td>≥ {h.umbral_aprobacion} / ≤ {h.umbral_rechazo}</td>
                    <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.autor_modificacion}
                    </td>
                    <td style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', lineHeight: '1.4', fontSize: '0.85rem' }}>
                      {h.estado_publicacion === 'RECHAZADO' ? (
                        <span style={{ color: '#F87171', fontWeight: 600 }}>
                          ✕ RECHAZADO: <span style={{ fontWeight: 400, color: '#FCA5A5' }}>{h.motivo_rechazo}</span>
                        </span>
                      ) : (
                        <span style={{ color: '#34D399', fontWeight: 600 }}>
                          ✓ APROBADO <span style={{ fontWeight: 400, color: '#A7F3D0' }}>(Firma: {h.firma_cumplimiento?.firmado_por || 'Sistema'})</span>
                        </span>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(h.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL INTEGRADO DE RECHAZO NORMATIVO */}
      {modalRechazoAbierto && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ maxWidth: '550px', width: '90%', border: '1px solid #DC2626' }}>
            <div className="card-title" style={{ color: '#F87171' }}>
              <span>🛡️ Rechazo Normativo de Cumplimiento</span>
              <span className="badge badge-danger">CU-03 Flujo 5a</span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Como Oficial de Cumplimiento, declare formalmente el motivo legal, técnico o actuarial por el cual esta propuesta no puede ser desplegada en producción.
            </p>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <label style={{ margin: 0 }}>Motivo del Rechazo:</label>
                <span style={{ fontSize: '0.75rem', color: motivoRechazoTexto.length >= 300 ? '#EF4444' : 'var(--text-muted)' }}>
                  {motivoRechazoTexto.length} / 300 caracteres
                </span>
              </div>
              <textarea
                rows={4}
                maxLength={300}
                value={motivoRechazoTexto}
                onChange={(e) => setMotivoRechazoTexto(e.target.value)}
                style={{ resize: 'vertical' }}
                placeholder="Especifique las razones del rechazo (máximo 300 caracteres)..."
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button 
                onClick={() => setModalRechazoAbierto(false)} 
                className="btn"
                style={{ background: '#374151', color: '#fff' }}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarRechazo} 
                className="btn"
                style={{ backgroundColor: '#DC2626', color: '#fff' }}
              >
                Confirmar Rechazo y Archivar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
