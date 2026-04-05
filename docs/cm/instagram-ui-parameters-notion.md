# Parametros de UI para Instagram — @iudex.ai

> Documento de referencia para el equipo de contenido. Define la identidad visual, formatos y reglas de diseno para todas las piezas de Instagram de Iudex.

---

## Identidad visual

### Paleta de colores

| Nombre | Hex | Uso |
|--------|-----|-----|
| Ink (oscuro) | `#0F0F0E` | Fondos principales, texto sobre claro |
| Cream (claro) | `#F7F4EE` | Fondos secundarios, texto sobre oscuro |
| Gold (acento) | `#C9A84C` | Titulos destacados, iconos, CTAs, badges |
| Gold Light | `#D4B95E` | Acentos secundarios, gradientes |
| Cream Dark | `#EFEAE2` | Fondos alternativos, separadores |

**Regla**: no usar colores fuera de esta paleta. Si se necesita un color adicional, debe aprobarse antes de publicar.

### Tipografia

| Uso | Fuente | Peso | Ejemplo |
|-----|--------|------|---------|
| Titulos y headlines | Playfair Display | 600-700 | Titulos de carruseles, textos grandes en reels |
| Cuerpo y descripciones | DM Sans | 400-500 | Texto de slides, captions |
| Labels, tags, datos | DM Mono | 400-500 | Hashtags, metricas, badges de categoria |

**Regla**: nunca mezclar mas de 2 fuentes en una misma pieza. Playfair para titulo + DM Sans para cuerpo es la combinacion por defecto.

### Estilo visual

| Elemento | Especificacion |
|----------|---------------|
| Bordes | Redondeados, radio 12-20px |
| Iconografia | Lineal (stroke), no relleno solido. Grosor 1.5px |
| Espaciado | Generoso. Minimo 24px de margen entre elementos |
| Fotografias | Tonos calidos, minimalistas, espacios de trabajo reales |
| Fondos | Preferir fondo ink (#0F0F0E) o cream (#F7F4EE). Evitar degradados complejos |

**Prohibido**: stock generico, fondos ruidosos, mas de 3 colores por pieza, texto sobre imagenes sin overlay de contraste.

---

## Formatos y dimensiones

### Feed — Post unico

| Parametro | Valor |
|-----------|-------|
| Dimension | 1080 x 1080 px (cuadrado) |
| Formato | JPG o PNG |
| Margenes seguros | 60px desde cada borde |
| Texto maximo | 1 titulo (Playfair, 48-64px) + 1-2 lineas de cuerpo (DM Sans, 24-28px) |

### Feed — Carrusel

| Parametro | Valor |
|-----------|-------|
| Dimension por slide | 1080 x 1080 px |
| Cantidad de slides | 5-8 |
| Slide 1 (hook) | Fondo ink, titulo gold en Playfair, pregunta o dato impactante |
| Slides intermedias | Fondo cream, texto ink, iconografia lineal gold |
| Slide final (CTA) | Fondo ink, CTA en gold: "Link en bio" o "Guarda este post" |

**Estructura tipo**:
1. Hook (pregunta o dato)
2. Contexto del problema
3. Dato o evidencia
4. Solucion / tip
5. CTA + branding

### Reels

| Parametro | Valor |
|-----------|-------|
| Dimension | 1080 x 1920 px (9:16 vertical) |
| Duracion | 30-60 segundos |
| Texto en pantalla | Siempre. DM Sans, 32-40px, con sombra o fondo semitransparente |
| Zona segura | Evitar texto en los 250px inferiores (controles de IG) y 200px superiores |
| Musica | Libreria de Instagram, sin copyright |

### Stories

| Parametro | Valor |
|-----------|-------|
| Dimension | 1080 x 1920 px (9:16) |
| Fondo por defecto | Ink (#0F0F0E) o Cream (#F7F4EE) |
| Elementos interactivos | Encuestas, preguntas, countdowns — usar colores de marca |
| Texto | DM Sans, 28-36px |

---

## Plantillas base

### Plantilla 1: Tip de productividad (carrusel)

```
Slide 1:  Fondo #0F0F0E
          Titulo: Playfair Display 56px, color #C9A84C
          Subtitulo: DM Sans 24px, color #F7F4EE al 60%
          Badge: DM Mono 14px, "PRODUCTIVIDAD", fondo gold al 15%

Slide 2-6: Fondo #F7F4EE
           Titulo: Playfair Display 40px, color #0F0F0E
           Cuerpo: DM Sans 24px, color #0F0F0E al 70%
           Icono: stroke #C9A84C, 48x48px

Slide 7:  Fondo #0F0F0E
          CTA: DM Sans 28px semibold, color #C9A84C
          Logo Iudex: esquina inferior derecha, 80px
```

### Plantilla 2: Feature highlight (imagen unica)

```
Fondo:    #0F0F0E
Screenshot: centrado, con borde redondeado 16px, sombra suave
Titulo:   Playfair Display 44px, color #F7F4EE, debajo del screenshot
Badge:    DM Mono 12px, "PRODUCTO", fondo #C9A84C al 15%
Logo:     esquina inferior derecha
```

### Plantilla 3: Cita / testimonio (imagen unica)

```
Fondo:    #F7F4EE
Comillas:  Playfair Display 120px, color #C9A84C al 30%
Cita:     DM Sans 28px italic, color #0F0F0E
Autor:    DM Sans 20px semibold + DM Mono 14px rol
Linea:    1px #C9A84C, separador entre cita y autor
```

### Plantilla 4: Equipo / behind the scenes (imagen unica)

```
Fondo:    Foto real con overlay gradiente desde abajo (#0F0F0E al 80%)
Texto:    DM Sans 28px, color #F7F4EE, posicionado abajo
Badge:    DM Mono 14px, "EQUIPO", fondo gold al 15%
```

---

## Reglas de composicion

1. **Jerarquia clara**: un solo punto focal por pieza. Si hay titulo y subtitulo, el titulo debe ser 1.5-2x mas grande.
2. **Espacio en blanco**: minimo 30% del area total debe ser espacio vacio. No saturar.
3. **Contraste**: texto sobre fondo oscuro en cream/gold. Texto sobre fondo claro en ink. Nunca gold sobre cream (bajo contraste).
4. **Logo**: siempre presente pero discreto. Esquina inferior derecha, 60-80px, opacidad 80%.
5. **Consistencia entre slides**: un carrusel usa un solo estilo de fondo. No alternar ink/cream entre slides intermedias.

---

## Perfil de la cuenta

| Elemento | Valor |
|----------|-------|
| Nombre | Iudex |
| Handle | @iudex.ai |
| Foto de perfil | icon.png sobre fondo #0F0F0E, circular |
| Bio | Software de gestion legal para abogados y juzgados argentinos. Organiza tus expedientes, automatiza tu escritura. Acceso anticipado disponible. |
| Link en bio | iudex.com.ar/contacto (con UTM: ?utm_source=instagram&utm_medium=bio) |
| Highlights | 3 categorias: Producto, Equipo, FAQ |
| Portadas highlights | Fondo #0F0F0E, icono lineal #C9A84C centrado |

---

## Calendario semanal

| Dia | Contenido | Formato | Pilar |
|-----|-----------|---------|-------|
| Lunes | Tip de productividad | Feed (carrusel 5-8 slides) | Productividad |
| Miercoles | Feature highlight / demo | Reel (30-60s) | Producto |
| Viernes | Equipo o testimonio | Feed (imagen unica) | Equipo / Social proof |

**Stories**: lunes a viernes, 2-3 por dia. Encuestas, behind-the-scenes, recordatorios de posts.

---

## Hashtags

### Siempre (en todo post)
`#LegalTech #SoftwareLegal #AbogadosArgentina #GestionJuridica #Iudex`

### Por pilar

| Pilar | Hashtags adicionales |
|-------|---------------------|
| Producto | #GestionDeExpedientes #AutomatizacionLegal #TecnologiaJuridica |
| Productividad | #ProductividadLegal #OrganizacionJuridica #TiempoAbogados |
| Equipo | #StartupArgentina #LegalTechLatam #DesarrolloDeProducto |
| Testimonios | #CasosDeExito #TransformacionDigital #InnovacionLegal |
| Educacion | #DerechoYTecnologia #DigitalizacionJudicial #FuturoLegal |

**Reglas**: maximo 15 por post. Colocar en primer comentario, no en caption. Rotar para evitar shadowban.

---

## Flujo de aprobacion

```
Creacion (Nahuel/colaborador)
    ↓
Revision de tono y producto (Maxi)
    ↓
Programacion (48hs antes minimo)
    ↓
Publicacion automatica
    ↓
Monitoreo primeras 4 horas (quien publico)
```

---

## SLAs de respuesta

| Canal | Tiempo maximo | Horario |
|-------|--------------|---------|
| Comentarios | 4 horas | Lun-Vie 9:00-18:00 ART |
| DMs | 12 horas | Lun-Vie 9:00-18:00 ART |
| Feedback negativo | Responder con empatia, nunca discutir. Escalar a DM si es necesario. |
| Consultas legales | No responder. Derivar: "Recomendamos consultar con un profesional." |

---

## Checklist mensual

- [ ] Revisar metricas (seguidores, engagement, clicks, DMs)
- [ ] Identificar top 3 posts y analizar por que funcionaron
- [ ] Identificar bottom 2 posts y ajustar
- [ ] Actualizar calendario del mes siguiente
- [ ] Verificar highlights actualizados
- [ ] Revisar bio y link en bio
- [ ] Documentar feedback de DMs y comentarios para producto
