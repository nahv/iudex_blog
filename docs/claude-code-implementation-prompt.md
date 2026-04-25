# Claude Code — Implementation Prompt

Copy the block below into Claude Code from the `iudex_blog/` repo root.
It stages the redesign in three checkpoints and hands control back after each.

---

## Prompt to paste into Claude Code

You are working on **iudex_blog**, a static marketing site (HTML5 / CSS3 / vanilla ES6+, no build step, no frameworks) for **Iudex** — legal-tech for abogados and juzgados in Corrientes, Argentina. GitHub Pages + Cloudflare DNS.

Before you touch a single file, do this in order:

1. Read `CLAUDE.md` (project rules).
2. Read `.specify/constitution.md` (immutable principles).
3. Read `docs/redesign-proposal.md` (the full redesign strategy — this is your brief).
4. Read the current `index.html`, `public/css/styles.css`, and `public/js/main.js` so you know the real starting point.

Do not skip any of these reads. The proposal is the brief, the constitution is the guardrail, the current files are the baseline.

### Hard constraints (non-negotiable)

- **Vanilla only.** HTML5, CSS3, ES6+. No build step, no bundler, no framework, no npm dependency. If you feel the urge to add a library, stop and propose it in chat first.
- **Language of content is Spanish (AR).** Code, comments, and commits may be in English.
- **Use the existing CSS custom properties in `:root`** (`--ink`, `--cream`, `--gold`, `--font-display`, `--font-body`, `--font-mono`, etc.). Do not hardcode colors, fonts, or spacing. If the palette needs a new token (e.g., a cooler "paper" tone the proposal mentions), add it as a new custom property inside `:root` — do not replace existing ones.
- **BEM naming** for new CSS (`block__element--modifier`).
- **Semantic HTML.** `nav / main / section / article / footer`. `lang="es"`. Every new page or section must include `title`, `meta description`, `meta keywords`, `og:title`, `og:description` where relevant.
- **Relative paths** for internal links.
- **Alt text** on every image; SVG for icons, WebP/PNG for photos.
- **Responsive at three viewports**: 375px, 768px, 1200px.
- **No destructive refactors.** Incremental changes. Small diffs. Do not rewrite pages that are not part of the current stage.
- **Respect ownership split** (see `CLAUDE.md`): Max owns config/SEO/infra; Nahue owns design/content/UI. Cross-ownership changes need a PR note.

### Anti-patterns (from the proposal — do not produce these)

- Three-column feature grid.
- Icon-above-heading-above-paragraph triplets.
- Decorative gradients.
- Stock AI imagery (brains, circuits, glowing orbs).
- Dark mode for the marketing site.
- Chat-bubble widget on the homepage.
- Centered composition on every section (mix alignments per the proposal).
- Cards on the homepage (cards are allowed on `blog/` and `historias/` only).
- Any copy containing: "revolucionario", "disruptivo", "potente", "solución integral", "plataforma líder".

### Stage plan — work in order, stop between stages

Do **Stage 1 only** in this turn. When Stage 1 is done, commit, open a PR draft locally (describe it in chat, do not push), and **wait for explicit approval** before starting Stage 2.

---

#### Stage 1 — Copy pass on the current live site

Goal: bring all existing pages in line with the messaging rules in Section 3 of the proposal *without changing layout*. This is the fastest way to raise the bar and it sharpens the brief for Stage 2.

Do:

1. Walk every page (`index.html`, `blog/index.html`, each article in `blog/`, `about/index.html`, `contacto/index.html`).
2. Rewrite headlines, subheads, CTAs, meta descriptions, and body microcopy against the before/after tables and tone rules in the proposal (Section 3).
3. Replace any occurrence of the banned words list above.
4. Keep structure and DOM identical where possible. Only copy changes.
5. For `juzgados`, if there is no dedicated surface yet, do **not** create one in this stage — note it as a gap in chat.
6. Update `<title>`, `meta description`, `meta keywords`, and Open Graph tags on every page you touch. Keep them honest and specific — no filler.

Definition of done for Stage 1:
- [ ] Every page audited and updated.
- [ ] Zero banned words remaining (grep the repo).
- [ ] Meta tags complete and specific on every touched page.
- [ ] No broken internal links (verify with a quick link check).
- [ ] Diff is copy-only. No CSS, no JS, no structural HTML changes.
- [ ] Summary posted in chat: which pages changed, what the copy shift was per page, and a short list of open questions for Max/Nahue.

Do not move to Stage 2 until a human approves.

---

#### Stage 2 — Homepage Act I prototype (hero + transition to Act II)

Goal: prove the visual concept on the first fold only. Don't build the whole seven-act scroll yet.

When approved for Stage 2, implement:

1. **Act I (hero)** per Section 2 of the proposal:
   - Full-bleed ink-on-cream hero.
   - One dominant display-type headline (Playfair).
   - The "cita que se compone" signature element (Section 6B) — a single Argentine ruling citation that types itself in on page load, once, then settles. Curated list can live in a small JSON array in `public/js/main.js`. Rotate daily by date, not randomly.
   - One CTA: "Ver cómo funciona" — triggers a smooth scroll to Act II, not a modal.
   - Navbar is hidden during Act I and fades in once the user has scrolled past the fold.
2. **Transition into Act II (problem framing)** — first ~40vh of Act II is enough to validate the transition feel. Don't build the rest of Act II yet.
3. Typographic scale per Section 5 of the proposal — add any missing sizes as CSS custom properties.
4. The motion must be restrained: section fade at 8% → 100% over 400ms with 8px y-translate, once. No parallax. No scroll-jacking in Stage 2.
5. Add the **Pulso Jurídico** top-right element (Section 6A) as a static, non-animated placeholder in this stage. Real data signal is a later stage.

Definition of done for Stage 2:
- [ ] Renders correctly at 375 / 768 / 1200.
- [ ] Passes the three tests from Section 7 of the proposal (competitor test, silence test, lawyer test). Note how in chat.
- [ ] No new dependencies.
- [ ] `main` still deploys clean.
- [ ] Screenshots or a recorded scroll at all three viewports attached in the chat summary.
- [ ] Nothing from Acts III–VII touched.

Do not move to Stage 3 until a human approves.

---

#### Stage 3 — Acts II through VII

Only after Stage 2 ships and the feel is validated. At that point request a fresh prompt — Stage 3 is too big to plan blind from here.

---

### How to work

- Use a TODO list. Mark items as you go.
- Prefer `Edit` over `Write` when modifying existing files.
- Before committing, run the site locally (`python3 -m http.server 8000`) and spot-check.
- Commit messages: conventional style, Spanish or English both fine, short subject + a real body when the change isn't obvious.
- Branch name: `redesign/stage-1-copy-pass` for Stage 1, `redesign/stage-2-hero-prototype` for Stage 2.
- Open questions go in chat, not in code comments.

### What to ask me before you start

Only ask if any of the following is true:

1. A file referenced above is missing.
2. A proposal instruction materially conflicts with `CLAUDE.md` or the constitution.
3. You need a clarification on tone or audience for a specific page.

Otherwise, proceed with Stage 1.

---

*Source brief: `docs/redesign-proposal.md`. Project rules: `CLAUDE.md`. Principles: `.specify/constitution.md`.*
