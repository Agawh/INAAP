-- Fixed rol CHECK constraint to include 'miembro_departamento'
-- Crear extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla: departamentos
CREATE TABLE departamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT
);

-- Tabla: usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('superusuario', 'jefe_departamento', 'miembro_departamento')),
    departamento_id UUID REFERENCES departamentos(id) ON DELETE SET NULL,
    telegram_chat_id VARCHAR(255),
    correo_google VARCHAR(255),
    activo BOOLEAN DEFAULT true
);

-- Tabla: actividades
CREATE TABLE actividades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('operativa', 'efemeride')),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_progreso', 'completada', 'cancelada')),
    prioridad VARCHAR(50) NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta')),
    creado_por UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    asignado_a UUID REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabla: actividades_departamentos (relación many-to-many)
CREATE TABLE actividades_departamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actividad_id UUID NOT NULL REFERENCES actividades(id) ON DELETE CASCADE,
    departamento_id UUID NOT NULL REFERENCES departamentos(id) ON DELETE CASCADE,
    UNIQUE(actividad_id, departamento_id)
);

-- Tabla: notificaciones
CREATE TABLE notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actividad_id UUID NOT NULL REFERENCES actividades(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    canal VARCHAR(50) NOT NULL CHECK (canal IN ('telegram', 'email', 'calendario')),
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviada', 'fallida')),
    enviada_en TIMESTAMP,
    mensaje_error TEXT
);

-- Tabla: configuracion_notificaciones
CREATE TABLE configuracion_notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    telegram_habilitado BOOLEAN DEFAULT false,
    email_habilitado BOOLEAN DEFAULT false,
    calendario_habilitado BOOLEAN DEFAULT false,
    dias_anticipacion INTEGER DEFAULT 3
);

-- Tabla: registro_actividades (auditoría)
CREATE TABLE registro_actividades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actividad_id UUID NOT NULL REFERENCES actividades(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    accion VARCHAR(50) NOT NULL CHECK (accion IN ('creada', 'actualizada', 'eliminada', 'cambio_estado')),
    cambios JSONB
);

-- Tabla: registro_apis_externas
CREATE TABLE registro_apis_externas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_api VARCHAR(255) NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    codigo_estado INTEGER,
    respuesta JSONB,
    error TEXT
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_departamento ON usuarios(departamento_id);
CREATE INDEX idx_actividades_tipo ON actividades(tipo);
CREATE INDEX idx_actividades_estado ON actividades(estado);
CREATE INDEX idx_actividades_fecha_inicio ON actividades(fecha_inicio);
CREATE INDEX idx_actividades_creado_por ON actividades(creado_por);
CREATE INDEX idx_actividades_departamentos_actividad ON actividades_departamentos(actividad_id);
CREATE INDEX idx_actividades_departamentos_departamento ON actividades_departamentos(departamento_id);
CREATE INDEX idx_notificaciones_actividad ON notificaciones(actividad_id);
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_estado ON notificaciones(estado);
