/* ==========================================================================
 * auth.js — INICIO DE SESIÓN Y REGISTRO (ventana 2)
 
 * ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const tabs          = document.getElementById('authTabs');
  const formIngreso   = document.getElementById('formIngreso');
  const formRegistro  = document.getElementById('formRegistro');
  const errorIngreso  = document.getElementById('errorIngreso');
  const errorRegistro = document.getElementById('errorRegistro');

  /* ---------- Si ya hay sesión abierta, no mostramos el login ---------- */
  if (usuarioActual()) {
    window.location.href = 'app.html';
    return;
  }

  /* ---------- Pestañas Ingresar / Crear cuenta ---------- */
  function mostrarTab(cual) {
    tabs.querySelectorAll('.tabs__btn').forEach(b =>
      b.classList.toggle('is-active', b.dataset.tab === cual));
    formIngreso.classList.toggle('is-oculto', cual !== 'ingreso');
    formRegistro.classList.toggle('is-oculto', cual !== 'registro');
  }

  tabs.addEventListener('click', e => {
    const btn = e.target.closest('.tabs__btn');
    if (btn) mostrarTab(btn.dataset.tab);
  });

  // El index puede mandar directo a la pestaña de registro: login.html?modo=registro
  if (new URLSearchParams(window.location.search).get('modo') === 'registro') {
    mostrarTab('registro');
  }

  /* ---------- Botones de cuenta de prueba: completan el formulario ---------- */
  document.querySelectorAll('.demo').forEach(btn => {
    btn.addEventListener('click', () => {
      mostrarTab('ingreso');
      formIngreso.elements.email.value      = btn.dataset.email;
      formIngreso.elements.contrasena.value = btn.dataset.pass;
      formIngreso.elements.email.focus();
    });
  });

  /* ---------- Ingresar ---------- */
  formIngreso.addEventListener('submit', e => {
    e.preventDefault();
    errorIngreso.textContent = '';

    const email      = formIngreso.elements.email.value.trim().toLowerCase();
    const contrasena = formIngreso.elements.contrasena.value;

    const db      = leerDB();
    const usuario = db.usuarios.find(u => u.email.toLowerCase() === email);

    // Un solo mensaje para email inexistente y contraseña equivocada:
    // así no le confirmamos a nadie qué emails están registrados.
    if (!usuario || usuario.contrasena !== contrasena) {
      errorIngreso.textContent = 'El email o la contraseña no coinciden. Probá de nuevo.';
      return;
    }

    guardarSesion(usuario.id);
    window.location.href = 'app.html';
  });

  /* ---------- Crear cuenta ---------- */
  formRegistro.addEventListener('submit', e => {
    e.preventDefault();
    errorRegistro.textContent = '';

    const nombre     = formRegistro.elements.nombre.value.trim();
    const email      = formRegistro.elements.email.value.trim().toLowerCase();
    const contrasena = formRegistro.elements.contrasena.value;
    const rol        = formRegistro.elements.rol.value;

    const db = leerDB();

    // El email es único, igual que en la base (UNIQUE en la tabla usuarios)
    if (db.usuarios.some(u => u.email.toLowerCase() === email)) {
      errorRegistro.textContent = 'Ese email ya tiene una cuenta. Ingresá con tu contraseña.';
      return;
    }

    const usuario = {
      id: nuevoId(db),
      nombre, email, contrasena, rol,
      categoria: rol === 'cliente' ? 'Sin categoría' : '-'
    };
    db.usuarios.push(usuario);

    // Bienvenida: puntos de arranque + primera notificación
    if (rol === 'cliente') {
      db.puntos.push({ id_usuario: usuario.id, cantidad: 50, motivo: 'Bienvenida', fecha: hoyISO() });
    }
    db.notificaciones.push({
      id: nuevoId(db), id_usuario: usuario.id,
      mensaje: '¡Bienvenido a PadelConnect! Ya podés reservar tu primera cancha.',
      tipo: 'promocion', leida: false, fecha: hoyISO()
    });

    guardarDB(db);
    guardarSesion(usuario.id);
    window.location.href = 'app.html';
  });
});
