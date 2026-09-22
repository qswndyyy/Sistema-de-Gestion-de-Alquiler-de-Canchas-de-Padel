/* ==========================================================================
   ARRANQUE Y SESIÓN
   ========================================================================== */
let db = leerDB();
let yo = usuarioActual();

// Si alguien abre app.html sin estar logueado, lo mandamos al login.
if (!yo) window.location.replace('login.html');

const $vista   = document.getElementById('vista');
const $sidebar = document.getElementById('sidebar');

// Estado de la interfaz que no se guarda en la "base": filtros, borradores.
const ui = {
  filtros: { ubicacion: 'todas', fecha: hoyISO(), franja: 'todas', tipo: 'todos' },
  reserva: null,      // datos del turno que se está reservando en el modal
  handlerModal: null  // listener activo del modal, para poder desengancharlo
};

/* ==========================================================================
   MENÚS POR ROL Y RUTEO
   ========================================================================== */
const MENUS = {
  cliente: [
    ['buscar',         '🎾', 'Buscar canchas'],
    ['reservas',       '📅', 'Mis reservas'],
    ['torneos',        '🏆', 'Torneos'],
    ['ranking',        '📊', 'Ranking'],
    ['historial',      '📜', 'Historial'],
    ['puntos',         '⭐', 'Puntos y premios'],
    ['notificaciones', '🔔', 'Notificaciones']
  ],
  proveedor: [
    ['agenda',      '📅', 'Reservas recibidas'],
    ['canchas',     '🎾', 'Mis canchas'],
    ['eventos',     '📌', 'Disponibilidad y eventos'],
    ['promos',      '🏷️', 'Promociones'],
    ['ranking',     '📊', 'Ranking'],
    ['notificaciones', '🔔', 'Notificaciones']
  ],
  administrador: [
    ['reportes',     '📈', 'Reportes'],
    ['usuarios',     '👥', 'Usuarios'],
    ['adminTorneos', '🏆', 'Torneos'],
    ['adminPuntos',  '⭐', 'Ranking y puntos'],
    ['adminCanchas', '🎾', 'Canchas']
  ]
};

function rutaActual() {
  const ruta = location.hash.replace('#/', '');
  const permitidas = MENUS[yo.rol].map(m => m[0]);
  return permitidas.includes(ruta) ? ruta : permitidas[0];
}

function irA(ruta) { location.hash = '#/' + ruta; }

window.addEventListener('hashchange', render);

/* Dibuja todo de nuevo: releemos la "base" para que la pantalla siempre
   muestre el dato más fresco después de cualquier acción. */
function render() {
  db = leerDB();
  yo = usuarioActual();
  if (!yo) return;

  document.getElementById('usuarioNombre').textContent = yo.nombre;
  document.getElementById('usuarioRol').textContent =
    yo.rol === 'cliente' ? 'Jugador' : yo.rol === 'proveedor' ? 'Proveedor' : 'Administrador';

  dibujarMenu();
  dibujarBadge();

  const ruta = rutaActual();
  $vista.innerHTML = VISTAS[ruta] ? VISTAS[ruta]() : '<p>Sección en construcción.</p>';
  $vista.scrollTop = 0;
}

function dibujarMenu() {
  const activa = rutaActual();
  $sidebar.innerHTML = MENUS[yo.rol].map(([ruta, icono, texto]) => `
    <a href="#/${ruta}" class="sidebar__item ${ruta === activa ? 'is-active' : ''}">
      <span class="sidebar__icono">${icono}</span>${texto}
    </a>
  `).join('') + `
    <button class="sidebar__reset" data-accion="reiniciar">Reiniciar datos de demo</button>
  `;
}

function dibujarBadge() {
  const sinLeer = db.notificaciones.filter(n => n.id_usuario === yo.id && !n.leida).length;
  const badge = document.getElementById('badgeNotis');
  badge.textContent = sinLeer;
  badge.classList.toggle('is-oculto', sinLeer === 0);
}

/* ==========================================================================
   HELPERS DE INTERFAZ
   ========================================================================== */

/* Aviso corto abajo a la derecha. Se borra solo a los 3 segundos. */
function aviso(texto, tipo = 'ok') {
  const cont = document.getElementById('toasts');
  const div = document.createElement('div');
  div.className = `toast toast--${tipo}`;
  div.textContent = texto;
  cont.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

function abrirModal(html) {
  document.getElementById('modalContenido').innerHTML = html;
  document.getElementById('modal').classList.remove('is-oculto');
}

function cerrarModal() {
  document.getElementById('modal').classList.add('is-oculto');
  ui.reserva = null;
}

document.getElementById('modal').addEventListener('click', e => {
  if (e.target.hasAttribute('data-cerrar-modal')) cerrarModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarModal(); });

/* Alta de notificación: la usamos en varios lados (reserva, pago, torneo...) */
function notificar(dbRef, idUsuario, mensaje, tipo) {
  dbRef.notificaciones.push({
    id: nuevoId(dbRef), id_usuario: idUsuario, mensaje, tipo,
    leida: false, fecha: hoyISO()
  });
}

/* --------------------------------------------------------------------------
   SIMULACIÓN DE PAGO

   -------------------------------------------------------------------------- */
function generarAliasPago() {
  const palabras = ['padel', 'smash', 'drive', 'net', 'ace', 'cancha'];
  const palabra = palabras[Math.floor(Math.random() * palabras.length)];
  const numero = Math.floor(1000 + Math.random() * 9000);
  return `${palabra}.connect.${numero}`;
}

/* Abre el modal de "pago". onExito se ejecuta recién después de que el
   usuario confirma y ve la ventana de agradecimiento (así nunca se registra
   un pago sin pasar por la simulación completa). */
function abrirModalPagoSimulado(monto, onExito) {
  const alias = generarAliasPago();

  abrirModal(`
    <h2>Pago seguro</h2>
    <p class="modal__sub">Vas a pagar <strong>${precio(monto)}</strong>. Esto es una simulación
      para la demo — no se realiza ningún cobro real.</p>

    <label class="campo">
      <span>Alias o CVU de destino</span>
      <input value="${alias}" readonly>
    </label>
    <label class="campo">
      <span>Titular de la tarjeta</span>
      <input id="pagoTitular" value="${yo.nombre}">
    </label>
    <div class="fila">
      <label class="campo">
        <span>Número de tarjeta</span>
        <input id="pagoTarjeta" value="•••• •••• •••• 4242" readonly>
      </label>
      <label class="campo">
        <span>Vencimiento</span>
        <input value="12/29" readonly>
      </label>
    </div>

    <div class="modal__acciones">
      <button class="btn btn--ghost" data-cerrar-modal>Cancelar</button>
      <button class="btn btn--primary" id="btnPagarSim">Pagar ${precio(monto)}</button>
    </div>
  `);

  document.getElementById('btnPagarSim').addEventListener('click', (e) => {
    const boton = e.target;
    boton.disabled = true;
    boton.textContent = 'Procesando pago...';

    // Delay corto para que se sienta como una pasarela real procesando
    setTimeout(() => mostrarAgradecimientoPago(monto, onExito), 1000);
  });
}

function mostrarAgradecimientoPago(monto, onExito) {
  abrirModal(`
    <div class="pago-ok">
      <div class="pago-ok__icono">✓</div>
      <h2>¡Gracias por tu pago!</h2>
      <p>Se acreditaron <strong>${precio(monto)}</strong> correctamente.</p>
      <p class="pago-ok__nota">Recordá que esto es parte de la demo: ninguna transacción real fue procesada.</p>
      <button class="btn btn--primary btn--bloque" id="btnContinuarPago">Continuar</button>
    </div>
  `);

  document.getElementById('btnContinuarPago').addEventListener('click', () => {
    // onExito es quien cierra el modal (confirmarReserva y pagarMiParte ya
    // lo hacen); así evitamos perder ui.reserva antes de que se use.
    onExito();
  });
}

/* Alta de puntos (sistema de puntos/recompensas) */
function sumarPuntos(dbRef, idUsuario, cantidad, motivo) {
  dbRef.puntos.push({ id_usuario: idUsuario, cantidad, motivo, fecha: hoyISO() });
}

/* Tarjeta de número grande, se reutiliza en varias vistas */
function tarjetaDato(valor, etiqueta, extra = '') {
  return `<div class="dato ${extra}"><span class="dato__valor">${valor}</span>
          <span class="dato__label">${etiqueta}</span></div>`;
}

function encabezado(titulo, bajada, botones = '') {
  return `<header class="vista__header">
            <div><h1>${titulo}</h1><p>${bajada}</p></div>
            <div class="vista__acciones">${botones}</div>
          </header>`;
}

function vacio(texto, boton = '') {
  return `<div class="vacio"><p>${texto}</p>${boton}</div>`;
}

/* ==========================================================================
   VISTAS DEL CLIENTE
   ========================================================================== */
const VISTAS = {};

/* -------------------------------------------------------------------------
   BUSCAR CANCHAS
   Calendario de disponibilidad con filtros.
   ------------------------------------------------------------------------- */
VISTAS.buscar = function () {
  const f = ui.filtros;

  // Opciones de los filtros, sacadas de las canchas cargadas
  const ubicaciones = [...new Set(db.canchas.map(c => c.ubicacion))];
  const tipos       = [...new Set(db.canchas.map(c => c.tipo))];

  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(hoyISO(), i));

  const canchas = db.canchas.filter(c =>
    c.activa &&
    (f.ubicacion === 'todas' || c.ubicacion === f.ubicacion) &&
    (f.tipo === 'todos' || c.tipo === f.tipo));

  const enFranja = hora => {
    const h = parseInt(hora, 10);
    if (f.franja === 'manana') return h >= 8 && h <= 12;
    if (f.franja === 'tarde')  return h >= 13 && h <= 18;
    if (f.franja === 'noche')  return h >= 19;
    return true;
  };

  const listado = canchas.map(c => {
    const turnos = turnosDe(db, c, f.fecha, yo.id).filter(t => enFranja(t.hora));
    const libres = turnos.filter(t => t.estado !== 'ocupado').length;

    return `
      <article class="cancha">
        <div class="cancha__info">
          <h3>${c.nombre} — ${c.club}</h3>
          <p class="cancha__meta">${c.ubicacion} · ${c.tipo} ${c.techada ? 'techada' : 'al aire libre'}</p>
          <p class="cancha__precio">${precio(c.precio_hora)} <span>/ hora</span></p>
          <p class="cancha__libres">${libres} turno${libres === 1 ? '' : 's'} disponible${libres === 1 ? '' : 's'}</p>
        </div>

        <div class="turnos">
          ${turnos.length === 0 ? '<p class="turnos__vacio">No hay turnos en esa franja.</p>' :
            turnos.map(t => `
              <button class="chip chip--${t.estado}"
                      ${t.estado === 'ocupado' ? 'disabled' : ''}
                      data-accion="reservar"
                      data-cancha="${c.id}" data-hora="${t.hora}">
                ${t.hora}${t.estado === 'promo' ? ` <em>−${t.promo.descuento_pct}%</em>` : ''}
              </button>`).join('')}
        </div>
      </article>`;
  }).join('');

  return `
    ${encabezado('Buscar canchas', 'Elegí zona, día y horario. Tocá un turno libre para reservarlo.')}

    <!-- ---------- Filtros ---------- -->
    <section class="filtros">
      <label class="campo campo--inline">
        <span>Ubicación</span>
        <select data-filtro="ubicacion">
          <option value="todas">Todas</option>
          ${ubicaciones.map(u => `<option ${f.ubicacion === u ? 'selected' : ''}>${u}</option>`).join('')}
        </select>
      </label>

      <label class="campo campo--inline">
        <span>Tipo de cancha</span>
        <select data-filtro="tipo">
          <option value="todos">Todos</option>
          ${tipos.map(t => `<option ${f.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
      </label>

      <label class="campo campo--inline">
        <span>Horario</span>
        <select data-filtro="franja">
          <option value="todas"  ${f.franja === 'todas'  ? 'selected' : ''}>Cualquiera</option>
          <option value="manana" ${f.franja === 'manana' ? 'selected' : ''}>Mañana (8 a 12)</option>
          <option value="tarde"  ${f.franja === 'tarde'  ? 'selected' : ''}>Tarde (13 a 18)</option>
          <option value="noche"  ${f.franja === 'noche'  ? 'selected' : ''}>Noche (19 a 23)</option>
        </select>
      </label>

      <label class="campo campo--inline">
        <span>Fecha exacta</span>
        <input type="date" value="${f.fecha}" min="${hoyISO()}" data-filtro="fecha">
      </label>
    </section>

    <!-- ---------- Tira de días ---------- -->
    <div class="dias">
      ${dias.map(d => `
        <button class="dia ${d === f.fecha ? 'is-active' : ''}" data-accion="dia" data-fecha="${d}">
          ${fechaLinda(d)}
        </button>`).join('')}
    </div>

    <!-- ---------- Referencias de color ---------- -->
    <p class="leyenda">
      <span class="punto punto--libre"></span> Libre
      <span class="punto punto--promo"></span> Con promoción
      <span class="punto punto--ocupado"></span> Ocupado
    </p>

    <section class="canchas">
      ${listado || vacio('No hay canchas con esos filtros. Probá cambiando la zona o el tipo.')}
    </section>`;
};

/* -------------------------------------------------------------------------
   MIS RESERVAS
   ------------------------------------------------------------------------- */
VISTAS.reservas = function () {
  // Son "mías" las que creé y también en las que me invitaron
  const mias = db.reservas.filter(r =>
    r.id_cliente === yo.id || r.jugadores.some(j => j.id_usuario === yo.id));

  if (mias.length === 0) {
    return encabezado('Mis reservas', 'Acá vas a ver tus partidos confirmados y los pagos pendientes.') +
      vacio('Todavía no reservaste ninguna cancha.',
        '<a class="btn btn--primary" href="#/buscar">Buscar una cancha</a>');
  }

  const tarjetas = mias
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
    .map(r => {
      const c = canchaPorId(db, r.id_cancha);
      const faltaPagar = r.jugadores.filter(j => !j.pagado).length;
      const miParte    = r.jugadores.find(j => j.id_usuario === yo.id);
      const soyDueno   = r.id_cliente === yo.id;

      return `
        <article class="reserva reserva--${r.estado}">
          <div class="reserva__cabecera">
            <div>
              <h3>${c.nombre} — ${c.club}</h3>
              <p class="cancha__meta">${fechaLinda(r.fecha)} · ${r.hora} · ${c.ubicacion}</p>
            </div>
            <span class="estado estado--${r.estado}">${r.estado}</span>
          </div>

          <!-- División automática del costo entre los jugadores -->
          <div class="reserva__jugadores">
            <p class="reserva__subtitulo">
              ${r.tipo_reserva === 'equipo' ? 'Reserva en equipo' : 'Reserva individual'}
              · total ${precio(r.total)}
            </p>
            <ul>
              ${r.jugadores.map(j => `
                <li>
                  <span>${j.nombre}${j.id_usuario === yo.id ? ' (vos)' : ''}</span>
                  <span class="monto ${j.pagado ? 'monto--ok' : 'monto--debe'}">
                    ${precio(j.monto)} ${j.pagado ? '· pagado' : '· pendiente'}
                  </span>
                </li>`).join('')}
            </ul>
          </div>

          <div class="reserva__acciones">
            ${miParte && !miParte.pagado && r.estado !== 'cancelada' ?
              `<button class="btn btn--primary" data-accion="pagar" data-id="${r.id}">
                 Pagar mi parte (${precio(miParte.monto)})</button>` : ''}

            ${soyDueno && faltaPagar > 0 && r.estado !== 'cancelada' ?
              `<button class="btn btn--ghost" data-accion="recordar" data-id="${r.id}">
                 Avisar a los ${faltaPagar} que faltan</button>` : ''}

            ${soyDueno && r.estado !== 'cancelada' ?
              `<button class="btn btn--peligro" data-accion="cancelar" data-id="${r.id}">
                 Cancelar reserva</button>` : ''}
          </div>
        </article>`;
    }).join('');

  return encabezado('Mis reservas', 'Tus partidos, el estado de cada pago y lo que falta confirmar.') +
    `<section class="lista">${tarjetas}</section>`;
};

/* -------------------------------------------------------------------------
   TORNEOS
   ------------------------------------------------------------------------- */
VISTAS.torneos = function () {
  const tarjetas = db.torneos.map(t => {
    const anotado = t.inscriptos.includes(yo.id);
    const lleno   = t.inscriptos.length >= t.cupo;

    return `
      <article class="torneo">
        <div class="torneo__top">
          <h3>${t.nombre}</h3>
          <span class="estado estado--${t.estado}">${t.estado}</span>
        </div>
        <p class="cancha__meta">${t.sede} · categoría ${t.categoria} · arranca ${fechaLinda(t.fecha_inicio)}</p>
        <p class="torneo__desc">${t.descripcion}</p>

        <!-- Barra de cupo: se llena a medida que se anotan jugadores -->
        <div class="cupo">
          <div class="cupo__barra"><span style="width:${(t.inscriptos.length / t.cupo) * 100}%"></span></div>
          <p>${t.inscriptos.length} de ${t.cupo} inscriptos</p>
        </div>

        ${t.estado === 'finalizado' ? '' :
          anotado
            ? `<button class="btn btn--ghost" data-accion="salirTorneo" data-id="${t.id}">Anular inscripción</button>`
            : lleno
              ? '<button class="btn btn--ghost" disabled>Cupo completo</button>'
              : `<button class="btn btn--primary" data-accion="anotarse" data-id="${t.id}">Inscribirme</button>`}
      </article>`;
  }).join('');

  return encabezado('Torneos', 'Anotate en los torneos abiertos o creá el tuyo con tus propias reglas.',
      '<button class="btn btn--primary" data-accion="nuevoTorneo">Crear torneo</button>') +
    `<section class="grilla">${tarjetas}</section>`;
};

/* -------------------------------------------------------------------------
   RANKING (lo ven cliente y proveedor)
   ------------------------------------------------------------------------- */
VISTAS.ranking = function () {
  const tabla = ranking(db);

  return encabezado('Ranking', 'Se ordena por puntos acumulados. Ganar partidos y torneos suma más.') + `
    <table class="tabla">
      <thead>
        <tr><th>#</th><th>Jugador</th><th>Categoría</th><th>Jugados</th><th>Ganados</th><th>Puntos</th></tr>
      </thead>
      <tbody>
        ${tabla.map((u, i) => `
          <tr class="${u.id === yo.id ? 'is-yo' : ''}">
            <td class="pos">${i + 1}</td>
            <td>${u.nombre}${u.id === yo.id ? ' (vos)' : ''}</td>
            <td>${u.categoria}</td>
            <td>${u.jugados}</td>
            <td>${u.ganados}</td>
            <td class="puntos">${u.puntos}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
};

/* -------------------------------------------------------------------------
   HISTORIAL DE PARTIDOS
   ------------------------------------------------------------------------- */
VISTAS.historial = function () {
  const mios    = db.partidos.filter(p => p.id_usuario === yo.id);
  const ganados = mios.filter(p => p.gano).length;
  const efect   = mios.length ? Math.round((ganados / mios.length) * 100) : 0;

  return encabezado('Historial', 'Todos tus partidos, con resultado y torneo si correspondía.') + `
    <section class="datos">
      ${tarjetaDato(mios.length, 'Partidos jugados')}
      ${tarjetaDato(ganados, 'Ganados')}
      ${tarjetaDato(mios.length - ganados, 'Perdidos')}
      ${tarjetaDato(efect + '%', 'Efectividad')}
    </section>

    ${mios.length === 0 ? vacio('Cuando juegues tu primer partido va a aparecer acá.') : `
    <table class="tabla">
      <thead><tr><th>Fecha</th><th>Cancha</th><th>Rivales</th><th>Resultado</th><th></th></tr></thead>
      <tbody>
        ${mios.map(p => `
          <tr>
            <td>${fechaLinda(p.fecha)}</td>
            <td>${p.cancha}</td>
            <td>${p.rival}</td>
            <td>${p.resultado}</td>
            <td><span class="estado estado--${p.gano ? 'confirmada' : 'cancelada'}">
              ${p.gano ? 'Ganado' : 'Perdido'}</span></td>
          </tr>`).join('')}
      </tbody>
    </table>`}`;
};

/* -------------------------------------------------------------------------
   PUNTOS Y RECOMPENSAS
   ------------------------------------------------------------------------- */
VISTAS.puntos = function () {
  const total = puntosDe(db, yo.id);
  const movs  = db.puntos.filter(p => p.id_usuario === yo.id).slice().reverse();

  return encabezado('Puntos y premios', 'Sumás puntos por jugar y por ganar. Canjealos cuando quieras.') + `
    <section class="datos">
      ${tarjetaDato(total, 'Puntos disponibles', 'dato--destacado')}
      ${tarjetaDato(movs.length, 'Movimientos')}
      ${tarjetaDato(db.recompensas.filter(r => r.costo <= total).length, 'Premios a tu alcance')}
    </section>

    <h2 class="subtitulo">Canjear premios</h2>
    <section class="grilla">
      ${db.recompensas.map(r => {
        const alcanza = total >= r.costo;
        return `
          <article class="premio ${alcanza ? '' : 'premio--lejos'}">
            <h3>${r.nombre}</h3>
            <p>${r.detalle}</p>
            <p class="premio__costo">${r.costo} puntos</p>
            <button class="btn ${alcanza ? 'btn--primary' : 'btn--ghost'}"
                    data-accion="canjear" data-id="${r.id}" ${alcanza ? '' : 'disabled'}>
              ${alcanza ? 'Canjear' : `Te faltan ${r.costo - total}`}
            </button>
          </article>`;
      }).join('')}
    </section>

    <h2 class="subtitulo">Tus movimientos</h2>
    <ul class="movimientos">
      ${movs.map(m => `
        <li>
          <span>${m.motivo}</span>
          <span class="cancha__meta">${fechaLinda(m.fecha)}</span>
          <span class="${m.cantidad >= 0 ? 'monto--ok' : 'monto--debe'}">
            ${m.cantidad >= 0 ? '+' : ''}${m.cantidad}
          </span>
        </li>`).join('')}
    </ul>`;
};

/* -------------------------------------------------------------------------
   NOTIFICACIONES (la usan los 3 roles)
   ------------------------------------------------------------------------- */
VISTAS.notificaciones = function () {
  const mias = db.notificaciones.filter(n => n.id_usuario === yo.id).slice().reverse();
  const iconos = { reserva: '📅', recordatorio: '⏰', resultado: '🎾', promocion: '🏷️' };

  return encabezado('Notificaciones', 'Cambios en tus reservas, recordatorios, resultados y promos.',
      '<button class="btn btn--ghost" data-accion="leerTodas">Marcar todas como leídas</button>') +
    (mias.length === 0 ? vacio('No tenés notificaciones por ahora.') : `
      <ul class="notis">
        ${mias.map(n => `
          <li class="noti ${n.leida ? '' : 'noti--nueva'}">
            <span class="noti__icono">${iconos[n.tipo] || '🔔'}</span>
            <div>
              <p>${n.mensaje}</p>
              <span class="cancha__meta">${fechaLinda(n.fecha)} · ${n.tipo}</span>
            </div>
          </li>`).join('')}
      </ul>`);
};

/* ==========================================================================
   VISTAS DEL PROVEEDOR DE CANCHA
   ========================================================================== */

/* Canchas que pertenecen al proveedor logueado */
function misCanchas() {
  return db.canchas.filter(c => c.id_proveedor === yo.id);
}

/* -------------------------------------------------------------------------
   RESERVAS RECIBIDAS
   ------------------------------------------------------------------------- */
VISTAS.agenda = function () {
  const ids = misCanchas().map(c => c.id);
  const reservas = db.reservas
    .filter(r => ids.includes(r.id_cancha))
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

  const ingresos = reservas
    .filter(r => r.estado !== 'cancelada')
    .reduce((t, r) => t + r.total, 0);

  return encabezado('Reservas recibidas', 'Todo lo que se reservó en tus canchas, con su estado de pago.') + `
    <section class="datos">
      ${tarjetaDato(reservas.filter(r => r.estado !== 'cancelada').length, 'Reservas activas')}
      ${tarjetaDato(reservas.filter(r => r.estado === 'pendiente').length, 'Esperando confirmación')}
      ${tarjetaDato(precio(ingresos), 'Facturación estimada', 'dato--destacado')}
    </section>

    ${reservas.length === 0 ? vacio('Todavía no recibiste reservas.') : `
    <table class="tabla">
      <thead><tr><th>Fecha</th><th>Hora</th><th>Cancha</th><th>Reservó</th><th>Jugadores</th><th>Total</th><th>Estado</th><th></th></tr></thead>
      <tbody>
        ${reservas.map(r => {
          const c = canchaPorId(db, r.id_cancha);
          const cliente = usuarioPorId(db, r.id_cliente);
          return `
            <tr>
              <td>${fechaLinda(r.fecha)}</td>
              <td>${r.hora}</td>
              <td>${c.nombre}</td>
              <td>${cliente ? cliente.nombre : '—'}</td>
              <td>${r.jugadores.length}</td>
              <td>${precio(r.total)}</td>
              <td><span class="estado estado--${r.estado}">${r.estado}</span></td>
              <td class="acciones-fila">
                ${r.estado === 'pendiente' ?
                  `<button class="btn btn--mini btn--primary" data-accion="confirmarReserva" data-id="${r.id}">Confirmar</button>` : ''}
                ${r.estado !== 'cancelada' ?
                  `<button class="btn btn--mini btn--peligro" data-accion="cancelar" data-id="${r.id}">Cancelar</button>` : ''}
              </td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`}`;
};

/* -------------------------------------------------------------------------
   MIS CANCHAS (alta, baja y precio)
   ------------------------------------------------------------------------- */
VISTAS.canchas = function () {
  const canchas = misCanchas();

  return encabezado('Mis canchas', 'Cargá canchas nuevas, ajustá el precio o sacá una de circulación.',
      '<button class="btn btn--primary" data-accion="nuevaCancha">Agregar cancha</button>') +
    (canchas.length === 0 ? vacio('No tenés canchas cargadas todavía.') : `
    <section class="grilla">
      ${canchas.map(c => `
        <article class="cancha-card ${c.activa ? '' : 'cancha-card--baja'}">
          <h3>${c.nombre}</h3>
          <p class="cancha__meta">${c.ubicacion} · ${c.tipo} ${c.techada ? 'techada' : 'al aire libre'}</p>
          <p class="cancha__precio">${precio(c.precio_hora)} <span>/ hora</span></p>
          <p class="cancha__meta">${db.reservas.filter(r => r.id_cancha === c.id && r.estado !== 'cancelada').length} reservas activas</p>
          <div class="reserva__acciones">
            <button class="btn btn--mini btn--ghost" data-accion="editarPrecio" data-id="${c.id}">Cambiar precio</button>
            <button class="btn btn--mini ${c.activa ? 'btn--peligro' : 'btn--primary'}"
                    data-accion="toggleCancha" data-id="${c.id}">
              ${c.activa ? 'Dar de baja' : 'Reactivar'}
            </button>
          </div>
        </article>`).join('')}
    </section>`);
};

/* -------------------------------------------------------------------------
   DISPONIBILIDAD Y EVENTOS ESPECIALES
   ------------------------------------------------------------------------- */
VISTAS.eventos = function () {
  const ids = misCanchas().map(c => c.id);
  const eventos = db.eventos.filter(e => ids.includes(e.id_cancha));

  return encabezado('Disponibilidad y eventos', 'Bloqueá horarios por clínicas, torneos internos o mantenimiento.',
      '<button class="btn btn--primary" data-accion="nuevoEvento">Crear evento</button>') +
    (eventos.length === 0 ? vacio('No hay horarios bloqueados. Todas tus canchas están disponibles.') : `
    <table class="tabla">
      <thead><tr><th>Evento</th><th>Cancha</th><th>Fecha</th><th>Horario</th><th></th></tr></thead>
      <tbody>
        ${eventos.map(e => {
          const c = canchaPorId(db, e.id_cancha);
          return `<tr>
            <td>${e.nombre}</td>
            <td>${c ? c.nombre : '—'}</td>
            <td>${fechaLinda(e.fecha)}</td>
            <td>${e.desde} a ${e.hasta}</td>
            <td><button class="btn btn--mini btn--peligro" data-accion="borrarEvento" data-id="${e.id}">Liberar</button></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`);
};

/* -------------------------------------------------------------------------
   PROMOCIONES
   ------------------------------------------------------------------------- */
VISTAS.promos = function () {
  const promos = db.promociones.filter(p => p.id_proveedor === yo.id);

  return encabezado('Promociones', 'Descuentos para horarios de baja demanda o para jugadores frecuentes.',
      '<button class="btn btn--primary" data-accion="nuevaPromo">Crear promoción</button>') +
    (promos.length === 0 ? vacio('No tenés promociones activas.') : `
    <section class="grilla">
      ${promos.map(p => {
        const c = p.id_cancha ? canchaPorId(db, p.id_cancha) : null;
        return `
          <article class="promo-card ${p.activa ? '' : 'promo-card--off'}">
            <div class="promo-card__foto">
              <img src="assets/hero-cancha.jpg" alt="">
              <span class="promo-card__pct">−${p.descuento_pct}%</span>
            </div>
            <div class="promo-card__cuerpo">
              <h3>${p.descripcion}</h3>
              <p class="cancha__meta">${c ? c.nombre : 'Todas mis canchas'} · de ${p.desde} a ${p.hasta}</p>
              <p class="cancha__meta">${p.tipo === 'frecuentes' ? 'Solo para jugadores frecuentes (3+ partidos)' : 'Para todos los jugadores'}</p>
              <button class="btn btn--mini ${p.activa ? 'btn--peligro' : 'btn--primary'}"
                      data-accion="togglePromo" data-id="${p.id}">
                ${p.activa ? 'Pausar' : 'Activar'}
              </button>
            </div>
          </article>`;
      }).join('')}
    </section>`);
};

/* ==========================================================================
   VISTAS DEL ADMINISTRADOR
   ========================================================================== */

/* -------------------------------------------------------------------------
   REPORTES
   ------------------------------------------------------------------------- */
VISTAS.reportes = function () {
  const activas  = db.reservas.filter(r => r.estado !== 'cancelada');
  const ingresos = activas.reduce((t, r) => t + r.total, 0);
  const porZona = {};
  activas.forEach(r => {
    const c = canchaPorId(db, r.id_cancha);
    if (c) porZona[c.ubicacion] = (porZona[c.ubicacion] || 0) + 1;
  });
  const maximo = Math.max(1, ...Object.values(porZona));

  return encabezado('Reportes', 'Cómo viene funcionando la plataforma en números.') + `
    <section class="datos">
      ${tarjetaDato(db.usuarios.filter(u => u.rol === 'cliente').length, 'Jugadores')}
      ${tarjetaDato(db.usuarios.filter(u => u.rol === 'proveedor').length, 'Proveedores')}
      ${tarjetaDato(db.canchas.filter(c => c.activa).length, 'Canchas activas')}
      ${tarjetaDato(activas.length, 'Reservas activas')}
      ${tarjetaDato(db.torneos.filter(t => t.estado === 'abierto').length, 'Torneos abiertos')}
      ${tarjetaDato(precio(ingresos), 'Volumen operado', 'dato--destacado')}
    </section>

    <h2 class="subtitulo">Reservas por zona</h2>
    <div class="barras">
      ${Object.keys(porZona).length === 0 ? vacio('Todavía no hay reservas para graficar.') :
        Object.entries(porZona).map(([zona, cant]) => `
          <div class="barra">
            <span class="barra__label">${zona}</span>
            <div class="barra__pista"><span style="width:${(cant / maximo) * 100}%"></span></div>
            <span class="barra__valor">${cant}</span>
          </div>`).join('')}
    </div>`;
};

/* -------------------------------------------------------------------------
   USUARIOS
   ------------------------------------------------------------------------- */
VISTAS.usuarios = function () {
  return encabezado('Usuarios', 'Todas las cuentas del sistema. Podés cambiar el rol o dar de baja.') + `
    <table class="tabla">
      <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Puntos</th><th></th></tr></thead>
      <tbody>
        ${db.usuarios.map(u => `
          <tr>
            <td>${u.nombre}</td>
            <td>${u.email}</td>
            <td>
              <select class="select-mini" data-accion="cambiarRol" data-id="${u.id}" ${u.id === yo.id ? 'disabled' : ''}>
                <option value="cliente"       ${u.rol === 'cliente'       ? 'selected' : ''}>Jugador</option>
                <option value="proveedor"     ${u.rol === 'proveedor'     ? 'selected' : ''}>Proveedor</option>
                <option value="administrador" ${u.rol === 'administrador' ? 'selected' : ''}>Administrador</option>
              </select>
            </td>
            <td>${u.rol === 'cliente' ? puntosDe(db, u.id) : '—'}</td>
            <td>
              ${u.id === yo.id ? '<span class="cancha__meta">Tu cuenta</span>' :
                `<button class="btn btn--mini btn--peligro" data-accion="borrarUsuario" data-id="${u.id}">Eliminar</button>`}
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
};

/* -------------------------------------------------------------------------
   TORNEOS (moderación)
   ------------------------------------------------------------------------- */
VISTAS.adminTorneos = function () {
  return encabezado('Torneos', 'Supervisá los torneos creados por clubes y jugadores.') + `
    <table class="tabla">
      <thead><tr><th>Torneo</th><th>Sede</th><th>Categoría</th><th>Inicio</th><th>Inscriptos</th><th>Estado</th><th></th></tr></thead>
      <tbody>
        ${db.torneos.map(t => `
          <tr>
            <td>${t.nombre}</td>
            <td>${t.sede}</td>
            <td>${t.categoria}</td>
            <td>${fechaLinda(t.fecha_inicio)}</td>
            <td>${t.inscriptos.length}/${t.cupo}</td>
            <td><span class="estado estado--${t.estado}">${t.estado}</span></td>
            <td class="acciones-fila">
              ${t.estado === 'abierto'
                ? `<button class="btn btn--mini btn--peligro" data-accion="cerrarTorneo" data-id="${t.id}">Cerrar</button>`
                : `<button class="btn btn--mini btn--ghost" data-accion="reabrirTorneo" data-id="${t.id}">Reabrir</button>`}
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
};

/* -------------------------------------------------------------------------
   RANKING Y PUNTOS (ajuste manual)
   ------------------------------------------------------------------------- */
VISTAS.adminPuntos = function () {
  const tabla = ranking(db);

  return encabezado('Ranking y puntos', 'Corregí puntos a mano cuando haga falta (premios, sanciones, errores de carga).') + `
    <table class="tabla">
      <thead><tr><th>#</th><th>Jugador</th><th>Jugados</th><th>Ganados</th><th>Puntos</th><th>Ajuste</th></tr></thead>
      <tbody>
        ${tabla.map((u, i) => `
          <tr>
            <td class="pos">${i + 1}</td>
            <td>${u.nombre}</td>
            <td>${u.jugados}</td>
            <td>${u.ganados}</td>
            <td class="puntos">${u.puntos}</td>
            <td class="acciones-fila">
              <button class="btn btn--mini btn--ghost"   data-accion="ajustarPuntos" data-id="${u.id}" data-cant="-50">−50</button>
              <button class="btn btn--mini btn--primary" data-accion="ajustarPuntos" data-id="${u.id}" data-cant="50">+50</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
};

/* -------------------------------------------------------------------------
   CANCHAS (vista global del administrador)
   ------------------------------------------------------------------------- */
VISTAS.adminCanchas = function () {
  return encabezado('Canchas', 'Todas las canchas cargadas por los proveedores.') + `
    <table class="tabla">
      <thead><tr><th>Cancha</th><th>Club</th><th>Zona</th><th>Tipo</th><th>Precio</th><th>Estado</th></tr></thead>
      <tbody>
        ${db.canchas.map(c => `
          <tr>
            <td>${c.nombre}</td>
            <td>${c.club}</td>
            <td>${c.ubicacion}</td>
            <td>${c.tipo} ${c.techada ? '(techada)' : ''}</td>
            <td>${precio(c.precio_hora)}</td>
            <td><span class="estado estado--${c.activa ? 'confirmada' : 'cancelada'}">
              ${c.activa ? 'activa' : 'de baja'}</span></td>
          </tr>`).join('')}
      </tbody>
    </table>`;
};

/* ==========================================================================
   ACCIONES
   ========================================================================== */
$vista.addEventListener('click', e => {
  const el = e.target.closest('[data-accion]');
  if (!el) return;
  const accion = el.dataset.accion;
  const id     = Number(el.dataset.id);

  switch (accion) {
    /* ---- filtros de búsqueda ---- */
    case 'dia':
      ui.filtros.fecha = el.dataset.fecha;
      render();
      break;

    /* ---- reservar un turno: abre el modal ---- */
    case 'reservar':
      abrirModalReserva(Number(el.dataset.cancha), el.dataset.hora);
      break;

    /* ---- pagos y reservas ---- */
    case 'pagar':       pagarMiParte(id); break;
    case 'recordar':    recordarPago(id); break;
    case 'cancelar':    cancelarReserva(id); break;
    case 'confirmarReserva': cambiarEstadoReserva(id, 'confirmada'); break;

    /* ---- torneos ---- */
    case 'anotarse':    inscribirse(id, true); break;
    case 'salirTorneo': inscribirse(id, false); break;
    case 'nuevoTorneo': abrirModalTorneo(); break;
    case 'cerrarTorneo':  cambiarEstadoTorneo(id, 'finalizado'); break;
    case 'reabrirTorneo': cambiarEstadoTorneo(id, 'abierto'); break;

    /* ---- puntos ---- */
    case 'canjear':       canjear(id); break;
    case 'ajustarPuntos': ajustarPuntos(id, Number(el.dataset.cant)); break;

    /* ---- notificaciones ---- */
    case 'leerTodas':
      db.notificaciones.forEach(n => { if (n.id_usuario === yo.id) n.leida = true; });
      guardarDB(db); render(); aviso('Listo, no te queda nada sin leer.');
      break;

    /* ---- proveedor ---- */
    case 'nuevaCancha':  abrirModalCancha(); break;
    case 'editarPrecio': abrirModalPrecio(id); break;
    case 'toggleCancha': toggleCancha(id); break;
    case 'nuevoEvento':  abrirModalEvento(); break;
    case 'borrarEvento': borrarEvento(id); break;
    case 'nuevaPromo':   abrirModalPromo(); break;
    case 'togglePromo':  togglePromo(id); break;

    /* ---- administrador ---- */
    case 'borrarUsuario': borrarUsuario(id); break;

    /* ---- demo ---- */
    case 'reiniciar':
      if (confirm('Esto borra reservas, torneos y cuentas nuevas y vuelve todo a los datos de ejemplo. ¿Seguimos?')) {
        reiniciarDemo();
        window.location.href = 'login.html';
      }
      break;
  }
});


$vista.addEventListener('change', e => {
  const filtro = e.target.dataset.filtro;
  if (filtro) {
    ui.filtros[filtro] = e.target.value;
    render();
    return;
  }

  if (e.target.dataset.accion === 'cambiarRol') {
    const u = usuarioPorId(db, Number(e.target.dataset.id));
    u.rol = e.target.value;
    guardarDB(db);
    aviso(`${u.nombre} ahora es ${e.target.value}.`);
    render();
  }
});

/* El menú lateral también tiene el botón de reiniciar */
$sidebar.addEventListener('click', e => {
  const el = e.target.closest('[data-accion="reiniciar"]');
  if (el && confirm('Esto borra reservas, torneos y cuentas nuevas y vuelve todo a los datos de ejemplo. ¿Seguimos?')) {
    reiniciarDemo();
    window.location.href = 'login.html';
  }
  // En mobile el menú se cierra al elegir una sección
  document.body.classList.remove('menu-abierto');
});

/* --------------------------------------------------------------------------
   RESERVA: modal con división automática del costo
   -------------------------------------------------------------------------- */
function abrirModalReserva(idCancha, hora) {
  const c = canchaPorId(db, idCancha);
  const turno = turnosDe(db, c, ui.filtros.fecha, yo.id).find(t => t.hora === hora);

  // Guardamos el turno elegido para usarlo al confirmar
  ui.reserva = { idCancha, hora, fecha: ui.filtros.fecha, total: turno.precio, invitados: [] };

  // Otros jugadores disponibles para invitar
  const otros = db.usuarios.filter(u => u.rol === 'cliente' && u.id !== yo.id);

  abrirModal(`
    <h2>Reservar turno</h2>
    <p class="modal__sub">${c.nombre} — ${c.club} · ${fechaLinda(ui.reserva.fecha)} a las ${hora}</p>

    ${turno.promo ? `<p class="modal__promo">Promo aplicada: ${turno.promo.descripcion} (−${turno.promo.descuento_pct}%)</p>` : ''}

    <!-- Tipo de reserva: individual o por equipo -->
    <div class="opciones">
      <label class="opcion">
        <input type="radio" name="tipo" value="individual" checked>
        <span><strong>Individual</strong>Pagás vos la hora completa.</span>
      </label>
      <label class="opcion">
        <input type="radio" name="tipo" value="equipo">
        <span><strong>Por equipo</strong>Invitás jugadores y se divide el costo.</span>
      </label>
    </div>

    <!-- Lista de invitados: solo se muestra en reserva por equipo -->
    <div id="bloqueInvitados" class="is-oculto">
      <p class="modal__label">¿A quién invitás?</p>
      <div class="invitados">
        ${otros.map(u => `
          <label class="invitado">
            <input type="checkbox" value="${u.id}" data-invitado>
            <span>${u.nombre} <em>${u.categoria}</em></span>
          </label>`).join('')}
      </div>
    </div>

    <!-- Resumen del pago: se recalcula solo al tildar jugadores -->
    <div class="resumen" id="resumenPago"></div>

    <div class="modal__acciones">
      <button class="btn btn--ghost" data-cerrar-modal>Volver</button>
      <button class="btn btn--primary" id="btnConfirmarReserva">Confirmar y pagar</button>
    </div>
  `);

  // --- Lógica viva del modal ---
  const bloque   = document.getElementById('bloqueInvitados');
  const resumen  = document.getElementById('resumenPago');

  function actualizar() {
    const tipoInput = document.querySelector('input[name="tipo"]:checked');
  
    if (!tipoInput) return;
    const tipo = tipoInput.value;
    ui.reserva.tipo = tipo; // lo guardamos porque el modal de pago reemplaza este DOM
    bloque.classList.toggle('is-oculto', tipo !== 'equipo');

    const marcados = [...document.querySelectorAll('[data-invitado]:checked')].map(i => Number(i.value));
    ui.reserva.invitados = tipo === 'equipo' ? marcados : [];

    const cantidad = 1 + ui.reserva.invitados.length;
    const porCabeza = ui.reserva.total / cantidad;

    resumen.innerHTML = `
      <div><span>Total de la hora</span><strong>${precio(ui.reserva.total)}</strong></div>
      <div><span>Jugadores en la reserva</span><strong>${cantidad}</strong></div>
      <div class="resumen__destacado"><span>Te toca pagar</span><strong>${precio(porCabeza)}</strong></div>`;
  }


  const cont = document.getElementById('modalContenido');
  if (ui.handlerModal) cont.removeEventListener('change', ui.handlerModal);
  ui.handlerModal = actualizar;
  cont.addEventListener('change', actualizar);
  actualizar();

  // "Confirmar y pagar" no reserva directo: primero pasa por la simulación
  // de pago y recién con el "Continuar" de esa ventana se confirma la reserva.
  document.getElementById('btnConfirmarReserva').addEventListener('click', () => {
    const cantidad  = 1 + ui.reserva.invitados.length;
    const porCabeza = Math.round(ui.reserva.total / cantidad);
    abrirModalPagoSimulado(porCabeza, confirmarReserva);
  });
}

function confirmarReserva() {
  const r = ui.reserva;
  const tipo = r.tipo;

  db = leerDB();

  // Chequeo final: puede haber quedado ocupado mientras el modal estaba abierto
  const yaEsta = db.reservas.some(x =>
    x.id_cancha === r.idCancha && x.fecha === r.fecha && x.hora === r.hora && x.estado !== 'cancelada');
  if (yaEsta) { cerrarModal(); aviso('Ese turno se acaba de ocupar. Elegí otro.', 'error'); render(); return; }

  const cantidad  = 1 + r.invitados.length;
  const porCabeza = Math.round(r.total / cantidad);

  // El que reserva ya paga su parte; los invitados quedan pendientes
  const jugadores = [{ id_usuario: yo.id, nombre: yo.nombre, monto: porCabeza, pagado: true }]
    .concat(r.invitados.map(idU => {
      const u = usuarioPorId(db, idU);
      return { id_usuario: u.id, nombre: u.nombre, monto: porCabeza, pagado: false };
    }));

  const reserva = {
    id: nuevoId(db), id_cancha: r.idCancha, id_cliente: yo.id,
    fecha: r.fecha, hora: r.hora, tipo_reserva: tipo,
    estado: 'confirmada', total: r.total, jugadores
  };
  db.reservas.push(reserva);

  const c = canchaPorId(db, r.idCancha);

  // Notificaciones: al dueño de la reserva y a cada invitado
  notificar(db, yo.id, `Reservaste ${c.nombre} — ${c.club} para el ${fechaLinda(r.fecha)} a las ${r.hora}.`, 'reserva');
  r.invitados.forEach(idU =>
    notificar(db, idU, `${yo.nombre} te invitó a jugar el ${fechaLinda(r.fecha)} a las ${r.hora}. Tu parte: ${precio(porCabeza)}.`, 'reserva'));

  // Puntos por reservar (sistema de recompensas)
  sumarPuntos(db, yo.id, 10, 'Reserva confirmada');

  guardarDB(db);
  cerrarModal();
  aviso('Reserva confirmada. Sumaste 10 puntos.');
  irA('reservas');
  render();
}

/* --------------------------------------------------------------------------
   PAGOS
   -------------------------------------------------------------------------- */
function pagarMiParte(idReserva) {
  db = leerDB();
  const r = db.reservas.find(x => x.id === idReserva);
  const j = r.jugadores.find(x => x.id_usuario === yo.id);

  // Primero la simulación de pago; recién con el "Continuar" se registra.
  abrirModalPagoSimulado(j.monto, () => pagarMiParteConfirmado(idReserva));
}

function pagarMiParteConfirmado(idReserva) {
  db = leerDB();
  const r = db.reservas.find(x => x.id === idReserva);
  const j = r.jugadores.find(x => x.id_usuario === yo.id);
  j.pagado = true;

  // Si ya pagaron todos, la reserva pasa a confirmada
  if (r.jugadores.every(x => x.pagado)) r.estado = 'confirmada';

  notificar(db, r.id_cliente, `${yo.nombre} pagó su parte (${precio(j.monto)}).`, 'reserva');
  guardarDB(db);
  cerrarModal();
  aviso('Pago registrado.');
  render();
}

function recordarPago(idReserva) {
  db = leerDB();
  const r = db.reservas.find(x => x.id === idReserva);
  const deben = r.jugadores.filter(j => !j.pagado);

  deben.forEach(j =>
    notificar(db, j.id_usuario, `Recordatorio: te falta pagar ${precio(j.monto)} de la reserva del ${fechaLinda(r.fecha)}.`, 'recordatorio'));

  guardarDB(db);
  aviso(`Les avisamos a ${deben.length} jugador${deben.length === 1 ? '' : 'es'}.`);
  render();
}

function cancelarReserva(idReserva) {
  if (!confirm('¿Seguro que querés cancelar esta reserva?')) return;
  cambiarEstadoReserva(idReserva, 'cancelada');
}

function cambiarEstadoReserva(idReserva, estado) {
  db = leerDB();
  const r = db.reservas.find(x => x.id === idReserva);
  r.estado = estado;

  // Avisamos a todos los involucrados: el turno cambió
  r.jugadores.forEach(j =>
    notificar(db, j.id_usuario, `La reserva del ${fechaLinda(r.fecha)} a las ${r.hora} quedó ${estado}.`, 'reserva'));

  guardarDB(db);
  aviso(estado === 'cancelada' ? 'Reserva cancelada. El turno vuelve a estar libre.' : 'Reserva confirmada.');
  render();
}

/* --------------------------------------------------------------------------
   TORNEOS
   -------------------------------------------------------------------------- */
function inscribirse(idTorneo, entrar) {
  db = leerDB();
  const t = db.torneos.find(x => x.id === idTorneo);

  if (entrar) {
    if (t.inscriptos.length >= t.cupo) { aviso('Se llenó el cupo.', 'error'); return; }
    t.inscriptos.push(yo.id);
    notificar(db, yo.id, `Quedaste inscripto en ${t.nombre}. Arranca el ${fechaLinda(t.fecha_inicio)}.`, 'reserva');
    sumarPuntos(db, yo.id, 15, 'Inscripción a torneo');
  } else {
    t.inscriptos = t.inscriptos.filter(i => i !== yo.id);
  }

  guardarDB(db);
  aviso(entrar ? '¡Anotado! Sumaste 15 puntos.' : 'Anulamos tu inscripción.');
  render();
}

function abrirModalTorneo() {
  const sedes = [...new Set(db.canchas.map(c => c.club))];

  abrirModal(`
    <h2>Crear torneo</h2>
    <p class="modal__sub">Definí las reglas y después invitá jugadores a inscribirse.</p>

    <label class="campo"><span>Nombre del torneo</span>
      <input id="tNombre" placeholder="Copa de primavera"></label>

    <label class="campo"><span>Sede</span>
      <select id="tSede">${sedes.map(s => `<option>${s}</option>`).join('')}</select></label>

    <div class="fila">
      <label class="campo"><span>Categoría</span>
        <select id="tCat"><option>Libre</option><option>3ra</option><option>4ta</option><option>5ta</option><option>6ta</option></select></label>
      <label class="campo"><span>Cupo</span>
        <select id="tCupo"><option>8</option><option>16</option><option>32</option></select></label>
    </div>

    <label class="campo"><span>Fecha de inicio</span>
      <input type="date" id="tFecha" min="${hoyISO()}" value="${sumarDias(hoyISO(), 7)}"></label>

    <label class="campo"><span>Cómo se juega</span>
      <textarea id="tDesc" rows="2" placeholder="Eliminación directa, parejas libres."></textarea></label>

    <p class="form__error" id="tError"></p>

    <div class="modal__acciones">
      <button class="btn btn--ghost" data-cerrar-modal>Volver</button>
      <button class="btn btn--primary" id="btnCrearTorneo">Crear torneo</button>
    </div>
  `);

  document.getElementById('btnCrearTorneo').addEventListener('click', () => {
    const nombre = document.getElementById('tNombre').value.trim();
    if (!nombre) { document.getElementById('tError').textContent = 'Poné un nombre para el torneo.'; return; }

    db = leerDB();
    db.torneos.push({
      id: nuevoId(db), nombre,
      id_creador: yo.id,
      sede: document.getElementById('tSede').value,
      categoria: document.getElementById('tCat').value,
      fecha_inicio: document.getElementById('tFecha').value,
      cupo: Number(document.getElementById('tCupo').value),
      inscriptos: [yo.id],
      estado: 'abierto',
      descripcion: document.getElementById('tDesc').value.trim() || 'Sin detalles cargados.'
    });

    guardarDB(db);
    cerrarModal();
    aviso('Torneo creado y ya estás anotado.');
    render();
  });
}

function cambiarEstadoTorneo(id, estado) {
  db = leerDB();
  const t = db.torneos.find(x => x.id === id);
  t.estado = estado;

  if (estado === 'finalizado') {
    // Al cerrar un torneo, sus participantes suman puntos por haber jugado
    t.inscriptos.forEach(idU => {
      sumarPuntos(db, idU, 30, `Participación en ${t.nombre}`);
      notificar(db, idU, `${t.nombre} terminó. Sumaste 30 puntos por participar.`, 'resultado');
    });
  }

  guardarDB(db);
  aviso(`Torneo ${estado}.`);
  render();
}

/* --------------------------------------------------------------------------
   PUNTOS Y RECOMPENSAS
   -------------------------------------------------------------------------- */
function canjear(idRecompensa) {
  db = leerDB();
  const r = db.recompensas.find(x => x.id === idRecompensa);
  const total = puntosDe(db, yo.id);

  if (total < r.costo) { aviso('No te alcanzan los puntos.', 'error'); return; }

  // El canje se guarda como un movimiento negativo: así queda el historial
  sumarPuntos(db, yo.id, -r.costo, `Canje: ${r.nombre}`);
  notificar(db, yo.id, `Canjeaste "${r.nombre}". ${r.detalle}`, 'promocion');

  guardarDB(db);
  aviso(`Canjeaste ${r.nombre}.`);
  render();
}

function ajustarPuntos(idUsuario, cantidad) {
  db = leerDB();
  sumarPuntos(db, idUsuario, cantidad, 'Ajuste del administrador');
  notificar(db, idUsuario, `El administrador ajustó tus puntos en ${cantidad > 0 ? '+' : ''}${cantidad}.`, 'resultado');
  guardarDB(db);
  render();
}

/* --------------------------------------------------------------------------
   GESTIÓN DEL PROVEEDOR
   -------------------------------------------------------------------------- */
function abrirModalCancha() {
  abrirModal(`
    <h2>Agregar cancha</h2>
    <p class="modal__sub">Se publica al instante en el buscador de los jugadores.</p>

    <label class="campo"><span>Nombre</span><input id="cNombre" placeholder="Cancha 5"></label>
    <label class="campo"><span>Ubicación</span><input id="cUbi" placeholder="Palermo"></label>

    <div class="fila">
      <label class="campo"><span>Tipo</span>
        <select id="cTipo"><option>Cristal</option><option>Cemento</option></select></label>
      <label class="campo"><span>Techada</span>
        <select id="cTechada"><option value="si">Sí</option><option value="no">No</option></select></label>
    </div>

    <label class="campo"><span>Precio por hora</span><input type="number" id="cPrecio" value="12000" min="0" step="500"></label>

    <p class="form__error" id="cError"></p>

    <div class="modal__acciones">
      <button class="btn btn--ghost" data-cerrar-modal>Volver</button>
      <button class="btn btn--primary" id="btnCrearCancha">Agregar cancha</button>
    </div>
  `);

  document.getElementById('btnCrearCancha').addEventListener('click', () => {
    const nombre = document.getElementById('cNombre').value.trim();
    const ubi    = document.getElementById('cUbi').value.trim();
    if (!nombre || !ubi) { document.getElementById('cError').textContent = 'Completá nombre y ubicación.'; return; }

    db = leerDB();
    db.canchas.push({
      id: nuevoId(db), id_proveedor: yo.id, nombre, club: yo.nombre, ubicacion: ubi,
      tipo: document.getElementById('cTipo').value,
      techada: document.getElementById('cTechada').value === 'si',
      precio_hora: Number(document.getElementById('cPrecio').value),
      activa: true
    });

    guardarDB(db);
    cerrarModal();
    aviso('Cancha publicada.');
    render();
  });
}

function abrirModalPrecio(idCancha) {
  const c = canchaPorId(db, idCancha);
  abrirModal(`
    <h2>Cambiar precio</h2>
    <p class="modal__sub">${c.nombre} · precio actual ${precio(c.precio_hora)}</p>
    <label class="campo"><span>Nuevo precio por hora</span>
      <input type="number" id="pNuevo" value="${c.precio_hora}" min="0" step="500"></label>
    <div class="modal__acciones">
      <button class="btn btn--ghost" data-cerrar-modal>Volver</button>
      <button class="btn btn--primary" id="btnGuardarPrecio">Guardar precio</button>
    </div>
  `);

  document.getElementById('btnGuardarPrecio').addEventListener('click', () => {
    db = leerDB();
    canchaPorId(db, idCancha).precio_hora = Number(document.getElementById('pNuevo').value);
    guardarDB(db);
    cerrarModal();
    aviso('Precio actualizado.');
    render();
  });
}

function toggleCancha(idCancha) {
  db = leerDB();
  const c = canchaPorId(db, idCancha);
  c.activa = !c.activa;
  guardarDB(db);
  aviso(c.activa ? 'Cancha reactivada.' : 'Cancha dada de baja. Deja de aparecer en el buscador.');
  render();
}

function abrirModalEvento() {
  const canchas = misCanchas();

  abrirModal(`
    <h2>Crear evento</h2>
    <p class="modal__sub">El horario queda bloqueado y nadie puede reservarlo.</p>

    <label class="campo"><span>Nombre del evento</span><input id="eNombre" placeholder="Clínica de saque"></label>
    <label class="campo"><span>Cancha</span>
      <select id="eCancha">${canchas.map(c => `<option value="${c.id}">${c.nombre} — ${c.ubicacion}</option>`).join('')}</select></label>
    <label class="campo"><span>Fecha</span>
      <input type="date" id="eFecha" min="${hoyISO()}" value="${sumarDias(hoyISO(), 2)}"></label>

    <div class="fila">
      <label class="campo"><span>Desde</span>
        <select id="eDesde">${HORAS.map(h => `<option>${h}</option>`).join('')}</select></label>
      <label class="campo"><span>Hasta</span>
        <select id="eHasta">${HORAS.map(h => `<option ${h === '22:00' ? 'selected' : ''}>${h}</option>`).join('')}</select></label>
    </div>

    <p class="form__error" id="eError"></p>

    <div class="modal__acciones">
      <button class="btn btn--ghost" data-cerrar-modal>Volver</button>
      <button class="btn btn--primary" id="btnCrearEvento">Bloquear horario</button>
    </div>
  `);

  document.getElementById('btnCrearEvento').addEventListener('click', () => {
    const nombre = document.getElementById('eNombre').value.trim();
    const desde  = document.getElementById('eDesde').value;
    const hasta  = document.getElementById('eHasta').value;

    if (!nombre)       { document.getElementById('eError').textContent = 'Poné un nombre al evento.'; return; }
    if (hasta <= desde) { document.getElementById('eError').textContent = 'El horario de fin tiene que ser posterior al de inicio.'; return; }

    db = leerDB();
    db.eventos.push({
      id: nuevoId(db),
      id_cancha: Number(document.getElementById('eCancha').value),
      fecha: document.getElementById('eFecha').value,
      nombre, desde, hasta
    });

    guardarDB(db);
    cerrarModal();
    aviso('Horario bloqueado.');
    render();
  });
}

function borrarEvento(id) {
  db = leerDB();
  db.eventos = db.eventos.filter(e => e.id !== id);
  guardarDB(db);
  aviso('Horario liberado.');
  render();
}

function abrirModalPromo() {
  const canchas = misCanchas();

  abrirModal(`
    <h2>Crear promoción</h2>
    <p class="modal__sub">Sirve para llenar los horarios flojos o premiar a los que juegan seguido.</p>

    <label class="campo"><span>Descripción</span>
      <input id="prDesc" placeholder="Martes al mediodía"></label>

    <label class="campo"><span>Se aplica a</span>
      <select id="prCancha">
        <option value="">Todas mis canchas</option>
        ${canchas.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('')}
      </select></label>

    <div class="fila">
      <label class="campo"><span>Desde</span>
        <select id="prDesde">${HORAS.map(h => `<option ${h === '13:00' ? 'selected' : ''}>${h}</option>`).join('')}</select></label>
      <label class="campo"><span>Hasta</span>
        <select id="prHasta">${HORAS.map(h => `<option ${h === '16:00' ? 'selected' : ''}>${h}</option>`).join('')}</select></label>
    </div>

    <label class="campo"><span>Descuento (%)</span>
      <input type="number" id="prPct" value="20" min="5" max="60" step="5"></label>

    <label class="campo"><span>¿Para quién?</span>
      <select id="prTipo">
        <option value="horario">Todos los jugadores (hora de baja demanda)</option>
        <option value="frecuentes">Solo jugadores frecuentes (3+ partidos)</option>
      </select></label>

    <p class="form__error" id="prError"></p>

    <div class="modal__acciones">
      <button class="btn btn--ghost" data-cerrar-modal>Volver</button>
      <button class="btn btn--primary" id="btnCrearPromo">Publicar promoción</button>
    </div>
  `);

  document.getElementById('btnCrearPromo').addEventListener('click', () => {
    const desc = document.getElementById('prDesc').value.trim();
    if (!desc) { document.getElementById('prError').textContent = 'Escribí una descripción corta.'; return; }

    db = leerDB();
    const idCancha = document.getElementById('prCancha').value;

    db.promociones.push({
      id: nuevoId(db), id_proveedor: yo.id,
      id_cancha: idCancha ? Number(idCancha) : null,
      tipo: document.getElementById('prTipo').value,
      descripcion: desc,
      descuento_pct: Number(document.getElementById('prPct').value),
      desde: document.getElementById('prDesde').value,
      hasta: document.getElementById('prHasta').value,
      activa: true
    });

    // Avisamos a los jugadores: la promo sirve si se entera alguien
    db.usuarios.filter(u => u.rol === 'cliente').forEach(u =>
      notificar(db, u.id, `Nueva promo en ${yo.nombre}: ${desc}.`, 'promocion'));

    guardarDB(db);
    cerrarModal();
    aviso('Promoción publicada y avisada a los jugadores.');
    render();
  });
}

function togglePromo(id) {
  db = leerDB();
  const p = db.promociones.find(x => x.id === id);
  p.activa = !p.activa;
  guardarDB(db);
  aviso(p.activa ? 'Promoción activada.' : 'Promoción pausada.');
  render();
}

/* --------------------------------------------------------------------------
   ADMINISTRADOR
   -------------------------------------------------------------------------- */
function borrarUsuario(id) {
  const u = usuarioPorId(db, id);
  if (!confirm(`¿Eliminar la cuenta de ${u.nombre}?`)) return;

  db = leerDB();
  db.usuarios = db.usuarios.filter(x => x.id !== id);
  guardarDB(db);
  aviso('Cuenta eliminada.');
  render();
}

/* ==========================================================================
   BARRA SUPERIOR
   ========================================================================== */
document.getElementById('btnSalir').addEventListener('click', () => {
  cerrarSesion();
  window.location.href = 'index.html';
});
  
document.getElementById('btnCampana').addEventListener('click', () => irA('notificaciones'));

// Menú lateral en mobile
document.getElementById('btnMenu').addEventListener('click', () =>
  document.body.classList.toggle('menu-abierto'));

/* Arrancamos */
render();
