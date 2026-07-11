# PRP-001: Seguimiento de Ciclo Menstrual

> **Estado**: COMPLETADO (2026-07-11)
> **Fecha**: 2026-07-11
> **Proyecto**: ciclos

## Decisiones del Dueño (2026-07-11)

- **Modelo de uso**: Un usuario logueado administra una lista de varias mujeres (no es una app self-tracking por usuaria).
- **Historial**: Se guarda el historial COMPLETO de períodos por mujer (tabla `periods` separada). Permite calcular la duración promedio real del ciclo y mejorar predicciones.

---

## Objetivo

App de seguimiento de ciclo menstrual: registrar mujeres con la fecha de inicio de su último período, calcular automáticamente en qué fase del ciclo se encuentran hoy (menstrual, folicular, ovulación, lútea), y mostrar información educativa sobre estados de ánimo, energía y síntomas típicos de cada fase.

## Por Qué

| Problema | Solución |
|----------|----------|
| No se sabe en qué fase del ciclo está cada mujer sin calcular manualmente | Cálculo automático de fase a partir de la fecha de inicio del período y la duración del ciclo |
| La información de qué esperar en cada fase (ánimo, energía, síntomas) está dispersa | Panel informativo por fase, siempre visible junto al estado actual |
| Registros en papel o planillas se pierden y no persisten | CRUD persistido en Supabase con RLS |

**Valor de negocio**: Visibilidad inmediata del estado del ciclo de cada persona registrada; elimina cálculo manual propenso a errores y centraliza los registros.

## Qué

### Criterios de Éxito
- [ ] Se puede registrar una mujer con nombre, fecha de inicio del último período y duración del ciclo (default 28 días)
- [ ] La app muestra para cada registro: día del ciclo actual y fase (menstrual, folicular, ovulación, lútea) calculada correctamente
- [ ] Cada fase muestra su información de estado de ánimo, energía y síntomas típicos
- [ ] Se puede registrar un nuevo período (se agrega al historial, no sobreescribe) y eliminar registros
- [ ] El detalle muestra el historial de períodos y la duración promedio real del ciclo calculada desde el historial
- [ ] Los datos persisten en Supabase con RLS habilitado
- [ ] `npm run build` y typecheck pasan sin errores

### Comportamiento Esperado

1. La usuaria abre la app y ve la lista de mujeres registradas, cada una con su fase actual indicada visualmente (color por fase + día del ciclo).
2. Pulsa "Agregar" → formulario con nombre, fecha de inicio del último período, duración del ciclo (default 28) y duración del período (default 5). Validación con Zod.
3. Al guardar, la tarjeta muestra: "Día 16 de 28 — Ovulación" con la info de la fase: ánimo, energía y síntomas típicos.
4. Al hacer clic en un registro se ve el detalle: línea de tiempo del ciclo con las 4 fases, posición actual, y panel educativo de cada fase.
5. Cuando llega un nuevo período, se pulsa "Registrar período" → se agrega una fila al historial con la nueva fecha. El cálculo de fase usa siempre el período más reciente.
6. Con 2+ períodos registrados, la duración del ciclo deja de ser el valor manual y pasa a ser el promedio real entre inicios consecutivos (se muestra "ciclo promedio: X días").

### Lógica de Cálculo de Fase (pura, determinística)

```
diaDelCiclo = ((hoy - fechaInicio) en días) % duracionCiclo + 1

Fases (para ciclo de 28 días, escaladas proporcionalmente si difiere):
- Menstrual:  día 1 → duracionPeriodo (default 1-5)
- Folicular:  fin de menstrual → día ovulación - 2 (default 6-12)
- Ovulación:  ~día (duracionCiclo - 14) ± 1 (default 13-15)
- Lútea:      fin de ovulación → fin de ciclo (default 16-28)
```

---

## Contexto

### Referencias
- `src/features/.template/` - Estructura feature-first a replicar (components/hooks/services/store/types)
- `src/lib/supabase/client.ts` y `src/lib/supabase/server.ts` - Clientes Supabase ya configurados (patrón @supabase/ssr)
- `src/app/(main)/layout.tsx` - Layout de rutas autenticadas existente
- `src/app/(auth)/` - Login/signup ya scaffoldeados

### Estado actual del codebase
- Proyecto Next.js 16 + React 19 + TS + Tailwind 3.4 con scaffolding de SaaS Factory.
- Existen features heredadas del template (appointments, lawyers, booking) que NO se tocan; esta feature es independiente.
- No hay migraciones Supabase aplicadas para esta feature (carpeta `supabase/` vacía).
- Zod y Zustand aún no están en `package.json` → instalar al iniciar Fase 2/3.

### Arquitectura Propuesta (Feature-First)
```
src/features/cycle-tracking/
├── components/
│   ├── WomanCard.tsx          # Tarjeta con fase actual
│   ├── WomanForm.tsx          # Alta/edición (Zod)
│   ├── CycleTimeline.tsx      # Línea de tiempo de las 4 fases
│   └── PhaseInfoPanel.tsx     # Ánimo, energía, síntomas por fase
├── hooks/
│   └── useWomen.ts            # CRUD contra el service
├── services/
│   └── womenService.ts        # Supabase queries
├── lib/
│   ├── cycle-calculator.ts    # Funciones puras de cálculo de fase
│   └── phase-content.ts       # Contenido estático por fase (constantes)
└── types/
    └── index.ts               # Woman, CyclePhase, PhaseInfo

src/app/(main)/cycles/
├── page.tsx                   # Lista de mujeres con fase actual
└── [id]/page.tsx              # Detalle: timeline + info de fases
```

### Modelo de Datos
```sql
CREATE TABLE women (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cycle_length INT NOT NULL DEFAULT 28 CHECK (cycle_length BETWEEN 21 AND 40),  -- fallback manual; con 2+ períodos se usa el promedio real
  period_length INT NOT NULL DEFAULT 5 CHECK (period_length BETWEEN 2 AND 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historial completo de períodos (decisión del dueño: no solo el último)
CREATE TABLE periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  woman_id UUID NOT NULL REFERENCES women(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (woman_id, start_date)
);

ALTER TABLE women ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_rows_select" ON women FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_rows_insert" ON women FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_rows_update" ON women FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_rows_delete" ON women FOR DELETE USING (auth.uid() = user_id);

-- periods hereda ownership vía la mujer dueña (sin recursión: subquery simple a women)
CREATE POLICY "own_periods_select" ON periods FOR SELECT
  USING (woman_id IN (SELECT id FROM women WHERE user_id = auth.uid()));
CREATE POLICY "own_periods_insert" ON periods FOR INSERT
  WITH CHECK (woman_id IN (SELECT id FROM women WHERE user_id = auth.uid()));
CREATE POLICY "own_periods_delete" ON periods FOR DELETE
  USING (woman_id IN (SELECT id FROM women WHERE user_id = auth.uid()));
```

> La fase NO se guarda en BD: se calcula en runtime con funciones puras a partir del período MÁS RECIENTE en `periods` + la duración de ciclo efectiva. La duración efectiva es el promedio de los intervalos entre inicios consecutivos cuando hay 2+ períodos; si hay solo uno, se usa el `cycle_length` manual. El contenido de fases (ánimo/energía/síntomas) es estático en `phase-content.ts`, no requiere tabla.

---

## Blueprint (Assembly Line)

> IMPORTANTE: Solo FASES. Las subtareas se generan al entrar a cada fase con `/bucle-agentico`.

### Fase 1: Base de Datos
**Objetivo**: Tablas `women` y `periods` creadas en Supabase con RLS y policies por usuario.
**Validación**: `list_tables` muestra ambas tablas; `get_advisors` sin alertas de RLS; INSERT/SELECT de prueba funciona (incluyendo que un período de otra usuaria NO es visible).

### Fase 2: Lógica de Ciclo (dominio puro)
**Objetivo**: `cycle-calculator.ts` (día del ciclo + fase, escalado a duración del ciclo; duración efectiva = promedio de intervalos entre períodos si hay 2+, sino la manual) y `phase-content.ts` (ánimo, energía, síntomas de las 4 fases) con tipos TypeScript.
**Validación**: Casos de prueba deterministas: día 1 → menstrual, día 14/28 → ovulación, día 20 → lútea, ciclo de 30 días escala correctamente, promedio con historial [1-ene, 29-ene, 26-feb] → 28 días, fecha de inicio futura o >90 días manejada sin crash.

### Fase 3: CRUD de Registros
**Objetivo**: Service + hook + formularios con validación Zod para: crear/editar/eliminar mujeres, y registrar/eliminar períodos del historial.
**Validación**: Alta desde la UI persiste en Supabase; registrar un nuevo período agrega fila y recalcula fase y promedio; typecheck pasa.

### Fase 4: UI de Fases
**Objetivo**: Lista con `WomanCard` (fase actual con color distintivo), detalle con `CycleTimeline`, `PhaseInfoPanel` e historial de períodos con ciclo promedio, en rutas `(main)/cycles`.
**Validación**: Playwright screenshot de lista y detalle; las 4 fases se distinguen visualmente; historial visible; responsive básico.

### Fase 5: Validación Final
**Objetivo**: Sistema funcionando end-to-end.
**Validación**:
- [ ] `npm run typecheck` pasa (agregar script si falta)
- [ ] `npm run build` exitoso
- [ ] Playwright: flujo completo alta → ver fase → editar → eliminar
- [ ] Criterios de éxito cumplidos

---

## 🧠 Aprendizajes (Self-Annealing / Neural Network)

> Esta sección CRECE con cada error encontrado durante la implementación.

### 2026-07-11: MCP de Supabase con config vieja (timeouts fantasma)
- **Error**: Toda query SQL daba "Connection terminated due to connection timeout", aunque el proyecto estaba Healthy y el token era válido. `get_project_url` devolvía un project-ref DISTINTO al del `.mcp.json`.
- **Causa**: El servidor MCP lee `.mcp.json` UNA sola vez, al arrancar. Se editó el archivo con el proceso ya corriendo → seguía apuntando al proyecto anterior (pausado).
- **Fix**: Reiniciar Claude Code / reconectar los servidores MCP.
- **Aplicar en**: SIEMPRE que se edite `.mcp.json`. Diagnóstico rápido: si `get_project_url` no coincide con el `--project-ref` del archivo, el proceso está desactualizado.

### 2026-07-11: Tailwind v3 con sintaxis de v4 rompe el build
- **Error**: `Module not found: Can't resolve 'v8'` importando `tailwindcss` → `jiti` en el bundle del cliente.
- **Causa**: `globals.css` traía `@import 'tailwindcss'` (sintaxis **v4**) pero está instalada la **v3.4**. Webpack intenta resolver tailwind como módulo JS.
- **Fix**: Usar las directivas de v3: `@tailwind base; @tailwind components; @tailwind utilities;`
- **Aplicar en**: Todo proyecto con Tailwind 3.x.

### 2026-07-11: El middleware (proxy.ts) va DENTRO de src/
- **Error**: `/cycles` cargaba SIN sesión: la protección de rutas no corría. El build no listaba `ƒ Proxy (Middleware)`.
- **Causa**: `proxy.ts` estaba en la raíz del proyecto. Con carpeta `src/`, Next.js lo busca en `src/proxy.ts`.
- **Fix**: Mover a `src/proxy.ts`. Verificar que el build imprima `ƒ Proxy (Middleware)`.
- **Aplicar en**: Todo proyecto Next.js con `src/`. **Nunca confiar solo en RLS**: sin middleware la ruta se sirve igual (aunque vacía).

### 2026-07-11: Lockfile en carpeta padre desvía la raíz de Turbopack
- **Error**: El build intentaba compilar un `proxy.ts` de la carpeta PADRE, ajeno al proyecto.
- **Causa**: Había un `package-lock.json` en `prueba 1/`; Turbopack eligió esa carpeta como raíz.
- **Fix**: Fijar `turbopack.root` en `next.config.ts`.

### 2026-07-11: No crear usuarios de auth con INSERT directo
- **Error**: Usuario insertado por SQL en `auth.users` no podía loguearse ("credenciales incorrectas").
- **Causa**: GoTrue espera columnas de token que quedan en NULL con un INSERT manual. Además `auth.users` usa índice parcial → `ON CONFLICT (email)` falla.
- **Fix**: Crear el usuario por el flujo real de signup y, si hace falta para testear, solo confirmar el email: `UPDATE auth.users SET email_confirmed_at = now()`.

### 2026-07-11: Funciones de trigger no deben ser SECURITY DEFINER
- **Error**: `get_advisors` marcó `set_updated_at()` como ejecutable vía RPC público (`/rest/v1/rpc/set_updated_at`).
- **Fix**: `SECURITY INVOKER` + `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated`. Un trigger no necesita permisos elevados.
- **Aplicar en**: Toda función de trigger. Correr `get_advisors` DESPUÉS de cada migración.

### 2026-07-11: Los tests atraparon 2 errores... en los tests
- **Nota**: Los 2 fallos iniciales de `verify-cycle-calculator.ts` eran errores de las aserciones, no del código (indexar fases por posición fija asumiendo que siempre hay 4; y una resta de fechas mal hecha). Igual valieron: obligaron a verificar el caso de ciclos cortos (21 días) donde la fase folicular se comprime hasta desaparecer.

---

## Gotchas

> Cosas críticas a tener en cuenta ANTES de implementar

- [ ] `package.json` no tiene script `typecheck` ni dependencias `zod`/`zustand` → agregarlas antes de Fase 3
- [ ] Cálculo de días: usar solo fechas (DATE, sin hora) para evitar off-by-one por timezone; normalizar a medianoche local
- [ ] Si `last_period_start` está en el futuro, mostrar estado "pendiente" en vez de calcular fase negativa
- [ ] Si pasaron más días que `cycle_length` sin nuevo registro, indicar "ciclo atrasado" en vez de hacer módulo silencioso (decisión UX: mostrar ambos — fase estimada + aviso)
- [ ] La ovulación se ancla al FINAL del ciclo (duracionCiclo - 14), no al día 14 fijo — clave para ciclos ≠ 28 días
- [ ] El promedio de ciclo se calcula sobre intervalos entre inicios CONSECUTIVOS ordenados por fecha; descartar intervalos absurdos (<15 o >60 días) para que un dato mal cargado no rompa el promedio
- [ ] `UNIQUE (woman_id, start_date)` evita registrar dos veces el mismo período
- [ ] Contenido de fases es informativo/educativo, NO consejo médico → incluir disclaimer en `PhaseInfoPanel`
- [ ] Nombre de datos sensible (salud): RLS estricta por `user_id`, nunca exponer en rutas públicas

## Anti-Patrones

- NO crear nuevos patrones si los existentes funcionan (seguir `.template/`)
- NO guardar la fase calculada en BD (derivarla siempre en runtime)
- NO ignorar errores de TypeScript
- NO hardcodear rangos de fases en componentes (centralizar en `cycle-calculator.ts`)
- NO omitir validación Zod en el formulario

---

*PRP pendiente aprobación. No se ha modificado código.*
