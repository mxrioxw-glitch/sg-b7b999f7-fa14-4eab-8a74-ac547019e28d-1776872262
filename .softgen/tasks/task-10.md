---
title: Módulo Avanzado de Comedor y Gestión de Mesas
status: todo
priority: high
type: feature
tags:
- comedor
- restaurante
- mesas
- comandas
created_by: agent
created_at: 2026-04-24 06:40:00+00:00
position: 10
---

## Notes
**Objetivo:** Crear un módulo de "Comedor" profesional (tipo SoftRestaurant) para gestionar el flujo en sitio: mesas físicas, meseros, toma de pedidos, envío a cocina y cobro avanzado (cuentas divididas).

**Contexto y Funcionalidad:**
- Actualmente el módulo es un placeholder ("Próximamente").
- Se requiere infraestructura en base de datos para manejar órdenes *en curso* (diferentes a las *ventas* ya concretadas).
- El flujo debe ser: Abrir mesa -> Asignar mesero -> Agregar productos -> Enviar a cocina -> Pedir cuenta -> Cobrar (opción a dividir) -> Liberar mesa.
- Preparación para KDS: Los items deben tener un estado (pendiente, cocinando, servido).

## Checklist
- [ ] Estructura de datos y seguridad: Soporte para mesas físicas, comandas en curso, items por comanda y asignación de meseros (con políticas de acceso).
- [ ] UI de Mapa de Mesas: Cuadrícula visual mostrando todas las mesas con colores por estado (Libre, Ocupada, Sucia/Cobrando) y tiempo transcurrido.
- [ ] Panel de control de la mesa: Interfaz lateral o modal interactivo para ver el detalle de la mesa seleccionada.
- [ ] Gestión del personal: Funcionalidad para asignar el mesero inicial al abrir la mesa y opción para hacer cambio de mesero posteriormente.
- [ ] Toma de pedidos rápida: Buscador e interfaz táctil para agregar platillos, configurar variantes/extras y añadir notas especiales (ej. "Sin cebolla").
- [ ] Control de items: Acciones para editar cantidades, eliminar platillos ingresados por error y el botón maestro de "Enviar a Cocina".
- [ ] Sistema de cobro flexible: Opciones para cobro total o "Cuenta Dividida" (por montos iguales o seleccionando platillos específicos).
- [ ] Actualización de navegación: Remover el distintivo de "Próximamente" en el menú principal para habilitar el acceso.

## Acceptance
- ✅ El usuario puede visualizar un mapa de mesas e interactuar con ellas.
- ✅ Es posible abrir una mesa, asignarle un empleado (mesero) y cargarle productos del menú.
- ✅ Los productos cargados pueden ser marcados como "Enviados a cocina".
- ✅ El sistema permite cobrar la mesa completa o dividir la cuenta, liberando la mesa al procesar el pago total.
