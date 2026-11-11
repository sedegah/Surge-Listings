/**
 * Surge Listings - Progressive Web App (PWA) Client Controller
 * Version: 1.0.0
 * 
 * Manages:
 * - Service Worker registration & lifecycle
 * - Microsoft Edge desktop installation prompt handling
 * - Desktop standalone window state detection
 * - Offline / Online connectivity notifications
 * - Background update checks & auto-refresh
 */

(function () {
  'use strict';

  let deferredInstallPrompt = null;
  let refreshing = false;

  // 1. Detect Standalone Desktop Mode (installed app window)
  const isStandalone = () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: window-controls-overlay)').matches ||
           navigator.standalone === true ||
           document.referrer.includes('android-app://');
  };

  if (isStandalone()) {
    document.documentElement.classList.add('surge-desktop-app');
    console.info('[Surge PWA] Running as standalone desktop application window');

    // Ensure desktop PWA leads to the login portal first when opened at root
    const path = window.location.pathname;
    if (path === '/' || path.endsWith('/index.html')) {
      window.location.replace('/login.html');
    }
  }

  // 2. Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.info('[Surge PWA] Service Worker registered with scope:', reg.scope);

          // Check for background updates
          reg.addEventListener('updatefound', () => {
            const installingWorker = reg.installing;
            if (!installingWorker) return;

            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.info('[Surge PWA] New version of Surge Listings is available.');
                if (typeof window.NotificationSystem?.info === 'function') {
                  window.NotificationSystem.info(
                    'Update available: Surge Listings has been updated in the background.',
                    { duration: 6000 }
                  );
                }
              }
            });
          });
        })
        .catch((err) => {
          console.warn('[Surge PWA] Service Worker registration failed:', err);
        });

      // Reload smoothly when new controller takes over
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  }

  // 3. Desktop Install Prompt Handling (Microsoft Edge / Chromium)
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar on mobile so we have full control on desktop
    e.preventDefault();
    deferredInstallPrompt = e;
    console.info('[Surge PWA] Desktop installation prompt captured and ready');

    // Dispatch event so any UI install button can be activated if present
    window.dispatchEvent(new CustomEvent('surge:installable', { detail: { prompt: e } }));

    // Show install banner if an install button exists
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.style.display = 'inline-flex';
      installBtn.onclick = () => window.triggerSurgePwaInstall();
    }
  });

  // Global helper to trigger install prompt programmatically
  window.triggerSurgePwaInstall = async function () {
    if (!deferredInstallPrompt) {
      if (typeof window.NotificationSystem?.info === 'function') {
        window.NotificationSystem.info('Surge Listings is already installed or your browser does not support installation.', { duration: 4000 });
      }
      return false;
    }

    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    console.info(`[Surge PWA] Installation prompt response: ${outcome}`);
    deferredInstallPrompt = null;

    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) installBtn.style.display = 'none';

    return outcome === 'accepted';
  };

  // 4. Installed Event
  window.addEventListener('appinstalled', () => {
    console.info('[Surge PWA] Surge Listings installed as desktop application.');
    deferredInstallPrompt = null;
    document.documentElement.classList.add('surge-desktop-app');

    if (typeof window.NotificationSystem?.success === 'function') {
      window.NotificationSystem.success(
        'Surge Listings installed successfully! You can launch it from your Start Menu or pin it to your Windows Taskbar.',
        { duration: 8000 }
      );
    }
  });

  // 5. Connectivity Monitoring
  window.addEventListener('online', () => {
    console.info('[Surge PWA] Connection restored.');
    document.documentElement.classList.remove('surge-offline');
    if (typeof window.NotificationSystem?.success === 'function') {
      window.NotificationSystem.success('Internet connection restored. Synchronizing real-time data.', { duration: 4000 });
    }
  });

  window.addEventListener('offline', () => {
    console.warn('[Surge PWA] Offline mode active.');
    document.documentElement.classList.add('surge-offline');
    if (typeof window.NotificationSystem?.warning === 'function') {
      window.NotificationSystem.warning('You are currently offline. Running in offline desktop mode.', { duration: 5000 });
    }
  });
})();

