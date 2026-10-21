# -*- coding: utf-8 -*-
"""Sube las piezas renderizadas al panel (2026-10-21).

Cada pieza de la campaña en el panel (Redes) tiene un `pieza_id` que es el
id de piezas.json; este script busca sus archivos en scripts/social/out y
los sube como assets de esa pieza:

  reel       → el MP4 y su portada
  carrusel   → las slides en orden (el panel arma el PDF de LinkedIn)
  estático   → la imagen; «c01-asi-trabaja#05» = sólo la slide 05

Si la campaña no está cargada, la carga (preset por clave). No toca piezas
ya publicadas en Instagram. Por defecto no pisa piezas que ya tienen assets;
con --forzar los reemplaza (después de volver a renderizar).

Uso:
  API=http://api.iudex.localhost EMAIL=… PASSWORD=… \\
    python3 -I scripts/social/sincronizar_panel.py [--forzar] [--clave …] [pieza …]

Sólo librería estándar."""
import argparse
import json
import mimetypes
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

AQUI = Path(__file__).resolve().parent
OUT = Path(os.environ.get('OUT', AQUI / 'out')).expanduser()
API = os.environ.get('API', 'http://api.iudex.localhost').rstrip('/')
IG = '/admin/instagram'


def pedir(metodo, ruta, token=None, json_body=None, archivo=None, query=None):
    url = API + ruta + ('?' + urllib.parse.urlencode(query) if query else '')
    headers = {'Accept': 'application/json'}
    data = None
    if token:
        headers['Authorization'] = f'Bearer {token}'
    if json_body is not None:
        data = json.dumps(json_body).encode()
        headers['Content-Type'] = 'application/json'
    if archivo is not None:
        borde = uuid.uuid4().hex
        tipo = mimetypes.guess_type(archivo.name)[0] or 'application/octet-stream'
        data = (f'--{borde}\r\nContent-Disposition: form-data; name="file"; filename="{archivo.name}"\r\n'
                f'Content-Type: {tipo}\r\n\r\n').encode() + archivo.read_bytes() + f'\r\n--{borde}--\r\n'.encode()
        headers['Content-Type'] = f'multipart/form-data; boundary={borde}'
    req = urllib.request.Request(url, data=data, method=metodo, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            cuerpo = r.read()
            return json.loads(cuerpo) if cuerpo else None
    except urllib.error.HTTPError as e:
        raise SystemExit(f'{metodo} {ruta} → {e.code}: {e.read().decode()[:300]}')


def archivos_de(pieza_id, formato):
    """Los archivos de una pieza, en el orden en que van."""
    base, _, slide = pieza_id.partition('#')
    d = OUT / base
    if not d.is_dir():
        return []
    if slide:
        return sorted(d.glob(f'{base}-{slide.zfill(2)}.jpg'))
    if formato == 'reel':
        return [p for p in (d / f'{base}.mp4', d / f'{base}-portada.jpg') if p.exists()]
    slides = sorted(d.glob(f'{base}-[0-9][0-9].jpg'))
    return slides or sorted(d.glob(f'{base}.jpg'))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--clave', default='pediselo-a-nexus-2026')
    ap.add_argument('--forzar', action='store_true', help='reemplaza los assets que ya están')
    ap.add_argument('piezas', nargs='*', help='sólo las piezas cuyo id empieza así')
    a = ap.parse_args()

    token = os.environ.get('TOKEN')
    if not token:
        email, password = os.environ.get('EMAIL'), os.environ.get('PASSWORD')
        if not (email and password):
            sys.exit('Falta EMAIL y PASSWORD (o TOKEN) de un admin del panel')
        token = pedir('POST', '/auth/login', json_body={'email': email, 'password': password})['access_token']

    campanas = pedir('GET', f'{IG}/campanas', token)
    camp = next((c for c in campanas if c.get('clave') == a.clave), None)
    if not camp:
        r = pedir('POST', f'{IG}/campanas/lanzamiento', token, query={'clave': a.clave})
        print('campaña cargada:', r.get('message'))
        camp = {'id': r['id']}
    detalle = pedir('GET', f"{IG}/campanas/{camp['id']}", token)

    subidas = 0
    for p in detalle['posts']:
        pid = p.get('pieza_id') or ''
        if not pid or (a.piezas and not any(pid.startswith(f) for f in a.piezas)):
            continue
        nombre = f"{p['orden']:02d} {p['titulo']} ({pid})"
        if p['estado'] in ('publicando', 'publicado', 'programado'):
            print('  =', nombre, '· ya está', p['estado'])
            continue
        archivos = archivos_de(pid, p['formato'])
        if not archivos:
            print('  ?', nombre, '· no hay archivos en', OUT / pid.split('#')[0], '(¿render.mjs?)')
            continue
        if p['assets'] and not a.forzar:
            print('  =', nombre, f"· ya tiene {len(p['assets'])} asset(s) (--forzar para reemplazar)")
            continue
        for viejo in p['assets']:
            pedir('DELETE', f"{IG}/posts/{p['id']}/assets", token, query={'key': viejo['key']})
        for f in archivos:
            pedir('POST', f"{IG}/posts/{p['id']}/assets", token, archivo=f)
            subidas += 1
        print('  ↑', nombre, '·', ', '.join(f.name for f in archivos))
    print(f'listo: {subidas} archivo(s) subidos a «{detalle["nombre"]}»')


if __name__ == '__main__':
    main()
