# Plan de rediseño: tienda Zenda y chatbot

> Versión 2 · 8 nov 2026 · **Aprobado por el usuario.** Fase 0 en curso: ver [`specs/fase-0-fundamentos.md`](specs/fase-0-fundamentos.md). No hay nada commiteado.

## 1. Lo que sabemos (respuestas del usuario)

| Tema | Decisión |
|---|---|
| Objetivos | Todos a la vez: **vender más**, verse como **marca premium**, servir de **portafolio técnico** (animación, 3D, IA) y **captar encargos** de tortas para fechas especiales. |
| Público | Mezcla: gente de Sogamoso y Boyacá, personas fit, compradores de regalos y eventos. |
| Posicionamiento | **Zenda es fit.** Todas las recetas son saludables. Hoy vende repostería; pronto sumará productos **de sal** y quizá **platos saludables completos**. |
| Estilo | Entre **editorial cálido** y **lujo oscuro**. Se decide viendo **dos maquetas**. Se puede revisar toda la identidad, logo incluido. |
| Hero | Probar varias opciones. Mientras tanto, **el hero queda vacío**. Todavía no salimos a producción. |
| Chatbot | Debe hacer todo: encargos guiados, vender en el chat, responder en vivo con memoria y lucir técnicamente. **Solo habla de Zenda** y **nunca da recetas**. |
| Ingredientes | Las cantidades exactas son secreto del negocio y **no se publican**. Lo que sí se puede decir: la base es de **frutos secos** (no de galleta), se endulza con **stevia y fruta fresca**, el relleno es **queso combinado con yogur griego** y se usa **harina de avena**. |
| Catálogo | Por ahora se quedan los productos actuales. Los reales se cargan más adelante. |
| Precios | En **COP**, inventados por ahora (ver §5.1). Se corrigen después. |
| Entregas | Se pide con **mínimo 12 horas de anticipación**. Se entrega **a la hora que el cliente elija**, con un **costo de envío adicional**. |
| Identidad | Se **reforma la identidad corporativa** completa, no solo el logo (ver §3.1). La skill `logo-designer` ya está instalada. |

## 2. Hallazgos en el código actual

**Frontend** (Next 16, React 19, Tailwind 4, shadcn/Radix)
- Home = `HeroSection` + `FeaturesSection` + `ProductGrid` en un componente `'use client'`. Se puede volver Server Component.
- La paleta (`app/globals.css`) es beige con rosa pastel y tipografía Inter. Se ve genérica, como una plantilla, y no transmite "premium".
- El logo (`public/logo.png`) es un wordmark rosa redondeado con una hoja. Es amable, pero choca con las dos direcciones premium. Además es un PNG: no hay versión en SVG.
- Los textos mezclan registros: "Zenda Assistant" en inglés y faltan tildes ("azucares anadidos").
- Los precios del seed (`12.00`, `16.00`) parecen dólares. En Colombia deberían estar en **COP**.
- El catálogo mezcla productos de stock (matcha, chía, brownie) con los reales (cheesecakes de uchuva, maracuyá y mango, frutos rojos, manzana).
- No existe una página ni un flujo de **encargos**, y no hay ningún enlace a WhatsApp.

**`/anatomia` (sin commit)**: era una prueba para el hero y se descarta (ver §7). Sus datos además eran una receta tradicional inventada (gramos, azúcar, galleta), que no sirve para Zenda.

**Tus cambios sin commit (revisados)**
- `purchase.py`, `chatbot_tools.py` y `utils.py`: sirven. Resuelven pedidos de varios productos contra el catálogo completo, con búsqueda tolerante a errores de tipeo, y manejan el "sí" a una oferta. El chatbot nuevo los reutiliza.
- `product-grid.tsx`: sirve. Agrega un estado de error con reintento, que se conserva en el rediseño.
- `layout.tsx` (`suppressHydrationWarning`) y `next.config.mjs` (`devIndicators: false`): son ajustes menores de desarrollo. No afectan el plan.
- Recomendación: commitearlos como punto de partida antes de la Fase 1, para que el rediseño no se mezcle con ellos.

**Backend / chatbot** (FastAPI + LangGraph, `gpt-4o-mini`, pgvector y LangFuse)
- El grafo es `triage → recipe | purchase | info | greeting | track_order → END`. Es un solo paso: no hay memoria del servidor, y el frontend reenvía todo el historial en cada mensaje.
- El triage pide JSON en el texto del prompt y luego lo parsea a mano (`clean_json_response`). Esto es frágil.
- `GraphState.intent` solo declara 3 de los 5 intents.
- `_is_low_value_message` siempre termina devolviendo `False`, así que es código muerto.
- El nodo `recipe` **debe desaparecer**, porque el bot no da recetas.
- La respuesta llega completa, sin streaming. `utils.py` ya hace stream del LLM por dentro, así que agregar SSE cuesta poco.
- `orders` tiene `Customer`, `Order` y `OrderItem`, pero ningún modelo para encargos personalizados.

## 3. Arquitectura de marca

El nombre "Pastelería saludable" se queda corto si vienen productos de sal y platos. Propuesta:

- **Zenda**: cocina fit artesanal, hecha en Sogamoso.
  - **Zenda Dulce**: repostería fit (la línea actual, el foco hoy).
  - **Zenda Sal**: horneados salados fit (corto plazo).
  - **Zenda Mesa**: platos completos (más adelante, opcional).
- Las etiquetas nutricionales (*sin azúcar añadida*, *keto*, *sin gluten*, *alto en proteína*) son **filtros**, no categorías.
- El tono es cercano y concreto. Habla de ingredientes reales y de producto local (uchuva, mora, cuajada boyacense). No usa jerga de dieta ni culpa: hay que eliminar frases como "indulgencia sin culpa".

**Mensajes fit verificables** (sin cantidades): base de frutos secos en lugar de galleta, endulzado con stevia y fruta fresca, relleno de queso con yogur griego, harina de avena. Estos cuatro datos alimentan la home (incluidas las capas del hero), las fichas de producto y el chatbot.

### 3.1 Reforma de la identidad corporativa (Fase 0)

El logo actual es un wordmark rosa redondeado con una hoja. Es amable, pero no transmite premium y solo existe en PNG.

**Entregables: un manual de marca corto.** Lo escribo en `docs/marca/`, con un HTML para ver.
1. **Plataforma**: propósito, promesa, valores, a quién le habla y qué *no* es Zenda.
2. **Voz y tono**: cómo escribe Zenda (web, chatbot, WhatsApp, redes), con ejemplos de "sí" y "no".
3. **Sistema de logo**: wordmark, símbolo para favicon y avatar, versiones clara y oscura, área de protección, tamaño mínimo y sub-marcas Dulce, Sal y Mesa. Se hace con la skill `logo-designer` (instalada y revisada): 3 a 5 conceptos, refinamiento y exportación a SVG y PNG.
4. **Color y tipografía**: los tokens de la maqueta ganadora (§4).
5. **Fotografía**: lista de tomas, fondos, luz y encuadre.
6. **Aplicaciones**: empaque o caja de torta, sticker de cierre, tarjeta, perfil de WhatsApp Business e Instagram.

**Orden**: plataforma y voz → maquetas A/B → logo con la dirección ganadora → manual. El logo se diseña *después* de elegir el estilo, para que nazca coherente con él.

**Validación**: imprimir el logo en sticker y en caja real, y verlo a 16 px como favicon. Para la versión final conviene que un diseñador o diseñadora haga un repaso.

### 3.2 Skills

| Skill | Estado | Para qué |
|---|---|---|
| `logo-designer` ([neonwatty](https://github.com/neonwatty/logo-designer-skill)) | ✅ **Instalada** en `~/.claude/skills/logo-designer`, revisada (solo instrucciones y scripts locales). | Logo en SVG con entrevista, conceptos, refinamiento y exportación. Ojo: su exportación descarga `@aspect-build/resvg` con `npx` la primera vez. |
| `frontend-design`, `anatomy`, `archify`, `hyperframes*`, `media-use` | Ya instaladas | Dirección visual, figuras isométricas, diagramas, motion graphics del hero, imágenes y música. |
| Brand identity / strategy ([travisjneuman/.claude](https://claudeskills.info/ko/skills/travisjneuman/.claude/brand-identity/)) o `rampstackco/claude-skills` | Recomendada, sin instalar | Estructura para la plataforma de marca y el sistema visual completo. |
| React Three Fiber ([freshtechbro/claudedesignskills](https://claudemarketplaces.com/skills/freshtechbro/claudedesignskills/react-three-fiber)) | Recomendada para la Fase 4, sin instalar | Patrones de R3F para el prototipo 3D del hero. Es la más citada. |
| Brand guidelines ([alirezarezvani](https://open-design.ai/skills/alirezarezvani-brand-guidelines/)) | Opcional | Aplicar el manual de marca de forma consistente en el código. |

Antes de instalar cada skill recomendada, leo su `SKILL.md`. La oficial de Anthropic, `brand-guidelines`, **no sirve**: aplica la marca de Anthropic, no la de Zenda.

## 4. Dirección visual: dos maquetas a comparar

Las dos parten de los ingredientes reales, no de clichés. A propósito evitan los fondos crema con acento terracota y el negro con un acento neón. Las dos mantienen el foco en lo fit: mucha luz sobre el producto, fruta fresca y nada de "postre pecaminoso".

### A · "Cuajada" (editorial cálido)
Es una revista de cocina fresca, luminosa y con el producto en primer plano.

| Token | Hex | Uso |
|---|---|---|
| Cuajada | `#F3F4EE` | Fondo (blanco verdoso, no crema) |
| Mora negra | `#2B1D2A` | Texto (negro con tinte de mora) |
| Uchuva | `#E9A43B` | Acento principal y CTA |
| Hoja | `#5D7B4E` | Etiquetas fit y estados positivos (conecta con la hoja del logo) |
| Frambuesa | `#C2456A` | Acento secundario, poco uso |

- **Tipografía**: *Gambarino* (Fontshare) para títulos, una serif suave con carácter. *Hanken Grotesk* para el texto.
- **Layout**: asimétrico, con fotos grandes recortadas sobre el fondo, texto alineado a la izquierda y mucho aire.
- **Momento memorable**: el hero del cheesecake construyéndose. Todo lo demás, sobrio.

```
┌───────────────────────────────────────────┐
│ ZENDA          Dulce  Sal  Encargos  🛒   │
├───────────────────────────────────────────┤
│  Título grande         │  [ HERO 3D ]     │
│  2 líneas              │  (vacío por ahora)│
│  [Ver el menú] [Encargar]                 │
├───────────────────────────────────────────┤
│ ▢ foto grande   ▢ ▢  menú en mosaico      │
│ Ingredientes fit: 4 datos clave           │
│ Encargos: calendario + CTA WhatsApp       │
└───────────────────────────────────────────┘
```

### B · "Cacao" (lujo oscuro)
Es una boutique de noche, con iluminación dramática sobre cada pieza.

| Token | Hex | Uso |
|---|---|---|
| Cacao | `#2A1B15` | Fondo (marrón cacao, no negro) |
| Suero | `#F1E9DC` | Texto |
| Panela | `#C98B3F` | Acento principal y CTA |
| Mora | `#7B2D4B` | Acento secundario |
| Hoja oscura | `#7E9A6B` | Etiquetas fit |

- **Tipografía**: *Bodoni Moda* para títulos, con alto contraste y en tamaños grandes. *Schibsted Grotesk* para el texto.
- **Layout**: centrado y escénico. Cada producto sale "bajo un foco", y las secciones van separadas por bloques de luz.
- **Riesgo**: lo oscuro sugiere indulgencia, así que hay que cuidar que siga leyéndose como **fit**. En la maqueta pongo a prueba justo eso.

**Variante híbrida.** Si ninguna convence del todo: base A, con el hero y la sección de encargos en B.

**Fotografía.** El rediseño depende de las fotos. Hace falta una sesión (o fotos con celular bien hechas) con fondo consistente, cortes que muestren las capas y vistas cenitales. En la Fase 0 entrego la lista de tomas.

## 5. Mapa de páginas

| Ruta | Estado | Contenido |
|---|---|---|
| `/` | Rediseñar | Hero (vacío, luego animado) · líneas Dulce y Sal · destacados · ingredientes fit · encargos · confianza (Sogamoso, ingredientes) |
| `/menu` | Rediseñar | Filtros por línea y por etiqueta fit · precios en COP |
| `/productos/[id]` | Rediseñar | Foto, ingredientes (sin cantidades), información nutricional, alérgenos y agregar al carrito |
| `/encargos` | **Nueva** | Tortas para fechas especiales: ocasión, fecha y hora de entrega (**mínimo 12 h** desde ahora; el selector no deja elegir antes), tamaño y porciones, sabor, restricciones, mensaje, dirección y **costo de envío** visible. Termina en solicitud guardada y WhatsApp. |
| ~~`/anatomia`~~ | **Se elimina** | Era una prueba para el hero (ver §7) |
| `/nosotros` | Rediseñar | Historia, cocina en Sogamoso, filosofía fit |
| `/contacto` | Rediseñar | WhatsApp primero, horario, mapa |
| `/lab/*` | **Nueva, no pública** | Maquetas A/B y prototipos del hero. Se borra antes de producción. |
| (portafolio) `/como-esta-hecho` | Opcional | Caso técnico: arquitectura (diagrama de Archify), agente, 3D |

### 5.1 Precios provisionales (COP, inventados)

| Producto | Precio |
|---|---|
| Porción de cheesecake (uchuva, maracuyá y mango, frutos rojos, manzana, matcha) | $14.000 |
| Cheesecake entero de 22 cm (12 porciones) | $95.000 |
| Tarta de chocolate negro (porción) | $16.000 |
| Mousse de avellana | $13.000 |
| Parfait de chía y bayas | $12.000 |
| Panna cotta de coco | $11.000 |
| Brownie de almendras | $9.000 |
| Torta de encargo | desde $110.000 (según tamaño) |
| Envío en Sogamoso | $7.000 (tarifa plana provisional) |

**Implementación**: precios como enteros en COP en la base de datos (hoy son `Float` con decimales), formateados con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`. El envío se suma como línea aparte en el carrito y en el checkout.

**Reglas de entrega** (las usan la web, el checkout y el chatbot):
- Todo pedido, no solo los encargos, se hace con **12 horas de anticipación como mínimo**.
- El cliente elige la **hora exacta** de entrega.
- El **envío se cobra aparte**.

## 6. Hero: "construir un cheesecake"

Ahora queda **vacío** (un bloque con la proporción final y el título). Luego armamos un laboratorio en `/lab/hero` con prototipos lado a lado:

| Opción | Pros | Contras | Valor para el portafolio |
|---|---|---|---|
| **Three.js / R3F con scroll** | Interactivo y 100 % controlable. Las capas son procedurales (base, relleno, cobertura, fruta) y se apilan al hacer scroll. | Lleva más trabajo. Hay que cuidar el rendimiento en celular y tener un fallback estático. | ★★★ |
| **Motion graphics (HyperFrames)** | Ligero, controlable, se exporta a video o loop y es rápido de iterar. | Estilizado, no fotorrealista. | ★★ |
| **Video IA (Veo / Kling)** | Fotorrealista y rápido. Image-to-video a partir de una foto real. | Poco control. El resultado puede no parecerse al producto y tiene costo por generación. | ★ |
| **Render de Blender** | Fotorrealismo con control total. | Exige saber Blender o contratar a alguien. | ★★ |

- **Orden sugerido**: primero Three.js (lo que más luce y lo que más te interesa), luego HyperFrames como alternativa ligera y al final una prueba de Veo/Kling para comparar.
- **Criterios para elegir**: fidelidad al producto, LCP en celular (< 2,5 s), respeto a `prefers-reduced-motion`, costo y facilidad de cambiar el producto.
- **Ojo con Zenda Sal**: si el concepto es "capa por capa", luego puede extenderse a un bowl o un plato salado. El componente debe aceptar distintas "recetas de capas" visuales.

## 7. `/anatomia`: se descarta

Era una prueba de concepto para el hero, **no una página del sitio**. Sale del mapa de páginas y del menú.

- **Archivos de prueba, sin commit**: `app/anatomia/page.tsx`, `components/dessert-anatomy.tsx`, `lib/dessert-anatomy.ts` y `public/images/anatomia/`, más el enlace "Anatomía" en `components/header.tsx`. Se borran al empezar la Fase 1, o antes si das el OK.
- **Lo que sí se aprovecha para el hero**: la idea de las capas. Cuando el cheesecake se arma en el hero, cada capa puede llevar una etiqueta corta, sin cantidades:
  - **Cobertura**: fruta fresca, endulzada con stevia.
  - **Relleno**: queso combinado con yogur griego.
  - **Base**: frutos secos (no galleta) y harina de avena.

  *Pendiente: confirmar en qué capa va la harina de avena.*

## 8. Chatbot

### Comportamiento del agente (backend)
- **Alcance cerrado**: un guardrail en el triage hace que lo que no sea Zenda reciba una respuesta corta y lleve de vuelta al menú. El bot **no da recetas** aunque se las pidan: ofrece ingredientes, información nutricional o el producto.
- **Grafo nuevo**: `triage → producto | compra | encargo | pedido | saludo | fuera_de_alcance`
  - `recipe` desaparece y se convierte en **`producto`**: ingredientes sin cantidades, información nutricional, alérgenos y recomendaciones según la restricción del cliente ("¿qué hay sin gluten?").
  - **`encargo` (nuevo)**: llena los datos paso a paso (ocasión, fecha, porciones, sabor, restricciones, mensaje, entrega), valida la fecha contra la disponibilidad, guarda un `CustomOrderRequest` y devuelve el resumen con un botón a WhatsApp.
  - **`compra`**: tool calling estructurado en lugar de parsear JSON. Devuelve **tarjetas de producto** y acciones de carrito. Parte de tus cambios recientes (pedidos de varios productos, búsqueda tolerante a errores, el "sí" a una oferta).
  - **Ingredientes**: el bot conoce los cuatro mensajes fit (frutos secos, stevia y fruta, queso con yogur griego, avena). Si le piden cantidades o la preparación, responde con amabilidad que la receta es de la casa.
  - **Entregas**: aplica la regla de 12 horas mínimas, pregunta la hora de entrega y avisa del costo de envío antes de cerrar.
- **Salida estructurada** del triage (`with_structured_output`). Corregir `GraphState.intent` y borrar el código muerto.
- **Memoria**: checkpointer de LangGraph (Postgres) por `thread_id`. El frontend deja de reenviar todo el historial.
- **Streaming**: endpoint SSE con tokens y eventos (`card`, `action`, `form`).
- **RAG**: indexar ingredientes, información nutricional, alérgenos, políticas (envíos, tiempos de encargo) y FAQ, no solo productos.
- **Calidad y portafolio**: un set de evaluación (unas 50 preguntas: ruteo, rechazos fuera de tema, rechazos de recetas, encargos completos) que corre en CI, más dashboards de LangFuse.
- **Modelos**: centralizar en `ai_config.py` (ya existe) y evaluar si conviene un modelo más nuevo.

### UI del widget (frontend)
- Nombre y voz en español, con la personalidad de la marca. Fuera "Zenda Assistant" y el 🍃.
- **Botones de inicio**: *Ver el menú*, *Encargar una torta*, *¿Dónde está mi pedido?*, *Opciones sin azúcar*.
- **Mensajes ricos**: tarjeta de producto (foto, precio, agregar), formulario de encargo dentro del chat, tarjeta de estado del pedido, botón para pasar a WhatsApp.
- Streaming con cursor y `aria-live`. Pantalla completa en celular y panel lateral en escritorio. La conversación se guarda con `thread_id`.
- Con el estilo visual elegido (A o B) y movimiento solo como respuesta a las acciones del usuario.

## 9. Fases y prioridades

**P0** = bloquea lo demás · **P1** = núcleo del rediseño · **P2** = alto valor, puede esperar · **P3** = pulido

| Fase | Contenido | Prioridad |
|---|---|---|
| **0 · Fundamentos e identidad** | Plataforma de marca y voz. Maquetas A y B del home en `/lab` (hero vacío). Logo con `logo-designer` sobre la dirección ganadora. Manual de marca corto (§3.1). Lista de tomas fotográficas. **Salida**: tokens finales, logo en SVG y manual. | P0 |
| **1 · Sistema y home** | Instalar las herramientas de pruebas (§10). Tokens en `globals.css`, fuentes, logo nuevo, header y footer, home nuevo con hero vacío, catálogo y ficha de producto restilizados, textos reescritos. Precios en COP (§5.1). Los productos actuales se quedan. | P1 |
| **2 · Encargos y entregas** | Página `/encargos`, modelo y endpoint `CustomOrderRequest`, regla de 12 h y hora elegida, envío como línea aparte en el carrito y el checkout, paso a WhatsApp. | P1 |
| **3 · Chatbot** | 3a: backend (grafo nuevo, guardrails, sin recetas, memoria, SSE, encargo). 3b: widget nuevo. 3c: evals y LangFuse. | P1 (3a y 3b) · P2 (3c) |
| **4 · Laboratorio del hero** | Prototipos Three.js, HyperFrames y Veo/Kling, con las capas etiquetadas (§7). Elegir uno e integrarlo con fallback. **Puede ir en paralelo a las fases 2 y 3** una vez cerrados los tokens. | P2 |
| **5 · Portafolio y salida** | Página "cómo está hecho", rendimiento, accesibilidad, SEO local (Sogamoso), analítica, borrar `/lab`. Preparar Zenda Sal. | P3 |

## 10. Metodología: SDD con TDD donde importa

**SDD (Spec-Driven Development, desarrollo guiado por especificaciones)** es el método general. Este documento es la especificación global. Cada fase tiene además su propia especificación en `docs/specs/fase-N-<nombre>.md`, con tres partes:
1. **Requisitos**: historias de usuario con criterios de aceptación verificables (por ejemplo: "si la entrega queda a menos de 12 h, no se puede confirmar").
2. **Diseño**: componentes, modelos de datos, endpoints y pantallas.
3. **Tareas**: pasos pequeños y revisables, cada uno con su forma de verificarse.

**Regla**: no se programa una fase hasta que el usuario apruebe su especificación. Si algo cambia en el camino, primero se actualiza la especificación y después el código.

**TDD y verificación según el tipo de trabajo:**

| Tipo de trabajo | Cómo se verifica |
|---|---|
| Reglas de negocio: mínimo de 12 h, costo de envío, precios en COP, validación de encargos, carrito | **TDD**: primero la prueba que falla, luego el código y después la limpieza ("rojo, verde, refactor"). |
| Chatbot | **TDD en forma de evals**: primero la batería de unas 50 preguntas con el resultado esperado (ruteo, rechazo de recetas, rechazo de temas ajenos a Zenda, encargo completo), y después se cambia el agente hasta que la pase. Corre en CI y se ve en LangFuse. |
| Maquetas, logo, hero 3D, estilos | Revisión visual: capturas en escritorio y celular, modo oscuro, `prefers-reduced-motion` y la aprobación del usuario. Sin TDD. |
| Flujos completos (comprar, encargar, chatear) | Pruebas end-to-end con Playwright al cerrar cada fase. |

**Herramientas (hoy no existe ninguna prueba en el proyecto)**, a instalar al inicio de la Fase 1:
- Backend: `pytest`, `pytest-asyncio` y `httpx` (cliente de pruebas de FastAPI).
- Frontend: `vitest` y Testing Library para la lógica y los componentes, y `@playwright/test` para las pruebas end-to-end.
- Chatbot: un script de evals (`backend/evals/`) con un dataset en JSON y un reporte.

**Definición de "terminado" para cada tarea**: cumple los criterios de la especificación, las pruebas y evals pasan, la revisión visual está hecha si aplica y el usuario dio su visto bueno.

## 11. Estado de los pendientes

| # | Tema | Estado |
|---|---|---|
| 1 | Ingredientes | ✅ Composición general recibida, sin cantidades. Falta confirmar en qué capa va la harina de avena. |
| 2 | Catálogo | ✅ Se quedan los productos actuales por ahora. |
| 3 | Precios y entregas | ✅ Precios en COP inventados (§5.1). Regla de 12 h, hora elegida y envío aparte. Falta el **número de WhatsApp** (por ahora va un número de prueba). |
| 4 | Skill de logo | ✅ Instalada. ¿Instalo también las de identidad de marca y R3F (§3.2)? |
| 5 | Cambios sin commit | ✅ Revisados: son útiles y se integran. Recomiendo commitearlos antes de la Fase 1. |
