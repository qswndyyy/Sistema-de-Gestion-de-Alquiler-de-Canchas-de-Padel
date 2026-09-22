<?php
    
require_once "conexion.php";

echo "<h2>Conexión exitosa a la base de datos '$base_datos' ✅</h2>";

// Probamos traer los usuarios de prueba que vienen en el schema.sql
$resultado = $conexion->query("SELECT id_usuario, nombre, email, rol FROM usuarios");

if ($resultado->num_rows > 0) {
    echo "<table border='1' cellpadding='8'>";
    echo "<tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th></tr>";

    while ($fila = $resultado->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $fila["id_usuario"] . "</td>";
        echo "<td>" . $fila["nombre"] . "</td>";
        echo "<td>" . $fila["email"] . "</td>";
        echo "<td>" . $fila["rol"] . "</td>";
        echo "</tr>";
    }

    echo "</table>";
} else {
    echo "<p>La tabla 'usuarios' está vacía.</p>";
}

$conexion->close();
?>
