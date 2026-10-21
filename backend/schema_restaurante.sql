-- Extensión de esquema para Reservas de Restaurante
USE soporte_tickets;

-- Ajuste de tabla clientes si ya existe
ALTER TABLE clientes 
    ADD COLUMN IF NOT EXISTS telefono VARCHAR(30) NOT NULL DEFAULT '555-0000',
    ADD COLUMN IF NOT EXISTS no_shows INT DEFAULT 0;

-- Tabla mesas
CREATE TABLE IF NOT EXISTS mesas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero INT NOT NULL UNIQUE,
    capacidad INT NOT NULL,
    ubicacion ENUM('interior', 'terraza', 'barra', 'vip') NOT NULL,
    activa BOOLEAN DEFAULT 1
);

-- Tabla horarios
CREATE TABLE IF NOT EXISTS horarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dia_semana ENUM('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo') NOT NULL UNIQUE,
    apertura TIME NOT NULL,
    cierre TIME NOT NULL
);

-- Tabla reservas
CREATE TABLE IF NOT EXISTS reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    mesa_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    personas INT NOT NULL,
    estado ENUM('pendiente', 'confirmada', 'cumplida', 'cancelada', 'no_show') DEFAULT 'pendiente',
    nota TEXT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reservas_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_reservas_mesa FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE CASCADE
);

-- Datos semilla: Mesas
INSERT INTO mesas (numero, capacidad, ubicacion, activa) VALUES
(1, 2, 'interior', 1),
(2, 2, 'terraza', 1),
(3, 4, 'interior', 1),
(4, 4, 'terraza', 1),
(5, 4, 'terraza', 1),
(6, 6, 'interior', 1),
(7, 8, 'vip', 1),
(8, 2, 'barra', 1),
(9, 4, 'interior', 0)
ON DUPLICATE KEY UPDATE capacidad=VALUES(capacidad), ubicacion=VALUES(ubicacion), activa=VALUES(activa);

-- Datos semilla: Horarios de atención (Lunes a Domingo)
INSERT INTO horarios (dia_semana, apertura, cierre) VALUES
('lunes', '13:00:00', '23:00:00'),
('martes', '13:00:00', '23:00:00'),
('miercoles', '13:00:00', '23:00:00'),
('jueves', '13:00:00', '23:00:00'),
('viernes', '12:00:00', '23:59:00'),
('sabado', '12:00:00', '23:59:00'),
('domingo', '12:00:00', '22:00:00')
ON DUPLICATE KEY UPDATE apertura=VALUES(apertura), cierre=VALUES(cierre);

-- Clientes semilla (con diferentes niveles de no_shows)
INSERT INTO clientes (id, nombre, email, telefono, no_shows) VALUES
(1, 'Juan Pérez', 'juan.perez@example.com', '555-1111', 0),
(2, 'María Gómez', 'maria.gomez@example.com', '555-2222', 1),
(3, 'Carlos López', 'carlos.lopez@example.com', '555-3333', 2),
(4, 'Roberto Sancionado', 'roberto.s@example.com', '555-4444', 3)
ON DUPLICATE KEY UPDATE telefono=VALUES(telefono), no_shows=VALUES(no_shows);

-- Reservas de ejemplo para pruebas
INSERT INTO reservas (cliente_id, mesa_id, fecha, hora_inicio, hora_fin, personas, estado, nota) VALUES
(1, 3, CURDATE(), '14:00:00', '16:00:00', 4, 'confirmada', 'Almuerzo de trabajo'),
(2, 4, CURDATE(), '20:00:00', '22:00:00', 4, 'pendiente', 'Mesa exterior preferida'),
(1, 1, CURDATE(), '13:00:00', '15:00:00', 2, 'cumplida', 'Cliente puntual');
