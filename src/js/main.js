import '../styles/main.scss';
import { initStickyHeader } from './modules/sticky-header.js';
import { initMobileDrawer } from './modules/mobile-drawer.js';
import { initBackToTop } from './modules/back-to-top.js';
import { initGa4Events } from './modules/ga4-events.js';
import { initLinkTracker } from './modules/link-tracker.js';
import { initActiveNav } from './modules/active-nav.js';
import { initLazyImage } from './modules/lazy-image.js';

initStickyHeader();
initMobileDrawer();
initBackToTop();
initGa4Events();
initLinkTracker();
initActiveNav();
initLazyImage();
