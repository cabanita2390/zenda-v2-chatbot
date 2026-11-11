# Prompts para la secuencia de imágenes (Nano Banana + Veo)

Plan acordado el 8 nov 2026:
1. El usuario genera el fotograma inicial y el final con Nano Banana.
2. Con esos dos, genera el video en Google AI Studio (Veo).
3. Claude extrae los fotogramas con ffmpeg y los monta en la página (`/lab/secuencia`).

Todo es provisional: antes de producción se cambia por fotos y video del pastel real.

## Recomendaciones antes de empezar

- **Usa Google AI Studio, no la app de Gemini.** La app pone una marca de agua visible en la esquina (como en las fotos actuales de productos).
- **Haz el fotograma final editando el inicial.** Sube la imagen A y pide el cambio. Si lo generas desde cero, el pastel, el plato y la luz cambian, y el video se "derrite" al pasar de uno a otro.
- **Haz cada toma en dos formatos:** horizontal 16:9 (computador) y vertical 9:16 (celular). En el vertical, el pastel va en la mitad de abajo y el espacio vacío arriba (ahí va el texto).
- **Configuración del video:** la máxima resolución disponible (1080p si aparece), 8 segundos, sin audio (no se usa). 8 s a 24 fps dan unos 190 fotogramas; Apple usa alrededor de 150.
- **Revisa el video antes de mandármelo:**
  - que la fruta no cambie de forma ni aparezcan o desaparezcan cosas;
  - que no haya cortes;
  - que el movimiento vaya siempre en una sola dirección.
- **Mándame el MP4 original** (no un reenvío por WhatsApp, que lo comprime).

## Estilo (pégalo igual al inicio de cada prompt de imagen)

> Editorial still-life food photography on a seamless warm off-white background (#F3F4EE), with a faint sage undertone. Large soft morning window light from the left, big white bounce, one soft natural contact shadow. High key, gentle contrast, colour grade of warm cream, soft sage and natural fruit colour. Shot on medium format, 80mm lens, shallow depth of field, fine grain. Handmade artisanal pastry, honest real textures, visible crumbs, slightly imperfect. Photographic realism. NOT 3D render, NOT CGI, NOT illustration, no plastic sheen, no text, no logos, no people, no hands, no props other than the plate.

---

## Toma 1 · Portada → el corte (la más segura, hacer primero)

La cámara se acerca despacio al hueco de la porción que falta hasta que el corte llena la pantalla y se ven las tres capas. Sobre el final irán las etiquetas de "Qué lleva".

### Imagen A (inicial) · 16:9
> [estilo]
>
> A whole round no-bake cheesecake, 22 cm wide and about 7 cm tall, with one slice already cut out and missing, the gap facing the camera at a three-quarter view from slightly above. Thick golden toasted crumb base made of ground nuts and oats (not biscuit), tall smooth pale cream filling, a thin glossy deep red berry glaze on top with a few natural drips down the side, topped with fresh raspberries, blueberries and blackberries piled generously. Sitting on a plain matte off-white ceramic plate. The cake is placed in the right half of the frame; the left 40% of the frame is empty background for text.

### Imagen B (final) · editando la A
> Same photo, same cake, same plate, same light and colours. The camera has moved much closer to the gap where the slice is missing: the cut face of the cake now fills most of the frame, clearly showing the three layers — the golden nut and oat crumb base at the bottom, the thick creamy filling in the middle, and the glossy red berry glaze with fresh berries on top. Keep the cut face on the right half of the frame and some soft empty background on the left.

### Video (Veo, con A como primer fotograma y B como último)
> The camera pushes slowly and steadily forward toward the gap where the slice is missing, one smooth continuous dolly-in with a very slight downward tilt, ending on the cut face showing the three layers. The cake, the fruit and the plate stay perfectly still; only the camera moves. One single continuous take, no cuts, no camera shake, no zoom snap, nothing enters or leaves the frame, the fruit does not change shape. Slow, calm, cinematic, controlled.

### Versión vertical 9:16
Usa las mismas instrucciones, pero cambia la frase de encuadre:
- Imagen A: "The cake is placed in the lower half of the frame; the upper half is empty background for text."
- Imagen B: "Keep the cut face in the lower two thirds of the frame."

---

## Toma 2 · El desarme (más arriesgada, hacer solo si la 1 sale bien)

Las capas se separan en el aire. A los modelos de video les cuesta más: puede haber deformaciones. Si sale mal, nos quedamos con la toma 1.

### Imagen A (inicial) · 16:9
> [estilo]
>
> The same berry cheesecake (nut and oat crumb base, creamy filling, glossy red berry glaze with fresh raspberries, blueberries and blackberries), whole and intact, seen from the side at eye level, slightly from above, centred in the right half of the frame on a plain matte off-white ceramic plate. The left 40% of the frame is empty background.

### Imagen B (final) · editando la A
> Same photo, same cake, same plate, same light. The cheesecake is now shown as an exploded view: its layers float apart vertically in the air with even gaps between them — the crumb base stays on the plate, the creamy filling floats above it, the thin red glaze floats above the filling, and the fresh berries float at the top. Clean, realistic, like a high-end product photograph. Keep everything in the right half of the frame.

### Video (Veo, A → B)
> The layers of the cheesecake slowly and smoothly lift apart vertically, one after another — the filling rises off the base, the glaze rises off the filling, the berries rise off the glaze — until they float in an even exploded view. The camera stays perfectly still. The shapes and textures of each layer stay exactly the same while they move. One single continuous take, no cuts, no morphing, nothing enters or leaves the frame. Slow, calm, controlled.

---

## Lo que hace Claude cuando reciba los videos

1. Extrae los fotogramas con ffmpeg (alrededor de 150 por toma) en WebP y en dos tamaños (computador y celular).
2. Los monta en `/lab/secuencia` con el reproductor por scroll que ya existe, con las etiquetas y los textos encima en HTML.
3. Revisa la fluidez, el peso y los bordes, y ajusta la cantidad de fotogramas y la calidad.
