# MiFlix — Catálogo de contenido (estilo Netflix)

App **React Native (Expo) + TypeScript** que muestra un catálogo de shows organizado en
carruseles horizontales por categoría, con una pantalla de detalle que incluye póster,
sinopsis y lista de capítulos. Los datos viven en **Supabase (Postgres)**.

## Demo de funcionalidad

- **Home:** categorías apiladas verticalmente (Populares, Drama, Comedia, Ciencia Ficción).
  Cada una es un carrusel horizontal (`FlatList`) de posters. Pull-to-refresh incluido.
- **Detalle:** al tocar un poster se navega a la pantalla del show con título, póster,
  sinopsis y la lista de capítulos ordenada. El botón de volver del header regresa a Home.

## Stack

| Área         | Tecnología                                              |
| ------------ | ------------------------------------------------------- |
| UI           | React Native + Expo (SDK 57), TypeScript                |
| Navegación   | `@react-navigation/native` + `native-stack`             |
| Backend      | Supabase (Postgres, RLS, función RPC)                   |
| Datos        | `@supabase/supabase-js`                                 |

---

## Cómo correr el proyecto

### 1. Requisitos

- Node 18+ (probado con Node 22)
- App **Expo Go** en tu celular, o un emulador Android / simulador iOS.

### 2. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Abre **SQL Editor** y ejecuta el contenido de [`supabase/schema.sql`](./supabase/schema.sql).
   Esto crea las tablas, las políticas de lectura (RLS), la función `get_home_catalog()`
   y carga datos de ejemplo.
3. En **Project Settings → API** copia el **Project URL** y la **anon public key**.

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

> El prefijo `EXPO_PUBLIC_` es obligatorio para que Expo inyecte las variables en el cliente.
> El archivo `.env` está en `.gitignore`; nunca se sube al repo.

### 4. Instalar y arrancar

```bash
npm install
npx expo start
```

Escanea el QR con Expo Go, o pulsa `a` (Android), `i` (iOS) o `w` (web).

---

## Modelo de datos

```
categories (id, name, sort_order)
shows      (id, title, synopsis, poster_url, year)
episodes   (id, show_id → shows, episode_number, title, duration_minutes)
show_categories (show_id → shows, category_id → categories)   -- N:M
```

Se usó una relación **muchos-a-muchos** entre shows y categorías porque un mismo show
puede aparecer en varias (p. ej. en *Drama* y también en *Populares*).

## Funciones de SQL implementadas

**`get_home_catalog()` → `json`** (ver `supabase/schema.sql`)

Devuelve, en **una sola llamada**, todas las categorías con su arreglo de shows anidado.
Evita el problema **N+1** (hacer una consulta por cada carrusel) construyendo el JSON
directamente en Postgres con `json_agg` / `json_build_object`:

```sql
select coalesce(json_agg(cat order by cat.sort_order, cat.name), '[]')
from (
  select c.id, c.name, c.sort_order,
    coalesce((
      select json_agg(json_build_object('id', s.id, 'title', s.title,
                                         'poster_url', s.poster_url, 'year', s.year)
                      order by s.title)
      from show_categories sc
      join shows s on s.id = sc.show_id
      where sc.category_id = c.id
    ), '[]') as shows
  from categories c
) cat;
```

Para el detalle no hizo falta una función: se usa el **join anidado** de `supabase-js`
(`shows` + `episodes` con `order` sobre la tabla referenciada), que también resuelve todo
en una sola consulta.

Además el esquema define **Row Level Security** con políticas de solo lectura (`select` público),
apropiadas para un catálogo consultado con la `anon key`.

## Decisiones técnicas

El objetivo fue **consultas eficientes y una separación clara de responsabilidades**. La
lógica de datos se aísla en hooks (`useHomeCatalog`, `useShowDetail`) que exponen
`{ data, loading, error, refetch }`, de modo que las pantallas solo se ocupan de renderizar
estados. Para Home preferí una **función RPC** sobre múltiples queries porque el catálogo se
arma con una relación N:M y resolverlo en el cliente implicaría varias vueltas a la red o
un `select` con datos duplicados; la RPC entrega exactamente la forma que consume la UI.

En React Native cuidé el **rendimiento de las listas**: `FlatList` horizontal con
`snapToInterval` para el efecto carrusel, componentes memoizados (`React.memo` en `ShowCard`
y `CategoryRow`) y handlers estables con `useCallback` para no romper esa memoización.
`useMemo` deriva el texto de metadatos del detalle sin recomputar en cada render, y
`useLayoutEffect` fija el título del header antes del primer pintado. Usé TypeScript de punta
a punta (tipos de dominio + tipado de rutas de navegación) para detectar errores en compilación.

## Prompts usados en IA

Este proyecto se construyó con **Claude (Claude Code)**. Prompts principales:

- «Construye este reto técnico (catálogo estilo Netflix en React Native) y guíame paso a
  paso en lo que me toca hacer por fuera; ya tengo mi URL y mi Key de Supabase.»
- Se le pidió que consultara la documentación actual de `supabase-js` para inicializar el
  cliente en Expo con `AsyncStorage` y `react-native-url-polyfill`.
- Se le pidió modelar las tablas con relación N:M y escribir una función RPC que devolviera
  el catálogo de Home en una sola llamada, evitando N+1.

> Todo el código fue revisado y comprendido; puedo explicar cada decisión.

## Qué haría a continuación con más tiempo

- **Imágenes en Supabase Storage** en vez de URLs externas (bucket público + `getPublicUrl`).
- **Buscador** y filtro por categoría, y una fila "Continuar viendo" con estado persistido.
- **Paginación / lazy loading** de carruseles largos (`range()` en Supabase).
- **Caché y reintentos** con React Query en lugar de hooks manuales.
- **Reproductor / pantalla de capítulo** y marca de "visto".
- **Tests** (Jest + React Native Testing Library) y CI.
- Skeletons de carga en lugar de un spinner global.
