import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [activo, setActivo] = useState(null);
  const [pendientes, setPendientes] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Rol Activo en la Interfaz (Separación de Perfiles)
  const [rolActivo, setRolActivo] = useState('ADMIN'); // 'ADMIN' (Diseñador de Riesgo) o 'CUMPLIMIENTO' (Oficial)
  
  // Estado para Modal de Rechazo Integrado
  const [modalRechazoAbierto, setModalRechazoAbierto] = useState(false);
  const [propuestaIdARechazar, setPropuestaIdARechazar] = useState(null);
  const [motivoRechazoTexto, setMotivoRechazoTexto] = useState('La política incrementa excesivamente el riesgo operativo de la aseguradora sin respaldo actuarial suficiente.');

  // Estados del Formulario (Admin)
  const [aprobacion, setAprobacion] = useState(85);
  const [rechazo, setRechazo] = useState(45);
  const [autor, setAutor] = useState('Joaquín Aguilera (Diseñador)');
  const [pesoFraude, setPesoFraude] = useState(0.4);
  const [pesoIngresos, setPesoIngresos] = useState(0.3);
  const [pesoIdentidad, setPesoIdentidad] = useState(0.3);

  // Estados de Firma (Oficial de Cumplimiento)
  const [oficial, setOficial] = useState('Max Latuz (Oficial de Cumplimiento)');
  const [tokenFirma, setTokenFirma] = useState('SIG-TOKEN-MIRA-2026');

  // Alertas
  const [errorValidacion, setErrorValidacion] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // Cargar datos del Backend
  const cargarDatos = async () => {
    try {
      setCargando(true);
      const res = await fetch(`${API_BASE}/umbrales`);
      const data = await res.json();
      if (data.success) {
        setActivo(data.activo);
        setPendientes(data.pendientes);
        setHistorial(data.historial);
      }
    } catch (err) {
      console.error('Error conectando con la API:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Validación en vivo de regla de negocio AC-F5-03
  useEffect(() => {
    const numAprob = Number(aprobacion);
    const numRech = Number(rechazo);

    if (numAprob < 0 || numAprob > 100 || numRech < 0 || numRech > 100) {
      setErrorValidacion('Los umbrales deben ubicarse estrictamente entre 0 y 100.');
    } else if (numRech >= numAprob) {
      setErrorValidacion('Violación AC-F5-03: El umbral de rechazo no puede ser mayor o igual al de aprobación.');
    } else {
      setErrorValidacion('');
    }
  }, [aprobacion, rechazo]);

  // Manejador para proponer nuevo umbral (POST /api/umbrales - Tarea 2)
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
          pesos_senales: {
            fraude: Number(pesoFraude),
            ingresos: Number(pesoIngresos),
            identidad: Number(pesoIdentidad)
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        setMensajeExito('Propuesta registrada en estado PENDIENTE. Notificada al Oficial de Cumplimiento.');
        setTimeout(() => setMensajeExito(''), 6000);
        cargarDatos();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Error al enviar propuesta: ' + err.message);
    }
  };

  // Manejador para firmar y activar umbral (PATCH /api/umbrales/:id/firma - Tarea 3)
  const handleFirmar = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/umbrales/${id}/firma`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oficial_cumplimiento: oficial,
          token_firma: tokenFirma
        })
      });

      const data = await res.json();
      if (data.success) {
        setMensajeExito('¡Firma estampada exitosamente! Nueva política desplegada en producción (CU-03).');
        setTimeout(() => setMensajeExito(''), 6000);
        cargarDatos();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Error en firma de cumplimiento: ' + err.message);
    }
  };

  // Abrir Modal de Rechazo
  const abrirModalRechazo = (id) => {
    setPropuestaIdARechazar(id);
    setModalRechazoAbierto(true);
  };

  // Confirmar Rechazo en el Modal
  const confirmarRechazo = async () => {
    if (!motivoRechazoTexto.trim()) {
      alert('Debe ingresar un motivo formal de rechazo.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/umbrales/${propuestaIdARechazar}/rechazar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oficial_cumplimiento: oficial,
          motivo_rechazo: motivoRechazoTexto
        })
      });

      const data = await res.json();
      if (data.success) {
        setMensajeExito('Propuesta formalmente rechazada por Cumplimiento. Producción permanece intacta.');
        setModalRechazoAbierto(false);
        setPropuestaIdARechazar(null);
        setTimeout(() => setMensajeExito(''), 6000);
        cargarDatos();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Error al rechazar propuesta: ' + err.message);
    }
  };

  return (
    <div className="container">
      <header>
        <div>
          <h1>MIRA — Plataforma de Inteligencia Multimodal</h1>
          <p style={{ color: 'var(--text-muted)' }}>Módulo F5: Gestión y Gobernanza de Reglas de Decisión</p>
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
            <span>Configuración Activa en Producción</span>
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


