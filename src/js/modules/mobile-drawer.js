export function initMobileDrawer() {
  const drawer = document.querySelector('[data-mobile-drawer]');
  const overlay = document.querySelector('[data-drawer-overlay]');
  const openBtn = document.querySelector('[data-drawer-open]');
  const closeBtn = document.querySelector('[data-drawer-close]');
  if (!drawer || !overlay || !openBtn || !closeBtn) return;

  let prevBodyOverflow = '';
  const onKeydown = (e) => { if (e.key === 'Escape') close(); };

  const open = () => {
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    openBtn.setAttribute('aria-expanded', 'true');
    overlay.hidden = false;
    prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeydown);
    closeBtn.focus();
  };
  const close = () => {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    openBtn.setAttribute('aria-expanded', 'false');
    overlay.hidden = true;
    document.body.style.overflow = prevBodyOverflow;
    document.removeEventListener('keydown', onKeydown);
    openBtn.focus();
  };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);

  drawer.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && drawer.contains(link)) close();
  });

  // Phase 6-b：依 viewport 同步 hamburger hidden 狀態，並在 resize 切到桌機時自動關閉 drawer
  const mq = window.matchMedia('(max-width: 47.99em)');
  const closeOnResize = () => {
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    openBtn.setAttribute('aria-expanded', 'false');
    overlay.hidden = true;
    document.body.style.overflow = prevBodyOverflow;
    document.removeEventListener('keydown', onKeydown);
  };
  const syncMenuButton = () => {
    openBtn.hidden = !mq.matches;
    if (!mq.matches) closeOnResize();
  };
  syncMenuButton();
  if (mq.addEventListener) {
    mq.addEventListener('change', syncMenuButton);
  } else if (mq.addListener) {
    mq.addListener(syncMenuButton);
  }
}
