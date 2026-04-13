# POS SaaS System - Cloud-Based Point of Sale

## Vision
Sistema POS moderno en la nube enfocado en cafeterías y negocios de alimentos. Multi-tenant SaaS con suscripciones, optimizado para pantallas táctiles, diseño premium tipo Square/Shopify.

**Target:** Cafeterías, restaurantes, food trucks, reposterías
**Modelo:** SaaS con 7 días de prueba gratis
**UX Core:** Rápido, intuitivo, visual, táctil

## Design

**Colors (HSL shadcn tokens):**
- `--primary: 16 23% 19%` (café espresso oscuro - botones principales, headers)
- `--secondary: 16 24% 35%` (café medio - elementos secundarios)
- `--accent: 122 39% 49%` (verde menta - acciones, confirmaciones, success)
- `--background: 40 56% 97%` (crema claro - fondo principal)
- `--foreground: 16 23% 19%` (texto principal - mismo que primary)
- `--muted: 0 0% 62%` (gris cálido - texto secundario, disabled)
- `--card: 0 0% 100%` (blanco - cards, modales)
- `--border: 0 0% 90%` (bordes sutiles)

**Typography:**
- Heading: Plus Jakarta Sans (tech-professional, weights: 600, 700)
- Body: Work Sans (limpia, legible, weights: 400, 500, 600)

**Style:** Modern SaaS, botones grandes touch-friendly (min 60px), elevación sutil, micro-interacciones, espaciado generoso (gap-6/8)

## Features

### 1. Autenticación & SaaS
- Registro (email + password)
- Login seguro
- Recuperación de contraseña
- Prueba gratis 7 días automática
- Sistema de suscripciones (Básico/Profesional/Premium)
- Middleware validación suscripción activa

### 2. Super Admin Panel
- Credenciales: mxrioxw@gmail.com / 640248
- Dashboard con métricas SaaS (MRR, usuarios activos)
- Gestión clientes (activar/desactivar cuentas)
- Control de planes y precios
- Forzar suspensión de cuentas

### 3. Módulo Ventas (POS Core)
- Grid productos con imágenes
- Categorías dinámicas
- Buscador rápido
- Modal configuración producto (variantes, extras, notas)
- Carrito en tiempo real
- Métodos de pago (efectivo, tarjeta, mixto)
- Generación de tickets

### 4. Inventario
- Productos (lo que vendes)
- Insumos (materias primas)
- Descuento automático al vender
- Alertas bajo stock
- Ajustes manuales
- Kardex básico

### 5. Productos
- CRUD completo
- Categorías
- Precio base
- Variantes (tamaños)
- Extras (modificadores con precio)
- Imagen producto

### 6. Clientes
- Registro
- Historial de compras
- Notas
- Fidelización básica

### 7. Corte de Caja
- Apertura/cierre turno
- Registro ventas
- Diferencias
- Historial cortes

### 8. Configuración
- Info negocio (nombre, logo, dirección)
- Impuestos (IVA configurable)
- Empleados y roles
- Métodos de pago
- Personalización (colores, nombre POS)

### 9. Dashboard
- Ventas del día
- Ventas por hora
- Productos más vendidos
- Ingresos totales
- Gráficas simples

### 10. Bonus
- Multi-sucursal
- Impresión tickets
- Reportes PDF
- Notificaciones