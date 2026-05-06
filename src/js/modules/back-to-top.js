export function initBackToTop() {
  const btn = document.querySelector('[data-back-to-top]');
  if (!btn) return;
  const update = () => btn.classList.toggle('is-visible', window.scrollY > 240);
  update();
  window.addEventListener('scroll', update, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}
