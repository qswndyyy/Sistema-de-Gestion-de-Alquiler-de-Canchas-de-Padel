

/* --------------------------------------------------------------------------
   ALMACÉN
   
   -------------------------------------------------------------------------- */
const CLAVE_DB     = 'padelconnect_db_v2';
const CLAVE_SESION = 'padelconnect_sesion_v2';

const _memoria = {};

const Almacen = {
  leer(clave) {
    try { return localStorage.getItem(clave); }
    catch (e) { return _memoria[clave] ?? null; }
  },
  escribir(clave, valor) {
    try { localStorage.setItem(clave, valor); }
    catch (e) { _memoria[clave] = valor; }
  },
  borrar(clave) {
    try { localStorage.removeItem(clave); }
    catch (e) { delete _memoria[clave]; }
  }
};

/* --------------------------------------------------------------------------
   UTILIDADES DE FECHA
   -------------------------------------------------------------------------- */
function hoyISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);            // "2026-09-17"
}

function sumarDias(fechaISO, dias) {
  const d = new Date(fechaISO + 'T12:00:00');
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function fechaLinda(fechaISO) {
  const dias  = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const d = new Date(fechaISO + 'T12:00:00');
  if (fechaISO === hoyISO())             return 'Hoy';
  if (fechaISO === sumarDias(hoyISO(),1)) return 'Mañana';
  return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`;
}

/* Formatea un número como precio argentino: 14000 -> "$14.000" */
function precio(n) {
  return '$' + Math.round(n).toLocaleString('es-AR');
}

/* --------------------------------------------------------------------------
   DATOS INICIALES (la "semilla")
  
   -------------------------------------------------------------------------- */
function semilla() {
  return {
    /* ---- usuarios: los 3 roles conviven en la misma lista, igual que en la
       tabla `usuarios` del schema.sql ---- */
    usuarios: [
      { id: 1, nombre: 'Juan Pérez',      email: 'juan@demo.com',   contrasena: '1234', rol: 'cliente',       categoria: '5ta' },
      { id: 2, nombre: 'Sofía Ramírez',   email: 'sofi@demo.com',   contrasena: '1234', rol: 'cliente',       categoria: '4ta' },
      { id: 3, nombre: 'Club Nogal',      email: 'club@demo.com',   contrasena: '1234', rol: 'proveedor',     categoria: '-'   },
      { id: 4, nombre: 'Admin General',   email: 'admin@demo.com',  contrasena: '1234', rol: 'administrador', categoria: '-'   },
      { id: 5, nombre: 'Martín Gómez',    email: 'martin@demo.com', contrasena: '1234', rol: 'cliente',       categoria: '6ta' },
      { id: 6, nombre: 'Lucía Fernández', email: 'lucia@demo.com',  contrasena: '1234', rol: 'cliente',       categoria: '3ra' },
      { id: 7, nombre: 'Diego Suárez',    email: 'diego@demo.com',  contrasena: '1234', rol: 'cliente',       categoria: '5ta' },
      { id: 8, nombre: 'Norte Pádel',     email: 'norte@demo.com',  contrasena: '1234', rol: 'proveedor',     categoria: '-'   }
    ],

    /* ---- canchas: cada una pertenece a un proveedor ---- */
    canchas: [
      { id: 1, id_proveedor: 3, nombre: 'Cancha 1', club: 'Club Nogal',  ubicacion: 'Palermo',       tipo: 'Cristal',  techada: true,  precio_hora: 14000, activa: true },
      { id: 2, id_proveedor: 3, nombre: 'Cancha 2', club: 'Club Nogal',  ubicacion: 'Palermo',       tipo: 'Cristal',  techada: true,  precio_hora: 14000, activa: true },
      { id: 3, id_proveedor: 3, nombre: 'Cancha 3', club: 'Club Nogal',  ubicacion: 'Palermo',       tipo: 'Cemento',  techada: false, precio_hora: 11000, activa: true },
      { id: 4, id_proveedor: 8, nombre: 'Cancha A', club: 'Norte Pádel', ubicacion: 'Belgrano',      tipo: 'Cemento',  techada: false, precio_hora: 11500, activa: true },
      { id: 5, id_proveedor: 8, nombre: 'Cancha B', club: 'Norte Pádel', ubicacion: 'Belgrano',      tipo: 'Cristal',  techada: true,  precio_hora: 15000, activa: true },
      { id: 6, id_proveedor: 8, nombre: 'Cancha C', club: 'Norte Pádel', ubicacion: 'Villa Urquiza', tipo: 'Cristal',  techada: false, precio_hora: 12500, activa: true },
      { id: 7, id_proveedor: 3, nombre: 'Cancha 4', club: 'Club Nogal',  ubicacion: 'Caballito',     tipo: 'Cemento',  techada: true,  precio_hora: 12000, activa: true },
      { id: 8, id_proveedor: 8, nombre: 'Cancha D', club: 'Norte Pádel', ubicacion: 'Caballito',     tipo: 'Cristal',  techada: true,  precio_hora: 13500, activa: true }
    ],

    
    reservas: [
      {
        id: 1, id_cancha: 1, id_cliente: 1, fecha: sumarDias(hoyISO(), 1), hora: '20:00',
        tipo_reserva: 'equipo', estado: 'confirmada', total: 14000,
        jugadores: [
          { id_usuario: 1, nombre: 'Juan Pérez',      monto: 3500, pagado: true  },
          { id_usuario: 2, nombre: 'Sofía Ramírez',   monto: 3500, pagado: true  },
          { id_usuario: 5, nombre: 'Martín Gómez',    monto: 3500, pagado: false },
          { id_usuario: 7, nombre: 'Diego Suárez',    monto: 3500, pagado: false }
        ]
      },
      {
        id: 2, id_cancha: 5, id_cliente: 2, fecha: sumarDias(hoyISO(), 2), hora: '19:00',
        tipo_reserva: 'individual', estado: 'pendiente', total: 15000,
        jugadores: [ { id_usuario: 2, nombre: 'Sofía Ramírez', monto: 15000, pagado: false } ]
      }
    ],

    /* ---- torneos personalizados ---- */
    torneos: [
      { id: 1, nombre: 'Copa Nogal Verano', id_creador: 3, sede: 'Club Nogal', categoria: '5ta',
        fecha_inicio: sumarDias(hoyISO(), 7), cupo: 16, inscriptos: [1, 2, 5, 7], estado: 'abierto',
        descripcion: 'Torneo de eliminación directa, parejas libres.' },
      { id: 2, nombre: 'Nocturno Belgrano', id_creador: 8, sede: 'Norte Pádel', categoria: 'Libre',
        fecha_inicio: sumarDias(hoyISO(), 14), cupo: 8, inscriptos: [6], estado: 'abierto',
        descripcion: 'Se juega de 21 a 01, formato liguilla.' },
      { id: 3, nombre: 'Apertura Caballito', id_creador: 1, sede: 'Club Nogal', categoria: '6ta',
        fecha_inicio: sumarDias(hoyISO(), -10), cupo: 8, inscriptos: [1, 5, 6, 7], estado: 'finalizado',
        descripcion: 'Torneo cerrado. Campeón: Lucía Fernández.' }
    ],

    /* ---- historial de partidos ---- */
    partidos: [
      { id: 1, id_usuario: 1, fecha: sumarDias(hoyISO(), -3),  cancha: 'Cancha 1 — Club Nogal',  rival: 'Martín Gómez / Diego Suárez', resultado: '6-3 / 6-4', gano: true,  id_torneo: null },
      { id: 2, id_usuario: 1, fecha: sumarDias(hoyISO(), -8),  cancha: 'Cancha B — Norte Pádel', rival: 'Lucía Fernández / Sofía Ramírez', resultado: '4-6 / 5-7', gano: false, id_torneo: null },
      { id: 3, id_usuario: 1, fecha: sumarDias(hoyISO(), -10), cancha: 'Cancha 4 — Club Nogal',  rival: 'Diego Suárez / Sofía Ramírez', resultado: '7-5 / 6-2', gano: true,  id_torneo: 3 },
      { id: 4, id_usuario: 1, fecha: sumarDias(hoyISO(), -17), cancha: 'Cancha A — Norte Pádel', rival: 'Martín Gómez / Lucía Fernández', resultado: '6-1 / 6-4', gano: true,  id_torneo: null }
    ],

    /* ---- movimientos de puntos: el ranking se calcula sumando esto ---- */
    puntos: [
      { id_usuario: 1, cantidad: 120, motivo: 'Victorias del mes',   fecha: sumarDias(hoyISO(), -3) },
      { id_usuario: 1, cantidad: 40,  motivo: 'Partidos jugados',    fecha: sumarDias(hoyISO(), -8) },
      { id_usuario: 2, cantidad: 210, motivo: 'Victorias del mes',   fecha: sumarDias(hoyISO(), -2) },
      { id_usuario: 5, cantidad: 95,  motivo: 'Partidos jugados',    fecha: sumarDias(hoyISO(), -5) },
      { id_usuario: 6, cantidad: 260, motivo: 'Campeona de torneo',  fecha: sumarDias(hoyISO(), -9) },
      { id_usuario: 7, cantidad: 150, motivo: 'Victorias del mes',   fecha: sumarDias(hoyISO(), -4) }
    ],

    /* ---- recompensas canjeables con puntos ---- */
    recompensas: [
      { id: 1, nombre: 'Hora de cancha gratis',   costo: 500, detalle: 'Válido de lunes a jueves antes de las 18.' },
      { id: 2, nombre: '20% off en tu reserva',   costo: 200, detalle: 'Se aplica a la próxima reserva que confirmes.' },
      { id: 3, nombre: 'Tubo de pelotas',         costo: 150, detalle: 'Lo retirás en el club donde jugaste.' },
      { id: 4, nombre: 'Inscripción a torneo',    costo: 350, detalle: 'Cubre la inscripción a un torneo de tu categoría.' }
    ],

    /* ---- notificaciones por usuario ---- */
    notificaciones: [
      { id: 1, id_usuario: 1, mensaje: 'Sofía confirmó su parte del pago de la reserva del viernes.', tipo: 'reserva',      leida: false, fecha: hoyISO() },
      { id: 2, id_usuario: 1, mensaje: 'Recordatorio: mañana 20:00 jugás en Cancha 1 — Club Nogal.',  tipo: 'recordatorio', leida: false, fecha: hoyISO() },
      { id: 3, id_usuario: 1, mensaje: 'Cargaron el resultado de tu último partido: ganaste 6-3 / 6-4.', tipo: 'resultado', leida: true,  fecha: sumarDias(hoyISO(), -3) },
      { id: 4, id_usuario: 1, mensaje: 'Nueva promo: 30% off en horarios de 23:00 en Norte Pádel.',   tipo: 'promocion',    leida: true,  fecha: sumarDias(hoyISO(), -1) }
    ],

    /* ---- promociones: "horas de baja demanda" y "jugadores frecuentes" ---- */
    promociones: [
      { id: 1, id_proveedor: 3, id_cancha: null, tipo: 'horario',    descripcion: 'Horario de baja demanda (13 a 16)', descuento_pct: 20, desde: '13:00', hasta: '16:00', activa: true },
      { id: 2, id_proveedor: 8, id_cancha: null, tipo: 'horario',    descripcion: 'Trasnoche: turnos de 23:00',        descuento_pct: 30, desde: '23:00', hasta: '23:00', activa: true },
      { id: 3, id_proveedor: 3, id_cancha: 1,    tipo: 'frecuentes', descripcion: 'Jugadores frecuentes: 3+ partidos',  descuento_pct: 15, desde: '18:00', hasta: '21:00', activa: true }
    ],

    /* ---- eventos especiales del proveedor: bloquean la cancha ese día ---- */
    eventos: [
      { id: 1, id_cancha: 2, fecha: sumarDias(hoyISO(), 3), nombre: 'Clínica con profe invitado', desde: '18:00', hasta: '22:00' }
    ],

    
    ocupados: [],

    /* contador para generar ids nuevos, como haría el AUTO_INCREMENT */
    ultimo_id: 100
  };
}

/* --------------------------------------------------------------------------
   LECTURA / ESCRITURA DE LA "BASE"
   -------------------------------------------------------------------------- */
function leerDB() {
  const guardado = Almacen.leer(CLAVE_DB);
  if (guardado) {
    try { return JSON.parse(guardado); }
    catch (e) { }
  }
  const nueva = semilla();
  guardarDB(nueva);
  return nueva;
}

function guardarDB(db) {
  Almacen.escribir(CLAVE_DB, JSON.stringify(db));
}

/* Devuelve un id nuevo y lo deja registrado (equivale al AUTO_INCREMENT) */
function nuevoId(db) {
  db.ultimo_id += 1;
  return db.ultimo_id;
}

/* Borra todo y vuelve a los datos de fábrica (botón "Reiniciar demo") */
function reiniciarDemo() {
  Almacen.borrar(CLAVE_DB);
  Almacen.borrar(CLAVE_SESION);
}

/* --------------------------------------------------------------------------
   SESIÓN
   
   -------------------------------------------------------------------------- */
function guardarSesion(idUsuario) {
  Almacen.escribir(CLAVE_SESION, String(idUsuario));
}

function usuarioActual() {
  const id = Almacen.leer(CLAVE_SESION);
  if (!id) return null;
  return leerDB().usuarios.find(u => u.id === Number(id)) || null;
}

function cerrarSesion() {
  Almacen.borrar(CLAVE_SESION);
}

/* --------------------------------------------------------------------------
   DISPONIBILIDAD (el corazón del calendario)

   -------------------------------------------------------------------------- */
const HORAS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00',
               '16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00'];

function _huella(texto) {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) % 997;
  return h;
}

/* Un jugador es "frecuente" si tiene 3 o más partidos cargados.
   Lo usamos para las promos dirigidas a los que juegan seguido. */
function esFrecuente(db, idUsuario) {
  return db.partidos.filter(p => p.id_usuario === idUsuario).length >= 3;
}

function promoAplicable(db, cancha, hora, idUsuario) {
  return db.promociones.find(p =>
    p.activa &&
    p.id_proveedor === cancha.id_proveedor &&
    (p.id_cancha === null || p.id_cancha === cancha.id) &&
    hora >= p.desde && hora <= p.hasta &&
    // las promos para frecuentes solo valen si el jugador cumple la condición
    (p.tipo !== 'frecuentes' || esFrecuente(db, idUsuario))
  ) || null;
}

function turnosDe(db, cancha, fecha, idUsuario) {
  return HORAS.map(hora => {
    // ¿Hay una reserva nuestra o de otro usuario en ese turno?
    const reservado = db.reservas.some(r =>
      r.id_cancha === cancha.id && r.fecha === fecha && r.hora === hora && r.estado !== 'cancelada');

    // ¿Hay un evento especial del club que tape ese horario?
    const evento = db.eventos.some(e =>
      e.id_cancha === cancha.id && e.fecha === fecha && hora >= e.desde && hora < e.hasta);

    // Ocupación simulada de otros jugadores (determinística)
    const simulado = _huella(cancha.id + fecha + hora) % 10 < 4;

    const promo = promoAplicable(db, cancha, hora, idUsuario);
    const ocupado = reservado || evento || simulado;

    return {
      hora,
      estado: ocupado ? 'ocupado' : (promo ? 'promo' : 'libre'),
      promo,
      precio: promo ? cancha.precio_hora * (1 - promo.descuento_pct / 100) : cancha.precio_hora
    };
  });
}

/* --------------------------------------------------------------------------
   CONSULTAS DERIVADAS (ranking, puntos, etc.)
   -------------------------------------------------------------------------- */
function puntosDe(db, idUsuario) {
  return db.puntos
    .filter(p => p.id_usuario === idUsuario)
    .reduce((total, p) => total + p.cantidad, 0);
}

/* Ranking = jugadores ordenados por puntos, con partidos ganados al lado */
function ranking(db) {
  return db.usuarios
    .filter(u => u.rol === 'cliente')
    .map(u => {
      const jugados = db.partidos.filter(p => p.id_usuario === u.id).length;
      const ganados = db.partidos.filter(p => p.id_usuario === u.id && p.gano).length;
      return { ...u, puntos: puntosDe(db, u.id), jugados, ganados };
    })
    .sort((a, b) => b.puntos - a.puntos);
}
  
function canchaPorId(db, id) {
  return db.canchas.find(c => c.id === id);
}

function usuarioPorId(db, id) {
  return db.usuarios.find(u => u.id === id);
}
