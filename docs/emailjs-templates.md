# EmailJS Templates para Iudex

Instrucciones:
1. Ir a https://www.emailjs.com/ y crear cuenta
2. Conectar un email service (Gmail, Outlook, etc.)
3. Crear los 3 templates de abajo
4. Copiar los IDs y reemplazar en `public/js/main.js` (lineas 8-10)
5. Copiar el Service ID y reemplazar en `public/js/main.js` (linea 7)
6. Configurar origin restrictions en el dashboard para tu dominio

---

## Template 1: Team Notification (teamNotify)

**Subject:** Nueva solicitud de acceso anticipado: {{nombre}} {{apellido}}

**To email:** hola@iudex.app

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f7f4ee; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 32px; }
    .card { background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid rgba(15,15,14,0.06); }
    .header { border-bottom: 2px solid #c9a84c; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { color: #0f0f0e; font-size: 20px; margin: 0; }
    .header p { color: #5a5a56; font-size: 13px; margin: 4px 0 0; }
    .field { margin-bottom: 16px; }
    .field-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #c9a84c; font-weight: 600; margin-bottom: 4px; }
    .field-value { font-size: 15px; color: #0f0f0e; }
    .divider { border: none; border-top: 1px solid rgba(15,15,14,0.06); margin: 20px 0; }
    .footer { text-align: center; color: #5a5a56; font-size: 12px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>Nueva solicitud de acceso anticipado</h1>
        <p>Un nuevo abogado quiere probar Iudex</p>
      </div>

      <div class="field">
        <div class="field-label">Nombre completo</div>
        <div class="field-value">{{nombre}} {{apellido}}</div>
      </div>

      <div class="field">
        <div class="field-label">Email</div>
        <div class="field-value">{{email}}</div>
      </div>

      <div class="field">
        <div class="field-label">Telefono</div>
        <div class="field-value">{{telefono}}</div>
      </div>

      <hr class="divider">

      <div class="field">
        <div class="field-label">Provincia</div>
        <div class="field-value">{{provincia}}</div>
      </div>

      <div class="field">
        <div class="field-label">Area de practica</div>
        <div class="field-value">{{fuero}}</div>
      </div>

      <div class="field">
        <div class="field-label">Tamano del estudio</div>
        <div class="field-value">{{tamano}}</div>
      </div>

      <hr class="divider">

      <div class="field">
        <div class="field-label">Mensaje / Pain point</div>
        <div class="field-value">{{mensaje}}</div>
      </div>
    </div>
    <div class="footer">Iudex - Solicitud recibida via formulario web</div>
  </div>
</body>
</html>
```

---

## Template 2: Auto-Reply to User (autoReply)

**Subject:** Bienvenido/a a Iudex - Tu solicitud fue recibida

**To email:** {{email}}

**From name:** Equipo Iudex

**Reply to:** hola@iudex.app

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f7f4ee; margin: 0; padding: 0; color: #0f0f0e; }
    .container { max-width: 600px; margin: 0 auto; padding: 32px; }
    .card { background: #ffffff; border-radius: 12px; padding: 40px 32px; border: 1px solid rgba(15,15,14,0.06); }
    .logo { text-align: center; margin-bottom: 32px; }
    .logo-mark { display: inline-block; width: 40px; height: 40px; background: #0f0f0e; border-radius: 10px; line-height: 40px; text-align: center; }
    .logo-text { font-size: 22px; font-weight: 700; color: #0f0f0e; margin-left: 8px; vertical-align: middle; }
    .gold { color: #c9a84c; }
    h1 { font-size: 24px; text-align: center; margin-bottom: 8px; }
    .subtitle { text-align: center; color: #5a5a56; font-size: 15px; margin-bottom: 32px; }
    .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #c9a84c; font-weight: 600; margin-bottom: 16px; margin-top: 32px; }
    .feature { display: flex; gap: 12px; margin-bottom: 14px; align-items: flex-start; }
    .feature-icon { width: 24px; min-width: 24px; height: 24px; background: #0f0f0e; border-radius: 50%; text-align: center; line-height: 24px; color: #c9a84c; font-size: 12px; }
    .feature-text strong { display: block; font-size: 14px; margin-bottom: 2px; }
    .feature-text p { font-size: 13px; color: #5a5a56; margin: 0; }
    .divider { border: none; border-top: 1px solid rgba(15,15,14,0.06); margin: 28px 0; }
    .cta { display: block; text-align: center; background: #0f0f0e; color: #c9a84c; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 28px auto 0; max-width: 260px; }
    .footer { text-align: center; color: #5a5a56; font-size: 12px; margin-top: 32px; line-height: 1.6; }
    .footer a { color: #c9a84c; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <span class="logo-mark" style="color:#c9a84c;font-weight:700;font-size:18px;">I</span>
        <span class="logo-text">Iudex</span>
      </div>

      <h1>Hola, {{nombre}}</h1>
      <p class="subtitle">Recibimos tu solicitud de acceso anticipado. Gracias por tu interes en Iudex.</p>

      <div class="section-title">Que es Iudex</div>
      <p style="font-size:14px;line-height:1.7;color:#2a2a28">
        Iudex es un software disenado para abogados argentinos que quieren organizar su trabajo sin complicaciones. Gestion de expedientes, escritura legal automatizada y alertas de vencimientos, todo en una sola plataforma pensada para el sistema juridico argentino.
      </p>

      <div class="section-title">Funcionalidades principales</div>

      <div class="feature">
        <div class="feature-icon">1</div>
        <div class="feature-text">
          <strong>Gestion de expedientes</strong>
          <p>Todos tus casos organizados en un solo lugar. Seguimiento de estado, historial y documentos vinculados.</p>
        </div>
      </div>

      <div class="feature">
        <div class="feature-icon">2</div>
        <div class="feature-text">
          <strong>Automatizacion de escritura</strong>
          <p>Genera escritos, demandas y notificaciones a partir de plantillas inteligentes. Solo completas los datos relevantes.</p>
        </div>
      </div>

      <div class="feature">
        <div class="feature-icon">3</div>
        <div class="feature-text">
          <strong>Alertas de vencimientos</strong>
          <p>Nunca mas un plazo vencido. Iudex te notifica con anticipacion sobre fechas clave de cada expediente.</p>
        </div>
      </div>

      <div class="feature">
        <div class="feature-icon">4</div>
        <div class="feature-text">
          <strong>Disenado para Argentina</strong>
          <p>Terminologia, formatos y flujos de trabajo pensados para el sistema judicial argentino. Sin adaptaciones forzadas.</p>
        </div>
      </div>

      <hr class="divider">

      <div class="section-title">Proximos pasos</div>
      <p style="font-size:14px;line-height:1.7;color:#2a2a28">
        Tu solicitud ya esta en nuestro sistema. Nos vamos a poner en contacto proximamente para coordinar una demo personalizada de 20 minutos donde vas a poder ver Iudex en accion.
      </p>
      <p style="font-size:14px;line-height:1.7;color:#2a2a28">
        El acceso anticipado es <strong>sin costo</strong>. Solo te pedimos feedback honesto para seguir mejorando el producto.
      </p>

      <a href="https://iudex.app/blog/index.html" class="cta">Leer nuestro blog</a>
    </div>

    <div class="footer">
      <p>Equipo Iudex<br>
      <a href="mailto:hola@iudex.app">hola@iudex.app</a></p>
      <p style="margin-top:12px;font-size:11px;color:#999">
        Recibiste este email porque solicitaste acceso anticipado a Iudex.
      </p>
    </div>
  </div>
</body>
</html>
```

---

## Template 3: Newsletter/CTA Signup (newsletter)

**Subject:** Te anotaste para novedades de Iudex

**To email:** {{email}}

**From name:** Equipo Iudex

**Reply to:** hola@iudex.app

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f7f4ee; margin: 0; padding: 0; color: #0f0f0e; }
    .container { max-width: 600px; margin: 0 auto; padding: 32px; }
    .card { background: #ffffff; border-radius: 12px; padding: 40px 32px; border: 1px solid rgba(15,15,14,0.06); text-align: center; }
    .logo-mark { display: inline-block; width: 40px; height: 40px; background: #0f0f0e; border-radius: 10px; line-height: 40px; text-align: center; color: #c9a84c; font-weight: 700; font-size: 18px; }
    .logo-text { font-size: 22px; font-weight: 700; color: #0f0f0e; margin-left: 8px; vertical-align: middle; }
    h1 { font-size: 22px; margin: 24px 0 8px; }
    .gold { color: #c9a84c; }
    p { font-size: 14px; line-height: 1.7; color: #5a5a56; }
    .cta { display: inline-block; background: #0f0f0e; color: #c9a84c; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 20px; }
    .footer { text-align: center; color: #999; font-size: 11px; margin-top: 24px; }
    .footer a { color: #c9a84c; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <span class="logo-mark">I</span>
      <span class="logo-text">Iudex</span>

      <h1>Gracias por <span class="gold">suscribirte</span></h1>
      <p>
        Ya estas en la lista. Te vamos a avisar cuando Iudex este disponible y vas a recibir novedades sobre el producto, aprendizajes y recursos para abogados.
      </p>
      <p>Sin spam. Sin ruido. Solo contenido que vale la pena.</p>

      <a href="https://iudex.app/blog/index.html" class="cta">Visitar el blog</a>
    </div>
    <div class="footer">
      <p><a href="mailto:hola@iudex.app">hola@iudex.app</a></p>
      <p>Recibiste este email porque te suscribiste a novedades de Iudex.</p>
    </div>
  </div>
</body>
</html>
```

---

## Configuracion en main.js

Una vez creados los 3 templates, reemplazar los valores en `public/js/main.js`:

```javascript
const EMAILJS_CONFIG = {
  publicKey: '0f2bFDzG8i97sRFuw',
  serviceId: 'service_8w861ob',
  templates: {
    teamNotify: 'template_XXXXX',      // <-- Template 1 ID
    autoReply: 'template_XXXXX',       // <-- Template 2 ID
    newsletter: 'template_XXXXX',      // <-- Template 3 ID
  },
};
```

## Seguridad

- Configurar **origin restrictions** en EmailJS dashboard para solo permitir tu dominio
- Considerar agregar **reCAPTCHA** cuando el trafico aumente
- El Public Key es seguro de exponer; nunca exponer el Private Key
