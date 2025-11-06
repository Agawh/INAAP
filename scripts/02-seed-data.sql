-- scripts/02-seed-data.sql
-- (Contenido actualizado con un superusuario que funciona)

-- Insertar departamentos iniciales de INATUR Táchira
INSERT INTO departamentos (nombre, descripcion) VALUES
('Coordinador de Capacitación y Formación Turística', 'Responsable de la capacitación y formación en turismo'),
('Analista de Redes', 'Responsable del análisis de redes y sistemas'),
('Coordinación de Gestión Turística Estadal', 'Coordina la gestión turística a nivel estadal'),
('Coordinación de Promoción y Mercadeo', 'Responsable de promoción y estrategias de mercadeo');

-- Insertar usuario superusuario inicial (temporal que funciona)
-- Usuario: temp@inatur.gob.ve
-- Contraseña: inatur123
-- Hash: $2a$10$P.aa23k.fVICq1d6N/e3d.ww.fjlxSgzzsm1juf7aLhvyiMv53.Cq
INSERT INTO usuarios (email, password_hash, nombre_completo, rol, departamento_id, activo)
SELECT 
    'temp@inatur.gob.ve',
    '$2a$10$P.aa23k.fVICq1d6N/e3d.ww.fjlxSgzzsm1juf7aLhvyiMv53.Cq',
    'Administrador Temporal',
    'superusuario',
    (SELECT id FROM departamentos LIMIT 1),
    true
ON CONFLICT (email) DO UPDATE 
SET password_hash = '$2a$10$P.aa23k.fVICq1d6N/e3d.ww.fjlxSgzzsm1juf7aLhvyiMv53.Cq',
    nombre_completo = 'Administrador Temporal',
    rol = 'superusuario';

-- Insertar configuración de notificaciones para el superusuario
INSERT INTO configuracion_notificaciones (usuario_id, telegram_habilitado, email_habilitado, calendario_habilitado, dias_anticipacion)
SELECT 
    id,
    true,
    true,
    true,
    3
FROM usuarios 
WHERE email = 'temp@inatur.gob.ve'
ON CONFLICT (usuario_id) DO NOTHING;