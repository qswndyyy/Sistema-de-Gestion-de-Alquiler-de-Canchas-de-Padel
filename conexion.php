<?php



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


$conexion->set_charset("utf8mb4");
?>
