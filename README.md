PADELCONNECT — Sistema de gestión de alquiler de canchas de pádel
================================================================

CUENTAS DE PRUEBA (contraseña: 1234)
------------------------------------
- juan@demo.com   -> Jugador (cliente)
- club@demo.com   -> Proveedor de cancha
- admin@demo.com  -> Administrador
En la pantalla de login hay botones que las completan solas.
El botón "Reiniciar datos de demo" (abajo del menú lateral) borra todo
lo que se haya cargado y vuelve a los datos originales.

LAS VENTANAS
------------
index.html  -> Inicio: presentación del producto + prototipo de la app.
login.html  -> Iniciar sesión y crear cuenta (con elección de rol).
app.html    -> Panel. Cambia según quién entra:
               Jugador  : buscar canchas, mis reservas, torneos, ranking,
                          historial, puntos y premios, notificaciones.
               Proveedor: reservas recibidas, mis canchas, disponibilidad
                          y eventos, promociones, ranking.
               Admin    : reportes, usuarios, torneos, ranking y puntos,
                          canchas.

ARCHIVOS
--------
index.html / login.html / app.html  -> las tres pantallas
style.css                           -> colores, landing y formularios
app.css                             -> estilos del panel
script.js                           -> interacciones del inicio
data.js                             -> datos de ejemplo y "base" local
auth.js                             -> login y registro
app.js                              -> todo el panel (vistas y acciones)
schema.sql                          -> base de datos dbsgacp
conexion.php / test_conexion.php    -> conexión PHP a MySQL
    
