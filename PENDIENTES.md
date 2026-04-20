# Pendientes — My_Dr (actualizado 2026-04-20, sesión login)

## Contexto de arquitectura
- `clinic_id` es el tenant central. Cada doctor, secretaria y paciente pertenece a una clínica.
- Paciente pertenece al doctor que lo registró; acceso a historial se abre via `referrals` activa.
- Secretaria tiene `scope`: `'clinic'` (ve todos los doctores de la clínica) o `'personal'` (solo su `assigned_doctor_id`).

---

## ✅ Login Glassmorphism + Branding por clínica (COMPLETO)
- [x] `frontend/pages/Login.jsx`: rediseñado con fondo full-screen, card de cristal (backdrop-blur), inputs solo borde inferior con iconos Mail/Lock, botón "INICIAR SESIÓN" con color del acento de la clínica
- [x] `backend/routes/clinics.js`: nuevo endpoint público `GET /clinics/public/branding?clinicId=` — sin auth, devuelve `name`, `logoUrl`, `loginBgUrl`, `primaryColor` desde `settings` JSONB
- [x] `frontend/pages/Settings.jsx`: tab "Branding" (solo admin) — permite configurar URL de fondo y color principal con vista previa en tiempo real; guarda en `clinics.settings.loginBgUrl` y `primaryColor`
- [x] Fondo por defecto: imagen de pediatría (Unsplash). Personalizable por clínica desde Settings → Branding
- [x] `VITE_CLINIC_ID`: env var opcional para apuntar la page de login a una clínica específica

---

## ✅ Sesión 2026-04-20 — UX/UI + Seguridad

### P0 — Seguridad (COMPLETO)
- [x] `backend/routes/vaccinations.js` `/overdue`: secretaria filtra por `secretary_clinics`, admin acepta `clinicId` query param
- [x] `frontend/pages/Vaccinations.jsx`: pasa `clinicId` del proyecto activo al endpoint `/overdue`; re-fetch cuando cambia `activeProject.id`

### P1 — Documentos funcionales (COMPLETO)
- [x] `backend/routes/documents.js`: nuevo endpoint `POST /:id/email` — envía documento formateado vía Resend y marca `sent_at`
- [x] `backend/routes/documents.js`: búsqueda server-side con ILIKE en nombre de paciente y título
- [x] `frontend/components/DocumentViewModal.jsx`: modal nuevo con vista formateada, impresión/descarga via `window.open + print`, envío de email con input inline
- [x] `frontend/pages/Documents.jsx`: botones Ver/Descargar/Enviar conectados al `DocumentViewModal`; búsqueda debounced server-side (eliminada la duplicada client-side)

### P2 — DocumentModal UX + Auto-fill (COMPLETO)
- [x] `frontend/components/DocumentModal.jsx`: reescrito con auto-fill desde última consulta del paciente
- [x] Lab order: checklist de exámenes por grupos (Hematología, Química, Orina, Serología, Imágenes, Microbiología)
- [x] Incapacidad: campos estructurados (días de reposo + diagnóstico) pre-llenados del diagnóstico de la consulta
- [x] Banner de "Prellenado desde consulta del DD/MM/YYYY" cuando hay datos de la consulta

### P2 — Gráficas de crecimiento (COMPLETO)
- [x] `frontend/components/GrowthComparison3D.jsx`: reemplazado el visor 3D con **Clinical Dashboard** (semáforo por métrica: peso, talla, IMC — con percentil, tendencia ↑↓→ y resumen para padres)
- [x] Siluetas mejoradas: exageración 1.8x del ancho (bodyFat más visible), torso/brazos/piernas amplificados, etiquetas con valores y unidades
- [x] `frontend/pages/PatientDetail.jsx`: botón "🧍 3D" renombrado a "📊 Clínico"

### P3 — Fixes generales (COMPLETO)
- [x] `backend/routes/documents.js`: búsqueda server-side añadida (ILIKE en `first_name`, `last_name`, `title`)
- [x] `frontend/pages/Documents.jsx`: debounce 300ms + búsqueda enviada al backend (eliminado client-side filter)

---

## ✅ Sistema de referrals — COMPLETO (2026-03-31)

### Backend
- [x] Migración SQL: tabla `referrals` + `scope`/`assigned_doctor_id` en `secretaries`
- [x] `routes/referrals.js`: GET, POST, PATCH status con autorización por rol
- [x] `routes/patients.js`: doctor ve sus pacientes + referidos activos
- [x] `routes/appointments.js`: secretaria filtra por scope (clinic/personal)
- [x] `routes/users.js`: GET lista, GET por ID, POST, PUT — todos manejan `secretaryScope` y `assignedDoctorId`

### Frontend
- [x] `PatientDetail.jsx`: tab "Referidos" con lista, badges de estado, botón "Nueva referencia" y refresco automático
- [x] `PatientDetail.jsx`: botón "Referir" en el header como acceso rápido
- [x] `Users.jsx`: campos de scope y doctor asignado en modal crear/editar secretaria
- [x] `pages/Referrals.jsx`: página global de referencias con filtros y acciones
- [x] `App.jsx` + `Layout.jsx`: ruta y sidebar para doctores y admins

---

## ❌ Pendiente / Ideas futuras

### Recetas (prescriptions) — COMPLETO (2026-04-20)
- [x] AI sugerencia separada del form: banner "Sugerencia IA — revisa antes de aplicar" con botón Aplicar/Descartar. AI nunca sobreescribe campos del Dr.
- [x] Validación: bloquea guardar si falta `medicationName`, `dose` o `frequency`; errores inline en rojo por campo
- [x] Print client-side: `openPrintWindow(pr)` genera HTML con logo de clínica, tabla de medicamentos, firma del Dr, datos del paciente/alergias
- [x] Flujo post-guardar: pantalla de confirmación con "Imprimir / Guardar PDF" (abre ventana print) y "Cerrar sin imprimir"
- [x] `backend/routes/prescriptions.js` `GET /:id`: añadido `clinic.logoUrl` en respuesta para el letterhead

### WHO Curves — Mejoras opcionales
- [ ] Sombrear bandas percentílicas (p3–p97) con colores distintos (verde centro, amarillo bordes, rojo extremos)
- [ ] Eje X en meses para <2 años, años para ≥2 años
- [ ] Marcador grande con tooltip en punto actual del paciente

### Notificaciones referrals
- [ ] Notificación al doctor receptor cuando recibe una referencia activa
- [ ] Vista del paciente mostrando qué doctores tienen acceso referido a su historial

---

## Rutas API nuevas esta sesión
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/vaccinations/overdue?clinicId=` | Filter por clínica para admin/secretary |
| POST | `/api/documents/:id/email` | Enviar documento por email vía Resend |
| GET | `/api/documents?search=` | Búsqueda server-side por nombre paciente / título |
