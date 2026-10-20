# -*- coding: utf-8 -*-
"""Nexus al frente (2026-10-20): genera el hero y las escenas de Nexus con
OBJETOS sueltos de Iudex (tarjetas de acción, chips de cita, fichas de
fuente, compositor, orbe, hoja del escrito) copiados de la app: medidas,
colores y textos de apps/crm y packages/iudex_nexus (ver los comentarios de
nexus-objetos.css). Nada de ventanas enteras: cada objeto se muestra solo,
grande y con su animación.

Escribe en index.html entre los marcadores
  <!-- nexus:hero --> … <!-- /nexus:hero -->
  <!-- nexus:escenas --> … <!-- /nexus:escenas -->

Uso: python3 scripts/gen_nexus_escenas.py index.html

Estados: el HTML trae SIEMPRE el estado final (lo que se ve sin JS o con
«reducir movimiento»). `data-desde="u"` aparece cuando el scroll de la
escena pasa u (0..1); `data-estados="a:0 b:.4 c:.8"` cambia `data-estado`;
`data-tipeo="a b"` escribe su texto entre a y b. Ver nexus-escena.js."""
import re
import sys

# ───────────── íconos (Material redondeados, a trazo) ─────────────
P = {
    'check': 'M5 12.5l4.5 4.5L19 7.5',
    'chev': 'M6 9l6 6 6-6',
    'open': 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
    'pdf': 'M7 3h7l5 5v13H7zM14 3v5h5M9.5 14h5M9.5 17h3',
    'plus': 'M12 5v14M5 12h14',
    'mic': 'M12 4a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3zM6 11a6 6 0 0 0 12 0M12 17v3',
    'up': 'M12 19V5M6 11l6-6 6 6',
    'copy': 'M9 9h10v11H9zM5 15V4h10',
    'sub': 'M6 4v9h12M14 9l4 4-4 4',
    'folder': 'M4 6h6l2 2h8v10H4z',
}


def ic(nombre, cls=''):
    return f'<svg class="ob-ic{(" " + cls) if cls else ""}" viewBox="0 0 24 24" aria-hidden="true"><path d="{P[nombre]}"/></svg>'


def orbe(s, trabajando=False, extra=''):
    """NexusOrbeVivo: núcleo con degradé y tres puntos que orbitan."""
    t = ' is-trabajando' if trabajando else ''
    return (f'<span class="ob-orbe{t}" style="--s:{s}px"{extra} aria-hidden="true">'
            '<i class="ob-orbe__nucleo"></i><i class="ob-orbe__orbita"><b></b><b></b><b></b></i></span>')


def orbe_grande(s, extra='', cls=''):
    """IudexNexus: el orbe grande que piensa (aurora, brillo y nodos)."""
    return (f'<div class="ob-orbe-g{(" " + cls) if cls else ""}" style="--s:{s}px"{extra} aria-hidden="true">'
            '<i class="ob-orbe-g__glow"></i><i class="ob-orbe-g__aurora"></i><i class="ob-orbe-g__nucleo"></i>'
            '<i class="ob-orbe-g__nodos"><b></b><b></b><b></b><b></b></i></div>')


def cita(n, label, donde, extra=''):
    return (f'<span class="ob-cita"{extra}><b>{n}</b><span class="ob-cita__l">{label}</span>'
            f'<span class="ob-cita__u">{donde}</span>{ic("open")}</span>')


def btn(texto, tipo='lleno', icono=None):
    i = ic(icono) if icono else ''
    return f'<span class="ob-btn ob-btn--{tipo}">{i}{texto}</span>'


def filas(pares):
    """FilasTarjeta: etiqueta de 96px y valor; fechas en mono."""
    out = []
    for k, v in pares:
        mono = ' ob-mono' if k in ('Vence', 'Fecha', 'Empieza', 'Termina', 'Capital', 'Período') else ''
        out.append(f'<span class="ob-filas__k">{k}</span><span class="ob-filas__v{mono}">{v}</span>')
    return f'<div class="ob-filas">{"".join(out)}</div>'


def pasos(lista, estados=None):
    """PasosPlan: círculo de 18px con el número; tilde verde al confirmar."""
    lis = []
    for i, t in enumerate(lista):
        e = f' data-estado="ok" data-estados="num:0 ok:{estados[i]}"' if estados else ''
        lis.append(f'<li{e}><span class="ob-pasos__n"><b>{i + 1}</b>{ic("check")}</span><span>{t}</span></li>')
    return f'<ol class="ob-pasos">{"".join(lis)}</ol>'


def tarjeta(etiqueta, titulo, cuerpo, estado='pendiente', estados='', envio='Guardando…',
            hecho_btn='Abrir', plegable=False, plegada=False, resumen='', i=0, extra='', cls=''):
    """MarcoTarjetaNexus + TarjetaAprobacion. `estado`: oculto · pendiente ·
    pulsado · enviando · hecho. El cuerpo se cambia por el resumen si está
    plegada (TarjetasPlegables)."""
    est = f' data-estados="{estados}"' if estados else ''
    chev = f'<span class="ob-tarjeta__chev">{ic("chev")}</span>' if plegable else ''
    pleg = ' is-plegada' if plegada else ''
    medio = f'<div class="ob-tarjeta__resumen">{resumen}</div>' if plegada else f'<div class="ob-tarjeta__cuerpo">{cuerpo}</div>'
    return f'''<div class="ob ob-tarjeta{pleg}{(" " + cls) if cls else ""}" data-estado="{estado}"{est} style="--i:{i}"{extra}>
  <div class="ob-tarjeta__cab"><span class="ob-etiqueta">{etiqueta}</span><b class="ob-tarjeta__t">{titulo}</b><span class="ob-pill ob-pill--pendiente">Por confirmar</span><span class="ob-pill ob-pill--enviando">Enviando…</span><span class="ob-pill ob-pill--hecho">Hecho</span>{chev}</div>
  {medio}
  <div class="ob-tarjeta__envio"><i class="ob-spin"></i>{envio}</div>
  <div class="ob-tarjeta__acciones"><span class="ob-acc ob-acc--pend">{btn("Confirmar")}{btn("Editar", "borde")}{btn("Cancelar", "peligro")}</span><span class="ob-acc ob-acc--hecho">{btn(hecho_btn, "borde")}</span></div>
</div>'''


def fuente(n, label, snippet, meta, extra='', cls=''):
    """FichaFuente del panel de fuentes."""
    return f'''<div class="ob ob-fuente{(" " + cls) if cls else ""}"{extra}>
  <div class="ob-fuente__top"><span class="ob-badge">{n}</span><b>{label}</b></div>
  <p class="ob-fuente__s">{snippet}</p>
  <div class="ob-fuente__meta"><span>{meta}</span><span class="ob-fuente__pdf">{ic("pdf")}Ver PDF original</span></div>
</div>'''


def compositor(texto, ph, tipeo='', estados='', estado='vacio'):
    t = f' data-tipeo="{tipeo}"' if tipeo else ''
    e = f' data-estados="{estados}"' if estados else ''
    return f'''<div class="ob ob-compositor" data-estado="{estado}"{e}>
  <div class="ob-compositor__campo"><span class="ob-compositor__texto"{t}>{texto}</span><i class="ob-caret"></i><span class="ob-compositor__ph">{ph}</span></div>
  <div class="ob-compositor__barra"><span class="ob-cbtn ob-cbtn--adj">{ic("plus")}</span><span class="ob-compositor__sp"></span><span class="ob-cbtn">{ic("mic")}</span><span class="ob-cbtn ob-cbtn--enviar">{ic("up")}</span></div>
</div>'''


CURSOR = '<svg class="ob-cursor__svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l14 9-6 1.5L16 20l-2.5 1-3-6.5L6 18z" fill="#0f0f0e" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>'

CAR = 'PARTE ACTORA c/ PARTE DEMANDADA s/ Ejecución de honorarios'
CAR_M = 'MARTÍNEZ, ANA C/ SEGUROS DEL SUR S/ DAÑOS Y PERJUICIOS'

# ───────────────────────── Hero ─────────────────────────
# El pedido, la respuesta con dos citas a papeles de la causa y tres
# tarjetas: la primera abierta (regla de TarjetasPlegables con 3 o más) y
# las otras dos plegadas. Al final la primera queda «Hecho».
HERO = f'''<div class="nx-hero" role="img" aria-label="Nexus con una causa abierta. Se le pide contestar el traslado y practicar la planilla; responde citando dos papeles de la causa y deja tres tarjetas para confirmar: el escrito, la tarea y la liquidación. El escrito ya está confirmado.">
  {orbe_grande(260, cls="nx-hero__orbe")}
  <div class="nx-hero__col ob-escala">
    <div class="ob ob-burbuja nx-hero__pedido">Contestá el traslado del 12/09 y practicá planilla desde el 14/08/2025.</div>
    <div class="ob ob-pensando nx-hero__pensando">{orbe_grande(46, cls="is-busca")}<span>Leyendo la causa…</span></div>
    <p class="ob ob-respuesta nx-hero__resp">Te lo dejo armado con la resolución {cita(1, "Traslado de la demanda", "12/09")} y tu escrito {cita(2, "Promueve ejecución", "14/08")}. Revisalo y confirmá.</p>
    <div class="nx-hero__tarjetas">
      {tarjeta("Preparar escrito", "Contesta traslado", pasos(["Movimiento «Contesta traslado» del 12/09", "Redactar el escrito desde tu plantilla", "Firmarlo con tu firma"]), estado="hecho", plegable=True, i=0, cls="nx-hero__t0")}
      {tarjeta("Crear tarea", "Presentar la contestación", "", estado="pendiente", plegable=True, plegada=True, resumen="vos (Lucía Ferreyra) · vie 18/09/2026 18:00", i=1)}
      {tarjeta("Liquidación", "$ 1.500.000,00", "", estado="pendiente", plegable=True, plegada=True, resumen="Total $ 2.159.758,50 · 432 días · Tasa Activa Banco Nación", i=2)}
    </div>
  </div>
</div>'''


def escena(id_, eyebrow, titulo, sub, pasos_txt, stage, alto, cls=''):
    lis = ''.join(f'<li data-paso-texto="{i}"><b>{a}</b><span>{b}</span></li>' for i, (a, b) in enumerate(pasos_txt))
    s = f'<p class="nx-escena__sub">{sub}</p>' if sub else ''
    return f'''<section class="nx-escena{(" " + cls) if cls else ""}" id="{id_}" data-pasos="{len(pasos_txt)}" style="--alto:{alto}vh" aria-labelledby="{id_}-t">
  <div class="nx-escena__fija">
    <div class="nx-escena__grid">
      <div class="nx-escena__copy">
        <span class="c-eyebrow">{eyebrow}</span>
        <h2 id="{id_}-t" class="c-display nx-escena__t">{titulo}</h2>
        {s}
        <ol class="nx-pasos">{lis}</ol>
      </div>
      <div class="nx-escena__stage">
{stage}
      </div>
    </div>
  </div>
</section>'''


# ─────────────── Así trabaja: el ciclo de una tarjeta ───────────────
A = f'''        {orbe_grande(300, ' data-estado="fuera" data-estados="quieto:0 busca:.27 fuera:.52"', "nx-a__orbe")}
        <div class="nx-chat ob-escala">
          <div class="ob ob-burbuja ob-recede" data-desde=".26">Creá la tarea de contestar el traslado para el viernes</div>
          <div class="ob ob-progreso ob-recede" data-estado="plegado" data-estados="oculto:0 abierto:.28 plegado:.52">
            <div class="ob-progreso__lista">
              <div class="ob-fase" data-estado="ok" data-estados="oculto:0 ok:.29">Revisando el expediente</div>
              <div class="ob-fila" data-estado="hecho" data-estados="oculto:0 corre:.30 hecho:.37"><span class="ob-ind"><i class="ob-spin"></i>{ic("check")}</span><span>Leyendo la causa<em> — 12 actuaciones</em></span></div>
              <div class="ob-fase" data-estado="ok" data-estados="oculto:0 ok:.38">En tus causas</div>
              <div class="ob-fila" data-estado="hecho" data-estados="oculto:0 corre:.39 hecho:.46"><span class="ob-ind"><i class="ob-spin"></i>{ic("check")}</span><span>Buscando quién la lleva<em> — 2 responsables</em></span></div>
            </div>
            <div class="ob-progreso__resumen">{ic("check")}<span>1 paso en el expediente · 1 consulta a tus causas</span>{ic("chev")}</div>
          </div>
          <p class="ob ob-respuesta" data-desde=".53">Te dejo la tarea para que la confirmes.<span class="ob-respuesta__listo" data-desde=".89"> Listo: creé la tarea «Contestar el traslado».</span></p>
          <div class="nx-a__tarjeta">
            {tarjeta("Crear tarea", "Contestar el traslado", filas([("Responsable", "vos (Lucía Ferreyra)"), ("Vence", "vie 23/10/2026 18:00"), ("Causa", "MARTÍNEZ, ANA c/ SEGUROS DEL SUR s/ DAÑOS")]), estado="hecho", estados="oculto:0 pendiente:.56 pulsado:.79 enviando:.81 hecho:.88", envio="Creando la tarea…", plegable=True)}
            <span class="ob-cursor" data-estado="fuera" data-estados="oculto:0 va:.74 clic:.79 fuera:.805">{CURSOR}</span>
          </div>
          {compositor("Creá la tarea de contestar el traslado para el viernes", "Pedile algo sobre esta causa…", tipeo=".03 .2", estados="vacio:0 escribe:.02 vacio:.26")}
        </div>'''

ESC_A = escena('asi-trabaja', 'Así trabaja Nexus', 'Pedís. Nexus lo arma. Vos confirmás.', '',
               [('Pedís.', 'Con tus palabras, escrito o dictado, desde la causa abierta.'),
                ('Nexus revisa la causa.', 'Lee las actuaciones y busca en tus causas.'),
                ('Te lo deja para confirmar.', 'Confirmar, Editar o Cancelar. Nada se hace solo.'),
                ('Queda hecho.', 'En la causa, con fecha y con quién lo hizo.')],
               A, 420, 'nx-escena--a')

# ─────────────── I · Del pedido al escrito ───────────────
B = f'''        <div class="nx-chat ob-escala ob-recede-b">
          <div class="ob ob-burbuja" data-desde=".02">Haceme una demanda de daños por un choque, contra Seguros del Sur</div>
          <div class="nx-b__slot">
            <div class="nx-b__opciones" data-estado="fuera" data-estados="oculto:0 ver:.08 elegida:.18 fuera:.25">
              <p class="ob ob-respuesta">Encontré varias causas que pueden ser. ¿En cuál lo hago?</p>
              <div class="ob-opciones">
                <div class="ob-opcion"><span class="ob-opcion__n">1</span><span>Martínez c/ Paz · 2210/25</span></div>
                <div class="ob-opcion"><span class="ob-opcion__n">2</span><span>Martínez, Ana s/ sucesión · 87/24</span></div>
                <div class="ob-opcion ob-opcion--crear"><span class="ob-opcion__n">{ic("plus")}</span><span>Crear expediente nuevo</span></div>
              </div>
            </div>
            <div class="nx-b__plan">
              <p class="ob ob-respuesta" data-desde=".26">No encontré esa causa. Te propongo crearla y redactar ahí la demanda.</p>
              {tarjeta("Preparar escrito", CAR_M, pasos(["Crear el expediente MARTÍNEZ, ANA C/ SEGUROS DEL SUR S/ DAÑOS Y PERJUICIOS (S/N, sin juzgado)", "Movimiento «Redactar demanda de daños y perjuicios»", "Redactar la demanda en el editor"], estados=[".44", ".5", ".56"]), estado="hecho", estados="oculto:0 pendiente:.29 pulsado:.37 enviando:.39 hecho:.58", envio="Guardando…", hecho_btn="Abrir el escrito", plegable=True)}
            </div>
          </div>
        </div>
        <div class="nx-b__hoja" data-estado="entra" data-estados="oculto:0 entra:.64">
          <div class="ob ob-pildora-esc" data-estado="fin" data-estados="oculto:0 p1:.66 p2:.76 p3:.86 fin:.96">{orbe(14, True)}<span>Nexus está escribiendo · <b class="ob-n1">1</b><b class="ob-n2">2</b><b class="ob-n3">3</b> de 3</span><span class="ob-pildora-esc__det">Detener</span></div>
          <div class="ob ob-a4">
            <div class="ob-a4__regla" aria-hidden="true"></div>
            <div class="ob-a4__pag">
              <p data-tipeo=".66 .68">Señor Juez:</p>
              <p data-tipeo=".68 .76">LUCÍA FERREYRA, abogada, M.P. 5.812, por la parte actora, en los autos «MARTÍNEZ, ANA c/ SEGUROS DEL SUR s/ DAÑOS Y PERJUICIOS», respetuosamente digo:</p>
              <p class="ob-a4__h" data-tipeo=".76 .77">I. OBJETO</p>
              <p data-tipeo=".77 .86">Que vengo a promover demanda de daños y perjuicios contra SEGUROS DEL SUR S.A. por el choque del 14/08/2025, con costas.</p>
              <p class="ob-a4__h" data-tipeo=".86 .87">II. PETITORIO</p>
              <p data-tipeo=".87 .93">Se tenga por promovida la demanda y se corra traslado. SERÁ JUSTICIA.</p>
              <div class="ob-a4__firma" data-desde=".94"><i>Firmado electrónicamente por</i><b>Dra. Lucía Ferreyra</b><span>Abogada · M.P. 5.812</span></div>
            </div>
          </div>
        </div>'''

ESC_B = escena('cap-nexus-escrito', 'I · Escritos', 'Del pedido al escrito.', '',
               [('Contale qué necesitás.', 'Si no sabe en qué causa, te pregunta.'),
                ('Te propone el plan.', 'Crear la causa, el movimiento y el escrito. Lo confirmás una vez.'),
                ('Lo escribe en tu editor.', 'Párrafo por párrafo, con tu firma al pie. Lo podés detener.')],
               B, 380, 'nx-escena--b')

# ─────────────── II · Con la fuente al lado ───────────────
C = f'''        {orbe_grande(240, ' data-estado="fuera" data-estados="oculto:0 busca:.12 fuera:.33"', "nx-c__orbe")}
        <div class="nx-chat ob-escala ob-recede">
          <div class="ob ob-burbuja" data-desde=".03">¿Desde cuándo corren los intereses en un accidente de tránsito?</div>
          <div class="ob ob-pensando nx-c__pensando" data-estado="fuera" data-estados="oculto:0 f1:.12 f2:.19 f3:.26 fuera:.33">{orbe_grande(46, cls="is-busca")}<span class="ob-frase ob-frase--f1">Buscando jurisprudencia aplicable…</span><span class="ob-frase ob-frase--f2">Leyendo el fallo en detalle…</span><span class="ob-frase ob-frase--f3">Comparando fallos similares…</span></div>
          <div class="ob ob-progreso" data-estado="plegado" data-estados="oculto:0 plegado:.34"><div class="ob-progreso__resumen">{ic("check")}<span>2 búsquedas · 1 lectura</span>{ic("chev")}</div></div>
          <p class="ob ob-respuesta"><span data-tipeo=".35 .41">Desde el día del hecho. Las cámaras civiles cuentan los intereses desde que se produjo el daño </span>{cita(1, "Romero", "p. 4", ' data-desde=".41"')}<span data-tipeo=".42 .47">, con tasa activa hasta el pago </span>{cita(2, "Acosta", "p. 7", ' data-desde=".47"')}<span data-tipeo=".48 .53">. Para el daño moral hay fallos que los cuentan desde la sentencia </span>{cita(3, "Benítez", "p. 2", ' data-desde=".53"')}<span data-tipeo=".54 .55">.</span></p>
        </div>
        <div class="nx-c__fuentes ob-escala">
          <span class="nx-c__cab" data-desde=".42">Fuentes</span>
          {fuente(1, "Romero, Juan c/ Transportes del Litoral s/ daños y perjuicios", "…los intereses se devengan desde el día del hecho, momento en que se produjo el perjuicio…", "Fallo · p. 4 · Civil", ' data-desde=".42"', "nx-c__f1")}
          {fuente(2, "Acosta, Marta c/ Gutiérrez, Pablo s/ daños", "…se aplicará la tasa activa desde la mora y hasta el efectivo pago…", "Fallo · p. 7 · Civil", ' data-desde=".48"', "nx-c__f2")}
          {fuente(3, "Benítez c/ Expreso Mercedes s/ daños", "…los intereses por daño moral corren desde la fecha de la sentencia…", "Fallo · p. 2 · Civil", ' data-desde=".54"', "nx-c__f3")}
        </div>
        <div class="ob ob-hojafuente nx-c__hoja" data-desde=".72">
          <i class="ob-hojafuente__asa"></i>
          <div class="ob-hojafuente__t"><b>1</b><span>Romero, Juan c/ Transportes del Litoral s/ daños y perjuicios</span></div>
          <div class="ob-hojafuente__tipo">Fallo · p. 4</div>
          <blockquote>«…los intereses se devengan desde el día del hecho, momento en que se produjo el perjuicio, y hasta su efectivo pago…»</blockquote>
          <div class="ob-hojafuente__btns">{btn("Ver PDF", "lleno", "pdf")}{btn("Copiar cita", "borde", "copy")}</div>
        </div>'''

ESC_C = escena('cap-nexus-fuente', 'II · Fuentes', 'Con la fuente al lado.',
               'Más de 80.000 fallos y la legislación, citados en cada respuesta.',
               [('Preguntá como a un colega.', 'Nexus busca, lee y compara antes de contestar.'),
                ('Cada dato, con su cita.', 'Cada chip es un fallo o una norma que podés abrir.'),
                ('El fallo, a un toque.', 'La cita con su página y el PDF original.')],
               C, 380, 'nx-escena--c')

ESCENAS = '\n\n'.join([ESC_A, ESC_B, ESC_C])


def poner(html, marca, contenido):
    a, b = f'<!-- {marca} -->', f'<!-- /{marca} -->'
    pat = re.compile(re.escape(a) + r'.*?' + re.escape(b), re.S)
    assert pat.search(html), f'falta el marcador {a}'
    return pat.sub(lambda _: f'{a}\n{contenido}\n{b}', html, count=1)


if __name__ == '__main__':
    ruta = sys.argv[1]
    html = open(ruta, encoding='utf-8').read()
    html = poner(html, 'nexus:hero', HERO)
    html = poner(html, 'nexus:escenas', ESCENAS)
    open(ruta, 'w', encoding='utf-8').write(html)
    print('ok')
