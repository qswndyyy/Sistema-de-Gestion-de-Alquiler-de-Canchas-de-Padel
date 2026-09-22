<?php
/* ==========================================================================
 * conexion.php
 * Archivo único de conexión a la base de datos. Se incluye desde cualquier
 * página PHP que necesite consultar la base (con require_once).
 * ========================================================================== */

// Datos de conexión (XAMPP por defecto: usuario "root", sin contraseña)
$host        = "localhost";
$usuario     = "root";
$contrasena  = "";
$base_datos  = "dbsgacp";

// Creamos la conexión con mysqli
$conexion = new mysqli($host, $usuario, $contrasena, $base_datos);

// Si falla la conexión, cortamos la ejecución y avisamos el motivo
if ($conexion->connect_error) {
    die("Error de conexión a la base de datos: " . $conexion->connect_error);
}

// Forzamos UTF-8 para que tildes y ñ se guarden/lean bien
$conexion->set_charset("utf8mb4");
?>
