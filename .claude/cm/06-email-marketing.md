# Email Marketing - Iudex

## Stack Tecnológico Actual

El sistema de email marketing de Iudex en MVP se construye sobre servicios client-side para minimizar complejidad backend.

### Herramientas Utilizadas

#### EmailJS
- **Propósito**: Servicio de email transaccional sin servidor
- **Modelo**: Client-side (JavaScript CDN)
- **Precio**: Gratis hasta 200 emails/mes, luego pagado (~$20/mes)
- **Ventaja**: No requiere backend propio, configuración rápida
- **Desventaja**: Limitaciones de volumen, menos control de deliverability

**Documentación**: https://www.emailjs.com/

#### Supabase
- **Propósito**: Base de datos para persistencia de registros y suscripciones
- **Tabla**: `registrations` (leads que pidieron acceso anticipado)
- **Tabla futura**: `newsletter_subs` (suscriptores a blog)
- **Ventaja**: REST API, RLS (seguridad), gratis hasta cierto volume
- **Desventaja**: No envía emails directamente (por eso EmailJS)

#### Cloudflare (Opcional para futuro)
- **Propósito**: Email forwarding básico (futuro, no MVP)
- **Uso**: Redireccionar hello@iudex.com.ar a email privado del equipo

---

## Emails Necesarios (3 Templates)

### Template 1: Team Notification (teamNotify)
**Para**: Equipo de Iudex (team@iudex.com.ar)
**Cuándo**: Inmediatamente después de submit del formulario
**Propósito**: Alertar al equipo de nuevo lead

#### Subject
```
Nueva solicitud de acceso anticipado: {{nombre}} {{apellido}}
```

#### Body (HTML)
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: "DM Sans", sans-serif; color: #0F0F0E; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0F0F0E; color: #F7F4EE; padding: 20px; }
    .content { background-color: #F7F4EE; padding: 20px; margin-top: 10px; }
    .field { margin: 10px 0; }
    .label { font-weight: bold; color: #C9A84C; }
    .button { background-color: #C9A84C; color: #0F0F0E; padding: 10px 20px;
              text-decoration: none; border-radius: 8px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Nuevo Lead de Iudex</h2>
    </div>
    <div class="content">
      <div class="field">
        <span class="label">Nombre:</span> {{nombre}} {{apellido}}
      </div>
      <div class="field">
        <span class="label">Email:</span> <a href="mailto:{{email}}">{{email}}</a>
      </div>
      <div class="field">
        <span class="label">Teléfono:</span> {{telefono}}
      </div>
      <div class="field">
        <span class="label">Provincia:</span> {{provincia}}
      </div>
      <div class="field">
        <span class="label">Fuero Especializado:</span> {{fuero}}
      </div>
      <div class="field">
        <span class="label">Tamaño de Estudio:</span> {{tamano}}
      </div>
      <div class="field">
        <span class="label">Mensaje:</span> {{mensaje}}
      </div>
      <div class="field">
        <span class="label">Fuente:</span> {{source}}
      </div>
      <div style="margin-top: 20px;">
        <a href="https://iudex.com.ar/admin/leads" class="button">Ver en Dashboard</a>
      </div>
    </div>
  </div>
</body>
</html>
```

---

### Template 2: Auto-Reply (autoReply)
**Para**: Usuario que registró ({{email}})
**Cuándo**: Inmediatamente después de submit del formulario
**Propósito**: Confirmación cálida, establecer expectativas

#### Subject
```
Bienvenido/a a Iudex
```

#### Body (HTML)
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: "DM Sans", sans-serif; color: #0F0F0E; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #EDEAE2; }
    .logo { font-family: "Playfair Display", serif; font-size: 32px; color: #C9A84C; }
    .content { padding: 20px 0; }
    .section { margin: 20px 0; }
    .cta-button { background-color: #C9A84C; color: #0F0F0E; padding: 12px 24px;
                  text-decoration: none; border-radius: 8px; display: inline-block; }
    .footer { text-align: center; color: #888; font-size: 12px;
              border-top: 1px solid #EDEAE2; padding-top: 20px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Iudex</div>
    </div>

    <div class="content">
      <p>Hola {{nombre}},</p>

      <p>Gracias por registrarte para acceso anticipado a Iudex.</p>

      <div class="section">
        <h3>¿Qué sigue?</h3>
        <p>Nos contactaremos con vos en los próximos días para:</p>
        <ul>
          <li>Entender mejor tu práctica legal</li>
          <li>Explicar cómo Iudex puede ayudarte</li>
          <li>Coordinar acceso a la versión beta (si encajas en nuestro MVP)</li>
        </ul>
      </div>

      <div class="section">
        <h3>Mientras tanto</h3>
        <p>Podés:</p>
        <ul>
          <li><a href="https://iudex.com.ar/blog">Leer nuestro blog</a> sobre productividad legal</li>
          <li><a href="https://iudex.com.ar/about">Conocer al equipo</a> que está construyendo Iudex</li>
          <li>Seguirnos en <a href="https://instagram.com/iudex.ai">Instagram</a> para actualizaciones</li>
        </ul>
      </div>

      <div class="section">
        <p><strong>No es spam</strong>. Este es un proyecto serio que está transformando la forma en que abogados argentinos gestionan su práctica.</p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="https://iudex.com.ar/blog" class="cta-button">Explorar el Blog</a>
      </div>
    </div>

    <div class="footer">
      <p>© 2026 Iudex. Todos los derechos reservados.</p>
      <p>Si no pediste acceso, ignorá este email.</p>
    </div>
  </div>
</body>
</html>
```

---

### Template 3: Newsletter Confirmation (newsletter)
**Para**: Usuario que se suscribió al blog ({{email}})
**Cuándo**: Cuando hace click en "Suscribirme" en un artículo del blog
**Propósito**: Confirmación de suscripción, expectativa de contenido

#### Subject
```
Confirmación: Te suscribiste al blog de Iudex
```

#### Body (HTML)
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: "DM Sans", sans-serif; color: #0F0F0E; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .logo { font-family: "Playfair Display", serif; font-size: 28px; color: #C9A84C; }
    .content { padding: 20px; background-color: #F7F4EE; border-radius: 8px; }
    .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Iudex</div>
    </div>

    <div class="content">
      <p>Gracias por suscribirte, {{nombre}}!</p>

      <p>Ahora recibirás emails cuando publicamos nuevo contenido sobre:</p>
      <ul>
        <li>Productividad legal</li>
        <li>Automatización de documentos</li>
        <li>UX para software legal</li>
        <li>Innovación y legal tech</li>
      </ul>

      <p>Todo con un objetivo: ayudarte a trabajar mejor como abogado.</p>

      <p><strong>Promesa</strong>: No es spam. Publicamos ~1 email/semana. Contenido útil, nada de hype.</p>

      <p style="margin-top: 30px;"><a href="https://iudex.com.ar/blog">Ver todos los artículos →</a></p>
    </div>

    <div class="footer">
      <p>© 2026 Iudex</p>
    </div>
  </div>
</body>
</html>
```

---

## Email de Bienvenida (Profundización)

El email de bienvenida es crítico porque es el primer contacto directo con el usuario. Debe ser honesto, cálido, y establecer expectativas correctas.

### Estructura Óptima

**Asunto** (35-50 caracteres):
```
Bienvenido/a a Iudex
```
- Corto, personalizado con nombre
- Sin "hype" (no "¡Bienvenido a la revolución legal tech!")

**Preheader** (85-100 caracteres, visible antes de abrir):
```
Gracias por tu interés. Nos contactaremos pronto.
```
- Complementa el subject
- Realista, no overpromise

**Opening** (primeras líneas, antes de scrollear):
```
Hola {{nombre}},

Gracias por registrarte para acceso anticipado a Iudex.
```
- Personalizado con nombre (variable {{nombre}})
- Directo, sin spam template

**Cuerpo Principal**:
1. **Confirmación**: "Recibimos tu solicitud" (fecha/hora)
2. **Próximos pasos**: "Nos pondremos en contacto en X días"
3. **Qué esperar**: "Te preguntaremos sobre tu práctica"
4. **Recursos**: "Mientras, podés leer nuestro blog"
5. **Cierre**: "Gracias por creer en esto"

**CTA** (máximo 2):
- Primaria: Link a blog ("Leer artículos")
- Secundaria: Link a Instagram ("Seguir en redes")
- **NO**: "Ver demo" (si no existe), "Descargar app" (si no existe)

**Footer**:
- Copyright año actual
- Email de contacto (hello@iudex.com.ar)
- Unsubscribe link (si aplica)

### Tono en Email de Bienvenida

**Qué HACER**:
- Ser genuino, no corporate
- Reconocer que es early stage (transparencia)
- Expresar gratitud sincera
- Sugerir cómo agregar valor mientras espera

**Qué EVITAR**:
- "¡Estamos revolucionando la industria legal!" (hype)
- "Acceso exclusivo VIP a nuestro producto" (no es tan exclusivo)
- Promesas sobre fecha de lanzamiento (no existe)
- "Consultas legales gratis" (responsabilidad legal)
- Demasiados links (confunde)

### Ejemplo Completo de Email de Bienvenida

**Subject**: Bienvenido/a a Iudex
**Preheader**: Gracias por tu interés. Nos contactaremos pronto.

```
Hola Nahuel,

Gracias por registrarte para acceso anticipado a Iudex.

Recibimos tu solicitud hoy a las 14:30 ART.

QUÉ SIGUE
=========

Nos contactaremos con vos en los próximos días por WhatsApp o email para:
- Entender mejor tu situación (abogado solo, estudio, especialidad, etc)
- Contar cómo Iudex puede ayudarte (sin vendida)
- Si encajás en nuestro MVP, coordinar acceso a beta

El proceso es simple y sin compromiso. Si en algún momento no te interesa, decís y listo.

MIENTRAS TANTO
==============

Si tenés ganas de explorar:
→ Lee nuestro blog: Escritura repetitiva, Gestión de expedientes, UX legal
→ Seguinos en Instagram: @iudex.ai (actualizaciones, tips diarios)
→ Preguntá en DM si tenés dudas

GRACIAS
=======

En serio. Sabemos que hay 20 opciones de software legal. Que hayas elegido creer en nosotros (un proyecto de 2 abogados + 1 dev) es lo más valioso.

Esto es early stage. Hay bugs, features faltantes, todo eso. Pero es REAL, está basado en dolor verdadero, y estamos obsesionados con hacerlo bien.

Un abrazo,
Nahuel
(Founder, Iudex)

---
© 2026 Iudex
hello@iudex.com.ar
iudex.com.ar

Si no solicitaste acceso, ignorá este email.
```

---

## Data Persistence (Supabase)

### Tabla: registrations

```sql
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefono TEXT NOT NULL,
  provincia TEXT NOT NULL,
  fuero TEXT,
  tamano TEXT,
  mensaje TEXT,
  source TEXT DEFAULT 'landing',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RLS Policies
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Permitir INSERT desde anónimos (web publica)
CREATE POLICY "Enable insert for anons" ON registrations
  FOR INSERT
  WITH CHECK (true);

-- Permitir SELECT solo para autenticados (equipo)
CREATE POLICY "Enable read for authenticated" ON registrations
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Crear índice en email para búsqueda rápida
CREATE INDEX idx_registrations_email ON registrations(email);
```

### Tabla: newsletter_subs (Futura)

```sql
CREATE TABLE newsletter_subs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMP NULL
);

ALTER TABLE newsletter_subs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for anons" ON newsletter_subs
  FOR INSERT
  WITH CHECK (true);
```

---

## Flujo de Registro y Envío de Emails

Secuencia exacta de qué pasa cuando el usuario registra:

### Paso 1: Validación Client-Side
```javascript
// Validar campos requeridos
- nombre (no vacío)
- apellido (no vacío)
- email (formato válido)
- teléfono (no vacío, formato)
- provincia (seleccionado)

// Si error: mostrar mensaje rojo debajo del campo
// Si OK: continuar paso 2
```

### Paso 2: Anti-Spam (Honeypot)
```javascript
// Chequear honeypot field (debe estar vacío)
const honeypot = document.querySelector('[name="website"]').value;
if (honeypot !== '') {
  // Es un bot, silenciosamente ignorar (no alertar al usuario)
  return;
}
```

### Paso 3: Deshabilitar y Mostrar Estado
```javascript
// Cambiar botón:
button.disabled = true;
button.textContent = 'Enviando...';
button.style.opacity = 0.5;
```

### Paso 4: INSERT en Supabase
```javascript
const { data, error } = await supabase
  .from('registrations')
  .insert([{
    nombre: formData.nombre,
    apellido: formData.apellido,
    email: formData.email,
    telefono: formData.telefono,
    provincia: formData.provincia,
    fuero: formData.fuero,
    tamano: formData.tamano,
    mensaje: formData.mensaje,
    source: 'landing' // o 'blog', 'instagram', etc
  }]);

if (error?.code === '23505') {
  // Email ya existe (unique constraint)
  showError('Ya tenes una solicitud registrada con ese email');
  enableButton();
  return;
}

if (error) {
  // Error de base de datos
  showError('Error al registrar, intentá de nuevo');
  console.error(error);
  enableButton();
  return;
}
```

### Paso 5: Enviar Emails (Paralelo, No Bloqueante)
```javascript
// Email 1: Team notification
emailjs.send('SERVICE_ID', 'template_teamNotify', {
  nombre: formData.nombre,
  apellido: formData.apellido,
  email: formData.email,
  telefono: formData.telefono,
  provincia: formData.provincia,
  fuero: formData.fuero,
  tamano: formData.tamano,
  mensaje: formData.mensaje,
  source: 'landing',
  to_email: 'team@iudex.com.ar'
}).catch(err => console.error('Team email failed:', err));

// Email 2: Auto-reply
emailjs.send('SERVICE_ID', 'template_autoReply', {
  nombre: formData.nombre,
  email: formData.email,
  to_email: formData.email // Variable de destino
}).catch(err => console.error('Auto-reply failed:', err));

// Nota: Los .catch no frenan el flujo, son fire-and-forget
```

### Paso 6: Mostrar Éxito
```javascript
showSuccess('Gracias! Revisa tu email en los próximos minutos');
resetForm();
enableButton();

// (Opcional) Scroll to success message
window.scrollTo({ top: 0, behavior: 'smooth' });
```

---

## Anti-Spam (Honeypot)

Implementación de honeypot field para evitar bots:

### HTML
```html
<div class="form-group form-group--hidden">
  <label for="website">Website (dejar vacío)</label>
  <input type="text" id="website" name="website" style="display: none;">
</div>
```

### JavaScript (validación)
```javascript
const honeypot = document.querySelector('[name="website"]').value.trim();
if (honeypot !== '') {
  console.warn('Honeypot triggered - likely bot submission');
  // Silenciosamente ignorar (no alertar al usuario bot que fue detectado)
  return false;
}
```

**Por qué funciona**: Los bots llenan todos los campos (incluso invisibles). Los humans dejan el honeypot vacío porque no ven el campo.

**Limitación**: No es 100% seguro (bots sofisticados pueden detectar honeypots). Solución futura: reCAPTCHA v3.

---

## Flujos Futuros de Email

### Double Opt-In (Confirmación)
**Cuándo implementar**: Cuando newsletter cresca
**Proceso**:
1. Usuario se suscribe
2. Recibe email con link de confirmación
3. Hace click en link
4. Newsletter se activa
5. Recibe primer email de bienvenida

**Beneficio**: Reduce fake emails, aumenta deliverability

### Newsletter Automática
**Cuándo**: Cuando tengamos contenido regular
**Setup**:
- Integración con Supabase + EmailJS
- O migrar a Resend (mejor que EmailJS para newsletters)
- Triggers: "nuevo post publicado" → enviar a newsletter_subs

### Drip Campaign
**Idea futura**: Serie de emails post-registro
```
Día 0: Bienvenida (template actual)
Día 2: "Cómo optimizar tu workflow" (email educativo)
Día 5: "Case study: abogado X ahorró 10 horas/semana"
Día 10: "¿Seguís interesado?" (re-engagement)
```

---

## Persistencia Futura (Después de MVP)

### Migración a Backend Propio
Cuando escale, migrar de EmailJS a:

**Opción 1: Resend (Recomendado)**
- Email marketing profesional
- Mejor deliverability que EmailJS
- API simple (similar a EmailJS)
- Precio: $20/mes +
- Pros: Especializado, buena documentación

**Opción 2: Mailchimp**
- Email marketing robusto
- Templates visuales
- Automation workflows
- Precio: Gratis hasta 500 contactos
- Cons: Overkill si solo queremos transaccional

**Opción 3: Backend Propio (Python + SendGrid)**
- Control total
- Más complejo de mantener
- SendGrid para delivery
- Precio: ~$20/mes SendGrid

### Migración de Datos
```javascript
// Cuando migremos, extraer datos de Supabase
const { data } = await supabase
  .from('registrations')
  .select('*');

// Importar a nueva plataforma (CSV export, API bulk, etc)
```

---

## Metricas de Email (Futuro)

Cuando tengamos suficiente volumen, rastrear:

- **Deliverability**: Porcentaje que llega (vs bounces)
- **Open rate**: % que abre el email
- **Click-through rate**: % que hace click en CTA
- **Conversion rate**: % que registra después de email
- **Unsubscribe rate**: % que se da de baja

**Targets iniciales**:
- Deliverability: >95%
- Open rate: >25% (buenos para transaccional)
- CTR: >5%
- Conversion: >1% (si es venta), >10% si es lead

---

## Checklist de Email Marketing

Antes de lanzar emails:
- [ ] EmailJS configurado con 3 templates
- [ ] Supabase tabla registrations creada y RLS activo
- [ ] Form validación client-side completa
- [ ] Honeypot implementado
- [ ] Variables EmailJS correctas ({{nombre}}, {{email}}, etc)
- [ ] Email de bienvenida testeado (ver preview en EmailJS)
- [ ] Team email recibe datos correctamente
- [ ] Error handling para emails fallidos
- [ ] Privacidad: GDPR compliance (unsubscribe link, data storage)
- [ ] Spam folder testing (no terminar en spam)
- [ ] Link tracking (UTMs en blog/redes)

---

## Ejemplos de Variación de Emails

### Email de Bienvenida Alternativa (Más Personal)
Si queremos tono aún más personal:

```
Subject: Bienvenido/a a Iudex (sin formalismos)

Hola {{nombre}},

Gracias por registrarte.

Honestamente, recibir tu email me pone contento. Significa que hay abogados ahí afuera que sienten lo mismo que yo sentía: frustración con procesos manuales que roban tiempo.

Iudex es mi respuesta a eso. Software creado POR abogados PARA abogados.

En los próximos días me contacto personalmente para entender tu caso y ver si Iudex puede ayudarte.

Un abrazo,
Nahuel

---
P.D.: Si ves bugs, features raras, o cosas feas... es porque estamos en beta. Lo importante es que resuelve problemas reales. Tu feedback es gold para nosotros.
```

### Email de Seguimiento (Día 3)
```
Subject: Seguimos aquí (no es spam, es info útil)

Hola {{nombre}},

Hace 3 días registraste para Iudex. Quería asegurarme de que recibiste nuestro primer email.

Mientras te contacto personalmente, te dejo unos resources:

→ Blog: "Escritura repetitiva" - Por qué escribir lo mismo 10x es un desperdicio
→ Instagram: @iudex.ai - Tips diarios de productividad legal
→ Preguntas?: Contame en DM de Instagram

Nos hablamos pronto,
Nahuel
```

---

## Compliance y Privacy

### GDPR/RGPD (Argentina aplica similar)
- [ ] Términos de privacidad publicados
- [ ] Unsubscribe link en cada email
- [ ] No guardar datos más de X tiempo sin consentimiento
- [ ] User puede pedir delete de datos

### Datos Sensibles
- No guardar password en email (obvio)
- No guardar números de expedientes confidenciales
- No guardar datos de clientes en email (privacidad abogado-cliente)

### Seguridad
- HTTPS en formulario (obligatorio)
- Supabase RLS activo (no public read)
- EmailJS token no expuesto en client (use public key, no secret)
