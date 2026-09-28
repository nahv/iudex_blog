// Iudex Labs · formulario de NEA Tech 2026 (/neatech/).
//
// Una pregunta por pantalla, cinco pasos, sin fricción: un toque elige y
// avanza, Enter sigue, los números eligen en desktop. Mientras se responde,
// la ficha se arma al costado (desktop) o en una hoja que asoma (teléfono).
//
// Envío a Supabase (public.event_leads, sólo INSERT para anon). El Wi-Fi de
// un evento es malo: si no hay señal, el envío queda en una cola local y se
// reintenta solo. `client_id` lo genera el browser: un reintento que ya
// había entrado vuelve 409 y se da por enviado.
//
// Parámetros: ?s=qr (vino del QR) · ?modo=stand (tablet del stand: al
// terminar vuelve sola a la portada).

(() => {
  'use strict';

  const TOTAL = 5;
  const CLAVE_BORRADOR = 'iudex_neatech_borrador_v1';
  const CLAVE_COLA = 'iudex_neatech_cola_v1';
  const EVENTO = 'neatech-2026';

  const INDUSTRIAS = [
    { id: 'agro', txt: 'Agro y agroindustria' },
    { id: 'salud', txt: 'Salud' },
    { id: 'comercio', txt: 'Comercio' },
    { id: 'logistica', txt: 'Logística y transporte' },
    { id: 'industria', txt: 'Industria' },
    { id: 'gobierno', txt: 'Gobierno y municipios' },
    { id: 'educacion', txt: 'Educación' },
    { id: 'servicios', txt: 'Servicios profesionales' },
    { id: 'legal', txt: 'Legal y justicia' },
    { id: 'otra', txt: 'Otra' },
  ];

  const PROBLEMAS = {
    agro: ['Pedidos y entregas', 'Stock e insumos', 'Clientes y cobranzas', 'Trazabilidad y papeles', 'Reportes para decidir'],
    salud: ['Turnos y agenda', 'Historias y documentos', 'Seguimiento de pacientes', 'Obras sociales y facturación', 'Consultas por WhatsApp'],
    comercio: ['Clientes y ventas', 'Stock', 'Consultas por WhatsApp', 'Cobranzas', 'Reportes para decidir'],
    logistica: ['Seguimiento de envíos', 'Choferes y rutas', 'Documentación', 'Reclamos', 'Reportes para decidir'],
    industria: ['Órdenes de trabajo', 'Mantenimiento', 'Calidad y trazabilidad', 'Proveedores', 'Reportes para decidir'],
    gobierno: ['Expedientes y trámites', 'Reclamos de vecinos', 'Turnos', 'Seguimiento interno', 'Tableros de gestión'],
    educacion: ['Inscripciones', 'Comunicación con familias', 'Legajos', 'Seguimiento académico', 'Cobranzas'],
    servicios: ['Clientes y proyectos', 'Agenda', 'Documentos', 'Cobranzas', 'Seguimiento del equipo'],
    legal: ['Expedientes y plazos', 'Escritos', 'Notificaciones', 'Liquidaciones', 'Trabajo en equipo'],
    otra: ['Clientes y seguimiento', 'Documentos y papeles', 'Consultas por WhatsApp', 'Agenda y turnos', 'Reportes para decidir'],
  };

  // «Primer paso posible»: una idea para abrir la charla, por el primer
  // problema elegido. Reglas explícitas, no IA: la ficha dice lo que hace.
  const SUGERENCIAS = {
    'Pedidos y entregas': 'Un tablero de pedidos donde cada uno tiene dueño y estado, con aviso por WhatsApp cuando se atrasa.',
    'Stock e insumos': 'Stock en un solo lugar, con alertas de reposición y un resumen semanal automático.',
    'Clientes y cobranzas': 'Una ficha por cliente con su historial y un agente que avisa qué cobrar esta semana.',
    'Trazabilidad y papeles': 'Cada lote o trámite con su línea de tiempo y sus documentos, listos para mostrar en una auditoría.',
    'Reportes para decidir': 'Un tablero que se arma solo con lo que ya cargan, y un resumen semanal en lenguaje claro.',
    'Turnos y agenda': 'Agenda compartida con recordatorios automáticos y menos ausencias.',
    'Historias y documentos': 'Documentos ordenados por persona, con búsqueda y un agente que resume lo último.',
    'Seguimiento de pacientes': 'Una lista de seguimiento con próximos controles y avisos al equipo.',
    'Obras sociales y facturación': 'Estado de cada presentación en un solo lugar, con lo pendiente arriba.',
    'Consultas por WhatsApp': 'Cada consulta que entra por WhatsApp se vuelve un caso con responsable y estado.',
    'Clientes y ventas': 'Un CRM simple: cada cliente con su historial, próximos pasos y quién lo lleva.',
    'Stock': 'Stock en un solo lugar, con alertas de reposición y un resumen semanal automático.',
    'Cobranzas': 'Lo que hay que cobrar esta semana, con recordatorios y el historial de cada cuenta.',
    'Seguimiento de envíos': 'Cada envío con su estado en tiempo real y aviso automático cuando algo se demora.',
    'Choferes y rutas': 'La agenda de cada chofer y sus entregas, con el día cerrado en un toque.',
    'Documentación': 'Los papeles de cada operación juntos, con vencimientos que avisan solos.',
    'Reclamos': 'Cada reclamo como un caso con responsable, plazo y respuesta registrada.',
    'Órdenes de trabajo': 'Órdenes de trabajo con estado, responsable y plazos, visibles para todo el equipo.',
    'Mantenimiento': 'Mantenimiento preventivo agendado, con historial por equipo y avisos.',
    'Calidad y trazabilidad': 'Cada lote con su línea de tiempo, controles y documentos.',
    'Proveedores': 'Una ficha por proveedor con pedidos, plazos y cumplimiento.',
    'Expedientes y trámites': 'Cada trámite con su línea de tiempo, responsable y plazos, como hicimos en Iudex para los juzgados.',
    'Reclamos de vecinos': 'Cada reclamo como un caso con área responsable, plazo y respuesta al vecino.',
    'Turnos': 'Turnos online con recordatorios y agenda compartida entre áreas.',
    'Seguimiento interno': 'Pases entre áreas con estado visible y un resumen diario automático.',
    'Tableros de gestión': 'Indicadores que se arman solos con lo que ya se carga.',
    'Inscripciones': 'Inscripciones online con documentos y estado de cada legajo.',
    'Comunicación con familias': 'Avisos y respuestas ordenados por familia, con historial.',
    'Legajos': 'Legajos digitales con documentos, búsqueda y vencimientos.',
    'Seguimiento académico': 'Alertas tempranas por alumno y un resumen para cada docente.',
    'Clientes y proyectos': 'Cada cliente con sus proyectos, tareas y próximos pasos.',
    'Agenda': 'Agenda compartida con recordatorios y la semana del equipo a la vista.',
    'Documentos': 'Documentos por cliente, con plantillas y firma.',
    'Seguimiento del equipo': 'Quién tiene qué y para cuándo, sin preguntar por WhatsApp.',
    'Expedientes y plazos': 'Esto ya lo resuelve Iudex: te lo mostramos en el stand.',
    'Escritos': 'Esto ya lo resuelve Iudex: plantillas, firma y Nexus con fuentes.',
    'Notificaciones': 'Esto ya lo resuelve Iudex: el listado de ForumNA entra solo a cada causa.',
    'Liquidaciones': 'Esto ya lo resuelve Iudex: la planilla de intereses en un minuto.',
    'Trabajo en equipo': 'Esto ya lo resuelve Iudex: el estudio trabaja sobre la misma causa en tiempo real.',
    'Clientes y seguimiento': 'Un CRM simple: cada cliente con su historial, próximos pasos y quién lo lleva.',
    'Documentos y papeles': 'Los papeles de cada caso juntos, con búsqueda y vencimientos que avisan solos.',
    'Agenda y turnos': 'Agenda compartida con recordatorios automáticos.',
  };

  const TAMANOS = ['Sólo yo', '2 a 10', '11 a 50', '51 a 200', 'Más de 200'];

  // ---------------------------------------------------------------------
  // Estado
  // ---------------------------------------------------------------------

  const params = new URLSearchParams(location.search);
  const modoStand = params.get('modo') === 'stand';
  const origen = modoStand ? 'stand' : (params.get('s') === 'qr' ? 'qr' : 'web');

  const nuevoId = () =>
    (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    }));

  const vacio = () => ({
    client_id: nuevoId(),
    industria: null,
    industria_otra: '',
    problemas: [],
    problema: '',
    tamano: null,
    nombre: '',
    organizacion: '',
    contacto_tipo: 'whatsapp',
    contacto: '',
  });

  let datos = vacio();
  let paso = 0;

  const leer = (clave, def) => {
    try { const v = localStorage.getItem(clave); return v ? JSON.parse(v) : def; } catch { return def; }
  };
  const escribir = (clave, v) => {
    try { localStorage.setItem(clave, JSON.stringify(v)); } catch { /* modo privado: sin memoria, sigue andando */ }
  };
  const borrar = (clave) => { try { localStorage.removeItem(clave); } catch { /* idem */ } };

  // ---------------------------------------------------------------------
  // DOM
  // ---------------------------------------------------------------------

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const body = document.body;
  const form = $('#nt-form');
  const pasos = $$('.nt-paso', form);
  const linea = $('.nt-progreso__linea');
  const barra = $('.nt-progreso');
  const pasoActual = $('[data-paso-actual]');
  const ficha = $('[data-ficha]');

  const vibrar = () => { try { navigator.vibrate && navigator.vibrate(8); } catch { /* sin háptica */ } };
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Referencia corta de la ficha, como un número de expediente.
  $('[data-ficha-ref]').textContent = 'NT-' + datos.client_id.slice(0, 4).toUpperCase();

  // ---------------------------------------------------------------------
  // Opciones
  // ---------------------------------------------------------------------

  function opcionesUnaSola(contenedor, lista, alElegir) {
    contenedor.innerHTML = '';
    lista.forEach((op, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'nt-op';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', 'false');
      b.dataset.valor = op.id ?? op;
      const k = i === 9 ? '0' : String(i + 1);
      b.innerHTML = `<span class="nt-op__k" aria-hidden="true">${k}</span><span></span>`;
      b.lastChild.textContent = op.txt ?? op;
      b.dataset.tecla = k;
      b.addEventListener('click', () => alElegir(b.dataset.valor, true));
      contenedor.appendChild(b);
    });
  }

  function marcarUna(contenedor, valor) {
    $$('.nt-op', contenedor).forEach((b) => b.setAttribute('aria-checked', String(b.dataset.valor === valor)));
  }

  const cajaIndustria = $('[data-campo="industria"]');
  const cajaTamano = $('[data-campo="tamano"]');
  const cajaProblemas = $('[data-campo="problemas"]');
  const campoOtra = $('.nt-campo--otra');
  const inputOtra = $('#nt-industria-otra');

  opcionesUnaSola(cajaIndustria, INDUSTRIAS, (v, auto) => {
    datos.industria = v;
    marcarUna(cajaIndustria, v);
    vibrar();
    campoOtra.hidden = v !== 'otra';
    if (v !== 'otra') datos.industria_otra = '';
    // Cambiar de industria cambia las sugerencias: se conservan sólo las que
    // siguen existiendo.
    const validas = PROBLEMAS[v] || [];
    datos.problemas = datos.problemas.filter((p) => validas.includes(p));
    pintarChips();
    actualizar();
    if (v === 'otra') { inputOtra.focus(); return; }
    if (auto) setTimeout(() => ir(2), reducido ? 0 : 260);
  });

  opcionesUnaSola(cajaTamano, TAMANOS, (v, auto) => {
    datos.tamano = v;
    marcarUna(cajaTamano, v);
    vibrar();
    actualizar();
    if (auto) setTimeout(() => ir(4), reducido ? 0 : 260);
  });

  function pintarChips() {
    const lista = PROBLEMAS[datos.industria] || PROBLEMAS.otra;
    cajaProblemas.innerHTML = '';
    lista.forEach((p) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'nt-chip';
      b.textContent = p;
      b.setAttribute('aria-pressed', String(datos.problemas.includes(p)));
      b.addEventListener('click', () => {
        const i = datos.problemas.indexOf(p);
        if (i === -1) datos.problemas.push(p); else datos.problemas.splice(i, 1);
        b.setAttribute('aria-pressed', String(i === -1));
        vibrar();
        actualizar();
      });
      cajaProblemas.appendChild(b);
    });
    if (datos.industria === 'legal') {
      const nota = document.createElement('p');
      nota.className = 'nt-nota-legal';
      nota.textContent = 'Para estudios y juzgados ya existe Iudex. Igual contanos: lo vemos juntos.';
      cajaProblemas.appendChild(nota);
    }
  }

  // ---------------------------------------------------------------------
  // Campos de texto
  // ---------------------------------------------------------------------

  const inputProblema = $('#nt-problema');
  const inputNombre = $('#nt-nombre');
  const inputOrg = $('#nt-organizacion');
  const inputContacto = $('#nt-contacto');
  const labelContacto = $('[data-label-contacto]');
  const errorContacto = $('.nt-error');
  const segmento = $('.nt-segmento');

  inputOtra.addEventListener('input', () => { datos.industria_otra = inputOtra.value; actualizar(); });
  inputProblema.addEventListener('input', () => { datos.problema = inputProblema.value; actualizar(); });
  inputNombre.addEventListener('input', () => { datos.nombre = inputNombre.value; actualizar(); });
  inputOrg.addEventListener('input', () => { datos.organizacion = inputOrg.value; actualizar(); });
  inputContacto.addEventListener('input', () => {
    datos.contacto = inputContacto.value;
    inputContacto.removeAttribute('aria-invalid');
    errorContacto.hidden = true;
    actualizar();
  });

  function elegirMedio(medio) {
    datos.contacto_tipo = medio;
    segmento.dataset.medio = medio;
    $$('.nt-segmento__op').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.medio === medio)));
    const email = medio === 'email';
    labelContacto.textContent = email ? 'Tu email' : 'Tu WhatsApp';
    inputContacto.type = email ? 'email' : 'tel';
    inputContacto.inputMode = email ? 'email' : 'tel';
    inputContacto.autocomplete = email ? 'email' : 'tel';
    inputContacto.placeholder = email ? 'nombre@empresa.com' : '379 412 3456';
    inputContacto.removeAttribute('aria-invalid');
    errorContacto.hidden = true;
    actualizar();
  }
  $$('.nt-segmento__op').forEach((b) => b.addEventListener('click', () => {
    if (datos.contacto_tipo !== b.dataset.medio) {
      datos.contacto = '';
      inputContacto.value = '';
    }
    elegirMedio(b.dataset.medio);
    vibrar();
    inputContacto.focus();
  }));

  const soloDigitos = (s) => s.replace(/\D/g, '');
  const contactoValido = () => datos.contacto_tipo === 'email'
    ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(datos.contacto.trim())
    : soloDigitos(datos.contacto).length >= 8 && soloDigitos(datos.contacto).length <= 15;

  // ---------------------------------------------------------------------
  // Dictado (si el navegador lo tiene: Chrome en Android, Safari reciente)
  // ---------------------------------------------------------------------

  const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
  const botonMic = $('[data-accion="dictar"]');
  const cajaAvisoMic = $('.nt-aviso-mic');
  const avisoMic = (texto) => {
    cajaAvisoMic.textContent = texto;
    cajaAvisoMic.hidden = !texto;
  };
  if (Reconocimiento && botonMic) {
    botonMic.hidden = false;
    let rec = null;
    let base = '';
    const avisoPermiso = 'El navegador no dio permiso para el micrófono. Podés escribirlo acá.';
    botonMic.addEventListener('click', async () => {
      if (rec) { rec.stop(); return; }
      // Si el permiso ya está negado, se avisa sin intentar (Chrome y Edge
      // lo informan; Safari no tiene esta consulta y sigue de largo).
      try {
        const permiso = await navigator.permissions?.query({ name: 'microphone' });
        if (permiso?.state === 'denied') { avisoMic(avisoPermiso); return; }
      } catch { /* sin Permissions API: se intenta igual */ }
      rec = new Reconocimiento();
      rec.lang = 'es-AR';
      rec.interimResults = true;
      rec.continuous = true;
      base = inputProblema.value ? inputProblema.value.replace(/\s*$/, ' ') : '';
      let oyo = false;
      let fallo = false;
      rec.onresult = (e) => {
        oyo = true;
        avisoMic('');
        let texto = '';
        for (let i = 0; i < e.results.length; i++) texto += e.results[i][0].transcript;
        inputProblema.value = (base + texto).slice(0, 2000);
        datos.problema = inputProblema.value;
        actualizar();
      };
      const fin = () => {
        rec = null;
        botonMic.setAttribute('aria-pressed', 'false');
        $('.nt-mic__txt', botonMic).textContent = 'Dictar';
      };
      // Algunos navegadores (o el permiso bloqueado) cortan sin evento de
      // error: si terminó sin haber escuchado nada, también se avisa.
      rec.onend = () => {
        if (!oyo && !fallo) avisoMic('No pudimos escucharte. Revisá el permiso del micrófono o escribilo acá.');
        fin();
      };
      // Nunca falla callado (2026-09-28): si el navegador no deja usar el
      // micrófono o no escuchó nada, se dice y se ofrece escribir.
      rec.onerror = (e) => {
        fallo = true;
        avisoMic(({
          'not-allowed': avisoPermiso,
          'service-not-allowed': avisoPermiso,
          'no-speech': 'No escuchamos nada. Tocá «Dictar» y hablá cerca del teléfono.',
          'audio-capture': 'No encontramos un micrófono. Podés escribirlo acá.',
          'network': 'El dictado necesita conexión. Podés escribirlo acá.',
        })[e.error] || 'No pudimos usar el dictado. Podés escribirlo acá.');
        fin();
      };
      try {
        rec.start();
        botonMic.setAttribute('aria-pressed', 'true');
        $('.nt-mic__txt', botonMic).textContent = 'Escuchando…';
        vibrar();
      } catch {
        avisoMic('No pudimos usar el dictado en este navegador. Podés escribirlo acá.');
        fin();
      }
    });
  }

  // ---------------------------------------------------------------------
  // Validez por paso y ficha
  // ---------------------------------------------------------------------

  const valido = {
    1: () => !!datos.industria && (datos.industria !== 'otra' || datos.industria_otra.trim().length > 1),
    2: () => datos.problemas.length > 0 || datos.problema.trim().length > 3,
    3: () => !!datos.tamano,
    4: () => datos.nombre.trim().length > 1,
    5: () => contactoValido(),
  };

  const ultimoValores = {};
  function setDato(clave, texto) {
    const fila = $(`[data-dato="${clave}"]`, ficha);
    if (!fila) return;
    const dd = $('dd', fila);
    const nuevo = texto || '—';
    if (dd.textContent === nuevo) return;
    dd.textContent = nuevo;
    fila.classList.toggle('is-lleno', !!texto);
    if (texto && ultimoValores[clave] !== texto) {
      fila.classList.remove('is-nuevo');
      void fila.offsetWidth;
      fila.classList.add('is-nuevo');
    }
    ultimoValores[clave] = texto;
  }

  function textoIndustria() {
    if (!datos.industria) return '';
    if (datos.industria === 'otra') return datos.industria_otra.trim();
    return INDUSTRIAS.find((i) => i.id === datos.industria)?.txt ?? '';
  }

  function textoProblemas() {
    const partes = [...datos.problemas];
    const libre = datos.problema.trim();
    if (libre) partes.push(`«${libre.length > 110 ? libre.slice(0, 107) + '…' : libre}»`);
    return partes.join(' · ');
  }

  function textoQuien() {
    const quien = [datos.nombre.trim(), datos.organizacion.trim()].filter(Boolean).join(' · ');
    const medio = datos.contacto.trim() ? `${datos.contacto_tipo === 'email' ? 'Email' : 'WhatsApp'} ${datos.contacto.trim()}` : '';
    return [quien, medio].filter(Boolean).join('\n');
  }

  function sugerencia() {
    const p = datos.problemas[0];
    if (p && SUGERENCIAS[p]) return SUGERENCIAS[p];
    if (datos.problema.trim().length > 3) {
      return 'Un piloto chico sobre eso: una ficha por caso, estados claros y un agente que resume y avisa.';
    }
    return '';
  }

  let lleno = 0;
  function actualizar() {
    setDato('industria', textoIndustria());
    setDato('problemas', textoProblemas());
    setDato('tamano', datos.tamano ? `${datos.tamano} ${datos.tamano === 'Sólo yo' ? '' : 'personas'}`.trim() : '');
    setDato('quien', textoQuien());

    const sug = sugerencia();
    const cajaSug = $('[data-ficha-sugerencia]');
    cajaSug.hidden = !sug;
    $('[data-sugerencia-texto]').textContent = sug;

    const antes = lleno;
    lleno = [1, 2, 3, 4, 5].filter((n) => valido[n]()).length;
    $('[data-ficha-cuenta]').textContent = `${lleno} de ${TOTAL}`;
    if (lleno > antes) {
      ficha.classList.remove('is-latido');
      void ficha.offsetWidth;
      ficha.classList.add('is-latido');
    }

    // Botones «Seguir» / «Enviar» del paso visible.
    const sec = pasos[paso];
    const btn = sec && $('[data-accion="siguiente"], .nt-btn--enviar', sec);
    if (btn && valido[paso]) btn.disabled = !valido[paso]();

    guardarBorrador();
  }

  // ---------------------------------------------------------------------
  // Navegación
  // ---------------------------------------------------------------------

  function progreso(n) {
    const hechos = Math.min(n, TOTAL + 1) - 1;
    const p = n === 0 ? 0 : n > TOTAL ? 1 : Math.max(0.04, hechos / TOTAL);
    linea.style.setProperty('--p', p);
    barra.setAttribute('aria-valuenow', String(Math.max(0, Math.min(TOTAL, hechos))));
    pasoActual.textContent = String(Math.min(Math.max(n, 0), TOTAL)).padStart(2, '0');
  }

  function ir(n, { foco = true } = {}) {
    if (n < 0 || n > 6 || n === paso) return;
    const atras = n < paso;
    pasos.forEach((s) => { s.hidden = true; s.classList.remove('is-activo', 'is-entrando', 'is-atras'); });
    const sec = pasos[n];
    sec.hidden = false;
    sec.classList.add('is-activo', 'is-entrando');
    if (atras) sec.classList.add('is-atras');
    paso = n;
    body.dataset.paso = String(n);
    progreso(n);
    actualizar();
    if (!foco) return;
    // Foco: el campo si el paso es de escribir, si no el título (lector de
    // pantalla). En teléfono no se abre el teclado solo en pasos de opciones.
    requestAnimationFrame(() => {
      const campo = { 4: inputNombre, 5: inputContacto }[n];
      if (campo && !esTactil) campo.focus();
      else if (campo && esTactil && n === 5) campo.focus();
      else $('.nt-titulo', sec)?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: reducido ? 'auto' : 'smooth' });
    });
  }

  const esTactil = matchMedia('(hover: none)').matches;

  form.addEventListener('click', (e) => {
    const a = e.target.closest('[data-accion]');
    if (!a) return;
    switch (a.dataset.accion) {
      case 'empezar': ir(pasoGuardado > 0 ? pasoGuardado : 1); break;
      case 'siguiente': if (valido[paso]?.()) ir(paso + 1); break;
      case 'atras': ir(paso - 1); break;
      case 'reiniciar': reiniciar(); break;
      case 'otra': reiniciar(); break;
    }
  });

  // Teclado (desktop): Enter sigue, números eligen, Escape vuelve.
  document.addEventListener('keydown', (e) => {
    const t = e.target;
    const escribiendo = t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement;
    if (e.key === 'Enter') {
      if (t instanceof HTMLTextAreaElement && !(e.metaKey || e.ctrlKey)) return;
      if (t instanceof HTMLButtonElement && t.type === 'button' && !t.dataset.accion) return;
      if (paso === 0) { e.preventDefault(); ir(pasoGuardado > 0 ? pasoGuardado : 1); return; }
      if (paso >= 1 && paso <= 4 && valido[paso]()) { e.preventDefault(); ir(paso + 1); return; }
      if (paso === 5) { e.preventDefault(); enviar(); return; }
    }
    if (e.key === 'Escape' && paso > 1 && paso < 6) { ir(paso - 1); return; }
    if (!escribiendo && !e.metaKey && !e.ctrlKey && !e.altKey && /^[0-9]$/.test(e.key)) {
      const caja = paso === 1 ? cajaIndustria : paso === 3 ? cajaTamano : null;
      const b = caja && $(`.nt-op[data-tecla="${e.key}"]`, caja);
      if (b) { e.preventDefault(); b.click(); }
    }
  });

  // Hoja de la ficha en el teléfono.
  $('[data-accion="ficha"]').addEventListener('click', (e) => {
    const abierta = ficha.classList.toggle('is-abierta');
    e.currentTarget.setAttribute('aria-expanded', String(abierta));
  });

  // ---------------------------------------------------------------------
  // Borrador (sobrevive a una recarga o a cerrar la pestaña sin querer)
  // ---------------------------------------------------------------------

  let pasoGuardado = 0;
  function guardarBorrador() {
    if (paso === 0 || paso === 6 || modoStand) return;
    escribir(CLAVE_BORRADOR, { datos, paso, t: Date.now() });
  }

  function restaurar() {
    if (modoStand) return;
    const b = leer(CLAVE_BORRADOR, null);
    // Un borrador de más de un día ya no es «donde quedaste».
    if (!b || !b.datos || Date.now() - (b.t || 0) > 24 * 3600 * 1000) { borrar(CLAVE_BORRADOR); return; }
    datos = { ...vacio(), ...b.datos };
    pasoGuardado = Math.min(Math.max(b.paso | 0, 1), 5);
    $('[data-ficha-ref]').textContent = 'NT-' + datos.client_id.slice(0, 4).toUpperCase();
    if (datos.industria) { marcarUna(cajaIndustria, datos.industria); campoOtra.hidden = datos.industria !== 'otra'; }
    inputOtra.value = datos.industria_otra || '';
    inputProblema.value = datos.problema || '';
    if (datos.tamano) marcarUna(cajaTamano, datos.tamano);
    inputNombre.value = datos.nombre || '';
    inputOrg.value = datos.organizacion || '';
    elegirMedio(datos.contacto_tipo || 'whatsapp');
    inputContacto.value = datos.contacto || '';
    pintarChips();
    $('.nt-retomar').hidden = false;
    $('[data-accion="empezar"]').firstChild.textContent = 'Seguir donde quedaste ';
  }

  function reiniciar() {
    borrar(CLAVE_BORRADOR);
    datos = vacio();
    pasoGuardado = 0;
    [inputOtra, inputProblema, inputNombre, inputOrg, inputContacto].forEach((i) => { i.value = ''; });
    marcarUna(cajaIndustria, null);
    marcarUna(cajaTamano, null);
    campoOtra.hidden = true;
    elegirMedio('whatsapp');
    pintarChips();
    $('[data-ficha-ref]').textContent = 'NT-' + datos.client_id.slice(0, 4).toUpperCase();
    const estado = $('[data-ficha-estado]');
    estado.textContent = 'borrador';
    estado.classList.remove('is-enviada');
    $('.nt-retomar').hidden = true;
    $('[data-accion="empezar"]').firstChild.textContent = 'Empezar ';
    $('[data-fin-ficha]').innerHTML = '';
    lleno = 0;
    ir(0);
    actualizar();
  }

  // ---------------------------------------------------------------------
  // Envío (con cola local si no hay señal)
  // ---------------------------------------------------------------------

  const config = (window.ENV && window.ENV.supabase) || {};
  const sinBackend = !config.url || String(config.url).includes('YOUR_');
  // Sólo se simula en local. En producción, si env.js no cargó, NO se
  // finge el envío (se perdería el lead): va a la cola y se reintenta.
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.hostname.endsWith('.localhost');

  function payload() {
    return {
      client_id: datos.client_id,
      evento: EVENTO,
      origen,
      industria: datos.industria,
      industria_otra: datos.industria === 'otra' ? datos.industria_otra.trim().slice(0, 120) || null : null,
      problemas: datos.problemas.slice(0, 12),
      problema: datos.problema.trim().slice(0, 2000) || null,
      tamano: datos.tamano,
      nombre: datos.nombre.trim().slice(0, 120),
      organizacion: datos.organizacion.trim().slice(0, 160) || null,
      contacto_tipo: datos.contacto_tipo,
      contacto: datos.contacto.trim().slice(0, 160),
      consentimiento: true,
    };
  }

  /** true = entró (o ya había entrado); false = reintentar más tarde. */
  async function mandar(p) {
    if (sinBackend) {
      if (!local) {
        console.error('[neatech] falta la configuración de Supabase (env.js): queda en cola');
        return false;
      }
      // Local sin env.js: se simula y se deja a la vista en consola.
      await new Promise((r) => setTimeout(r, 450));
      console.info('[neatech] envío simulado (sin env.js):', p);
      return true;
    }
    try {
      const ctrl = new AbortController();
      const corte = setTimeout(() => ctrl.abort(), 12000);
      const r = await fetch(`${config.url}/rest/v1/event_leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: config.anonKey,
          Authorization: `Bearer ${config.anonKey}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(p),
        signal: ctrl.signal,
      });
      clearTimeout(corte);
      if (r.ok || r.status === 409) return true;
      // 4xx de validación no se arregla reintentando: se guarda igual para
      // no perderlo y se deja registro en consola.
      if (r.status >= 400 && r.status < 500) {
        console.warn('[neatech] rechazo del servidor', r.status, await r.text().catch(() => ''));
        return false;
      }
      return false;
    } catch {
      return false;
    }
  }

  const cola = () => leer(CLAVE_COLA, []);
  async function vaciarCola() {
    const pendientes = cola();
    if (!pendientes.length) return 0;
    const quedan = [];
    for (const p of pendientes) {
      if (!(await mandar(p))) quedan.push(p);
    }
    if (quedan.length) escribir(CLAVE_COLA, quedan); else borrar(CLAVE_COLA);
    return quedan.length;
  }

  let enviando = false;
  async function enviar() {
    if (enviando || paso !== 5) return;
    if ($('.nt-hp').value) { finalizar(true, 0); return; } // bot: éxito silencioso
    if (!contactoValido()) {
      inputContacto.setAttribute('aria-invalid', 'true');
      errorContacto.textContent = datos.contacto_tipo === 'email'
        ? 'Revisá el email: falta algo (ej.: nombre@empresa.com).'
        : 'Revisá el número: con característica, sin 0 ni 15 (ej.: 379 412 3456).';
      errorContacto.hidden = false;
      inputContacto.focus();
      return;
    }
    enviando = true;
    const btn = $('.nt-btn--enviar');
    btn.disabled = true;
    btn.firstChild.textContent = 'Enviando… ';
    const p = payload();
    const t0 = performance.now();
    const ok = await mandar(p);
    const ms = Math.round(performance.now() - t0);
    if (!ok) escribir(CLAVE_COLA, [...cola().filter((x) => x.client_id !== p.client_id), p]);
    btn.firstChild.textContent = 'Enviar ';
    enviando = false;
    finalizar(ok, ms);
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); enviar(); });

  function finalizar(ok, ms) {
    borrar(CLAVE_BORRADOR);
    const nombre = datos.nombre.trim().split(/\s+/)[0] || '';
    $('[data-fin-nombre]').textContent = nombre ? `, ${nombre}` : '';
    $('[data-fin-mensaje]').textContent = datos.contacto_tipo === 'email'
      ? 'Te escribimos por mail en las próximas 48 horas con una primera idea concreta.'
      : 'Te escribimos por WhatsApp en las próximas 48 horas con una primera idea concreta.';
    const estadoEnvio = $('[data-estado-envio]');
    estadoEnvio.classList.toggle('is-pendiente', !ok);
    estadoEnvio.textContent = ok
      ? `Enviado · ${ms.toLocaleString('es-AR')} ms`
      : 'Sin señal: quedó guardado en este teléfono y se envía solo apenas vuelva. Si podés, dejá esta pestaña abierta un momento.';
    const estado = $('[data-ficha-estado]');
    estado.textContent = ok ? 'enviada' : 'en cola';
    estado.classList.toggle('is-enviada', ok);
    // En el teléfono, la ficha completa se muestra en la pantalla final.
    const copia = $('.nt-ficha__cuerpo', ficha).cloneNode(true);
    copia.removeAttribute('id');
    const fin = $('[data-fin-ficha]');
    fin.innerHTML = '';
    fin.appendChild(copia);
    ficha.classList.remove('is-abierta');
    ir(6);
    vibrar();
    if (modoStand) setTimeout(() => { if (paso === 6) reiniciar(); }, 25000);
  }

  // Reintentos: al volver la señal, cada 10 s mientras haya algo, y al abrir.
  window.addEventListener('online', () => { vaciarCola().then(refrescarPendiente); });
  setInterval(() => { if (cola().length) vaciarCola().then(refrescarPendiente); }, 10000);
  function refrescarPendiente(quedan) {
    if (paso !== 6 || quedan) return;
    const estadoEnvio = $('[data-estado-envio]');
    if (estadoEnvio.classList.contains('is-pendiente')) {
      estadoEnvio.classList.remove('is-pendiente');
      estadoEnvio.textContent = 'Enviado. Ya podés cerrar.';
      const estado = $('[data-ficha-estado]');
      estado.textContent = 'enviada';
      estado.classList.add('is-enviada');
    }
  }

  // ---------------------------------------------------------------------
  // Arranque
  // ---------------------------------------------------------------------

  body.dataset.paso = '0';
  pintarChips();
  restaurar();
  progreso(0);
  actualizar();
  vaciarCola();
})();
