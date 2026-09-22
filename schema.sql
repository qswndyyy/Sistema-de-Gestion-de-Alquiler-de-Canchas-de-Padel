-- ==========================================================================
-- PadelConnect — Base de datos
-- Motor: MySQL (pensado para usar con XAMPP)
-- ==========================================================================
-- Este script crea la base de datos completa según las funcionalidades
-- definidas en el documento funcional: usuarios y roles, canchas, reservas
-- (individuales y en equipo), pagos divididos, torneos, historial, ranking,
-- puntos/recompensas, notificaciones y promociones.
-- ==========================================================================

CREATE DATABASE IF NOT EXISTS dbsgacp
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE dbsgacp;

-- ==========================================================================
-- 1. USUARIOS
-- Guarda a los tres roles del sistema en una sola tabla, diferenciados por
-- la columna "rol". Así evitamos duplicar login/contraseña en 3 tablas.
-- ==========================================================================
CREATE TABLE usuarios (
  id_usuario      INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL,
  email           VARCHAR(150) NOT NULL UNIQUE,
  contrasena_hash VARCHAR(255) NOT NULL,      -- nunca se guarda como texto plano
  rol             ENUM('cliente', 'proveedor', 'administrador') NOT NULL DEFAULT 'cliente',
  fecha_registro  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================================
-- 2. CANCHAS
-- Cada cancha pertenece a un usuario con rol "proveedor".
-- ==========================================================================
CREATE TABLE canchas (
  id_cancha    INT AUTO_INCREMENT PRIMARY KEY,
  id_proveedor INT NOT NULL,
  nombre       VARCHAR(100) NOT NULL,
  ubicacion    VARCHAR(150) NOT NULL,
  tipo         VARCHAR(50)  NOT NULL,          -- ej: "pared de cristal", "pared de cemento", "indoor"
  precio_hora  DECIMAL(10,2) NOT NULL,
  activa       BOOLEAN NOT NULL DEFAULT TRUE,  -- permite dar de baja una cancha sin borrarla

  FOREIGN KEY (id_proveedor) REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE
);

-- ==========================================================================
-- 3. RESERVAS
-- Una reserva se hace sobre una cancha, en una franja horaria puntual.
-- "id_cliente" es quien creó la reserva (el organizador del partido).
-- ==========================================================================
CREATE TABLE reservas (
  id_reserva   INT AUTO_INCREMENT PRIMARY KEY,
  id_cancha    INT NOT NULL,
  id_cliente   INT NOT NULL,
  fecha        DATE NOT NULL,
  hora_inicio  TIME NOT NULL,
  hora_fin     TIME NOT NULL,
  tipo_reserva ENUM('individual', 'equipo') NOT NULL DEFAULT 'individual',
  estado       ENUM('pendiente', 'confirmada', 'cancelada') NOT NULL DEFAULT 'pendiente',
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (id_cancha) REFERENCES canchas(id_cancha)
    ON DELETE CASCADE,
  FOREIGN KEY (id_cliente) REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE
);

-- ==========================================================================
-- 4. JUGADORES POR RESERVA
-- Tabla intermedia: permite invitar varios jugadores a una misma reserva
-- y saber cuánto le toca pagar a cada uno.
-- ==========================================================================
CREATE TABLE reserva_jugadores (
  id_reserva      INT NOT NULL,
  id_usuario      INT NOT NULL,
  monto_a_pagar   DECIMAL(10,2) NOT NULL,
  pagado          BOOLEAN NOT NULL DEFAULT FALSE,

  PRIMARY KEY (id_reserva, id_usuario),
  FOREIGN KEY (id_reserva) REFERENCES reservas(id_reserva)
    ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE
);

-- ==========================================================================
-- 5. PAGOS
-- Registra cada pago individual dentro de una reserva (la división del
-- costo se resuelve en la app; acá solo queda el registro de cada cobro).
-- ==========================================================================
CREATE TABLE pagos (
  id_pago     INT AUTO_INCREMENT PRIMARY KEY,
  id_reserva  INT NOT NULL,
  id_usuario  INT NOT NULL,
  monto       DECIMAL(10,2) NOT NULL,
  metodo      VARCHAR(50) NOT NULL,           -- ej: "tarjeta", "mercado pago"
  estado      ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',
  fecha_pago  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (id_reserva) REFERENCES reservas(id_reserva)
    ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE
);

-- ==========================================================================
-- 6. TORNEOS
-- ==========================================================================
CREATE TABLE torneos (
  id_torneo    INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL,
  descripcion  TEXT,
  id_creador   INT NOT NULL,                  -- usuario que creó el torneo
  fecha_inicio DATE NOT NULL,
  fecha_fin    DATE NOT NULL,

  FOREIGN KEY (id_creador) REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE
);

-- Jugadores/equipos anotados en un torneo
CREATE TABLE torneo_participantes (
  id_torneo   INT NOT NULL,
  id_usuario  INT NOT NULL,

  PRIMARY KEY (id_torneo, id_usuario),
  FOREIGN KEY (id_torneo) REFERENCES torneos(id_torneo)
    ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE
);

-- ==========================================================================
-- 7. HISTORIAL DE PARTIDOS
-- Guarda el resultado de cada partido jugado, sea de una reserva suelta o
-- de un torneo (por eso "id_torneo" puede ser NULL).
-- ==========================================================================
CREATE TABLE partidos (
  id_partido   INT AUTO_INCREMENT PRIMARY KEY,
  id_reserva   INT NULL,
  id_torneo    INT NULL,
  id_ganador   INT NULL,                      -- usuario o capitán del equipo ganador
  resultado    VARCHAR(50),                   -- ej: "6-3 / 6-4"
  fecha        DATE NOT NULL,

  FOREIGN KEY (id_reserva) REFERENCES reservas(id_reserva)
    ON DELETE SET NULL,
  FOREIGN KEY (id_torneo) REFERENCES torneos(id_torneo)
    ON DELETE SET NULL,
  FOREIGN KEY (id_ganador) REFERENCES usuarios(id_usuario)
    ON DELETE SET NULL
);

-- ==========================================================================
-- 8. PUNTOS Y RANKING
-- "puntos" guarda cada movimiento (histórico); el ranking se calcula sumando
-- esta tabla, así queda registro de por qué cada usuario tiene esos puntos.
-- ==========================================================================
CREATE TABLE puntos (
  id_punto    INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario  INT NOT NULL,
  cantidad    INT NOT NULL,
  motivo      VARCHAR(100) NOT NULL,          -- ej: "victoria en partido", "partido jugado"
  fecha       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE
);

-- ==========================================================================
-- 9. NOTIFICACIONES
-- ==========================================================================
CREATE TABLE notificaciones (
  id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario      INT NOT NULL,
  mensaje         VARCHAR(255) NOT NULL,
  tipo            ENUM('reserva', 'recordatorio', 'resultado', 'promocion') NOT NULL,
  leida           BOOLEAN NOT NULL DEFAULT FALSE,
  fecha           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE
);

-- ==========================================================================
-- 10. PROMOCIONES
-- Creadas por un proveedor, para una cancha puntual o para todas las suyas.
-- ==========================================================================
-- ---------------------------------------------------------------------------
-- EVENTOS ESPECIALES
-- Bloquean el horario de una cancha (clínicas, torneos internos,
-- mantenimiento). Mientras dura el evento, ese turno no se puede reservar.
-- ---------------------------------------------------------------------------
CREATE TABLE eventos (
  id_evento  INT AUTO_INCREMENT PRIMARY KEY,
  id_cancha  INT NOT NULL,
  nombre     VARCHAR(100) NOT NULL,
  fecha      DATE NOT NULL,
  hora_desde TIME NOT NULL,
  hora_hasta TIME NOT NULL,

  FOREIGN KEY (id_cancha) REFERENCES canchas(id_cancha)
    ON DELETE CASCADE
);

CREATE TABLE promociones (
  id_promocion  INT AUTO_INCREMENT PRIMARY KEY,
  id_proveedor  INT NOT NULL,
  id_cancha     INT NULL,                     -- NULL = aplica a todas las canchas del proveedor
  descripcion   VARCHAR(255) NOT NULL,
  descuento_pct DECIMAL(5,2) NOT NULL,        -- ej: 20.00 = 20% de descuento
  tipo          ENUM('horario', 'frecuentes') NOT NULL DEFAULT 'horario',
                                              -- 'horario'    = promo por hora de baja demanda
                                              -- 'frecuentes' = solo para jugadores que juegan seguido
  hora_desde    TIME NOT NULL DEFAULT '00:00:00',  -- franja en la que se aplica el descuento
  hora_hasta    TIME NOT NULL DEFAULT '23:59:00',
  activa        BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_inicio  DATE NOT NULL,
  fecha_fin     DATE NOT NULL,

  FOREIGN KEY (id_proveedor) REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE,
  FOREIGN KEY (id_cancha) REFERENCES canchas(id_cancha)
    ON DELETE CASCADE
);

-- ==========================================================================
-- DATOS DE PRUEBA (opcional, para probar el sistema mientras se desarrolla)
-- ==========================================================================
INSERT INTO usuarios (nombre, email, contrasena_hash, rol) VALUES
('Wendy Quispe', 'wendy@dbsgacp.com', 'hash_de_prueba_1', 'cliente'),
('Complejo San Martín', 'sanmartin@dbsgacp.com', 'hash_de_prueba_2', 'proveedor'),
('Admin General', 'admin@dbsgacp.com', 'hash_de_prueba_3', 'administrador');

INSERT INTO canchas (id_proveedor, nombre, ubicacion, tipo, precio_hora) VALUES
(2, 'Cancha 1', 'Av. Siempre Viva 123', 'Cristal', 8000.00),
(2, 'Cancha 2', 'Av. Siempre Viva 123', 'Cemento', 7000.00);
