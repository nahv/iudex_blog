# -*- coding: utf-8 -*-
"""Genera el HTML de los capítulos y de la ventana del hero, con mocks que
siguen la estructura real del CRM (verificada en app.iudex.localhost el
2026-09-20): ficha flotante EXPEDIENTE, página Tus causas + diálogo ForumNA,
diálogo Datos del expediente, página de tarea con el editor, diálogo Hacer
cédula (3 pasos) y Calculadora."""

CAR = 'PARTE ACTORA c/ PARTE DEMANDADA s/ Ejecución de honorarios'
CUR = '<svg class="ml-cursor" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l14 9-6 1.5L16 20l-2.5 1-3-6.5L6 18z" fill="#0f0f0e" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>'

def rail(on='expedientes'):
    items = [('inicio','Inicio'),('agenda','Agenda'),('expedientes','Expedientes'),('calculadora','Calculadora'),('tareas','Plantillas'),('nexus','Nexus'),('clientes','Clientes')]
    r = ['<div class="app__rail">','<div class="app__brand">Iudex</div>','<div class="app__studio">Estudio Vallejos</div>']
    for k,l in items:
        r.append(f'<div class="app__nav app__nav--{k}{" is-on" if k==on else ""}"><i></i>{l}</div>')
    r.append('</div>')
    return '\n'.join(r)

def ico(name, gold=False):
    return f'<span class="ml-ib{" ml-ib--gold" if gold else ""}"><i class="ml-ic ml-ic--{name}"></i></span>'

def mov_card(fecha, kind, titulo, texto=None, extra_cls='', archivos=None, pendiente=None):
    files = ''.join(f'<span class="ml-file-chip"><i class="ml-ic ml-ic--pdf"></i>{f}</span>' for f in (archivos or []))
    pend = f'<span class="app__tag app__tag--gold">{pendiente}</span>' if pendiente else ''
    p = f'<p>{texto}</p>' if texto else ''
    return f'''<div class="ml-mov {extra_cls}"><i></i>
  <div class="ml-mov__card">
    <div class="ml-mov__top"><b>{fecha}</b><span class="ml-kind"><i class="ml-ic ml-ic--gavel"></i>{kind} ▾</span><span class="ml-mov__title">{titulo}</span><em class="ml-edit">✎</em>{pend}<u class="ml-more">⋯</u></div>
    {p}
    <div class="ml-mov__foot">
      <div class="ml-mov__grp"><small>Archivos</small><div class="ml-acts">{files}<span class="ml-act">{ico("pdf")}Subir archivo</span><span class="ml-act ml-act--nuevo">{ico("doc", True)}Nuevo escrito</span><span class="ml-act">{ico("mic")}Nota de voz</span></div></div>
      <div class="ml-mov__grp"><small>Acciones</small><div class="ml-acts"><span class="ml-act ml-act--cedula">{ico("ced")}Hacer cédula</span><span class="ml-act ml-act--planilla">{ico("calc")}Practicar planilla</span></div></div>
    </div>
  </div>
</div>'''

def ficha(extra_mov='', archivos_res=None, count='2', add_hint=True, ultimo='Último: 12/09/2026 · 0 tareas abiertas · 0 archivos'):
    hint = '<u class="ml-hint">Nuevo movimiento… (Enter)</u>' if add_hint else ''
    return f'''<div class="ml-ficha">
  <div class="ml-ficha__bar"><span><i class="ml-ic ml-ic--folder"></i>EXPEDIENTE</span><span class="ml-ficha__win"><i>–</i><i>⤢</i><i>×</i></span></div>
  <div class="ml-ficha__body">
    <div class="ml-ficha__head">
      <h4 class="app__title">{CAR} <em class="ml-edit">✎</em></h4>
      <div class="ml-chips"><span>48583/12</span><span>Juzgado Civil y Comercial N° 4</span><span>Secretaría N° 8</span><span class="ml-chips__add">+ Juez/a</span><span>Civil y Comercial</span></div>
    </div>
    <div class="ml-ficha__cols">
      <div class="ml-ficha__main">
        <div class="ml-sec">Movimientos <b>· {count}</b></div>
        <div class="ml-sub">{ultimo}</div>
        <div class="app__add ml-add"><i>+</i><span><em class="ml-typed"></em><span class="app__caret"></span>{hint}</span><u>→</u></div>
        <div class="ml-sub ml-sub--hint">Con fecha adelante si no es de hoy. Ej. 28/02 Sentencia</div>
        <div class="ml-mes">SEPTIEMBRE 2026</div>
        <div class="ml-time">
          {extra_mov}
          {mov_card('12/09/2026','Resolución','Traslado de la demanda por cinco días', archivos=archivos_res)}
          <div class="ml-mes ml-mes--in">AGOSTO 2026</div>
          {mov_card('14/08/2026','Escrito','Promueve ejecución de honorarios')}
        </div>
      </div>
      <aside class="ml-ficha__side">
        <div class="ml-sec">Clientes</div>
        <div class="ml-side__link"><i class="ml-ic ml-ic--user"></i>Sumá el primer cliente de esta causa</div>
        <div class="ml-sec">En la causa · sin movimiento</div>
        <div class="ml-sub">Lo que no es de un movimiento en particular. Arrastrá acá (o a un movimiento) para mover archivos y tareas.</div>
        <div class="ml-side__box"><small>Archivos</small><div class="ml-acts">{ico("pdf")}{ico("doc", True)}{ico("mic")}</div><span>Arrastrá archivos a cualquier parte de esta columna, o tocá «Subir archivo».</span></div>
      </aside>
    </div>
  </div>
</div>'''

def window(inner, on='expedientes', label='', extra_cls=''):
    return f'''<div class="c-window ml-window {extra_cls}" role="img" aria-label="{label}">
  <div class="app">
    {rail(on)}
    <div class="app__main">
      {inner}
      {CUR}
    </div>
  </div>
</div>'''

def chapter(cid, num, eyebrow, title, beats, inner, on, label):
    bts = '\n'.join(f'<div class="c-chapter__beat" data-beat="{i}"><p>{b}</p></div>' for i,b in enumerate(beats))
    return f'''<section class="c-chapter" id="{cid}" data-chapter="{num}" data-live aria-labelledby="{cid}-t">
  <div class="c-chapter__sticky">
    <div class="c-chapter__copy">
      <span class="c-chapter__rail" aria-hidden="true"><span class="c-chapter__rail-fill"></span></span>
      <span class="c-eyebrow">{eyebrow}</span>
      <h2 id="{cid}-t" class="c-display">{title}</h2>
      <div class="c-chapter__beats">
{bts}
      </div>
    </div>
    <div class="c-chapter__stage">
{window(inner, on, label)}
    </div>
  </div>
</section>
'''

# ───────────────── Hero (ventana del frente) ─────────────────
EDITOR = f'''<div class="ml-tarea">
  <div class="ml-tarea__head"><span class="ml-back">←</span><b class="ml-tarea__title">Nuevo escrito</b><span class="ml-sub">Enter guarda · Esc cancela</span></div>
  <div class="ml-chips ml-chips--tarea"><span>Por hacer</span><span><i class="ml-ic ml-ic--cal"></i>Poner fecha…</span><span>prioridad: normal ▾</span><span><i class="ml-ic ml-ic--folder"></i>48583/12 {CAR[:34]}…</span><span>Abrir expediente</span><span class="ml-chips__on"><i class="ml-ic ml-ic--ok"></i>Marcar hecha</span></div>
  <div class="ml-tarea__cols">
    <div class="ml-tarea__docs"><div class="ml-sec">Documentos</div><div class="ml-drop"><i class="ml-ic ml-ic--pdf"></i>Arrastrá los PDFs o fotos de la causa acá, o hacé click para elegirlos.</div><div class="ml-sec">De la causa</div><div class="ml-sub">Los documentos que cargues en la ficha de la causa aparecen acá.</div></div>
    <div class="ml-tarea__editor">
      <div class="ml-tabs"><span>☰ Tarea</span><span class="is-on">✎ Escrito</span></div>
      <div class="ml-toolbar"><span>↶</span><span>↷</span><b>B</b><i>I</i><u>U</u><span>☰</span><span>≡</span><span>❞</span><span class="ml-toolbar__sep"></span><span class="ml-btn">A4 ▾</span><span class="ml-btn">Márgenes · Normal ▾</span><span class="ml-btn">Ajustar</span><span class="ml-btn ml-tpl-btn"><i class="ml-ic ml-ic--tpl"></i>Plantilla</span><span class="ml-btn ml-firma-btn"><i class="ml-ic ml-ic--pen"></i>Firmar</span>
        <div class="ml-menu"><div>Contesta demanda</div><div class="ml-menu__pick">Contesta traslado</div><div>Interpone recurso de apelación</div><div>Ofrece prueba</div><div>Practica planilla</div></div>
      </div>
      <div class="ml-ruler"></div>
      <div class="ml-page">
        <span class="ml-page__caret"></span>
        <div class="ml-t ml-sheet__h">CONTESTA TRASLADO</div>
        <div class="ml-t ml-sheet__l">Señora Jueza:</div>
        <div class="ml-t ml-sheet__p"><mark>Lucía Ferreyra</mark>, abogada, <mark>M.P. 5.812</mark>, en autos <mark>«{CAR}», Expte. N° 48583/12</mark>, que tramita ante el <mark>Juzgado Civil y Comercial N° 4, Secretaría N° 8</mark>, a V.S. digo:</div>
        <div class="ml-t ml-sheet__p">Que vengo en tiempo y forma a contestar el traslado conferido por resolución del <mark>12/09/2026</mark>…</div>
        <div class="ml-t ml-sheet__p ml-sheet__p--sk"></div>
        <div class="ml-t ml-sheet__p ml-sheet__p--sk" style="width:58%"></div>
        <div class="ml-t ml-sheet__sign"><b>Firmado electrónicamente por: Lucía Ferreyra</b><span>M.P. 5.812 · CUIT 27-31XXXXXX-4</span></div>
      </div>
      <div class="ml-tarea__foot"><span class="ml-sub">Guardado</span><span class="ml-btn ml-btn--gold ml-export"><i class="ml-ic ml-ic--down"></i>Exportar ▾</span></div>
    </div>
    <div class="ml-tarea__comments"><div class="ml-sec">Comentarios</div><div class="ml-side__box ml-side__box--note">Acá quedan tus notas y avances sobre la tarea. El chat con otras personas del estudio (asignar, comentar, notas de voz entre colegas) viene con los planes de Estudio.</div></div>
  </div>
</div>'''

HERO = f'''      <!-- La ventana del frente cuenta el trabajo de todos los días, sola:
           la ficha de la causa con sus movimientos, «Nuevo escrito» sobre el
           último, la página de la tarea con el editor y una plantilla que
           deja el escrito armado con carátula, juzgado y firma. Los mocks
           siguen la estructura real del CRM. main.js avanza `data-step`. -->
      <div class="c-window c-window--front" role="img" aria-label="Iudex: la ficha de una causa con sus movimientos; sobre el último se elige «Nuevo escrito», se abre el editor y una plantilla deja el escrito armado con carátula, juzgado y firma.">
        <div class="hx" data-step="0">
          <div class="app">
            {rail('expedientes')}
            <div class="app__main hx__main">
              <div class="hx__ficha">{ficha()}</div>
              <div class="hx__editor">{EDITOR}</div>
              <svg class="hx__cursor" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l14 9-6 1.5L16 20l-2.5 1-3-6.5L6 18z" fill="#0f0f0e" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>
            </div>
          </div>
        </div>
      </div>
'''

# ───────────────── Capítulos ─────────────────
CH = []
CH.append('''<!-- ===========================================================
     CHAPTER BREADCRUMB — above-fold roadmap
     =========================================================== -->
<nav class="c-chapter-strip" aria-label="Capítulos">
  <ol class="c-chapter-strip__list">
    <li><a href="#cap-movimientos">Movimientos</a></li>
    <li><a href="#cap-forumna">ForumNA</a></li>
    <li><a href="#cap-pdf">Desde el PDF</a></li>
    <li><a href="#cap-escrito">Escrito</a></li>
    <li><a href="#cap-cedula">Cédula</a></li>
    <li><a href="#cap-planilla">Planilla</a></li>
  </ol>
</nav>
''')

# I · Movimientos
nuevo = mov_card('12/09/2026','Sentencia','Sentencia de trance y remate','Corrientes, 12 de septiembre de 2026. Y VISTOS… RESUELVO: mandar llevar adelante la ejecución…', extra_cls='ml-mov--new')
CH.append(chapter('cap-movimientos', 1, 'I · Movimientos', 'La causa,<br/>por momentos.',
    ['Lo que pasó en el juzgado, con fecha.', '«12/09 Sentencia» y Enter.', 'Los archivos y las tareas cuelgan de su movimiento.'],
    ficha(extra_mov=nuevo, count='3'), 'expedientes',
    'La ficha de una causa en Iudex: la carátula, los chips de juzgado y secretaría, la fila «Nuevo movimiento… (Enter)» y la línea de movimientos con fecha, cada uno con sus archivos y acciones.'))

# II · ForumNA
def causa_row(obj, sub, notif=True, i=0):
    tag = '<span class="ml-notif"><i class="ml-ic ml-ic--bell"></i>Notificación · 19/09</span>' if notif else '<span class="app__tag">activo</span>'
    return f'<div class="app__row ml-causa" style="--i:{i}"><b>PARTE ACTORA c/ PARTE DEMANDADA s/ {obj}<span class="app__row-sub">{sub}</span></b>{tag}</div>'
CAUSAS = f'''<div class="app__head"><h4 class="app__title">Tus causas</h4><span class="ml-btn ml-forum-btn"><i class="ml-ic ml-ic--bell"></i>Notificaciones de ForumNA</span></div>
<div class="app__add ml-add"><i class="ml-ic ml-ic--folder"></i><span><u class="ml-hint">Nueva causa… número y carátula, tal como salen de mesa (Enter)</u></span><u>→</u></div>
<div class="ml-search"><i class="ml-ic ml-ic--search"></i>Buscar por número, carátula, juzgado o parte</div>
<div class="ml-chips ml-chips--filtro"><span>Juzgado Civil y Comercial N° 4</span><span>Juzgado del Trabajo N° 1</span><span>Juzgado de Familia N° 1</span></div>
<div class="app__rows ml-causas">
{causa_row('Ejecución de honorarios','48583/12 · Juzgado Civil y Comercial N° 4 · Civil y Comercial', True, 0)}
{causa_row('Accidente Ley 24.557','31207/24 · Juzgado del Trabajo N° 1 · Laboral', True, 1)}
{causa_row('Alimentos','20115/25 · Juzgado de Familia N° 1 · Familia', False, 2)}
{causa_row('Amparo','7720/26 · Cámara Contencioso Administrativo', True, 3)}
</div>
<div class="ml-scrim"></div>
<div class="ml-dialog ml-forum">
  <div class="ml-dialog__title"><i class="ml-ic ml-ic--bell"></i>Notificaciones de ForumNA</div>
  <div class="ml-steps">
    <div class="ml-step" style="--i:0"><i class="ml-ic ml-ic--down"></i><div><b>1 · Bajá el listado de ForumNA</b><span>Notificaciones automáticas → exportar (xlsx).</span></div><em class="ml-check"></em></div>
    <div class="ml-step" style="--i:1"><i class="ml-ic ml-ic--link"></i><div><b>2 · Iudex lo cruza con tus causas</b><span>Por número de expediente. Las que falten se pueden crear en el mismo paso.</span></div><em class="ml-check"></em></div>
    <div class="ml-step" style="--i:2"><i class="ml-ic ml-ic--ok"></i><div><b>3 · Queda el movimiento y la tarea</b><span>En cada causa: movimiento «Notificación» + tarea «Cargar notificación».</span></div><em class="ml-check"></em></div>
  </div>
  <div class="ml-file"><i class="ml-ic ml-ic--xlsx"></i>notificaciones-19-09.xlsx<span class="ml-file__bar"><span></span></span><b>3 causas</b></div>
  <div class="ml-dialog__foot"><span class="ml-btn ml-btn--gold ml-elegir"><i class="ml-ic ml-ic--up"></i>Elegir el archivo…</span><span class="ml-link">Cancelar</span></div>
</div>'''
CH.append(chapter('cap-forumna', 2, 'II · ForumNA', 'Las notificaciones,<br/>en orden.',
    ['Bajás el listado de ForumNA. Un xlsx.', 'Iudex lo cruza con tus causas por número.', 'En cada una queda el movimiento y la tarea.'],
    CAUSAS, 'expedientes',
    'Notificaciones de ForumNA en Iudex: desde «Tus causas» se sube el listado, se cruza con las causas y en cada una queda un movimiento y una tarea.'))

# III · Datos del expediente desde el PDF
DATOS = f'''{ficha(archivos_res=['Resolución.pdf'], ultimo='Último: 12/09/2026 · 0 tareas abiertas · 1 archivo')}
<div class="ml-scrim"></div>
<div class="ml-dialog ml-datos">
  <div class="ml-dialog__title"><i class="ml-ic ml-ic--folder"></i>Datos del expediente</div>
  <div class="ml-leido"><i class="ml-ic ml-ic--nexus"></i>Leído por Nexus del PDF — revisalo</div>
  <div class="ml-fields ml-fields--2">
    <div class="ml-field" data-f="exp"><label>Número de expediente</label><div>48583/12</div><em class="ml-check"></em></div>
    <div class="ml-field" data-f="fuero"><label>Fuero</label><div>Civil y Comercial</div><em class="ml-check"></em></div>
    <div class="ml-field ml-field--wide" data-f="caratula"><label>Carátula</label><div>{CAR}</div><em class="ml-check"></em></div>
    <div class="ml-field" data-f="actora"><label>Parte actora</label><div>PARTE ACTORA</div><em class="ml-check"></em></div>
    <div class="ml-field" data-f="demandada"><label>Parte demandada</label><div>PARTE DEMANDADA</div><em class="ml-check"></em></div>
    <div class="ml-field ml-field--wide" data-f="juzgado"><label>Juzgado donde tramita</label><div>Juzgado Civil y Comercial N° 4 · Corrientes</div><em class="ml-check ml-check--guia"></em></div>
    <div class="ml-field" data-f="secretaria"><label>Secretaría</label><div>Secretaría N° 8</div><em class="ml-check ml-check--guia"></em></div>
    <div class="ml-field" data-f="juez"><label>Juez/a</label><div>Dra. María Laura Gómez</div><em class="ml-check ml-check--guia"></em></div>
  </div>
  <div class="ml-guia"><i class="ml-ic ml-ic--shield"></i>Guía Judicial: 9 de Julio N° 1099 – 2° piso, Capital · Tel. (379) 4104011</div>
  <div class="ml-dialog__foot"><span class="ml-link">Cancelar</span><span class="ml-btn ml-btn--ink ml-guardar">Guardar</span></div>
</div>'''
CH.append(chapter('cap-pdf', 3, 'III · Desde el PDF', 'Los datos,<br/>en un click.',
    ['Subís la resolución al movimiento.', 'Nexus lee número, carátula, partes, juzgado.', 'Verificado con la Guía Judicial oficial.'],
    DATOS, 'expedientes',
    'Datos del expediente en Iudex: se sube la resolución al movimiento, Nexus la lee y el diálogo queda con número, carátula, partes, juzgado, secretaría y juez, verificados contra la Guía Judicial.'))

CH.append('''<section class="c-interstitial c-interstitial--air">
  <h3 class="c-display">Organizá en cada movimiento<br/>lo que hay que hacer.</h3>
</section>
''')

# IV · Escrito
CH.append(chapter('cap-escrito', 4, 'IV · Escrito', 'El escrito,<br/>desde la plantilla.',
    ['Elegís la plantilla.', 'Carátula, juzgado y partes ya vienen puestos.', 'Firmado al pie. Listo para exportar.'],
    EDITOR, 'agenda',
    'Nuevo escrito en Iudex: la página de la tarea con el editor, el botón Plantilla que despliega los modelos del estudio, la hoja con los datos de la causa ya cargados y la firma electrónica al pie.'))

# V · Cédula
CEDULA = f'''<div class="ml-scrim is-on"></div>
<div class="ml-dialog ml-dialog--wide ml-ced is-on">
  <div class="ml-dialog__title">Hacer cédula · Traslado de la demanda por cinco días</div>
  <div class="ml-stepper">
    <span class="ml-stepper__s" data-s="1"><i>1</i>Resolución</span><span class="ml-stepper__line"></span>
    <span class="ml-stepper__s" data-s="2"><i>2</i>Encabezado</span><span class="ml-stepper__line"></span>
    <span class="ml-stepper__s" data-s="3"><i>3</i>Notificación</span>
  </div>
  <div class="ml-ced__panes">
    <div class="ml-ced__pane" data-s="1">
      <div class="ml-chips ml-chips--seg"><span class="is-on">✓ Cédula local</span><span>Cédula Ley 22172/3556</span><span>Contenido reservado</span></div>
      <div class="ml-sub">Notificación en la jurisdicción, con la resolución transcripta.</div>
      <div class="ml-sec">Resolución a notificar</div>
      <div class="ml-resbox"><span>Este movimiento no tiene la resolución en PDF. Subila y se transcribe sola; o pegá el texto más abajo.</span><span class="ml-btn ml-btn--gold"><i class="ml-ic ml-ic--up"></i>Subir la resolución</span></div>
      <div class="ml-sec">Transcripción de la resolución</div>
      <div class="ml-box ml-box--text"><em class="ml-typed ml-typed--multi">Corrientes, 12 de septiembre de 2026. Por presentado, parte y domicilio constituido. De la demanda de ejecución promovida córrase traslado a la PARTE DEMANDADA por el término de CINCO (5) DÍAS, bajo apercibimiento de ley. Notifíquese con copias.</em></div>
      <div class="ml-sub ml-ok-line"><em class="ml-check is-on"></em>Transcripción lista. Siguiente: el encabezado.</div>
    </div>
    <div class="ml-ced__pane" data-s="2">
      <div class="ml-sec">Encabezado</div>
      <div class="ml-fields ml-fields--2">
        <div class="ml-field"><label>N° de expediente</label><div>48583/12</div><em class="ml-check"></em></div>
        <div class="ml-field"><label>Carátula</label><div>{CAR}</div><em class="ml-check"></em></div>
        <div class="ml-field ml-field--wide"><label>Juzgado donde tramita</label><div>Juzgado Civil y Comercial N° 4</div><em class="ml-check ml-check--guia"></em></div>
        <div class="ml-field"><label>Secretaría (Dr./Dra.)</label><div>Secretaría N° 8</div><em class="ml-check"></em></div>
        <div class="ml-field"><label>Juez/a (Dr./Dra.)</label><div>Dra. María Laura Gómez</div><em class="ml-check ml-check--guia"></em></div>
      </div>
      <div class="ml-guia"><i class="ml-ic ml-ic--shield"></i>Guía Judicial: 9 de Julio N° 1099 – 2° piso, Capital · Tel. (379) 4104011 · jcivilycom4-capital@juscorrientes.gov.ar</div>
    </div>
    <div class="ml-ced__pane" data-s="3">
      <div class="ml-sec">Notificación</div>
      <div class="ml-fields ml-fields--2 ml-fields--fill">
        <div class="ml-field"><label>Destinatario/s</label><div>PARTE DEMANDADA</div></div>
        <div class="ml-field"><label>Localidad</label><div>Corrientes</div></div>
        <div class="ml-field ml-field--wide"><label>Domicilio</label><div>San Juan 1120</div></div>
      </div>
      <div class="ml-chips ml-chips--seg ml-chips--tight"><small>Carácter del domicilio</small><span class="is-on">Real</span><span>Fiscal</span><span>Procesal</span><span>Especial</span></div>
      <div class="ml-copias">
        <div class="ml-sec">Copias para traslado + QR</div>
        <div class="ml-copias__grid">
          <div class="ml-copias__files"><label><i class="ml-cb is-on"></i>Demanda.pdf</label><label><i class="ml-cb is-on"></i>Documental (12 fs).pdf</label><label><i class="ml-cb"></i>Poder.pdf</label><span class="ml-btn ml-drive-btn"><i class="ml-ic ml-ic--up"></i>Subir a Drive</span><div class="ml-file__bar ml-drive__bar"><span></span></div></div>
          <div class="ml-qr"><svg viewBox="0 0 21 21" aria-hidden="true" shape-rendering="crispEdges"><path fill="currentColor" d="M0 0h7v7H0zM1 1v5h5V1zM2 2h3v3H2zM14 0h7v7h-7zM15 1v5h5V1zM16 2h3v3h-3zM0 14h7v7H0zM1 15v5h5v-5zM2 16h3v3H2zM8 0h1v1H8zM10 0h1v2h-1zM12 0h1v1h-1zM8 2h2v1H8zM11 2h2v1h-2zM9 4h1v1H9zM11 4h1v2h-1zM8 6h1v1H8zM12 6h1v1h-1zM0 8h1v1H0zM2 8h2v1H2zM5 8h1v1H5zM8 8h2v1H8zM11 8h1v1h-1zM13 8h1v2h-1zM15 8h2v1h-2zM18 8h1v1h-1zM20 8h1v1h-1zM1 10h1v1H1zM3 10h1v1H3zM6 10h2v1H6zM9 10h1v2H9zM11 10h1v1h-1zM15 10h1v1h-1zM17 10h3v1h-3zM0 12h2v1H0zM4 12h1v1H4zM6 12h1v1H6zM8 12h1v1H8zM10 12h3v1h-3zM14 12h1v1h-1zM16 12h1v2h-1zM19 12h2v1h-2zM8 14h1v2H8zM10 14h1v1h-1zM12 14h2v1h-2zM15 14h1v1h-1zM18 14h1v1h-1zM20 14h1v1h-1zM9 16h2v1H9zM12 16h1v1h-1zM14 16h1v2h-1zM17 16h2v1h-2zM8 18h1v1H8zM10 18h1v1h-1zM12 18h1v2h-1zM16 18h1v1h-1zM19 18h2v1h-2zM9 20h2v1H9zM14 20h2v1h-2zM17 20h1v1h-1zM20 20h1v1h-1z"/></svg><small>La cédula lleva la URL pública y el QR de «Demanda.pdf».</small></div>
        </div>
      </div>
    </div>
  </div>
  <div class="ml-dialog__foot ml-ced__foot"><span class="ml-link">Cancelar</span><span class="ml-link ml-atras">‹ Atrás</span><span class="ml-btn ml-btn--ink"><span class="ml-ced__next">› Siguiente</span><span class="ml-ced__done"><i class="ml-ic ml-ic--doc"></i>Crear cédula</span></span></div>
</div>'''
CH.append(chapter('cap-cedula', 5, 'V · Cédula', 'La cédula,<br/>en tres pasos.',
    ['1 · La resolución, transcripta del PDF.', '2 · El encabezado, desde la causa y la Guía Judicial.', '3 · Copias para traslado en tu Drive. Link público y QR.'],
    ficha() + CEDULA, 'expedientes',
    'Hacer cédula en Iudex: paso 1 la resolución transcripta del PDF, paso 2 el encabezado con número, carátula, juzgado, secretaría y juez, paso 3 la notificación con las copias para traslado subidas a Drive, con URL pública y QR.'))

# VI · Planilla
PLANILLA = f'''<div class="app__head"><h4 class="app__title">Calculadora de tasas</h4><span class="ml-chip-mini"><i class="ml-ic ml-ic--folder"></i>48583/12 · {CAR[:30]}…</span></div>
<div class="ml-calc">
  <div class="ml-calc__form">
    <div class="app__field"><label>Capital</label><div>$ 1.250.000,50</div></div>
    <div class="app__pair"><div class="app__field"><label>Desde</label><div>14/02/2025 <i class="ml-ic ml-ic--cal"></i></div></div><div class="app__field"><label>Hasta</label><div>19/09/2026 <i class="ml-ic ml-ic--cal"></i></div></div></div>
    <div class="app__field"><label>Tasa de interés</label><div class="ml-select">Tasa Activa Banco Nación <b>▾</b></div></div>
    <div class="ml-serie"><i class="ml-ic ml-ic--ok"></i>Actualizada al 19/09/2026.</div>
    <div class="ml-sub"><b>Pagos parciales (opcional)</b> · Cada pago corta el interés: primero cancela lo devengado y el resto amortiza capital.</div>
    <span class="ml-link ml-link--add">+ Agregar pago</span>
    <span class="ml-btn ml-btn--ink ml-btn--block ml-calcular">Calcular</span>
  </div>
  <div class="ml-calc__out">
    <div class="ml-res">
      <div class="ml-tiles"><div><small>Capital</small><b>$ 1.250.000,50</b></div><div><small>Intereses</small><b>$ 718.916,54</b></div><div class="ml-tiles__total"><small>Total</small><b>$ 1.968.917,04</b></div></div>
      <div class="ml-serie"><i class="ml-ic ml-ic--ok"></i>Tasa Activa Banco Nación · serie al 19/09/2026</div>
      <div class="ml-res__btns"><span class="ml-btn ml-btn--ink ml-generar"><i class="ml-ic ml-ic--doc"></i>Generar planilla + escrito</span><span class="ml-btn ml-btn--line"><i class="ml-ic ml-ic--table"></i>Solo la planilla</span><span class="ml-btn ml-btn--line"><i class="ml-ic ml-ic--doc"></i>Solo el escrito</span></div>
    </div>
    <div class="ml-detalle">
      <div class="ml-sec">Detalle por período <b>· 365 tramo(s)</b></div>
      <div class="ml-table">
        <div class="ml-table__h"><span>Desde</span><span>Hasta</span><span>Días</span><span>Tasa %</span><span>Interés</span></div>
        <div class="ml-table__r ml-tramo" style="--i:0"><span>14/02/2025</span><span>16/02/2025</span><span>3</span><span>2,83</span><b>$ 3.543,75</b></div>
        <div class="ml-table__r ml-tramo" style="--i:1"><span>17/02/2025</span><span>17/02/2025</span><span>1</span><span>2,81</span><b>$ 1.170,83</b></div>
        <div class="ml-table__r ml-tramo" style="--i:2"><span>18/02/2025</span><span>18/02/2025</span><span>1</span><span>2,88</span><b>$ 1.199,17</b></div>
        <div class="ml-table__r ml-tramo" style="--i:3"><span>19/02/2025</span><span>19/02/2025</span><span>1</span><span>2,82</span><b>$ 1.176,25</b></div>
      </div>
    </div>
    <div class="ml-toast ml-toast--pla"><i class="ml-ic ml-ic--ok"></i>Planilla y escrito guardados en el movimiento</div>
  </div>
</div>'''
CH.append(chapter('cap-planilla', 6, 'VI · Planilla', 'La planilla,<br/>con las tasas de hoy.',
    ['Capital, fechas, tasa. Calcular.', 'Los tramos, con la serie oficial actualizada.', 'Planilla y escrito «Practica planilla», listos para presentar.'],
    PLANILLA, 'calculadora',
    'Practicar planilla desde el movimiento: la Calculadora con capital, fechas y la tasa activa del Banco Nación; el resultado con el detalle por período; y los botones para generar la planilla y el escrito.'))

CH.append('''<section class="c-interstitial c-interstitial--nexus">
  <h3 class="c-display">Y Nexus responde<br/>con la fuente al lado.</h3>
  <p><a href="investigacion/index.html" class="c-link">Ver Nexus →</a></p>
</section>
''')

import sys
open(sys.argv[1], 'w', encoding='utf-8').write('\n'.join(CH))
open(sys.argv[2], 'w', encoding='utf-8').write(HERO)
print('ok')
