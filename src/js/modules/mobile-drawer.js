export function initMobileDrawer() {
  const drawer = document.querySelector('[data-mobile-drawer]');
  const overlay = document.querySelector('[data-drawer-overlay]');
  const openBtn = document.querySelector('[data-drawer-open]');
  const closeBtn = document.querySelector('[data-drawer-close]');
  if (!drawer || !overlay || !openBtn || !closeBtn) return;
  const open = () => { drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden', 'false'); overlay.hidden = false; };
  const close = () => { drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true'); overlay.hidden = true; };
  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);
}
