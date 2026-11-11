# Fase 0: Fundamentos e identidad (especificación)

> Estado: **aprobada** (respuestas del 8 nov: logo libre, Gambarino autorizada) · 8 nov 2026 · Plan general: [`../plan-rediseno-zenda.md`](../plan-rediseno-zenda.md)
> Regla SDD: no se programa nada de esta fase hasta que apruebes esta especificación.

**Objetivo**: decidir cómo se ve, cómo habla y cómo se firma Zenda antes de rediseñar el sitio. Al terminar, la Fase 1 arranca con tokens, logo y voz cerrados.

**Fuera de alcance**: cambiar el sitio real (home, header, `globals.css`, `layout.tsx`), el hero animado, el chatbot y los encargos.

---

## 1. Requisitos

### R1 · Plataforma de marca
Como dueño de Zenda, quiero una definición corta de qué es la marca, para que la web, el chatbot y las redes digan lo mismo.

Criterios de aceptación:
- [ ] Incluye propósito, promesa, 4 valores, perfiles de cliente y qué *no* es Zenda, todo en una página.
- [ ] Cubre las líneas Dulce, Sal y Mesa sin quedar atada solo a los postres.
- [ ] Usa los mensajes fit permitidos (frutos secos, stevia y fruta, queso con yogur griego, avena) y nunca menciona cantidades.
- [ ] La aprobaste. El lema puede quedar provisional hasta T9 (no bloquea las maquetas ni el logo).

### R2 · Voz y tono
Como dueño, quiero reglas de escritura con ejemplos, para que cualquier texto (incluido el del chatbot) suene a Zenda.

Criterios de aceptación:
- [ ] De 5 a 7 reglas, cada una con un ejemplo de "sí" y uno de "no".
- [ ] Ejemplos para la web, el chatbot, WhatsApp e Instagram.
- [ ] Lista de palabras prohibidas ("culpa", "pecado", "light", "dieta" y el inglés innecesario).

### R3 · Dos maquetas del home (A "Cuajada" y B "Cacao")
Como dueño, quiero ver las dos direcciones visuales con contenido real, para elegir con criterio y no por descripciones.

Criterios de aceptación:
- [ ] Están en `/lab/home-a` y `/lab/home-b`, no aparecen en el menú y llevan `noindex`.
- [ ] Las dos tienen **el mismo contenido y estructura**; solo cambian color, tipografía y tratamiento visual.
- [ ] Contenido: header, hero **vacío** (un bloque con la proporción final y el título), líneas Dulce y Sal ("próximamente"), destacados con productos y fotos reales, ingredientes fit, encargos (12 h mínimo, la hora que elijas, envío aparte), ubicación en Sogamoso y footer.
- [ ] Precios en COP (§5.1 del plan).
- [ ] Funcionan bien a 375 px, 768 px y 1440 px, sin scroll horizontal.
- [ ] Contraste AA en el texto, foco de teclado visible y respeto a `prefers-reduced-motion`.
- [ ] **No modifican el sitio actual**: los tokens van solo dentro de `/lab` y no se toca ni `globals.css` ni `layout.tsx`.
- [ ] Te entrego capturas de escritorio y celular de cada una.

### R4 · Elección de dirección
- [ ] Eliges A, B o el híbrido, con comentarios ("me gusta X de A y Y de B").
- [ ] Ajusto la ganadora una vez como máximo antes de cerrar los tokens.

### R5 · Logo y sistema de logo
Como dueño, quiero un logo premium en SVG que funcione desde un favicon hasta una caja de torta.

Criterios de aceptación:
- [ ] Se hace con la skill `logo-designer` **después** de R4, con la paleta y la tipografía ganadoras.
- [ ] De 3 a 5 conceptos distintos en `brand/logos/preview.html`. Al menos uno evoluciona el logo actual (que conserva la hoja) y otro es un rediseño completo.
- [ ] Refinamiento del concepto elegido hasta que lo apruebes.
- [ ] Entregables: wordmark y símbolo en SVG, versiones clara y oscura, PNG de 16 a 2048 px y favicon legible a 16 y 32 px.
- [ ] Sub-marcas: Zenda Dulce, Zenda Sal y Zenda Mesa.

### R6 · Tokens de diseño
- [ ] Están en `brand/tokens.css` (colores, tipografías, escala de tipo, radios y espacios), listos para copiar a `globals.css` en la Fase 1.
- [ ] Incluyen los modos claro y oscuro.

### R7 · Manual de marca corto
- [ ] Es una página HTML en `brand/manual.html` con: plataforma, voz, logo (usos correctos e incorrectos, área de protección, tamaño mínimo), color, tipografía, fotografía y 3 aplicaciones de prueba (caja de torta, sticker de cierre, perfil de WhatsApp o Instagram).

### R8 · Lista de tomas fotográficas
- [ ] De 10 a 15 tomas con encuadre, fondo, luz y uso en la web. Pensada para hacerse con celular.

---

## 2. Diseño

### 2.1 Borrador de plataforma de marca (para reaccionar)

- **Propósito**: que comer sano en Sogamoso no signifique renunciar a lo rico.
- **Promesa**: postres y comida fit hechos a mano, con ingredientes que puedes nombrar.
- **Valores**
  1. *Ingredientes a la vista*: decimos qué lleva cada producto (frutos secos, stevia, fruta fresca, yogur griego, avena).
  2. *Oficio*: todo se hace a mano y por encargo, nada sale de una fábrica.
  3. *De aquí*: hecho en Sogamoso, con fruta de la región cuando se puede (uchuva, mora).
  4. *Sin culpa ni sermón*: comer bien es un gusto, no un castigo.
- **Perfiles**: quien cuida lo que come, quien busca un regalo o una torta para una fecha especial, y el vecino que solo quiere algo rico.
- **Qué no es**: no es "light" sin sabor, no es una dieta, no es pastelería industrial ni una marca que regaña.
- **Lemas candidatos** (eliges uno o propones otro):
  - "Rico, y bien hecho."
  - "Lo rico también cuida."
  - "Cocina fit, hecha a mano en Sogamoso."
  - "Sabe a gusto, no a dieta."

### 2.2 Borrador de reglas de voz
1. Tutea con calidez, como alguien de la cocina que te atiende.
2. Nombra ingredientes, no adjetivos: "base de frutos secos" mejor que "deliciosa base".
3. Cero culpa: nunca "sin culpa", "pecado" ni "date permiso".
4. Concreta y corta: un mensaje dice una cosa.
5. Español colombiano natural, sin anglicismos innecesarios ("Zenda Assistant" pasa a llamarse con un nombre en español).
6. El secreto de la casa se guarda con gracia: "la receta es nuestra, pero te contamos qué lleva".

### 2.3 Maquetas: arquitectura técnica
- **Rutas**: `frontend/app/lab/home-a/page.tsx` y `frontend/app/lab/home-b/page.tsx`, más `frontend/app/lab/layout.tsx` con `robots: noindex`.
- **Aislamiento**: el layout global (`layout.tsx`, con cambios tuyos sin commit) pinta el header, el footer y el chatbot actuales. Para no tocarlo, cada maqueta se monta como una capa a pantalla completa (`fixed inset-0`, con su propio scroll) que tapa la interfaz actual. Es un truco temporal y válido solo para `/lab`, que se borra en la Fase 5.
- **Estilos**: cada maqueta tiene su archivo de tokens (`lab/home-a/tokens.css` y `lab/home-b/tokens.css`) aplicado a un contenedor (`.lab-a` y `.lab-b`), sin variables globales.
- **Fuentes**: se cargan con `next/font` solo en la página de cada maqueta:
  - A: Gambarino (Fontshare, se descarga y va como `localFont`) y Hanken Grotesk (Google).
  - B: Bodoni Moda y Schibsted Grotesk (Google).
- **Datos**: un arreglo local de productos con nombres, fotos de `public/images/products/` y precios en COP. No depende del backend, para que se vea aunque la API esté apagada.
- **Componentes compartidos**: la estructura vive en `lab/_shared/home-skeleton.tsx` y recibe un "tema", así A y B tienen el mismo contenido de verdad.

```
┌──────────── header (logo provisional, Dulce · Sal · Encargos · carrito)
│ HERO (vacío): título + 2 botones │ [bloque con la proporción del futuro 3D]
├──────────── Nuestras líneas: Dulce (activo) / Sal (próximamente)
├──────────── Destacados: 4 productos reales con foto y precio en COP
├──────────── Qué lleva: los 4 datos fit
├──────────── Encargos: cómo funciona (12 h mínimo, la hora que elijas, envío aparte) + CTA
├──────────── Hecho en Sogamoso (foto de la cocina y del fundador)
└──────────── footer
```

### 2.4 Logo: flujo con `logo-designer`
1. Entrevista: la mayoría de las respuestas ya están en esta especificación, así que solo pregunto lo que falte.
2. De 3 a 5 conceptos en paralelo, en `brand/logos/concepts/`. Ideas para explorar: evolución del wordmark con la hoja, monograma "Z" con capas (como un corte de cheesecake), wordmark serif editorial, sello artesanal ("Hecho en Sogamoso") y símbolo de cuchara u hoja abstracta.
3. Refinamiento en `brand/logos/iterations/` con verificación a tamaño favicon.
4. Exportación a `brand/logos/export/`. El reemplazo de `public/logo.png` y los íconos se hace en la Fase 1.

### 2.5 Archivos que se crean
```
e-commerce-zenda/
├── brand/                     ← nuevo
│   ├── plataforma.md          (R1, R2)
│   ├── tokens.css             (R6)
│   ├── manual.html            (R7)
│   ├── fotografia.md          (R8)
│   └── logos/                 (R5: concepts/, iterations/, export/, preview.html)
└── frontend/app/lab/          ← nuevo y temporal (R3)
```
No se modifica ningún archivo existente.

---

## 3. Tareas (en orden)

| # | Tarea | Verificación | Depende de |
|---|---|---|---|
| T1 | Pulir la plataforma y la voz a partir de tus comentarios sobre el §2.1 y el §2.2 → `brand/plataforma.md` | Apruebas el texto y el lema | Esta especificación |
| T2 | Estructura compartida de las maquetas y datos locales en COP | Compila (`next build`) | T1 (textos) |
| T3 | Maqueta A "Cuajada" | Capturas a 375, 768 y 1440 px; contraste AA; navegación por teclado | T2 |
| T4 | Maqueta B "Cacao" | Igual que T3 | T2 |
| T5 | Eliges la dirección y aplico un ajuste | Tu decisión por escrito | T3 y T4 |
| T6 | `brand/tokens.css` final | Revisión de contraste de cada par texto/fondo | T5 |
| T7 | Logo: conceptos, refinamiento y exportación con `logo-designer` | Lo apruebas; favicon legible a 16 y 32 px | T5 |
| T8 | Lista de tomas → `brand/fotografia.md` | La revisas | T5 |
| T9 | Cerrar el lema y hacer el manual → `brand/manual.html` | Lo revisas en el navegador | T6, T7 y T8 |

No hay TDD en esta fase: todo es diseño y se verifica visualmente (§10 del plan). La única revisión automática es que el build compile.

## 4. Lo que necesito de ti para arrancar
1. Comentarios sobre la plataforma del §2.1: ¿el propósito y los valores te representan? ¿Qué lema prefieres?
2. ¿El logo debe conservar algo del actual (la hoja, el rosa) o se puede rediseñar por completo?
3. ¿Me das permiso para descargar la fuente Gambarino de Fontshare (gratuita para uso comercial) para la maqueta A?
