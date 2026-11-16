# Vórtice — sitio web

Sitio oficial del estudio de diseño, desarrollo web y soluciones digitales.
Experiencia 3D en una sola página, más páginas legales estáticas.

## Puesta en marcha

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

```bash
npm run preview
```

`npm run build` comprueba tipos y genera `dist/`, un sitio estático que puede
publicarse en cualquier hosting (no necesita servidor ni reglas de reescritura).

## Qué hay que completar antes de publicar

| Qué | Dónde |
| --- | --- |
| Nombre del negocio | `.env` → `VITE_SITE_NAME` |
| URL pública | `.env` → `VITE_SITE_URL` |
| Aviso por WhatsApp | Variables de entorno en Netlify (ver «Publicar en Netlify») |
| Correo, teléfono, WhatsApp, ubicación | `src/config/site.ts` → `contact` |
| Redes sociales | `src/config/site.ts` → `socials` |
| Proyectos del portafolio | `src/content/projects.ts` |
| Logotipo | Ya aplicado. Original en `brand/logo-original.jpg`; isotipo vectorizado en `src/components/ui/Logo.tsx` |
| Textos legales (revisión jurídica) | `src/content/legal.ts` |

Los datos vacíos no se muestran: el sitio no inventa contactos, redes ni proyectos.

### Formulario de contacto

En producción el formulario usa **Netlify Forms**:

1. El visitante envía el formulario.
2. Netlify guarda el mensaje (se ve en el panel del sitio, sección *Forms*).
3. Netlify ejecuta `netlify/functions/submission-created.mjs`, que envía un aviso
   por WhatsApp con el contenido.

El número de WhatsApp **no está en el código ni en la página**: la función lo lee
de las variables de entorno de Netlify. Si el aviso falla, el mensaje sigue
guardado en Netlify.

En `npm run dev` el formulario va a un endpoint simulado (`/api/contact`,
definido en `vite.config.ts`) para probar los estados de envío sin Netlify.

`npm test` ejecuta las pruebas de la función de aviso.

### Portafolio

Cada proyecto es un objeto en `src/content/projects.ts` (el archivo incluye un
ejemplo). Las capturas van en `public/proyectos/`. Con la lista vacía, la sección
muestra un estado "en preparación". Para revisar el diseño con datos de muestra,
abre el sitio en desarrollo con `?demo` en la URL (no se incluyen en producción).

## Publicar en Netlify

1. Sube el proyecto a un repositorio de GitHub y, en Netlify, crea un sitio
   nuevo a partir de él. `netlify.toml` ya indica cómo construirlo.
2. En el panel del sitio, abre **Forms** y activa la detección de formularios.
   Después vuelve a desplegar: Netlify debe listar un formulario llamado `contacto`.
3. En **Site configuration → Environment variables** añade:
   - `WHATSAPP_PHONE`: el número que recibirá los avisos, con código de país.
   - `WHATSAPP_APIKEY`: la clave que entrega CallMeBot al autorizar ese número
     (las instrucciones están en callmebot.com).
4. Vuelve a desplegar y envía un mensaje de prueba desde el sitio publicado.
5. Recomendado: en **Forms → Form notifications** añade también un aviso por
   correo, como respaldo del WhatsApp.
6. Cuando tengas el dominio, escríbelo en `.env` → `VITE_SITE_URL`.

Notas:

- La función `submission-created` solo se ejecuta en el sitio publicado, no en
  las vistas previas de despliegue.
- El plan gratuito de CallMeBot está pensado para uso personal. Para un uso
  comercial sostenido, el camino oficial es la plataforma de WhatsApp Business
  de Meta; la función tiene un punto de extensión (`providers`) para añadirla.

## Identidad

Los colores salen del logotipo: azul noche de fondo (`#090e21`), degradado
índigo → violeta de los anillos (`#4b1de9` → `#7d4aff`) y el punto lima
(`#ccff0e`), que se usa igual que en el logo: poco y solo para señalar.
Están definidos en `src/styles/tokens.css`. El nombre se escribe en Montserrat
Bold, como en el logotipo; los titulares usan Bricolage Grotesque.

## Arquitectura

```
index.html · privacidad/ · terminos/   Entradas HTML (sitio multipágina)
netlify.toml · netlify/functions/      Despliegue y función de aviso por WhatsApp
tests/                                Pruebas de la función
src/
  config/site.ts        Marca, contacto, redes, navegación
  content/              Textos: servicios, proceso, principios, proyectos, legal
  styles/               Tokens de diseño y estilos base
  lib/                  Scroll (Lenis + GSAP), detección de dispositivo, estado compartido
  hooks/                Animaciones de aparición, efecto magnético, media queries
  components/
    layout/             Cabecera, menú móvil, indicador de secciones, precarga, pie
    sections/           Hero, Estudio, Servicios, Proceso, Trabajos, Enfoque, Contacto
    contact/            Panel y formulario de contacto
    fallback/           Alternativa visual sin WebGL (CSS 3D)
    ui/                 Botón, logotipo, iconos
  three/                Escena WebGL (se carga en diferido)
    Experience.tsx      Lienzo, entorno de reflejos, control de rendimiento
    Director.tsx        Scroll → poses, cámara, exposición, luz del cursor
    poses.ts            Coreografía por sección (escritorio y móvil)
    construct/          La pieza central: partición, materiales por etapa, shaders
    emblems/            Los seis objetos de servicios, anclados al DOM
```

### Cómo funciona la escena 3D

- Hay **un solo lienzo WebGL** fijo detrás del contenido. El texto es HTML real.
- `Director` lee la posición de cada sección (`data-stage="…"`) y interpola entre
  las poses declaradas en `poses.ts`. Para recomponer una sección basta con editar
  su pose; no hay coordenadas repartidas por el código.
- Los emblemas de servicios y la pieza del cierre se **anclan a huecos del DOM**,
  de modo que el 3D sigue al layout en cualquier tamaño de pantalla.
- El DOM y la escena se comunican por `lib/stage.ts`, un objeto mutable que se lee
  en cada frame sin provocar renders de React.

### Niveles gráficos

`lib/device.ts` elige el nivel al cargar:

- `high`: cristal con refracción y más partículas.
- `low`: misma identidad con materiales y densidad simplificados (móviles).
- `off`: sin WebGL o con renderizado por software; se muestra la alternativa en CSS
  y **no se descarga** el módulo 3D.

Se puede forzar con `?gfx=high`, `?gfx=low` o `?gfx=off`. Además, si el equipo no
mantiene el framerate, la escena baja resolución y simplifica el cristal sola.

### Accesibilidad y movimiento

- Con "reducir movimiento" activo no hay scroll suave, ni animaciones de entrada,
  ni giro autónomo de los objetos.
- Navegación completa por teclado, enlace "Saltar al contenido", foco visible,
  diálogos nativos (`<dialog>`) y formulario con errores asociados a cada campo.
