---
title: Authentication Views & Super Admin
status: in_progress
priority: high
type: feature
tags:
- auth
- admin
- frontend
created_by: agent
created_at: 2026-04-13 23:53:19+00:00
position: 3
---

## Notes
Crear vistas completas de autenticación (login, registro, recuperación) con activación automática de prueba gratis 7 días. Implementar panel oculto de super administrador con credenciales mxrioxw@gmail.com / 640248.

## Checklist
- [x] Crear página /auth/login (email + password, link recuperación)
- [x] Crear página /auth/register (registro con activación 7 días gratis)
- [x] Crear página /auth/recovery (recuperación de contraseña)
- [x] Implementar lógica de trial automático 7 días en registro
- [x] Crear página /super-admin (dashboard oculto)
- [x] Dashboard super admin: lista todos los clientes
- [x] Dashboard super admin: gestión de planes y precios
- [x] Dashboard super admin: métricas SaaS (MRR, usuarios activos)
- [x] Dashboard super admin: activar/desactivar cuentas
- [x] Middleware de autenticación (validar sesión)
- [x] Middleware de suscripción (bloquear si no paga)
---TASK:task-4.md:102
