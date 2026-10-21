-- Creación de la base de datos
CREATE DATABASE IF NOT EXISTS soporte_tickets CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE soporte_tickets;

-- Tabla clientes
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS clientes;

CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE
);

-- Tabla tickets con llave foránea a clientes
CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    asunto VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    urgencia ENUM('alta', 'media', 'baja') DEFAULT 'media',
    respuesta_sugerida TEXT NULL,
    estado ENUM('abierto', 'en progreso', 'cerrado') DEFAULT 'abierto',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tickets_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- Inserción de 3 clientes de ejemplo
INSERT INTO clientes (nombre, email) VALUES
('Juan Pérez', 'juan.perez@example.com'),
('María Gómez', 'maria.gomez@example.com'),
('Carlos López', 'carlos.lopez@example.com');

-- Inserción de 5 tickets de ejemplo
INSERT INTO tickets (cliente_id, asunto, descripcion, urgencia, respuesta_sugerida, estado) VALUES
(1, 'Error 500 al procesar pago con tarjeta', 'Al intentar pagar la suscripción me sale pantalla en blanco y error 500.', 'alta', NULL, 'abierto'),
(1, 'Consulta sobre cambio de plan', '¿Cómo puedo migrar mi cuenta al plan anual con descuento?', 'baja', NULL, 'abierto'),
(2, 'No puedo restablecer mi contraseña', 'El enlace de recuperación indica que expiró inmediatamente.', 'media', NULL, 'abierto'),
(3, 'Sistema caído en producción', 'Toda la plataforma arroja Gateway Timeout y no podemos operar.', 'alta', NULL, 'abierto'),
(2, 'Solicitud de factura del mes pasado', 'Requiero la factura fiscal del periodo anterior.', 'baja', NULL, 'cerrado');
