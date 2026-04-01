# Pendientes — My_Dr (actualizado 2026-03-31)

## Contexto de arquitectura
- `clinic_id` es el tenant central. Cada doctor, secretaria y paciente pertenece a una clínica.
- Paciente pertenece al doctor que lo registró; acceso a historial se abre via `referrals` activa.
- Secretaria tiene `scope`: `'clinic'` (ve todos los doctores de la clínica) o `'personal'` (solo su `assigned_doctor_id`).

---

## ✅ Completado

### Backend
- [x] `migrations/add_referrals_and_secretary_scope.sql`: tabla `referrals` + columnas `scope`/`assigned_doctor_id` en `secretaries`
- [x] `routes/referrals.js`: endpoints GET, POST, PATCH /:id/status con lógica de autorización por rol
- [x] `index.js`: referrals route registrada en `/api/referrals`
- [x] `routes/patients.js`: doctor ve sus propios pacientes + pacientes referidos activos
- [x] `routes/appointments.js`: secretaria con scope `personal` filtra solo citas de su doctor asignado
- [x] `routes/users.js` GET `/`: retorna `secretaryScope` y `assignedDoctorId`
- [x] `routes/users.js` GET `/:id`: retorna `secretaryScope` y `assignedDoctorId`
- [x] `routes/users.js` POST: guarda `scope` y `assigned_doctor_id` al crear secretaria
- [x] `routes/users.js` PUT: actualiza `scope` y `assigned_doctor_id` al editar secretaria

### Frontend
- [x] `PatientDetail.jsx`: botón "Referir paciente" + `ReferralModal` inline funcional
- [x] `Users.jsx` (UserModal): campos de `scope` y `assignedDoctorId` para secretarias (crear/editar)
- [x] `Users.jsx` (tabla): muestra "Personal" o "De clínica" en la fila de secretarias
- [x] `pages/Referrals.jsx`: página completa con lista, filtros por estado, acciones completar/revocar
- [x] `App.jsx`: ruta `/referrals` registrada (acceso: admin, doctor)
- [x] `Layout.jsx`: "Referencias" en sidebar (visible para doctor y admin)

---

## ❌ Pendiente

### Frontend — PRIORIDAD MEDIA
1. **Tab "Referidos" en PatientDetail:** Mostrar referencias activas/históricas dentro de la ficha del paciente.
   - Hacer `GET /api/referrals?patientId={id}` al cargar la ficha
   - Mostrar en un tab nuevo junto a Consultas, Vacunas, etc.

### Opcional / Mejoras futuras
- Notificación al doctor receptor cuando recibe una referencia activa
- Vista del paciente mostrando qué doctores tienen acceso referido a su historial

---

## Rutas API de referrals (resumen)
| Método | Endpoint | Rol permitido |
|--------|----------|---------------|
| GET | `/api/referrals?patientId=&status=` | doctor, secretary, admin |
| POST | `/api/referrals` | doctor (own patient), secretary (scope), admin |
| PATCH | `/api/referrals/:id/status` | from/to doctor, secretary (scope), admin |
