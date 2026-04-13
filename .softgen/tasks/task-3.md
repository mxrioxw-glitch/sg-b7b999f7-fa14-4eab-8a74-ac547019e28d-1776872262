---
title: Authentication Views & Super Admin
status: todo
priority: high
type: feature
tags: [auth, admin, frontend]
created_by: agent
created_at: 2026-04-13T23:53:19Z
position: 3
---

## Notes
Crear vistas completas de autenticación (login, registro, recuperación) con activación automática de prueba gratis 7 días. Implementar panel oculto de super administrador con credenciales mxrioxw@gmail.com / 640248.

## Checklist
- [ ] Crear página /auth/login (email + password, link recuperación)
- [ ] Crear página /auth/register (registro con activación 7 días gratis)
- [ ] Crear página /auth/recovery (recuperación de contraseña)
- [ ] Implementar lógica de trial automático 7 días en registro
- [ ] Crear página /super-admin (dashboard oculto)
- [ ] Dashboard super admin: lista todos los clientes
- [ ] Dashboard super admin: gestión de planes y precios
- [ ] Dashboard super admin: métricas SaaS (MRR, usuarios activos)
- [ ] Dashboard super admin: activar/desactivar cuentas
- [ ] Middleware de autenticación (validar sesión)
- [ ] Middleware de suscripción (bloquear si no paga)