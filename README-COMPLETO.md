# 🏋️ Sistema de Gestión de Gimnasios con AI Coach Viral

## 🎯 **DESCRIPCIÓN**

Sistema completo SaaS para gestión de gimnasios con funcionalidades innovadoras:
- 🤖 **AI Coach Viral** - Genera contenido automático para redes sociales
- 🔗 **Acceso Genérico de Recepción** - Sin usuarios complejos
- 👥 **Sistema de Recepcionistas** - Con códigos de autorización
- 💳 **Renovación de Membresías** - Directamente desde recepción
- 📊 **Tracking Completo** - Historial de movimientos por responsable

## 🚀 **CARACTERÍSTICAS PRINCIPALES**

### **🏢 Multi-Tenant**
- ✅ Cada gimnasio completamente aislado
- ✅ Escalable a miles de gimnasios
- ✅ Row Level Security (RLS) en Supabase

### **🤖 AI Coach Viral**
- ✅ 4 personalidades: Motivador, Sarcástico, Abuela, Científico
- ✅ Detecta clientes ausentes automáticamente
- ✅ Genera contenido para planes vencidos
- ✅ Balance entre contenido negativo y positivo
- ✅ Tracking de contenido generado

### **🔗 Acceso de Recepción**
- ✅ Un enlace único por gimnasio
- ✅ Sin usuarios ni contraseñas
- ✅ Funciona en cualquier dispositivo
- ✅ Token renovable por seguridad

### **👥 Sistema de Recepcionistas**
- ✅ Hasta 4 recepcionistas por gimnasio
- ✅ Cada uno con nombre y código único
- ✅ Consultas libres + Renovaciones protegidas
- ✅ Tracking completo de responsabilidades

## 🛠️ **TECNOLOGÍAS**

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **AI:** OpenAI API para generación de contenido
- **Deployment:** Vercel (recomendado)

## 📋 **INSTALACIÓN**

### **1. Clonar Repositorio**
```bash
git clone https://github.com/tuusuario/sistema-gimnasios.git
cd sistema-gimnasios
```

### **2. Instalar Dependencias**
```bash
npm install
```

### **3. Configurar Variables de Entorno**
```bash
cp .env.example .env.local
```

Editar `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
OPENAI_API_KEY=tu_openai_key
```

### **4. Configurar Base de Datos**

**Paso 1:** Ejecutar schema inicial
```sql
-- Copiar y ejecutar: supabase.sql
```

**Paso 2:** Ejecutar migración de miembros
```sql
-- Copiar y ejecutar: migrations-members.sql
```

**Paso 3:** Ejecutar migración de recepcionistas
```sql
-- Copiar y ejecutar: migrations-recepcionistas.sql
```

**Paso 4:** Configurar acceso público
```sql
-- Copiar y ejecutar: fix-rls-public-access.sql
```

### **5. Ejecutar Aplicación**
```bash
npm run dev
```

## 📚 **ESTRUCTURA DEL PROYECTO**

### **📁 Páginas Principales**
```
/                           - Landing page
/auth/login                 - Login de dueños
/dashboard                  - Dashboard principal
/dashboard/clientes         - Gestión de clientes
/dashboard/planes           - Gestión de planes
/dashboard/ai-coach         - AI Coach viral
/dashboard/crear-acceso-recepcion     - Generar enlace recepción
/dashboard/configurar-recepcionistas  - Configurar códigos
/recepcion-token?token=...  - Terminal de recepción
```

### **📁 Estructura de Archivos**
```
app/
├── auth/                   # Autenticación
├── dashboard/              # Dashboard del gimnasio
│   ├── ai-coach/          # AI Coach viral
│   ├── clientes/          # Gestión de clientes
│   ├── crear-acceso-recepcion/     # Generar token
│   └── configurar-recepcionistas/  # Códigos autorización
├── recepcion-token/        # Terminal recepción
└── api/                    # API routes

lib/
├── supabase.ts            # Cliente Supabase
├── ai-coach.ts            # Lógica AI Coach
├── positive-content.ts    # Contenido positivo
└── cliente-status.ts      # Mantenimiento automático

migrations/
├── supabase.sql           # Schema inicial
├── migrations-members.sql # Funciones miembros
├── migrations-recepcionistas.sql # Sistema recepcionistas
└── fix-rls-public-access.sql     # Políticas públicas
```

## 🔄 **FLUJO DE TRABAJO**

### **Para Dueños de Gimnasio:**
1. 📝 Registro en `/auth/login`
2. 🏢 Configurar información del gimnasio
3. 👥 Agregar clientes y planes
4. 🤖 Activar AI Coach para contenido viral
5. 🔗 Generar enlace de recepción
6. 👤 Configurar recepcionistas con códigos

### **Para Recepcionistas:**
1. 📱 Abrir enlace de recepción en tablet/computadora
2. 🔍 Buscar clientes (sin código requerido)
3. ✅ Registrar asistencias (sin código requerido)
4. 🔐 Renovar membresías (requiere nombre + código)

### **Para AI Coach:**
1. 🕐 Ejecuta automáticamente cada día
2. 🎯 Detecta clientes ausentes y planes vencidos
3. 🎨 Genera contenido viral personalizado
4. 📊 Evita duplicados y rastrea engagement

## 🔐 **ESQUEMA DE BASE DE DATOS**

### **Tablas Principales:**
```sql
usuarios                    # Dueños de gimnasio
gimnasios                   # Establecimientos
  ├── access_token          # Token de recepción
  ├── recepcionista_1_*     # Datos recepcionista 1
  ├── recepcionista_2_*     # Datos recepcionista 2
  ├── recepcionista_3_*     # Datos recepcionista 3
  └── recepcionista_4_*     # Datos recepcionista 4

clientes                    # Miembros del gimnasio
planes                      # Tipos de membresía
inscripciones              # Planes activos/vencidos
asistencias                # Check-ins diarios
ai_content_generated       # Contenido AI generado
movimientos_recepcion      # Log de acciones recepción
```

### **Políticas de Seguridad:**
- 🔒 **RLS habilitado** en todas las tablas
- 🏢 **Aislamiento por gimnasio** automático
- 🔑 **Acceso público** solo con token válido
- 👤 **Tracking individual** por recepcionista

## 🚀 **DEPLOYMENT**

### **Vercel (Recomendado):**
```bash
npm install -g vercel
vercel
```

### **Variables de Entorno en Producción:**
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_produccion
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_produccion
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_produccion
OPENAI_API_KEY=tu_openai_key
NEXT_PUBLIC_APP_URL=https://tudominio.com
```

## 📊 **FUNCIONALIDADES POR MÓDULO**

### **🏠 Dashboard Principal**
- 📈 Métricas de clientes activos
- 📊 Asistencias del mes
- 💰 Ingresos por membresías
- 🎯 Resumen AI Coach

### **👥 Gestión de Clientes**
- ➕ Crear/editar clientes
- 📋 Gestionar inscripciones
- 💳 Control de pagos
- 📈 Historial de asistencias

### **🤖 AI Coach Viral**
- 🎯 Detección automática de problemas
- 🎨 Generación de contenido viral
- 📱 Múltiples formatos (memes, videos, stories)
- 📊 Balance contenido positivo/negativo

### **🔗 Terminal de Recepción**
- 🔍 Búsqueda rápida de clientes
- ✅ Registro de asistencias
- 👀 Verificación de membresías
- 🔐 Renovación con autorización

## 🛡️ **SEGURIDAD**

### **Autenticación:**
- 🔐 Supabase Auth para dueños
- 🔑 Tokens únicos para recepción
- 👤 Códigos individuales para recepcionistas

### **Autorización:**
- 🏢 RLS por gimnasio
- 👀 Consultas públicas limitadas
- 🔐 Renovaciones solo con código
- 📊 Tracking completo de acciones

### **Datos:**
- 🔒 Aislamiento total por tenant
- 🚫 Sin cross-gym data leaks
- 📝 Logs de todas las operaciones
- 🔄 Tokens renovables

## 📞 **SOPORTE**

### **Problemas Comunes:**
1. **Token inválido en recepción**
   - Verificar que se ejecutaron todas las migraciones
   - Regenerar token desde dashboard

2. **AI Coach no genera contenido**
   - Verificar OpenAI API key
   - Revisar que hay clientes con problemas

3. **Errores de permisos**
   - Verificar políticas RLS
   - Comprobar configuración de Supabase

### **Logs y Debug:**
- 🔍 Console del navegador para errores frontend
- 📊 Dashboard de Supabase para errores backend
- 🤖 OpenAI usage dashboard para límites API

## 🚀 **ROADMAP FUTURO**

### **Fase 2: Dashboard de Miembros**
- 🌐 Registro opcional de clientes
- 📱 Dashboard personal web
- 📊 Estadísticas de progreso

### **Fase 3: App Móvil**
- 📱 App nativa React Native
- 🔔 Push notifications
- 🏆 Gamificación completa
- 💳 Pagos in-app

## 📄 **LICENCIA**

Este proyecto está bajo licencia MIT. Ver archivo `LICENSE` para más detalles.

## 🤝 **CONTRIBUIR**

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit los cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

---

**Desarrollado con ❤️ para revolucionar la gestión de gimnasios**