# Pendientes — My_Dr (actualizado 2026-03-31)

## Contexto de arquitectura
- `clinic_id` es el tenant central. Cada doctor, secretaria y paciente pertenece a una clínica.
- Paciente pertenece al doctor que lo registró; acceso a historial se abre via `referrals` activa.
- Secretaria tiene `scope`: `'clinic'` (ve todos los doctores de la clínica) o `'personal'` (solo su `assigned_doctor_id`).

---

## ✅ Sistema de referrals — COMPLETO

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

- Notificación al doctor receptor cuando recibe una referencia activa
- Vista del paciente mostrando qué doctores tienen acceso referido a su historial
- Historial de cambios de estado en cada referencia

---

## Rutas API
| Método | Endpoint | Rol permitido |
|--------|----------|---------------|
| GET | `/api/referrals?patientId=&status=` | doctor, secretary, admin |
| POST | `/api/referrals` | doctor (own patient), secretary (scope), admin |
| PATCH | `/api/referrals/:id/status` | from/to doctor, secretary (scope), admin |
