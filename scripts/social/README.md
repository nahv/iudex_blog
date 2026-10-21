# Piezas para redes desde el sitio

Instagram y LinkedIn usan **los mismos objetos que la landing** (tarjetas de
Nexus, hoja A4, chips de cita, teléfono, la grilla de la base). Nada de
capturas a mano: si una escena del sitio cambia, se regeneran las piezas.

```bash
python3 scripts/social/gen_social.py          # pieza.html desde gen_nexus_escenas.py
node scripts/social/render.mjs                # todas → scripts/social/out/
node scripts/social/render.mjs r03 c02        # sólo las que empiezan así
OUT=~/Desktop/redes node scripts/social/render.mjs p01

# subirlas a la campaña del panel (Redes), por pieza_id
API=http://api.iudex.localhost EMAIL=… PASSWORD=… \
  python3 -I scripts/social/sincronizar_panel.py [--forzar] [r03 …]
```

Necesita Node 24, ffmpeg, Pillow (para el PDF) y Chrome for Testing (el de la
caché de Playwright; o `CHROME=<binario>`).

## Qué sale

| Tipo | Formato | Archivos |
|---|---|---|
| `reel` | 1080×1920, 30 fps | `<id>.mp4` + `<id>-portada.jpg` |
| `carrusel` | 1080×1350 | `<id>-01.jpg` … (portada, un slide por paso, cierre) + `<id>.pdf` (documento de LinkedIn) |
| `carrusel-minis` | 1080×1350 | los seis objetos de «El expediente, en orden» |
| `post` | 1080×1350 | `<id>.jpg` |

## Cómo funciona

- `gen_social.py` importa `gen_nexus_escenas.py` y arma `pieza.html` con
  todas las escenas, el hero y los seis objetos; los textos (eyebrow, título,
  pasos) salen de las escenas mismas.
- `social.js` arma la pieza (formato, escena, textos) y la congela en el
  avance `p` que se pida con `IudexEscena.escena(el).aplicar(p)` (el mismo
  motor que el scroll del sitio). El reloj es propio: las animaciones y
  transiciones CSS se pausan y se les pone el tiempo a mano, así cada cuadro
  sale igual siempre.
- El encuadre se mide: zoom para que lo que se ve (los `.ob`, sin lo atenuado)
  llene la caja, con aire para el recorte 3:4 del perfil. En los reels hay una
  cámara por paso y se pasa de una a otra con un movimiento suave.
- `render.mjs` sirve el repo, maneja Chrome por CDP y arma JPG/MP4/PDF.

## Catálogo (`piezas.json`)

Cada pieza: `id` (lo usa el panel como `pieza_id`), `tipo`, `escena`
(`asi-trabaja`, `cap-nexus-escrito`, `cap-nexus-fuente`, `cap-nexus-planilla`,
`cap-nexus-telefono`, `cap-nexus-dia`, `hero`, `minis`) y opcionales:
`titulo`, `eyebrow`, `msPaso` (duración de cada paso en el reel), `pasosP`
(el avance de cada slide del carrusel: el mejor momento de cada paso),
`encuadre` (`[x0,y0,x1,y1]` en fracciones: acercar a una parte, p. ej. la
mitad de abajo del teléfono), `cierre` (la línea del cierre).

La campaña, sus textos y su calendario: iudex-cloud `kb/cm/09-redes-pediselo-a-nexus.md`
y el preset `src/services/redes_pediselo_a_nexus.py`. La marca (tokens, voz,
reglas): iudex-cloud `kb/marca/marca.json`.
