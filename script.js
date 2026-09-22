
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Menú  ---------- */
  const navbar = document.getElementById('navbar');
  const burgerBtn = document.getElementById('burgerBtn');

  burgerBtn.addEventListener('click', () => {
    
    navbar.classList.toggle('is-open');
  });

  
  document.querySelectorAll('.navbar__links a').forEach((link) => {
    link.addEventListener('click', () => navbar.classList.remove('is-open'));
  });

  /* ---------- Navbar con más opacidad al hacer scroll ---------- */
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.style.backgroundColor = 'rgba(13, 13, 13, 0.95)';
    } else {
      navbar.style.backgroundColor = 'rgba(13, 13, 13, 0.75)';
    }
  });

  /* ---------- Contador animado de estadísticas del hero ---------- */
  
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
          obs.unobserve(entrada.target); 
        }
      });
    },
    { threshold: 0.5 }
  );

  statNumbers.forEach((stat) => observer.observe(stat));

});
