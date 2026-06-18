---
name: iudex-mockup-motion
description: Build premium, scroll-choreographed "live mockup" scenes for the iudex.com.ar landing-page showcase — focused recreations of Iudex app screens built in real HTML/CSS inside a window frame, animated by scroll beats (typing, staggered reveals, an overlay rising, a command palette appearing). Use whenever adding or editing a `data-live` chapter scene in index.html. Triggers on: "add a live scene", "animate the <feature> mockup", "scrollytelling chapter", "make it feel like the app", "Apple-style product showcase".
---

# Iudex live-mockup motion (DOM recreations)

The chosen approach: recreate the **hero interaction** of each feature in real HTML/CSS —
focused and attractive, not the whole dense app window — inside the shared `.iudex-frame`
window, and animate it by scroll beats. The v3 screenshots (`public/assets/screenshots-v3/`)
are the **fidelity reference** (exact copy, layout, colours, real demo data). Crisp at any
size, tiny, fully controllable. We tried camera-over-screenshots and it read "off" — DOM
recreations win. No build step, vanilla CSS/JS, GitHub Pages. Reference scene: **Chapter IV ·
Nexus** (`.nx*`) and **Chapter I · dashboard** (`.dash*`).

## The engine (reuse — already built in main.js)

Per active `.c-chapter` the scroll engine writes, on the `<section>`:
- `data-beat="N"` (0,1,2…) — current beat = `floor(progress * segments)`, `segments = #.c-chapter__beat` (keep **3** copy beats per chapter).
- `--beat-progress` (0→1, eased) and `--seg-progress` (0→1, linear) within the beat.

It also injects the dark icon **rail** into any `.iudex-frame__body[data-shell="<key>"]`
(keys: inicio, expedientes, modelos, agenda, investigacion, calculadora, tasas, digesto, config).

## Scene markup

```html
<section class="c-chapter" id="capitulo-N" data-chapter="N" data-live ...>
  <div class="c-chapter__sticky">
    <div class="c-chapter__copy">… eyebrow, title, 3 .c-chapter__beat panels …</div>
    <div class="c-chapter__stage">
      <div class="iudex-frame iudex-frame--<scene>" role="img" aria-label="<plain description>">
        <div class="iudex-bar"> search pill · spacer · chips · account </div>   <!-- optional -->
        <div class="iudex-frame__body" data-shell="<key>">   <!-- data-shell injects the rail; omit for editor/nexus -->
          <div class="iudex-frame__view <scene>"> … recreated screen … </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

Reusable shell/atoms in styles.css: `.iudex-frame` (window; give it a per-scene
`aspect-ratio` ~1.35–1.5 so content fits with no clip), `.iudex-bar*` (top chrome),
`.iudex-rail` (injected), `.iudex-frame__body/__view`, `.iudex-card`, `.iudex-chip--ok|gold|live`.

## The golden rule of state (no `!important`, ever)

**Author DEFAULT CSS as the settled/final state** (everything typed out, lists shown, overlay
risen — what mobile & reduced-motion get). Put ALL motion (hidden-start states, transitions,
per-beat reveals) inside:
```css
@media (min-width: 980px) and (prefers-reduced-motion: no-preference) { … }
```
Beat gating uses the chapter attribute; use `:is()` for "reveal and keep" across beats:
```css
.thing { opacity: 0; transform: translateY(8px); transition: opacity .4s var(--ease-cinema), …; }   /* hidden start (inside media) */
#capitulo-N[data-beat="1"] .row { --r: clamp(0, (var(--beat-progress) - var(--i)*0.13)*5, 1); opacity: var(--r); transform: translateY(calc((1-var(--r))*8px)); }  /* stagger by --i */
#capitulo-N:is([data-beat="1"],[data-beat="2"]) .thing { opacity: 1; transform: none; }              /* stays revealed */
```
Transient overlays (command palette) must be hidden in the BASE too (`opacity:0`) so mobile
doesn't show them; only the desktop beat re-enables.

## Motion primitives (transform / opacity / clip-path / width only)

- **Typewriter**: `display:inline-block; white-space:nowrap; overflow:hidden;` + `width: calc(var(--beat-progress)*<chars>ch)` during its beat; blinking `.caret` (`@keyframes`, `steps(1)`); clear to a muted placeholder once "sent".
- **Staggered reveal**: `style="--i:0|1|2…"` + the `--r` clamp formula above.
- **Rising overlay / palette**: absolute card, `transform: translate(-50%, 120%)` hidden → `translate(-50%, 0)` at its beat, with a dim `scrim`.
- **Line-by-line text**: per `<span class="ed-line" style="--i:N">`, `opacity: clamp(0,(var(--beat-progress)-var(--i)*0.12)*6,1)` during beat 0.

## Choreography recipe (3 beats = 3 distinct states, like Nexus)

establish (greeting/empty) → focus (rows stagger / type / variables) → payoff (overlay rises,
palette opens, toast/result). Match each beat to its `.c-chapter__beat` copy. Real Spanish demo
copy (Dra. Ana María Vallejos, "Bianchi c/ Aseguradora del Sur ART", real fallo names, the
$525.666,67 liquidation, the SHA-256). Gold **text** = `--gold-deep` (AA on cream).

## Verify — and beware two preview gotchas

1. `preview_start "blog"` from a clean start; take ONE screenshot at scroll 0 first to prime
   the capture, then `preview_resize` to 1280×820.
2. **Capture only works near scroll 0**, and **the engine's scroll tick overwrites a manually
   set `data-beat`.** So to inspect a beat: pop the frame to a fixed overlay and set the beat
   *after* the tick settles:
   ```js
   document.documentElement.style.scrollBehavior='auto';
   document.documentElement.scrollTop = 0;
   const fr = el.querySelector('.iudex-frame');
   fr.style.cssText = 'position:fixed;top:30px;left:150px;width:980px;z-index:999999';
   await sleep(200);                 // let the scroll tick settle data-beat to 0
   el.dataset.beat='2'; el.style.setProperty('--beat-progress','1');  // THEN override (no further scroll)
   await sleep(1000); // let transitions finish → screenshot
   ```
   Reset `fr.style.cssText=''` before inspecting the next scene. Ephemeral — gone on reload.
3. Check the mobile (≤979) settled frame and that reduced-motion shows the settled state.
