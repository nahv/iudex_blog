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
    'x': 'M6 6l12 12M18 6L6 18',
    'sol': 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
    'scan': 'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10',
    'unir': 'M7 4l5 5 5-5M12 9v11',
    'camara': 'M4 8h3l2-2h6l2 2h3v11H4zM12 11a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
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


def compositor(texto, ph, tipeo='', estados='', estado='vacio', adj=''):
    t = f' data-tipeo="{tipeo}"' if tipeo else ''
    e = f' data-estados="{estados}"' if estados else ''
    return f'''<div class="ob ob-compositor" data-estado="{estado}"{e}>
  {f'<div class="ob-compositor__adjs">{adj}</div>' if adj else ''}<div class="ob-compositor__campo"><span class="ob-compositor__texto"{t}>{texto}</span><i class="ob-caret"></i><span class="ob-compositor__ph">{ph}</span></div>
  <div class="ob-compositor__barra"><span class="ob-cbtn ob-cbtn--adj">{ic("plus")}</span><span class="ob-compositor__sp"></span><span class="ob-cbtn">{ic("mic")}</span><span class="ob-cbtn ob-cbtn--enviar">{ic("up")}</span></div>
</div>'''


CURSOR = '<svg class="ob-cursor__svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l14 9-6 1.5L16 20l-2.5 1-3-6.5L6 18z" fill="#0f0f0e" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>'

CAR = 'PARTE ACTORA c/ PARTE DEMANDADA s/ Ejecución de honorarios'
CAR_M = 'PARTE ACTORA C/ PARTE DEMANDADA S/ DAÑOS Y PERJUICIOS'

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
      {tarjeta("Liquidación", "$ 1.500.000,00", "", estado="pendiente", plegable=True, plegada=True, resumen="Total $ 2.159.383,56 · 432 días · Tasa Activa Banco Nación", i=2)}
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
            {tarjeta("Crear tarea", "Contestar el traslado", filas([("Responsable", "vos (Lucía Ferreyra)"), ("Vence", "vie 23/10/2026 18:00"), ("Causa", "PARTE ACTORA c/ PARTE DEMANDADA s/ DAÑOS")]), estado="hecho", estados="oculto:0 pendiente:.56 pulsado:.79 enviando:.81 hecho:.88", envio="Creando la tarea…", plegable=True)}
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
          <div class="ob ob-burbuja" data-desde=".02">Haceme una demanda de daños por un choque</div>
          <div class="nx-b__slot">
            <div class="nx-b__opciones" data-estado="fuera" data-estados="oculto:0 ver:.08 elegida:.18 fuera:.25">
              <p class="ob ob-respuesta">Encontré varias causas que pueden ser. ¿En cuál lo hago?</p>
              <div class="ob-opciones">
                <div class="ob-opcion"><span class="ob-opcion__n">1</span><span>PARTE ACTORA c/ PARTE DEMANDADA s/ Despido · 2210/25</span></div>
                <div class="ob-opcion"><span class="ob-opcion__n">2</span><span>PARTE ACTORA c/ PARTE DEMANDADA s/ Alimentos · 87/24</span></div>
                <div class="ob-opcion ob-opcion--crear"><span class="ob-opcion__n">{ic("plus")}</span><span>Crear expediente nuevo</span></div>
              </div>
            </div>
            <div class="nx-b__plan">
              <p class="ob ob-respuesta" data-desde=".26">No encontré esa causa. Te propongo crearla y redactar ahí la demanda.</p>
              {tarjeta("Preparar escrito", CAR_M, pasos(["Crear el expediente PARTE ACTORA C/ PARTE DEMANDADA S/ DAÑOS Y PERJUICIOS (S/N, sin juzgado)", "Movimiento «Redactar demanda de daños y perjuicios»", "Redactar la demanda en el editor"], estados=[".44", ".5", ".56"]), estado="hecho", estados="oculto:0 pendiente:.29 pulsado:.37 enviando:.39 hecho:.58", envio="Guardando…", hecho_btn="Abrir el escrito", plegable=True)}
            </div>
          </div>
        </div>
        <div class="nx-b__hoja" data-estado="entra" data-estados="oculto:0 entra:.64">
          <div class="ob ob-pildora-esc" data-estado="fin" data-estados="oculto:0 p1:.66 p2:.76 p3:.86 fin:.96">{orbe(14, True)}<span>Nexus está escribiendo · <b class="ob-n1">1</b><b class="ob-n2">2</b><b class="ob-n3">3</b> de 3</span><span class="ob-pildora-esc__det">Detener</span></div>
          <div class="ob ob-a4">
            <div class="ob-a4__regla" aria-hidden="true"></div>
            <div class="ob-a4__pag">
              <p data-tipeo=".66 .68">Señor Juez:</p>
              <p data-tipeo=".68 .76">LUCÍA FERREYRA, abogada, M.P. 5.812, por la parte actora, en los autos «PARTE ACTORA c/ PARTE DEMANDADA s/ DAÑOS Y PERJUICIOS», respetuosamente digo:</p>
              <p class="ob-a4__h" data-tipeo=".76 .77">I. OBJETO</p>
              <p data-tipeo=".77 .86">Que vengo a promover demanda de daños y perjuicios contra PARTE DEMANDADA por el choque del 14/08/2025, con costas.</p>
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
          <p class="ob ob-respuesta"><span data-tipeo=".35 .41">Desde el día del hecho. Las cámaras civiles cuentan los intereses desde que se produjo el daño </span>{cita(1, "PARTE ACTORA", "p. 4", ' data-desde=".41"')}<span data-tipeo=".42 .47">, con tasa activa hasta el pago </span>{cita(2, "PARTE ACTORA", "p. 7", ' data-desde=".47"')}<span data-tipeo=".48 .53">. Para el daño moral hay fallos que los cuentan desde la sentencia </span>{cita(3, "PARTE ACTORA", "p. 2", ' data-desde=".53"')}<span data-tipeo=".54 .55">.</span></p>
        </div>
        <div class="nx-c__fuentes ob-escala">
          <span class="nx-c__cab" data-desde=".42">Fuentes</span>
          {fuente(1, "PARTE ACTORA c/ PARTE DEMANDADA s/ daños y perjuicios", "…los intereses se devengan desde el día del hecho, momento en que se produjo el perjuicio…", "Fallo · p. 4 · Civil", ' data-desde=".42"', "nx-c__f1")}
          {fuente(2, "PARTE ACTORA c/ PARTE DEMANDADA s/ accidente de tránsito", "…se aplicará la tasa activa desde la mora y hasta el efectivo pago…", "Fallo · p. 7 · Civil", ' data-desde=".48"', "nx-c__f2")}
          {fuente(3, "PARTE ACTORA c/ PARTE DEMANDADA s/ daño moral", "…los intereses por daño moral corren desde la fecha de la sentencia…", "Fallo · p. 2 · Civil", ' data-desde=".54"', "nx-c__f3")}
        </div>
        <div class="ob ob-hojafuente nx-c__hoja" data-desde=".72">
          <i class="ob-hojafuente__asa"></i>
          <div class="ob-hojafuente__t"><b>1</b><span>PARTE ACTORA c/ PARTE DEMANDADA s/ daños y perjuicios</span></div>
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

# ─────────────── III · La planilla, en una frase ───────────────
# Tramos de la Tasa Activa Banco Nación (valores de ejemplo, la cuenta es
# la de la calculadora: capital × tasa × días / 365).
CAPITAL = 1_500_000
TRAMOS = [('14/08/2025', '30/09/2025', 47, 41.00), ('01/10/2025', '31/12/2025', 92, 38.50),
          ('01/01/2026', '31/03/2026', 90, 36.00), ('01/04/2026', '30/06/2026', 91, 35.20),
          ('01/07/2026', '20/10/2026', 112, 36.90)]


def pesos(v):
    """`$ ` + #,##0.00 es-AR (planilla_escrito.dart)."""
    ent, dec = f'{v:,.2f}'.split('.')
    return '$ ' + ent.replace(',', '.') + ',' + dec


FILAS = [(d, h, n, t, round(t * n / 365, 2), round(CAPITAL * t * n / 36500, 2)) for d, h, n, t in TRAMOS]
INTERES = round(sum(f[5] for f in FILAS), 2)
TOTAL = CAPITAL + INTERES
DIAS = sum(f[2] for f in FILAS)


def liquidacion():
    """Tarjeta «Liquidación» (tarjetas_turno.dart:728): mismo marco, filas en
    mono, bloque Total y «Guardar en la causa» → «Guardando…» → «Ver en la
    causa»."""
    cuerpo = filas([('Capital', pesos(CAPITAL)), ('Período', f'14/08/2025 → 20/10/2026 · {DIAS} días'),
                    ('Tasa', 'Tasa Activa Banco Nación'), ('Tasas', 'Hasta el 20/10/2026')])
    total = (f'<div class="ob-liq__total"><span>Total</span><b>{pesos(TOTAL)}</b>'
             f'<span>interés {pesos(INTERES)}</span></div>')
    return f'''<div class="ob ob-tarjeta ob-liq" data-estado="guardada" data-estados="oculto:0 lista:.36 guardando:.47 guardada:.53">
  <div class="ob-tarjeta__cab"><span class="ob-etiqueta">Liquidación</span><b class="ob-tarjeta__t">{pesos(CAPITAL)}</b><span class="ob-pill ob-pill--fija">En la calculadora</span><span class="ob-tarjeta__chev">{ic("chev")}</span></div>
  <div class="ob-tarjeta__cuerpo">{cuerpo}{total}</div>
  <div class="ob-tarjeta__acciones"><span class="ob-acc ob-acc--siempre"><span class="ob-btn ob-btn--lleno ob-liq__guardar"><i class="ob-spin ob-spin--claro"></i><span class="ob-liq__g1">Guardar en la causa</span><span class="ob-liq__g2">Guardando…</span><span class="ob-liq__g3">Ver en la causa</span></span>{btn("Ver en la calculadora", "borde")}</span></div>
</div>'''


def tabla_tramos():
    """_TablaTramos (calculadora_page.dart:1954): DM Mono 12px; Tasa % e
    Interés % con punto (toStringAsFixed), montos es-AR."""
    cab = ''.join(f'<span>{c}</span>' for c in ('Desde', 'Hasta', 'Días', 'Tasa %', 'Interés %', 'Interés'))
    filas_html = []
    for i, (d, h, n, t, ip, monto) in enumerate(FILAS):
        u = .62 + i * .035
        filas_html.append(f'<div class="ob-tramos__fila" data-desde="{u:.3f}"><span>{d}</span><span>{h}</span><span>{n}</span>'
                          f'<span>{t:.2f}</span><span>{ip:.2f}</span><span>{pesos(monto)}</span></div>')
    return f'''<div class="ob ob-tramos">
  <div class="ob-tramos__t"><b>Detalle por período · {len(FILAS)} tramos</b><span class="ob-tramos__copiar">{ic("copy")}Copiar tabla</span></div>
  <div class="ob-tramos__cab">{cab}</div>
  {''.join(filas_html)}
</div>'''


def cifras():
    """_Cifra: etiqueta 11px y valor DM Mono 17px; el Total, 22px."""
    return f'''<div class="ob ob-cifras">
  <div class="ob-cifras__fila"><div><span>Capital</span><b>{pesos(CAPITAL)}</b></div><div><span>Intereses</span><b>{pesos(INTERES)}</b></div><div class="ob-cifras__total"><span>Total</span><b>{pesos(TOTAL)}</b></div></div>
  <div class="ob-cifras__serie">{ic("check")}Tasa Activa Banco Nación · serie al 20/10/2026</div>
</div>'''


D = f'''        <div class="nx-chat ob-escala ob-recede-b">
          <div class="ob ob-burbuja" data-desde=".03">Liquidá capital de $ 1.500.000 con intereses desde el 14/08/2025</div>
          <div class="ob ob-pensando" data-estado="fuera" data-estados="oculto:0 f1:.07 f2:.15 f3:.23 fuera:.31">{orbe_grande(46, cls="is-busca")}<span class="ob-frase ob-frase--f1">Leyendo los datos de la planilla…</span><span class="ob-frase ob-frase--f2">Trayendo la serie de la tasa…</span><span class="ob-frase ob-frase--f3">Calculando los intereses por tramo…</span></div>
          <p class="ob ob-respuesta" data-desde=".32">Listo. Con capital {pesos(CAPITAL)} desde el 14/08/2025 hasta el 20/10/2026 a tasa activa del Banco Nación, los intereses son {pesos(INTERES)} y el total {pesos(TOTAL)}.</p>
          {liquidacion()}
        </div>
        <div class="nx-d__calc" data-estado="entra" data-estados="oculto:0 entra:.58">
          {cifras()}
          {tabla_tramos()}
        </div>'''

ESC_D = escena('cap-nexus-planilla', 'III · Planillas', 'La planilla, en una frase.', '',
               [('Decile capital y fecha.', 'Nexus trae la serie oficial de la tasa.'),
                ('Te la deja calculada.', 'Capital, período, tasa y total. La guardás en la causa.'),
                ('Tramo por tramo.', 'La calculadora completa, con la serie oficial.')],
               D, 380, 'nx-escena--d')


# ─────────────── IV · En el teléfono, con el pulgar ───────────────
def vidrio(contenido, cls='', extra=''):
    """VidrioNexus (nexus_a_mano.dart): blur 22, degradé blanco → crema,
    borde blanco 65 %, radio 24."""
    return f'<div class="ob ob-vidrio{(" " + cls) if cls else ""}"{extra}>{contenido}</div>'


def foto_acta(n, rot):
    """Una foto del acta: la hoja sobre la mesa (sin imágenes, en CSS)."""
    return f'<span class="ob-foto" style="--rot:{rot}deg" aria-hidden="true"><i></i></span>'


HOJAS = ''.join(
    f'<div class="ob-hoja" data-desde="{u}"><span class="ob-hoja__img">{foto_acta(i + 1, r)}</span>'
    f'<span class="ob-hoja__n">Hoja {i + 1}</span><span class="ob-hoja__x">{ic("x")}</span></div>'
    for i, (u, r) in enumerate([('.38', -3), ('.44', 2), ('.50', -1)]))

ADJ = f'''<div class="ob-adj" data-estado="leido" data-estados="subiendo:0 leyendo:.74 leido:.88"><span class="ob-tap__adj-ic">{orbe(15, True)}{ic("pdf")}</span><span><b>Acta de audiencia.pdf</b><small class="ob-adj1">Subiendo…</small><small class="ob-adj2">Nexus está leyendo 2/3 págs.</small><small class="ob-adj3">3 hojas</small></span></div>'''

TEL = f'''        <div class="nx-tel ob-escala">
          <div class="nx-tel__pantalla">
            <div class="nx-tel__fondo" aria-hidden="true">
              <div class="nx-tel__barra">← Expediente</div>
              <b class="nx-tel__car">PARTE ACTORA c/ PARTE DEMANDADA s/ Despido</b>
              <div class="nx-tel__chips"><span>2210/25</span><span>Juzgado Laboral N° 1</span></div>
              <div class="nx-tel__mov"><b>20/10/2026</b><span>Audiencia de conciliación</span></div>
              <div class="nx-tel__mov"><b>12/09/2026</b><span>Traslado de la demanda</span></div>
              <div class="nx-tel__mov"><b>14/08/2026</b><span>Promueve demanda</span></div>
            </div>

            {vidrio(f'''<div class="ob-escucha__fila">{orbe(40, True)}<div class="ob-escucha__txt"><b class="ob-escucha__t1">Te escucho…</b><b class="ob-escucha__t2">Pasando a texto…</b><span class="ob-escucha__s1">Soltá para preguntarle · ← deslizá para cancelar</span><span class="ob-escucha__s2">Ya se lo paso a Nexus.</span></div></div><div class="ob-escucha__onda"><span class="ob-barras"><i></i><i></i><i></i><i></i><i></i></span><span class="ob-escucha__reloj">0:04</span></div>''', "ob-escucha", ' data-estado="fuera" data-estados="oculto:0 escucha:.05 pasando:.22 fuera:.31"')}

            {vidrio(f'''<div class="ob-esc__cab"><span class="ob-esc__ic">{ic("scan")}</span><b>Unir en un PDF</b><span class="ob-esc__x">{ic("x")}</span></div><p class="ob-esc__sub">Ordenalas como van en el escrito: arrastrá para mover. Cada foto es una hoja.</p><div class="ob-esc__hojas">{HOJAS}<div class="ob-hoja ob-hoja--otra">{ic("camara")}<span>Otra hoja</span></div></div><div class="ob-esc__campo"><small>Nombre del PDF</small><span>{ic("pdf")}Acta de audiencia</span></div><span class="ob-btn ob-btn--lleno ob-esc__unir">{ic("unir")}Unir 3 hojas en un PDF</span>''', "ob-esc", ' data-estado="fuera" data-estados="oculto:0 entra:.34 unir:.6 fuera:.65"')}

            {vidrio(f'''<i class="ob-hojafuente__asa"></i><div class="ob-tap__cab">{orbe(26)}<b>Nexus</b><span class="ob-tap__conv">Conversación</span></div><div class="ob-tap__causa">{ic("folder")}<span>2210/25 · PARTE ACTORA C/ PARTE DEMANDADA</span><span class="ob-tap__x">{ic("x")}</span></div>{compositor("¿Qué se resolvió en la audiencia?", "Pedile algo sobre esta causa…", tipeo=".76 .88", estados="vacio:0 escribe:.75", estado="escribe", adj=ADJ)}<p class="ob-tap__tip">Tip: mantené apretado el orbe para hablarle sin abrir esto.</p>''', "ob-tap", ' data-estado="entra" data-estados="oculto:0 entra:.67"')}

            <div class="ob-flotante" data-estado="oculto" data-estados="quieto:0 aprieta:.05 quieto:.31 oculto:.34">{vidrio(orbe(32, True), "ob-flotante__vidrio")}<i class="ob-dedo"></i></div>
          </div>
        </div>'''

ESC_E = escena('cap-nexus-telefono', 'IV · En el teléfono', 'En el teléfono, con el pulgar.', '',
               [('Mantené apretado y hablale.', 'Soltás y se lo pasa a Nexus. Deslizá para cancelar.'),
                ('Sacale fotos al acta.', 'Las ordenás como van y se unen en un PDF.'),
                ('Nexus lo lee.', 'Y te contesta sobre la causa que tenés abierta.')],
               TEL, 380, 'nx-escena--e')


# ─────────────── Tu día: el Informe del día ───────────────
def paso_dia(n, titulo, motivo, boton, u):
    return (f'<div class="ob-dia__paso" data-desde="{u}"><span class="ob-dia__n">{n}</span>'
            f'<span class="ob-dia__txt"><b>{titulo}</b><small>{motivo}</small></span>{btn(boton, "borde")}</div>')


DIA = f'''        <div class="nx-dia ob-escala">
          <div class="ob ob-dia__seccion">{ic("chev")}<span class="ob-dia__sol">{ic("sol")}</span><b>Informe del día  ·  3</b></div>
          <div class="ob ob-dia" data-desde=".04">
            <div class="ob-dia__top">{orbe_grande(20)}<span class="ob-dia__nexus">Nexus</span><span class="ob-dia__fecha">martes 20 de octubre</span></div>
            <h3 class="ob-dia__hola" data-tipeo=".08 .2">Hola, Lucía.</h3>
            <p class="ob-dia__res" data-tipeo=".2 .4">Tenés 3 cosas para hoy: el traslado que vence, una audiencia el jueves y la planilla de PARTE ACTORA c/ PARTE DEMANDADA.</p>
            <span class="ob-dia__pp" data-desde=".42">Próximos pasos</span>
            {paso_dia(1, "Contestar traslado", "vence hoy", "Abrir en el editor", ".48")}
            {paso_dia(2, "Audiencia de conciliación", "jueves 23/10 a las 10:00", "Ver en la agenda", ".54")}
            {paso_dia(3, "Practicar planilla", "capital e intereses desde el 14/08/2025", "Hacer la planilla", ".6")}
            <div class="ob-dia__pie" data-desde=".64"><span>Actualizado a las 08:12</span><span class="ob-btn ob-btn--texto">Actualizar</span></div>
          </div>
        </div>'''

ESC_F = escena('cap-nexus-dia', 'Tu día', 'Abrís Iudex y ya sabés qué toca.', '',
               [('Nexus repasa tus causas.', 'Vencimientos, audiencias y lo que quedó pendiente.'),
                ('Te arma el día.', 'Un resumen corto y los próximos pasos.'),
                ('Un toque y empezás.', 'Cada paso abre lo que hace falta.')],
               DIA, 300, 'nx-escena--f')

# ─────────────── V · La base: «El expediente, en orden.» ───────────────
# Los seis capítulos de antes, como seis objetos chicos con su animación en
# bucle (corre sólo mientras se ven; nexus-escena.js pone `is-visible`).
def qr():
    """Un QR de muestra: tres esquinas y puntos fijos (no lleva a nada)."""
    import random
    r = random.Random(7)
    cel = []
    for y in range(21):
        for x in range(21):
            esquina = (x < 8 and y < 8) or (x > 12 and y < 8) or (x < 8 and y > 12)
            if not esquina and r.random() < 0.45:
                cel.append(f'M{x} {y}h1v1h-1z')
    fin = ''.join(f'M{x} {y}h7v7h-7zM{x+1} {y+1}v5h5v-5zM{x+2} {y+2}h3v3h-3z' for x, y in ((0, 0), (14, 0), (0, 14)))
    return f'<svg class="ob-qr" viewBox="0 0 21 21" shape-rendering="crispEdges" aria-hidden="true"><path fill-rule="evenodd" d="{fin}{"".join(cel)}"/></svg>'


def item(etiqueta, titulo, texto, objeto, i):
    return f'''<article class="nx-grilla__item" style="--i:{i}">
      <div class="nx-grilla__obj">{objeto}</div>
      <span class="c-caption">{etiqueta}</span>
      <h3 class="nx-grilla__t">{titulo}</h3>
      <p class="nx-grilla__p">{texto}</p>
    </article>'''


MOV = f'''<div class="ob ob-mini ob-mov">
  <div class="ob-mov__add"><span class="ob-mov__mas">{ic("plus")}</span><span class="ob-mov__in"><b class="ob-mov__tipeo">12/09 Sentencia</b><i class="ob-caret-m"></i></span><span class="ob-mov__enter">Enter</span></div>
  <div class="ob-mov__card ob-mov__card--nuevo"><span class="ob-mov__top"><b class="ob-mono">12/09/2026</b><span class="ob-mov__kind">Sentencia ▾</span></span><b class="ob-mov__t">Sentencia de trance y remate</b><span class="ob-mov__acts"><span>Subir archivo</span><span class="is-oro">Nuevo escrito</span><span>Hacer cédula</span></span></div>
  <div class="ob-mov__card"><span class="ob-mov__top"><b class="ob-mono">14/08/2026</b><span class="ob-mov__kind">Escrito ▾</span></span><b class="ob-mov__t">Promueve ejecución de honorarios</b></div>
</div>'''

FORUM = f'''<div class="ob ob-mini ob-forum">
  <div class="ob-forum__file"><span class="ob-forum__xls">XLSX</span><span class="ob-forum__nom"><b>notificaciones-19-09.xlsx</b><span class="ob-forum__bar"><i></i></span></span><em>3 causas</em></div>
  {''.join(f'<div class="ob-forum__fila" style="--i:{i}"><span class="ob-forum__ok">{ic("check")}</span><span class="ob-forum__c"><b class="ob-mono">{n}</b> PARTE ACTORA c/ PARTE DEMANDADA</span><span class="ob-forum__tag">Notificación</span></div>' for i, n in enumerate(['48583/12', '2210/25', '87/24']))}
</div>'''

PDF = f'''<div class="ob ob-mini ob-datos">
  <div class="ob-datos__leido">{orbe(14, True)}Leído por Nexus del PDF — revisalo</div>
  {''.join(f'<div class="ob-datos__f" style="--i:{i}"><small>{k}</small><span>{v}</span><i class="ob-datos__ok{" ob-datos__ok--guia" if g else ""}">{ic("check")}</i></div>' for i, (k, v, g) in enumerate([("Número de expediente", "48583/12", False), ("Carátula", "PARTE ACTORA c/ PARTE DEMANDADA s/ Ejecución de honorarios", False), ("Juzgado donde tramita", "Juzgado Civil y Comercial N° 4", True), ("Secretaría", "Secretaría N° 8", True)]))}
  <div class="ob-datos__guia">Verificado con la Guía Judicial</div>
</div>'''

ESCRITO = '''<div class="ob ob-mini ob-escr">
  <div class="ob-escr__barra"><span class="ob-escr__btn is-on">Plantilla ▾</span><span class="ob-escr__btn">Firmar</span><span class="ob-escr__btn">A4 ▾</span></div>
  <div class="ob-escr__menu"><span>Contesta demanda</span><span class="is-pick">Contesta traslado</span><span>Ofrece prueba</span><span>Practica planilla</span></div>
  <div class="ob-escr__hoja"><b>CONTESTA TRASLADO</b><p>Señora Jueza:</p><p><mark>Lucía Ferreyra</mark>, abogada, en autos <mark>«PARTE ACTORA c/ PARTE DEMANDADA s/ Ejecución de honorarios»</mark>, Expte. N° <mark>48583/12</mark>, a V.S. digo:</p><i class="ob-escr__sk"></i><i class="ob-escr__sk" style="width:62%"></i><span class="ob-escr__firma">Firmado electrónicamente por<br><b>Lucía Ferreyra</b></span></div>
</div>'''

CEDULA = f'''<div class="ob ob-mini ob-ced">
  <div class="ob-ced__pasos"><span style="--i:0"><i>1</i>Resolución</span><b></b><span style="--i:1"><i>2</i>Encabezado</span><b></b><span style="--i:2"><i>3</i>Notificación</span></div>
  <div class="ob-ced__hoja">
    <div class="ob-ced__txt"><small>Cédula de notificación</small><b>Traslado de la demanda por cinco días</b><span>PARTE DEMANDADA · San Juan 1120 · Real</span><span class="ob-ced__copias">{ic("pdf")}Demanda.pdf · Documental (12 fs).pdf</span></div>
    {qr()}
  </div>
</div>'''

PLANI = f'''<div class="ob ob-mini ob-plani">
  <div class="ob-plani__tiles"><div><small>Capital</small><b>$ 1.250.000,50</b></div><div><small>Intereses</small><b>$ 718.916,54</b></div><div class="is-total"><small>Total</small><b>$ 1.968.917,04</b></div></div>
  <div class="ob-cifras__serie">{ic("check")}Tasa Activa Banco Nación · serie al 19/09/2026</div>
  <span class="ob-btn ob-btn--lleno ob-plani__gen">{ic("pdf")}Generar planilla + escrito</span>
  <div class="ob-plani__toast">{ic("check")}Planilla y escrito guardados en el movimiento</div>
</div>'''

GRILLA = f'''<section class="nx-grilla" id="en-orden" aria-labelledby="en-orden-t">
  <div class="nx-grilla__cab">
    <span class="c-eyebrow">V · La base</span>
    <h2 id="en-orden-t" class="c-display nx-escena__t">El expediente, en orden.</h2>
    <p class="nx-escena__sub">Lo de todos los días, cada cosa en su causa. Sobre esto trabaja Nexus.</p>
  </div>
  <div class="nx-grilla__lista">
    {item("Movimientos", "La causa, por momentos.", "«12/09 Sentencia» y Enter. Cada movimiento con sus archivos y sus funciones.", MOV, 0)}
    {item("ForumNA", "Las notificaciones, en orden.", "Subís el listado y en cada causa queda el movimiento y la tarea.", FORUM, 1)}
    {item("Desde el PDF", "Los datos, en un click.", "Nexus lee número, carátula, partes y juzgado. Verificado con la Guía Judicial.", PDF, 2)}
    {item("Escrito", "El escrito, desde tus plantillas.", "Carátula, juzgado y partes ya vienen puestos. Firmado al pie.", ESCRITO, 3)}
    {item("Cédula", "La cédula, en tres pasos.", "Resolución, encabezado y notificación. Las copias, en tu Drive y con QR.", CEDULA, 4)}
    {item("Planilla", "La planilla, con las tasas de hoy.", "Planilla y escrito «Practica planilla», listos para presentar.", PLANI, 5)}
  </div>
</section>'''

ESCENAS = '\n\n'.join([ESC_A, ESC_B, ESC_C, ESC_D, ESC_E, ESC_F])


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
    html = poner(html, 'nexus:grilla', GRILLA)
    open(ruta, 'w', encoding='utf-8').write(html)
    print('ok')
