---
title: Dashboard como Módulo de Inicio + Mejoras Profesionales
status: done
priority: high
type: feature
tags: [dashboard, ux, analytics]
created_by: agent
created_at: 2026-04-24T06:02:00Z
position: 9
---

## Notes

**Objetivo:** Convertir Dashboard en el módulo de inicio principal del sistema (reemplazando /home) y mejorarlo significativamente con estadísticas avanzadas y gráficas profesionales.

**Contexto:**
- Actualmente existe un módulo `/home` que solo muestra un mensaje básico
- El Dashboard está relegado a un item del sidebar más abajo
- Se necesita un Dashboard profesional estilo SaaS moderno (inspiración: Square, Shopify, Linear)

**Archivos a modificar:**
1. `src/pages/home.tsx` - ELIMINAR completamente
2. `src/components/Sidebar.tsx` - Reordenar items (Dashboard primero)
3. `src/pages/auth/login.tsx` - Cambiar redirect de /home → /dashboard
4. `src/pages/dashboard.tsx` - Mejorar completamente con stats avanzadas

**Requerimientos del nuevo Dashboard:**

**Layout:**
- Grid de 4 cards principales arriba (Ingresos Hoy, Órdenes, Clientes, Semana)
- Cada card con icono, valor principal, y comparativa vs período anterior
- Indicadores visuales de tendencia (↑ verde / ↓ rojo)

**Stats Principales (fila superior):**
1. **Ingresos de Hoy** - Total + % cambio vs ayer (verde/rojo)
2. **Órdenes de Hoy** - Cantidad + ticket promedio
3. **Clientes Hoy** - Clientes únicos atendidos
4. **Ingresos Semana** - Últimos 7 días

**Gráficas (fila intermedia):**
1. **Ventas por Hora** - Gráfica de barras horizontal mostrando distribución de ventas por hora del día
2. **Top 5 Productos** - Lista rankeada de productos más vendidos con cantidad e ingresos

**Tablas (fila inferior):**
1. **Ventas Recientes** - Últimas 5 ventas con hora y total
2. **Alertas de Inventario** - Items con stock bajo (destacados en rojo)

**Diseño Visual:**
- Cards con `border-2` para mayor presencia
- Paleta de colores del sistema (primary café, accent verde, destructive rojo)
- Iconos lucide-react apropiados (DollarSign, ShoppingCart, Users, TrendingUp, Clock, Package, AlertCircle)
- Espaciado generoso (gap-6/8)
- Responsive: mobile 1 col, tablet 2 cols, desktop 4 cols
- Hover states en elementos interactivos

**Datos a mostrar:**
- Stats diarias: usar `dashboardService.getTodayStats()`
- Comparativas: calcular vs ayer, semana, mes
- Ventas por hora: agrupar ventas del día por hora (8am-10pm)
- Top productos: ordenar por cantidad vendida y revenue
- Low stock: items donde `current_stock < min_stock`

**Sidebar:**
Nuevo orden de items:
1. Dashboard (primer lugar, donde estaba "Inicio")
2. POS
3. Productos
4. Inventario
5. Clientes
6. Corte de Caja
7. (resto sin cambios)

**Login redirect:**
Cambiar `window.location.href = "/home"` → `window.location.href = "/dashboard"`

## Checklist

- [x] Eliminar archivo `src/pages/home.tsx` completamente
- [x] Reordenar `src/components/Sidebar.tsx`: Dashboard como primer item del array menuItems
- [x] Modificar `src/pages/auth/login.tsx`: cambiar redirect a `/dashboard` en función handleLogin
- [x] Reescribir `src/pages/dashboard.tsx` con nuevo diseño profesional:
  - Grid 4 columnas para stats principales
  - Card Ingresos de Hoy con comparativa vs ayer y flecha de tendencia
  - Card Órdenes de Hoy con ticket promedio
  - Card Clientes Hoy (clientes únicos)
  - Card Ingresos Semana (últimos 7 días)
  - Gráfica horizontal de Ventas por Hora (barras con bg-accent/70)
  - Lista Top 5 Productos con ranking visual
  - Tabla Ventas Recientes con hora y total
  - Tabla Alertas de Inventario con destacado en rojo
- [x] Calcular stats avanzadas: revenue de ayer, semana, mes, ticket promedio
- [x] Implementar indicadores de tendencia con iconos ArrowUpRight/ArrowDownRight
- [x] Agregar estados vacíos amigables ("No hay datos...", "¡Todo en orden!")

## Acceptance

- ✅ Usuario inicia sesión → redirige automáticamente a `/dashboard`
- ✅ Dashboard muestra 4 cards principales con stats en tiempo real
- ✅ Gráficas visualizan ventas por hora y top productos
- ✅ Alertas de inventario aparecen destacadas si hay items con stock bajo
- ✅ Diseño responsive funciona en mobile, tablet y desktop
- ✅ Ya no existe acceso a `/home` (404 si se intenta acceder)