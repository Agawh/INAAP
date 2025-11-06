# Sistema de Gestión de Actividades - INATUR Táchira

Sistema de gestión de actividades operativas y efemérides para el Instituto Autónomo de Turismo del Estado Táchira.

## Configuración Local

### 1. Instalar PostgreSQL localmente

**En Windows:**
- Descargar desde: https://www.postgresql.org/download/windows/
- Instalar con pgAdmin incluido

**En macOS:**
\`\`\`bash
brew install postgresql@16
brew services start postgresql@16
\`\`\`

**En Linux (Ubuntu/Debian):**
\`\`\`bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
\`\`\`

### 2. Crear la base de datos

\`\`\`bash
# Conectar a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE inatur_db;

# Crear usuario (opcional)
CREATE USER inatur_user WITH PASSWORD 'tu_contraseña';
GRANT ALL PRIVILEGES ON DATABASE inatur_db TO inatur_user;

# Salir
\q
\`\`\`

### 3. Configurar variables de entorno

Copia `.env.local` y ajusta la cadena de conexión:

\`\`\`env
DATABASE_URL="postgresql://postgres:tu_contraseña@localhost:5432/inatur_db"
\`\`\`

### 4. Ejecutar scripts SQL

\`\`\`bash
# Ejecutar script de creación de tablas
psql -U postgres -d inatur_db -f scripts/01-create-tables.sql

# Ejecutar script de datos iniciales
psql -U postgres -d inatur_db -f scripts/02-seed-data.sql
\`\`\`

### 5. Instalar dependencias y ejecutar

\`\`\`bash
npm install
npm run dev
\`\`\`

El sistema estará disponible en: http://localhost:3000

## Usuario Inicial

- **Email:** admin@inatur.gob.ve
- **Contraseña:** Admin123!

⚠️ **IMPORTANTE:** Cambia esta contraseña después del primer inicio de sesión.

## Próximos Pasos

1. Implementar sistema de autenticación
2. Crear interfaces de gestión de usuarios
3. Desarrollar CRUD de actividades
4. Integrar sistema de notificaciones
5. Configurar despliegue en Vercel con Neon

## Estructura de la Base de Datos

- **usuarios**: Gestión de usuarios del sistema
- **departamentos**: Departamentos de INATUR
- **actividades**: Actividades operativas y efemérides
- **actividades_departamentos**: Relación many-to-many entre actividades y departamentos
- **notificaciones**: Registro de notificaciones enviadas
- **configuracion_notificaciones**: Preferencias de notificación por usuario
- **registro_actividades**: Auditoría de cambios
- **registro_apis_externas**: Log de llamadas a APIs externas
