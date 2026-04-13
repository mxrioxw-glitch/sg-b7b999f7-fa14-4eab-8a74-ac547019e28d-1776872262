---
title: Database Schema & Authentication Setup
status: in_progress
priority: urgent
type: feature
tags: [backend, auth, database]
created_by: agent
created_at: 2026-04-13T23:53:19Z
position: 1
---

## Notes
Crear la arquitectura completa de base de datos multi-tenant con todas las tablas necesarias para el sistema POS SaaS. Implementar autenticación con Supabase Auth y configurar Row Level Security (RLS) para aislamiento de datos entre negocios.

## Checklist
- [x] Obtener schema actual de base de datos
- [x] Crear tabla profiles (extendiendo auth.users)
- [x] Crear tabla businesses (negocios/tenants)
- [x] Crear tabla subscriptions (planes y estado de pago)
- [x] Crear tabla employees (usuarios del negocio con roles)
- [x] Crear tabla categories (categorías de productos)
- [x] Crear tabla products (productos a vender)
- [x] Crear tabla product_variants (tamaños, etc)
- [x] Crear tabla product_extras (modificadores)
- [x] Crear tabla inventory_items (insumos/materias primas)
- [x] Crear tabla customers (clientes del negocio)
- [x] Crear tabla sales (ventas/órdenes)
- [x] Crear tabla sale_items (items de cada venta)
- [x] Crear tabla cash_registers (cortes de caja)
- [x] Crear tabla payment_methods (efectivo, tarjeta, etc)
- [x] Configurar RLS policies para multi-tenant
- [x] Crear trigger auto-creación de profile
- [x] Crear servicio de autenticación (authService.ts)
- [x] Crear servicios business y subscription
- [x] Configurar emails de autenticación