
CREATE DATABASE IF NOT EXISTS dbsgacp
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE dbsgacp;

-- ==========================================================================
-- USUARIOS
--
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
-- CANCHAS
-- 
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
-- RESERVAS
-- 
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
-- JUGADORES POR RESERVA
-- 
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
-- PAGOS
-- 
-- ==========================================================================
CREATE TABLE pagos (
  id_pago     INT AUTO_INCREMENT PRIMARY KEY,
  id_reserva  INT NOT NULL,
  id_usuario  INT NOT NULL,
  monto       DECIMAL(10,2) NOT NULL,
  metodo      VARCHAR(50) NOT NULL,   
  estado      ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',
  fecha_pago  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (id_reserva) REFERENCES reservas(id_reserva)
    ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE
);

-- ==========================================================================
-- TORNEOS
-- ==========================================================================
CREATE TABLE torneos (
  id_torneo    INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL,
  descripcion  TEXT,
  id_creador   INT NOT NULL,                 
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
-- HISTORIAL DE PARTIDOS
-- 
-- ==========================================================================
CREATE TABLE partidos (
  id_partido   INT AUTO_INCREMENT PRIMARY KEY,
  id_reserva   INT NULL,
  id_torneo    INT NULL,
  id_ganador   INT NULL,                   
  resultado    VARCHAR(50),                  
  fecha        DATE NOT NULL,

  FOREIGN KEY (id_reserva) REFERENCES reservas(id_reserva)
    ON DELETE SET NULL,
  FOREIGN KEY (id_torneo) REFERENCES torneos(id_torneo)
    ON DELETE SET NULL,
  FOREIGN KEY (id_ganador) REFERENCES usuarios(id_usuario)
    ON DELETE SET NULL
);

-- ==========================================================================
-- PUNTOS Y RANKING
-- 
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
-- NOTIFICACIONES
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
-- PROMOCIONES
--
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
  id_cancha     INT NULL,                    
  descripcion   VARCHAR(255) NOT NULL,
  descuento_pct DECIMAL(5,2) NOT NULL,        -- ej: 20.00 = 20% de descuento
  tipo          ENUM('horario', 'frecuentes') NOT NULL DEFAULT 'horario',
                                              -- 'horario'    = promo por hora de baja demanda
                                              -- 'frecuentes' = solo para jugadores que juegan seguido
  hora_desde    TIME NOT NULL DEFAULT '00:00:00', 
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
-- DATOS DE PRUEBA 
-- ==========================================================================
INSERT INTO usuarios (nombre, email, contrasena_hash, rol) VALUES
('Wendy Quispe', 'wendy@dbsgacp.com', 'hash_de_prueba_1', 'cliente'),
('Complejo San Martín', 'sanmartin@dbsgacp.com', 'hash_de_prueba_2', 'proveedor'),
('Admin General', 'admin@dbsgacp.com', 'hash_de_prueba_3', 'administrador');

INSERT INTO canchas (id_proveedor, nombre, ubicacion, tipo, precio_hora) VALUES
(2, 'Cancha 1', 'Av. Siempre Viva 123', 'Cristal', 8000.00),
(2, 'Cancha 2', 'Av. Siempre Viva 123', 'Cemento', 7000.00);
