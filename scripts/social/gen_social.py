# -*- coding: utf-8 -*-
"""Piezas para redes desde los objetos del sitio (2026-10-21).

Las piezas de Instagram y LinkedIn salen de los MISMOS objetos que la
landing (gen_nexus_escenas.py): si cambia una escena del sitio, se vuelve a
generar y las piezas cambian con ella. Nada de capturas a mano.

Escribe scripts/social/pieza.html: una sola página con todas las escenas,
el hero y los seis objetos de «El expediente, en orden», más los textos de
cada escena (eyebrow, título y pasos) en `window.ESCENAS`. social.js arma
la pieza que se le pida (formato, avance, textos) y render.mjs la captura.

Uso: python3 scripts/social/gen_social.py"""
import json
import os
import re
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(AQUI))
import gen_nexus_escenas as g  # noqa: E402

PASO = re.compile(r'<li data-paso-texto="\d+"><b>(.*?)</b><span>(.*?)</span></li>')


def textos(seccion):
    """Saca de la escena del sitio lo que dice: eyebrow, título y pasos."""
    eyebrow = re.search(r'<span class="c-eyebrow">(.*?)</span>', seccion).group(1)
    titulo = re.search(r'<h2 [^>]*>(.*?)</h2>', seccion).group(1)
    sub = re.search(r'<p class="nx-escena__sub">(.*?)</p>', seccion)
    return {
        'eyebrow': eyebrow,
        'titulo': titulo,
        'sub': sub.group(1) if sub else '',
        'pasos': [{'b': a, 't': b} for a, b in PASO.findall(seccion)],
    }


ESCENAS = {}
for sec in (g.ESC_A, g.ESC_B, g.ESC_C, g.ESC_D, g.ESC_E, g.ESC_F):
    id_ = re.search(r'id="([^"]+)"', sec).group(1)
    ESCENAS[id_] = textos(sec)

# Los seis objetos de la base, cada uno con su leyenda del sitio.
MINIS = {}
for m in re.finditer(r'<article class="nx-grilla__item".*?</article>', g.GRILLA, re.S):
    art = m.group(0)
    etiqueta = re.search(r'<span class="c-caption">(.*?)</span>', art).group(1)
    MINIS[etiqueta] = {
        'titulo': re.search(r'<h3 class="nx-grilla__t">(.*?)</h3>', art).group(1),
        'texto': re.search(r'<p class="nx-grilla__p">(.*?)</p>', art).group(1),
        'html': art,
    }

ESCENAS['hero'] = {
    'eyebrow': 'Iudex · Nexus',
    'titulo': 'Pedíselo a Nexus.',
    'sub': 'Escritos, planillas y tareas, armados desde tu causa. Vos confirmás.',
    'pasos': [],
}

minis_html = '\n'.join(
    f'<div class="sc__mini" data-mini="{k}">{v["html"]}</div>' for k, v in MINIS.items())
datos = {
    'escenas': ESCENAS,
    'minis': {k: {'titulo': v['titulo'], 'texto': v['texto']} for k, v in MINIS.items()},
}

HTML = f'''<!DOCTYPE html>
<!-- GENERADO por scripts/social/gen_social.py — no editar a mano. -->
<html lang="es"><head><meta charset="utf-8">
<meta name="robots" content="noindex">
<link rel="stylesheet" href="../../public/css/styles.css">
<link rel="stylesheet" href="../../public/css/nexus-objetos.css">
<link rel="stylesheet" href="social.css">
</head><body class="cinematic">
<div class="sc" id="sc" data-formato="post">
  <div class="c-hero__foja sc__foja" aria-hidden="true"></div>
  <div class="sc__cab"><span class="sc__eyebrow"></span><span class="sc__contador"></span></div>
  <h1 class="sc__t"><span class="sc__t-texto"></span><i class="sc__caret"></i></h1>
  <p class="sc__sub"></p>
  <div class="sc__stage"><div class="sc__mover"><div class="sc__zoom">
    <div class="sc__escena" data-escena="hero">{g.HERO}</div>
    {''.join(f'<div class="sc__escena" data-escena="{k}">{s}</div>' for k, s in zip(list(ESCENAS)[:6], (g.ESC_A, g.ESC_B, g.ESC_C, g.ESC_D, g.ESC_E, g.ESC_F)))}
    <div class="sc__escena sc__minis" data-escena="minis">{minis_html}</div>
  </div></div></div>
  <div class="sc__paso"><b></b><span></span></div>
  <div class="sc__pie"><span class="sc__logo"><img src="../../assets/icon.png" alt="">Iudex</span><span class="sc__url">app.iudex.com.ar</span></div>
  <div class="sc__cierre"><span class="sc__cierre-logo"><img src="../../assets/icon.png" alt="">Iudex</span><span class="sc__cierre-linea"></span><span class="sc__cierre-url">app.iudex.com.ar</span></div>
</div>
<script>window.SOCIAL = {json.dumps(datos, ensure_ascii=False)};</script>
<script src="../../public/js/nexus-escena.js"></script>
<script src="social.js"></script>
</body></html>
'''

if __name__ == '__main__':
    open(os.path.join(AQUI, 'pieza.html'), 'w', encoding='utf-8').write(HTML)
    print('ok', len(ESCENAS), 'escenas,', len(MINIS), 'objetos')
