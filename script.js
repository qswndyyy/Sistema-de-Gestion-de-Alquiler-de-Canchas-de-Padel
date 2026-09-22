/* ==========================================================================
   PadelConnect — script.js
   Interacciones base del landing: menú mobile, navbar con fondo al scrollear
   y contador animado de estadísticas.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 1. Menú hamburguesa (mobile) ---------- */
  const navbar = document.getElementById('navbar');
  const burgerBtn = document.getElementById('burgerBtn');

  burgerBtn.addEventListener('click', () => {
    // Alterna la clase que muestra/oculta el menú (ver style.css → .is-open)
    navbar.classList.toggle('is-open');
  });

  // Cierra el menú al tocar un link (mejor experiencia en mobile)
  document.querySelectorAll('.navbar__links a').forEach((link) => {
    link.addEventListener('click', () => navbar.classList.remove('is-open'));
  });

  /* ---------- 2. Navbar con más opacidad al hacer scroll ---------- */
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.style.backgroundColor = 'rgba(13, 13, 13, 0.95)';
    } else {
      navbar.style.backgroundColor = 'rgba(13, 13, 13, 0.75)';
    }
  });

  /* ---------- 3. Contador animado de estadísticas del hero ---------- */
  // Usamos IntersectionObserver para que el conteo arranque recién cuando
  // el usuario llega a esa sección, no apenas carga la página.
  const statNumbers = document.querySelectorAll('.stat__number');

  const animarContador = (elemento) => {
    const valorFinal = parseInt(elemento.dataset.count, 10);
    const duracionMs = 1500;
    const pasoMs = 16; // ~60fps
    const totalPasos = duracionMs / pasoMs;
    const incremento = valorFinal / totalPasos;

    let valorActual = 0;

    const intervalo = setInterval(() => {
      valorActual += incremento;

      if (valorActual >= valorFinal) {
        elemento.textContent = valorFinal.toLocaleString('es-AR');
        clearInterval(intervalo);
      } else {
        elemento.textContent = Math.floor(valorActual).toLocaleString('es-AR');
      }
    }, pasoMs);
  };

  const observer = new IntersectionObserver(
    (entradas, obs) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          animarContador(entrada.target);
          obs.unobserve(entrada.target); // solo se anima una vez
        }
      });
    },
    { threshold: 0.5 }
  );

  statNumbers.forEach((stat) => observer.observe(stat));

});
