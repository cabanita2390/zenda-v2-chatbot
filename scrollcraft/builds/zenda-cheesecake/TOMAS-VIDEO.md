# Tomas para la versión en video (opción 3: generar ahora, reemplazar luego por video real)

Decidido por el usuario el 8 nov 2026. El prototipo 3D (`/lab/scroll`) se mantiene como referencia. La versión en video será una ruta nueva (`/lab/video`) para poder compararlas.

**Importante:** todo lo generado es provisional. El pastel de IA no es el pastel real de Zenda. Antes de salir a producción se reemplaza por video y fotos reales.

## Qué cambia respecto al 3D

- La coreografía exacta (capas que se separan, porción que viaja) no se puede pedir a un video generado.
- **Nueva movida propia:** "entrar por la porción que falta". La cámara se acerca despacio al hueco del corte hasta que el corte llena la pantalla y se ven las capas. Ahí aparecen las etiquetas de "Qué lleva" (en HTML, encima del video).
- Sabores: cuatro fotos con el mismo encuadre que se funden entre sí con el scroll (más barato y más estable que un video por sabor).
- Cierre: video de la porción servida en su plato, con el botón de pedir al lado.

## Mundo (preámbulo fijo, se pega igual en todos los prompts)

> Editorial still-life food photography on a seamless warm bone-white cyclorama with a faint sage-green undertone. Large soft morning window light from the left, big white bounce, one soft contact shadow. High key, gentle contrast, colour grade of warm cream, soft sage and natural fruit colour. Shot on medium format, 80mm, shallow depth of field, fine grain. Handmade artisanal pastry, honest real textures, visible crumbs. Photographic realism. NOT 3D render, NOT CGI, NOT illustration, no plastic sheen, no text, no logos, no people, no hands.

## Lista (8 imágenes + 2 videos)

| # | Tipo | Formato | Escena (va después del preámbulo) |
|---|---|---|---|
| 01 | imagen | 16:9 | Whole round cheesecake, 22 cm, with one slice already cut out and missing, the cut faces toward the camera at three-quarter view. Thick golden toasted nut-and-oat crumb base, tall creamy pale filling, glossy deep red berry topping with fresh raspberries, blueberries and blackberries, a few drips down the side. On a plain matte off-white ceramic plate. Cake placed on the right third, generous empty space on the left for text. |
| 01m | imagen | 9:16 | Same cake and plate, cake in the lower half of the frame, empty space in the upper half for text. |
| V1 | video (desde 01) | 5 s | The camera pushes slowly and steadily forward toward the gap where the slice is missing, a smooth continuous dolly-in with a slight downward tilt, until the cut face with its three layers fills most of the frame. The cake stays perfectly still. One single continuous take, no cuts, no camera shake, no zoom snap. Slow, cinematic, controlled. |
| V1m | video (desde 01m) | 5 s | Same move for the vertical frame. |
| 02–05 | imagen | 16:9 | Same composition as 01, one per flavour: uchuva (cape gooseberry halves, golden glaze), maracuyá y mango (mango cubes, passion fruit pulp with seeds), manzana (thin caramelised apple slices, cinnamon), frutos rojos (same as 01). Same plate, light and camera position every time. |
| 06 | imagen | 16:9 | A single slice of the berry cheesecake standing on a small matte off-white plate with a dessert fork, three-quarter view, slice on the left third, empty space on the right for the order button. |
| V2 | video (desde 06) | 5 s | A very slow, smooth half orbit around the slice from left to right, the slice stays centred and perfectly still. One continuous take, no cuts, no shake. |

Las versiones verticales de 02–06 solo se hacen si las horizontales no funcionan recortadas en celular (para ahorrar créditos).

## Costo estimado

Tarifa publicada: imagen 28 créditos, video de 5 s 160 créditos. Con 8 imágenes y 3 videos: unos 700 créditos según tarifa. Según la skill, el cobro real ha quedado cerca del 40 % (unos 280). Se verifica con `kie.mjs probe` antes y después.

## Comandos (se corren desde `e-commerce-zenda/`, la clave va en `e-commerce-zenda/.env`)

```bash
node ~/.claude/skills/scroll-craft/scripts/kie.mjs probe
node ~/.claude/skills/scroll-craft/scripts/kie.mjs still "<preámbulo>\n\n<escena 01>" scrollcraft/builds/zenda-cheesecake/out/01.png --ar 16:9
node ~/.claude/skills/scroll-craft/scripts/kie.mjs shot "<movimiento V1>" scrollcraft/builds/zenda-cheesecake/out/01.png scrollcraft/builds/zenda-cheesecake/out/v1.mp4 --dur 5
bash ~/.claude/skills/scroll-craft/scripts/encode.sh out/v1.mp4 frontend/public/lab/video/v1.mp4
bash ~/.claude/skills/scroll-craft/scripts/encode.sh out/v1.mp4 frontend/public/lab/video/v1-m.mp4 mobile
```

Orden: primero solo la imagen 01, revisarla, y luego el resto (así no se gasta en un estilo que no convenza).
