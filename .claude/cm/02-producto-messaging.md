# Producto y Messaging - Iudex

## Features Principales del Producto

### Módulo Abogados: Workspace Central de Gestión de Casos

#### Workspace Central y Visor PDF
- **Qué es**: Espacio unificado donde el abogado ve un expediente completo
- **Componentes**:
  - Visor PDF con anotaciones (resaltados, notas, subrayados)
  - Panel de miniaturas (thumbnails) para navegación rápida entre páginas
  - Historial de cambios (quién anotó, cuándo)
  - Zoom, búsqueda dentro del documento
  - Exportación de anotaciones

- **Por qué importa**: El abogado pasa 50%+ del tiempo leyendo documentos. Tener un visor integrado (no abrir 5 tabs) es eficiencia pura.
- **Diferenciador**: Anotaciones con timestamp + usuario = auditoría de trabajo.

#### Gestión de Expedientes
- **Qué es**: CRUD completo de expedientes (crear, buscar, gestionar, eliminar)
- **Funcionalidades**:
  - Crear nuevo expediente con metadatos (nombre cliente, número juzgado, fuero, fecha inicio)
  - Búsqueda rápida por cliente, número de expediente, palabras clave
  - Vista tipo "tarjeta" o "lista" personalizable
  - Archivar/desactivar expedientes viejos
  - Historial completo: quién creó, cuándo, cambios posteriores
  - Tags/categorías (propio, ajeno, urgente, archivado)

- **Por qué importa**: El abogado necesita un lugar donde *está* el expediente, no buscarlo en carpetas.
- **Integración**: Base de datos local (SQLite) sincronizada con server (futura).

#### Actuaciones
- **Qué es**: Registro de todas las acciones legales en un expediente (demanda, escrito, sentencia, apelación)
- **Funcionalidades**:
  - Crear actuación con tipo, fecha, descripción, usuario
  - Timeline visual de expediente (ver progresión del caso)
  - Links a documentos relacionados
  - Comentarios entre equipo sobre actuaciones
  - Alertas cuando vence plazo de respuesta

- **Por qué importa**: Saber dónde está realmente el caso, no "creo que se demandó en mayo".
- **UX**: Timeline vertical es más clara que lista de texto.

#### Anotaciones
- **Qué es**: Sistema de notas conectadas a expedientes y documentos
- **Funcionalidades**:
  - Notas con timestamp, usuario, etiquetas
  - Búsqueda de notas (encuentra anotaciones viejas)
  - Seguimiento: resolver, asignar a alguien
  - Notas privadas vs colaborativas
  - Reacciones (emoji) en notas (levanta la mano, pregunta, etc.)

- **Por qué importa**: La memoria del abogado + de su equipo está en notas, no en su cabeza.
- **Diferenciador**: Centralizado (no pierde notas en cuadernos, WhatsApp, etc.).

#### Escritos Legales (Generador de Documentos)
- **Qué es**: Sistema de templates + editor integrado + generación con IA
- **Funcionalidades**:
  - Biblioteca de templates (demanda, escrito de prueba, contestación, etc.)
  - Editor rich text (negrita, cursiva, listas, numeración)
  - Variables: {{cliente}}, {{numero_expediente}}, {{monto}}, {{fecha}}
  - Substitución automática de variables
  - Historial de versiones (quién cambió qué, cuándo)
  - Exportación a PDF/DOCX
  - (Future) IA: generar borrador automático, parafrasear, mejorar redacción

- **Por qué importa**: 40% del tiempo del abogado es escribir documentos idénticos. Esto lo reduce a 10%.
- **Diferenciador**: Templates locales (no depende de cloud), versionado integrado.

#### Gestión de PDF
- **Qué es**: Importar, renderizar, buscar, anotaciones en documentos
- **Funcionalidades**:
  - Importar PDF (individual o bulk)
  - Renderización rápida (no tarda 5 segundos por página)
  - Búsqueda dentro del PDF (FTS5 local)
  - Generación de miniaturas para navegación
  - Exportación de anotaciones a PDF
  - OCR (futura): convertir PDF escaneado a texto

- **Por qué importa**: 90% de documentos legales son PDF (sentencias, resoluciones, escritos antiguos). La gestión debe ser fluida.
- **Consideración**: OCR es feature futura (requiere backend).

#### Command Palette (Ctrl+K)
- **Qué es**: Buscador de acciones rápido para usuarios avanzados
- **Funcionalidades**:
  - Buscar expediente (inicio rápido)
  - Crear nuevo documento
  - Buscar nota o actuación
  - Ejecutar acciones (archivar, compartir)
  - Shortcuts de teclado sugeridos

- **Por qué importa**: Usuarios experimentados quieren flujo veloz (teclado, no mouse).
- **Implementación**: Fuse.js para búsqueda, shortcut Ctrl+K.

#### Dashboard
- **Qué es**: Vista de inicio del abogado
- **Contenido**:
  - Expedientes recientes (últimos 5 abiertos)
  - Próximos vencimientos (siguientes 7 días)
  - Actuaciones pendientes
  - Estadísticas rápidas (casos activos, archivados, tasa de resolución)
  - Shortcuts a acciones comunes

- **Por qué importa**: En una mañana caótica, el abogado necesita saber "qué es urgente hoy" de una mirada.

#### Onboarding
- **Qué es**: Flujo de primer uso
- **Pasos**:
  1. Bienvenida + explicación de valor
  2. Crear primer expediente (tutorial)
  3. Importar PDF
  4. Crear primera actuación
  5. Escribir nota
  6. Confetti (celebración)

- **Por qué importa**: Primera experiencia determina si vuelve.

#### Perfil de Usuario
- **Qué es**: Configuración personal
- **Contenido**:
  - Datos básicos (nombre, email)
  - Preferencias (tema oscuro/claro, idioma)
  - Datos profesionales (matrícula, número CUIT)
  - Firma digital (para documentos)
  - Notificaciones (qué alerts recibir)
  - Datos de sincronización (última sync, estado de datos)

- **Por qué importa**: Cada abogado usa la herramienta diferente.

---

### Módulo Juzgados: Herramientas Especializadas para Trabajo Judicial

#### Modelos de Providencias
- **Qué es**: Base de datos de providencias (resoluciones judiciales) del juzgado
- **Funcionalidades**:
  - CRUD: crear, editar, buscar, eliminar providencias
  - Búsqueda full-text (FTS5) por contenido
  - Metadatos: juez, juzgado, fecha, caratula, resolución
  - Histórico de versiones (cómo cambió una providencia)
  - Filtros por tipo, fecha, juez, fuero

- **Por qué importa**: Las providencias se repiten (fallos similares). Poder reutilizar es eficiencia.
- **Uso real**: "Necesito ver cómo el juez Pérez resolvió casos de desalojo"

#### Sujetos Procesales
- **Qué es**: Registro de actores legales (demandantes, demandados, peritos, etc.)
- **Funcionalidades**:
  - CRUD de sujetos (nombre, tipo, datos de contacto)
  - **Integración de CBU** (importantísimo para pagos):
    - Agregar CBU a un sujeto
    - Validar CBU (checksum)
    - Banco y titulación automática desde CBU
  - Historial de casos donde participó el sujeto
  - Búsqueda (para no re-ingresando datos)

- **Por qué importa**: Cada caso tiene muchos actores. CBU es crítico para ejecutar sentencias (embargos, pagos).
- **Diferenciador**: Integración de CBU es feature que no hay en software judicial genérico.

#### Calculadora JUS
- **Qué es**: Herramienta para calcular valor en JUS (Unidad Judicial de Valor)
- **Funcionalidades**:
  - Ingresar cantidad de JUS
  - Convertir a pesos según valor actual del JUS
  - Histórico de valores del JUS
  - Simular cálculos de tasas judiciales

- **Por qué importa**: Cada provincia argentina tiene una JUS diferente (Corrientes es distinto a CABA). Es cálculo frecuente.
- **Datos**: Iudex mantiene tabla actualizada de JUS por provincia.

#### Tabla de Tasas de Justicia
- **Qué es**: Referencia de aranceles judiciales por provincia y tipo de trámite
- **Contenido**:
  - Tasa de registro (demanda)
  - Tasa de apelación
  - Tasa de recurso extraordinario
  - Tasa de incidentes
  - Variaciones por fuero (civil, penal, laboral, etc.)

- **Por qué importa**: Las tasas varían por provincia y cambian anualmente. Necesitar referencia rápida.
- **Mantenimiento**: Iudex mantiene tabla actualizada (data entry manual, luego automática).

#### Sincronización Basada en Archivos
- **Qué es**: Sync de datos entre juzgados en red local (sin internet)
- **Funcionalidades**:
  - Detectar cambios en directorio compartido
  - Sincronizar modelos de providencias, sujetos, tablas
  - Resolver conflictos (si dos jueces editan lo mismo)
  - Log de sincronización

- **Por qué importa**: En un juzgado, múltiples secretarios usan Iudex. Necesitan compartir referencias sin dependencia de internet.
- **Tecnología**: File system watcher + JSON/SQLite sync.

#### Dashboard de Juzgados
- **Qué es**: Overview del estado de datos en el módulo
- **Contenido**:
  - Cantidad de providencias, sujetos, modelos
  - Última sincronización (fecha, hora, resultado)
  - Alertas si sync falló
  - Estadísticas de uso (búsquedas frecuentes)

- **Por qué importa**: Transparencia sobre qué está actualizado.

---

### Features Cloud (Futuro)

Estas features requieren backend y no están en MVP, pero son roadmap confirmado:

#### IA: Resúmenes, Borradores, Extracción de Hechos
- **Resúmenes**: Input un PDF de sentencia, output párrafo resumido
- **Borradores**: Partir de un resumen, generar borrador de escrito
- **Extracción de hechos**: Leer providencia, identificar hechos clave, listarlos

- **Implementación**: LLM (Claude, GPT-4) via API backend.
- **Privacy**: Procesamiento local o cloud cifrado (no almacenar docs).

#### Búsqueda Híbrida de Jurisprudencia
- **Qué es**: Búsqueda inteligente sobre base de jurisprudencia argentina
- **Tipos de búsqueda**:
  - Semántica: "casos sobre desalojo" (entiende el significado)
  - Keyword (BM25): "articulo 1198 código civil" (búsqueda exacta)
  - Combinada: lo mejor de ambos

- **Datos**: Integraciones con Saij (jurisprudencia pública).
- **Implementación**: Vector embeddings + BM25 ranking.

#### Sincronización Multi-Dispositivo
- **Qué es**: Trabajar en laptop en oficina, continuar en tablet en juzgado
- **Features**:
  - Sincronización automática
  - Resolución de conflictos (si edité en dos devices a la vez)
  - Versioning de expedientes

- **Requisito**: Backend con database centralizada (Supabase, self-hosted).

#### OCR en la Nube
- **Qué es**: Convertir PDF escaneado a texto OCR
- **Beneficios**:
  - Búsqueda dentro de documentos escaneados
  - Extracción de datos automática (nombre demandado, monto)
  - Reducción de tamaño de archivos

- **Consideración**: Data privacy (documentos en servidores externos).

---

## Value Propositions

Las 5 razones principales por las que un abogado debería usar Iudex:

### 1. "Funciona sin Internet" (Offline-First Real)
- **Promesa**: Tu trabajo nunca se interrumpe por conexión floja
- **Realidad**: Mientras escribís un documento o buscás un PDF, no necesitás estar conectado
- **Diferenciador**: No es un workaround ("download datos antes de ir al juzgado"), es arquitectura desde cero
- **Aplicación**: "Estoy en un juzgado en Paso de la Cruz, sin señal 4G. Abro Iudex y trabajo como si tuviera 5G"

### 2. "Pensado para el Abogado Argentino"
- **Promesa**: No es software genérico adaptado, es diseñado para tu realidad
- **Detalles**:
  - JUS por provincia
  - Fueros argentinos (penal, civil, laboral, contencioso)
  - Procedimientos locales
  - Precios en pesos argentinos
- **Diferenciador**: Comprendemos que Corrientes no es igual a CABA
- **Aplicación**: "Otros softwares dicen 'zona', yo digo 'provincia y fuero'"

### 3. "Tu Escritorio Digital de Casos"
- **Promesa**: Un lugar donde vive tu trabajo, organizado y accesible
- **Contenido**:
  - Expedientes en un lugar
  - Documentos con historial
  - Anotaciones que no se pierden
  - Timeline de progresión
- **Diferenciador**: No es "base de datos judicial", es tu workspace
- **Aplicación**: "En lugar de carpetas físicas y Excel, tengo un escritorio digital donde está todo"

### 4. "Automatiza lo Repetitivo"
- **Promesa**: Recupera horas de tu semana
- **Detalles**:
  - Templates de documentos (demanda = 15 minutos, no 2 horas)
  - Variables auto-completadas (cliente, fecha, montos)
  - Generación con IA (borrador automático)
  - Búsqueda inteligente de documentos viejos
- **Diferenciador**: Cada segundo que no escribís manualmente es ganancia
- **Aplicación**: "Paso 10 minutos personalizando un template, no 2 horas escribiendo desde cero"

### 5. "Busca Jurisprudencia de Forma Inteligente"
- **Promesa**: Acceso rápido a fallos y doctrina relevante
- **Detalles**:
  - Búsqueda semántica ("casos sobre embargos")
  - Búsqueda por keyword ("artículo 1876")
  - Recomendaciones relacionadas
  - Base local de doctrina argentina
- **Diferenciador**: No es Google para abogados, es búsqueda inteligente especializada
- **Aplicación**: "Antes pasaba 1 hora buscando un fallo parecido. Ahora me toma 5 minutos"

---

## Mensajes Clave por Canal

Cada canal comunica valor de forma diferente. Aquí está el mapeo:

### Landing Page (iudex.com.ar)
**Objetivo**: Convencer en 30 segundos que vale la pena registrarse

**Mensajes principales**:
- **Hero**: "Organiza tus expedientes, automatiza tu escritura. Acceso anticipado disponible."
- **Subheader**: "Software moderno diseñado para abogados argentinos. Funciona sin internet."
- **Pain point section**: "¿Cansado de escribir lo mismo una y otra vez? ¿Perder horas en tareas administrativas?"
- **Features**: "Workspace unificado | Escritos automáticos | Búsqueda inteligente | Offline"
- **CTA principal**: "Solicitar acceso anticipado"
- **CTA secundario**: "Ver demo (video 2 min)"

**Tono**: Directo, enfocado en valor, sin hype

### Blog (iudex.com.ar/blog)
**Objetivo**: Atraer a abogados vía Google con contenido educativo que nos posiciona como expertos

**Tipos de posts**:
1. **Productividad legal**: "Por qué los abogados pierden 40% del día en tareas administrativas"
2. **Gestión de casos**: "Cómo organizar 50+ expedientes sin que se pierdan"
3. **UX para legal**: "Por qué el software legal es tan malo (y cómo lo estamos cambiando)"
4. **Legal Tech**: "IA en derecho: 5 casos de uso reales para abogados argentinos"
5. **Historia**: "De abogado frustrado a founder de legal tech"

**Tono**: Educativo, honesto, conversacional (vos)

**CTA en cada post**: "¿Interesado en optimizar tu práctica? Solicita acceso a Iudex"

### Instagram (@iudex.ai)
**Objetivo**: Generar awareness, comunidad, validación social

**Tipos de contenido**:
1. **Producto**: "Mira cómo Iudex organiza expedientes en segundos" (reel, demo)
2. **Productividad**: "Tip: 3 formas de recuperar 2 horas a la semana como abogado" (carrusel)
3. **Equipo**: "Conocé al equipo que está revolucionando legal tech" (foto + historia)
4. **Validación**: "Manuel, abogado en Corrientes, organiza sus 30 casos con Iudex" (testimonio)
5. **Educación**: "¿Qué es legal tech?" (infográfico)

**Tono**: Profesional pero cercano, visual, inspirador

**CTA**: Link en bio hacia contacto/acceso anticipado

### Email (Bienvenida + Newsletter)
**Objetivo**: Mantener contacto cálido, sin presionar

**Email de Bienvenida**:
- Subject: "Bienvenido/a a Iudex"
- Contenido: Agradecimiento, explicación breve del producto, next steps (versión beta próximamente)
- Tono: Cálido, personalizado (nombre), sin hype

**Newsletter del Blog**:
- Cero hard sell ("Lee nuestro nuevo post")
- Útil de por sí (consejos que valen sin Iudex)
- Mención sutil: "Este tip es 10x más fácil con Iudex"

**Tono**: Conversacional, de amigo a amigo

---

## Diferenciadores Competitivos Clave

Para mencionar cuando comparamos con competencia (no directamente, pero internamente):

| Competencia | Posición | Diferencial Iudex |
|-------------|----------|------------------|
| Juzgar (sistema judicial) | Oficial pero obsoleto | Moderno, UX clara, offline |
| LexisNexis/Microjuris | Caro, genérico | Accesible, Argentina-first |
| Notion + plugins | DIY complejo | Especializado, listo para usar |
| Generadores de documentos genéricos | Sin contexto legal | Templates legales argentinas |
| LawGeex (IA) | Cloud-only, caro | Offline + cloud opcional |

**Nunca atacar competencia directamente**. Solo posicionar como "mejor para abogados argentinos".

---

## Checklist de Messaging

Antes de comunicar cualquier feature:
- [ ] ¿Resuelve un pain point real del abogado argentino?
- [ ] ¿Es mensajeable en 1-2 frases simples?
- [ ] ¿Diferencia Iudex de competencia?
- [ ] ¿El beneficio es cuantificable? ("2 horas/semana", "50+ expedientes")
- [ ] ¿Es realista? (sin over-promising)
- [ ] ¿Refuerza una de las 5 value propositions?
- [ ] ¿El tono es profesional y accesible?
- [ ] ¿Un abogado en Corrientes se siente identificado?
