---
paths: ["**/blog/**"]
---

# Reglas para contenido del blog

- Audiencia: abogados argentinos (ejercicio liberal y estudios juridicos).
- Idioma: espanol argentino, tono profesional pero accesible.
- Cada articulo necesita:
  - `<title>` con sufijo " - Iudex Blog"
  - Meta description menor a 160 caracteres
  - Meta keywords relevantes al tema legal
  - Category badge en el hero (Productividad, Gestion, Tecnologia, Fundadores)
  - Fecha de publicacion
  - Tiempo de lectura estimado
- URL pattern: `blog/{slug-en-kebab-case}.html`.
- Despues de crear un articulo, agregar la card correspondiente en `blog/index.html` con `data-category` correcto.
- Contenido: referenciar naturalmente features de Iudex sin ser promocional excesivo.
- Estructura del articulo: post-hero con titulo/meta → cuerpo con subtitulos h2/h3 → CTA section → footer.
- Categorias actuales: Productividad, Gestion, Tecnologia, Fundadores.
