-- Updated to use the 4 correct INATUR departments
-- Insertar departamentos iniciales de INATUR Táchira
INSERT INTO departamentos (nombre, descripcion) VALUES
('Coordinador de Capacitación y Formación Turística', 'Responsable de la capacitación y formación en turismo'),
('Analista de Redes', 'Responsable del análisis de redes y sistemas'),
('Coordinación de Gestión Turística Estadal', 'Coordina la gestión turística a nivel estadal'),
('Coordinación de Promoción y Mercadeo', 'Responsable de promoción y estrategias de mercadeo');

-- Insertar usuario superusuario inicial
-- Contraseña: admin123 (deberás cambiarla en producción)
-- Hash generado con bcrypt, rounds=10: $2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5YmMxSUmmS46m
INSERT INTO usuarios (email, password_hash, nombre_completo, rol, departamento_id, activo)
SELECT 
    'admin@inatur.gob.ve',
    '$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5YmMxSUmmS46m',
    'Administrador del Sistema',
    'superusuario',
    (SELECT id FROM departamentos LIMIT 1),
    true;

-- Insertar configuración de notificaciones para el superusuario
INSERT INTO configuracion_notificaciones (usuario_id, telegram_habilitado, email_habilitado, calendario_habilitado, dias_anticipacion)
SELECT 
    id,
    true,
    true,
    true,
    3
FROM usuarios 
WHERE email = 'admin@inatur.gob.ve';
