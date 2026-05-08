// Burger toggle compartido por todas las páginas del admin.
// El topbar tiene un botón #btn-burger y un nav #admin-nav. En mobile el nav
// arranca colapsado (display:none vía CSS) y se expande con la clase
// admin-topbar__nav--open.

export function wireBurger() {
  const btn = document.getElementById('btn-burger');
  const nav = document.getElementById('admin-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('admin-topbar__nav--open');
    btn.setAttribute('aria-expanded', String(open));
  });
}
