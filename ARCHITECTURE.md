# Arquitectura del Sistema: My_Dr (Plataforma Médica Pediátrica)

Este documento centraliza toda la información técnica y de arquitectura del proyecto `My_Dr`. Actúa como la única fuente de la verdad para desarrolladores y herramientas automatizadas que operan en este repositorio.

## 1. Visión General
`My_Dr` es un sistema integral de gestión de clínicas médicas con enfoque en pediatría ("Dr.Platform"). Su principal propuesta de valor incluye un rendimiento veloz (Code Splitting), integración de curvas de crecimiento de la OMS, y visualizadores pediátricos interactivos en 3D (Spline/Three.js).

## 2. Stack Tecnológico

### 2.1. Frontend
La aplicación cliente ("frontend") está diseñada con un enfoque premium de "Lujo Silencioso", alta reactividad, y máxima eficiencia en tiempos de carga.
- **Framework Core**: React 18, empaquetado y construido con Vite (ES Modules, Hot Module Replacement rápido).
- **Enrutamiento**: `react-router-dom` v6. Utiliza un esquema protegido basado en Roles (`admin`, `doctor`) y Lazy-loading a nivel de rutas (`React.lazy` + `Suspense`) para dividir el bundle JS inicial y acelerar drásticamente el First Contentful Paint.
- **Estilos**: Tailwind CSS combinado con autoprefixer, soportando variables y modo oscuro mediante configuraciones personalizadas.
- **Estado Global**: `Zustand` (preferido para manejo ligero y robusto), combinado con `Context API` (ej. `AuthContext`, `PreferencesContext`).
- **Gráficos y Visualización**: 
  - `recharts`: Para visualizaciones 2D de datos de los pacientes (ej. curvas tabulares).
  - `three`, `@react-three/fiber`, `@react-three/drei`: Componentes complejos para visualizador pediátrico 3D (ej. `Pediatric4DViewer`).
  - `Spline`: Curvas complejas y modelado médico avanzado.
- **Manejo de Formularios**: `react-hook-form`
- **Iconografía y Tipografía**: `lucide-react`, fuentes modernas (familia de Inter / Sans Serif moderna).
- **Comunicaciones**: `axios` para peticiones HTTP al backend.

### 2.2. Backend
El servidor ("backend") es una API RESTful escalable diseñada para manejar la lógica de negocio, seguridad de datos de pacientes (HIPAA-ready conceptualmente), y comunicarse con motores de bases de datos remotas.
- **Entorno**: Node.js (>=18.0.0)
- **Framework API**: Express.js (v4)
- **Base de Datos / Driver**: PostgreSQL (integrado mediante el paquete `pg`).
- **Seguridad**:
  - Autenticación: JSON Web Tokens (`jsonwebtoken`) + Revocación por listas negras (Blocklist).
  - Hashing de contraseñas: `bcryptjs`.
  - Seguridad en HTTP Headers: `helmet`, `cors`.
  - Rate Limiting: `express-rate-limit` para prevención de abusos.
- **Validación de Datos**: `express-validator` (validación estricta de payloads entrantes).
- **Manejo de Archivos/Imágenes de Pacientes**: Middleware `multer` con `multer-s3` respaldado de `@aws-sdk/client-s3` (para subir documentos o imágenes del paciente directo al Almacenamiento en la Nube / AWS S3/Cloud Storage).
- **Inteligencia Artificial (Chatbot/Análisis Clínico)**: Integración híbrida. Utiliza `@google/generative-ai` y `openai`.
- **Comunicaciones**: `resend` para correos transaccionales (confirmaciones de cuenta, recuperación, notificaciones de clínicas).
- **Logger**: `winston` (rastreo robusto de eventos de servidor y auditoría transaccional de estados financieros).

## 3. Estructura de Proyecto ("Monorepo" Lógico)
```
/Proyectos/My_Dr/
│
├── frontend/                     # Aplicación SPA de React
│   ├── public/                   # Archivos estáticos
│   ├── src/                      # Código fuente React
│   │   ├── components/           # Componentes reutilizables (WHOGrowthCurves, Layout)
│   │   ├── context/              # Contextos globales (Auth, Preferences)
│   │   ├── pages/                # Vistas principales separadas por chunks (Lazy Loaded)
│   │   ├── App.jsx               # Router raíz de la aplicación
│   │   └── main.jsx              # Entrypoint de Vite
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── backend/                      # API de Express
    ├── src/
    │   ├── config/               # Variables de entorno y llaves
    │   ├── middleware/           # Interceptores (Auth JWT, RateLimit, ErrorHandlers)
    │   ├── routes/               # Enrutadores (ej. /growth, /auth, /patients)
    │   ├── services/             # Lógica de negocio core e IA
    │   ├── utils/                # Utilidades comunes (growthStandards.js)
    │   └── index.js              # Entrypoint servidor Express
    └── package.json
```

## 4. Patrones de Desarrollo Aceptados
1. **Lazy Loading**: Ningún componente pesado (en Vistas o Páginas) debe ser importado de manera asíncrona ("top-level") en el enrutamiento principal, a fin de evitar el "JavaScript Bloat". Usar siempre `lazy(() => import(...))` con `Suspense`.
2. **Archivos Centralizados de Tareas Complejas**: Componentes complejos, como `Pediatric4DViewer` y lógica de crecimientos (`growthStandards.js`), se manejan herméticamente y son exportables bajo interfaces bien predecibles.
3. **Auditoría Financiera**: Implementado guardado estricto contra mutaciones silenciosas y anulaciones, para asegurar un log real de modificaciones de transacciones.
4. **Diseño de Interfaz "Quiet Luxury" Clínico**: Limpieza, mucho espacio en blanco, colores tenues (Teal, grises suaves), sombras amplias pero de baja opacidad. Animaciones ligeras y utilitarias.

Este archivo es mantenido continuamente por el agente IA y puede ser referido en el futuro sin necesidad de volver a solicitar un escaneo inicial del sistema.
