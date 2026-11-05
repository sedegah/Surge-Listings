/**
 * Surge Listings — Modern Enterprise Notification & Dialog System
 * Complete implementation of the UI/UX Design Specification.
 */
(function (global) {
  'use strict';

  // SVG Lucide Icons
  const ICONS = {
    check: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    alertCircle: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    alertTriangle: '<svg viewBox="0 0 24 24" width="22" height="22" fill="#F59E0B" stroke="#D97706" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13" stroke="#FFFFFF" stroke-width="2.6"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="#FFFFFF" stroke-width="2.6"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    clock: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    spinner: '<svg class="surge-notify-spinner" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
    formAlert: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
  };

  // Default auto-dismiss durations in milliseconds
  const DEFAULT_DURATIONS = {
    success: 5000,
    info: 5000,
    warning: 6000,
    error: 7000,
    loading: 0
  };

  const activeNotifications = new Map();
  let idCounter = 0;
  let containerEl = null;

  function ensureContainer() {
    if (containerEl && document.body.contains(containerEl)) return containerEl;
    let el = document.getElementById('surge-notification-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'surge-notification-container';
      el.setAttribute('role', 'region');
      el.setAttribute('aria-label', 'Notifications');
      el.setAttribute('aria-live', 'polite');
      if (document.body) {
        document.body.prepend(el);
      }
    }
    containerEl = el;
    return containerEl;
  }

  // Sanitize HTML
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Filter raw technical backend strings and produce user-friendly, actionable messages
  function enhanceMessage(rawMsg, rawType, rawTitle) {
    let msg = String(rawMsg || '').trim();
    let type = (rawType || 'info').toLowerCase();
    if (type === 'warn') type = 'warning';
    if (type === 'information') type = 'info';

    let title = rawTitle ? String(rawTitle).trim() : '';

    // Network / connection failures
    if (/Failed to fetch|NetworkError|fetch failed|Cannot reach the server|network error/i.test(msg)) {
      type = 'error';
      title = title || 'Connection Failed';
      msg = 'Unable to reach Surge services. Please check your internet connection and try again.';
      return { title, message: msg, type };
    }

    // Database / Internal server errors: never expose SQL / raw stack traces
    if (/sqlite|d1|constraint|syntax error|database error|stack trace|internal server error|500 Internal/i.test(msg)) {
      type = 'error';
      title = title || 'Unable to complete request';
      msg = 'We encountered an unexpected problem processing your request. Please retry in a few moments.';
      return { title, message: msg, type };
    }

    // Valuation record check (direct match with design reference specification)
    if (/valuation record.*(not submitted|yet|unavailable)|no valuation record/i.test(msg)) {
      type = type === 'error' ? 'error' : 'warning';
      title = title || 'Valuation record unavailable';
      msg = "The bank hasn't submitted a valuation record for this asset yet.";
      return { title, message: msg, type };
    }

    // Session expiration (direct match with design reference specification)
    if (/session.*(expire|expired)|token.*expired/i.test(msg)) {
      if (/in 5 minutes/i.test(msg)) {
        type = 'info';
        title = title || 'Information';
        msg = 'Your session will expire in 5 minutes.';
      } else {
        type = 'warning';
        title = title || 'Session Expired';
        msg = 'Your session has expired. Please sign in again to continue.';
      }
      return { title, message: msg, type };
    }

    // Changes saved (direct match with design reference specification)
    if (/changes saved|asset record saved|updated successfully/i.test(msg)) {
      type = 'success';
      title = title || 'Changes saved';
      if (/changes saved successfully/i.test(msg) || msg === 'Changes saved') {
        msg = 'Your changes have been saved successfully.';
      }
      return { title, message: msg, type };
    }

    // Missing information / validation errors
    if (/Validation error:/i.test(msg)) {
      const cleanErr = msg.replace(/^Validation error:\s*/i, '');
      type = 'warning';
      title = title || 'Warning';
      msg = cleanErr || 'Some information is missing. Complete the required fields to continue.';
      return { title, message: msg, type };
    }

    if (/is required|select an asset|complete all required fields/i.test(msg)) {
      type = 'warning';
      title = title || 'Warning';
      return { title, message: msg, type };
    }

    // Generic defaults based on type
    if (!title) {
      switch (type) {
        case 'success':
          title = 'Success';
          break;
        case 'error':
          title = 'Unable to complete request';
          break;
        case 'warning':
          title = 'Warning';
          break;
        case 'loading':
          title = 'Loading';
          break;
        case 'info':
        default:
          title = 'Information';
          break;
      }
    }

    return { title, message: msg, type };
  }

  function getIconHtml(type) {
    switch (type) {
      case 'success':
        return `<div class="surge-notify-icon-circle">${ICONS.check}</div>`;
      case 'error':
        return `<div class="surge-notify-icon-circle">${ICONS.alertCircle}</div>`;
      case 'warning':
        return `<div class="surge-notify-icon-wrap">${ICONS.alertTriangle}</div>`;
      case 'loading':
        return ICONS.spinner;
      case 'info':
      default:
        return `<div class="surge-notify-icon-circle">${ICONS.info}</div>`;
    }
  }

  /**
   * Main Notification Dispatcher
   */
  function notify(opts) {
    if (!opts) return null;

    // Support string or object call
    let rawMsg = typeof opts === 'string' ? opts : opts.message || opts.msg || '';
    let rawType = typeof opts === 'string' ? 'info' : (opts.type || 'info');
    let rawTitle = typeof opts === 'string' ? '' : (opts.title || '');
    let customDuration = typeof opts === 'object' && opts.duration !== undefined ? opts.duration : null;
    let persistent = typeof opts === 'object' && Boolean(opts.persistent);
    let action = typeof opts === 'object' ? opts.action : null;
    let onDismiss = typeof opts === 'object' ? opts.onDismiss : null;

    const { title, message, type } = enhanceMessage(rawMsg, rawType, rawTitle);

    // Deduplication check: prevent duplicate notifications from stacking repeatedly
    const dedupeKey = `${type}::${title}::${message}`;
    if (activeNotifications.has(dedupeKey)) {
      const existing = activeNotifications.get(dedupeKey);
      if (existing && existing.el && document.body.contains(existing.el)) {
        // Wiggle the existing notification and refresh its timer
        existing.el.classList.remove('surge-notify-wiggle');
        void existing.el.offsetWidth;
        existing.el.classList.add('surge-notify-wiggle');
        if (existing.resetTimer) existing.resetTimer();
        return existing.handle;
      }
    }

    const container = ensureContainer();
    const id = 'surge-toast-' + (++idCounter);

    // Calculate duration
    let duration = customDuration !== null
      ? customDuration
      : (persistent ? 0 : (DEFAULT_DURATIONS[type] !== undefined ? DEFAULT_DURATIONS[type] : 5000));

    // Create Card DOM element
    const card = document.createElement('div');
    card.id = id;
    card.className = `surge-notify-card surge-notify-${type}`;
    card.setAttribute('role', type === 'error' || type === 'warning' ? 'alert' : 'status');
    card.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

    const durationSeconds = Math.max(1, Math.round(duration / 1000));

    // Build Card inner HTML
    const showTimerFooter = duration > 0 && type !== 'loading';
    const showActionRow = Boolean(action && action.label);

    card.innerHTML = `
      <div class="surge-notify-main">
        <div class="surge-notify-icon">${getIconHtml(type)}</div>
        <div class="surge-notify-body">
          <div class="surge-notify-title">${escapeHtml(title)}</div>
          <p class="surge-notify-message">${escapeHtml(message)}</p>
        </div>
        ${type !== 'loading' ? `
          <button type="button" class="surge-notify-close" aria-label="Dismiss notification">
            ${ICONS.close}
          </button>
        ` : ''}
      </div>
      ${showTimerFooter ? `
        <div class="surge-notify-footer">
          <div class="surge-notify-timer">
            ${ICONS.clock}
            <span>Dismisses in <b class="surge-notify-sec">${durationSeconds}</b>s</span>
          </div>
          <div class="surge-notify-progress-track">
            <div class="surge-notify-progress-bar"></div>
          </div>
        </div>
      ` : ''}
      ${showActionRow ? `
        <div class="surge-notify-actions">
          <button type="button" class="surge-notify-btn ${action.secondary ? 'secondary' : ''}">
            ${escapeHtml(action.label)}
          </button>
        </div>
      ` : ''}
    `;

    // Hook up Action button if provided
    if (showActionRow) {
      const actionBtn = card.querySelector('.surge-notify-btn');
      if (actionBtn && action.onClick) {
        actionBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          action.onClick(handle);
          if (action.dismissOnClick !== false) {
            dismiss();
          }
        });
      }
    }

    // Dismiss logic with smooth collapse animation
    let isDismissed = false;
    let timerTimeout = null;
    let countdownInterval = null;
    let remainingTime = duration;
    let startTime = Date.now();
    let isPaused = false;

    function dismiss() {
      if (isDismissed) return;
      isDismissed = true;
      clearTimeout(timerTimeout);
      clearInterval(countdownInterval);
      activeNotifications.delete(dedupeKey);

      card.classList.add('surge-notify-exit');
      card.addEventListener('animationend', () => {
        if (card.parentNode) card.parentNode.removeChild(card);
        if (typeof onDismiss === 'function') onDismiss();
      }, { once: true });

      // Fallback cleanup in case animationend does not fire
      setTimeout(() => {
        if (card.parentNode) card.parentNode.removeChild(card);
      }, 350);
    }

    // Hook up Close button
    const closeBtn = card.querySelector('.surge-notify-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dismiss();
      });
    }

    // Timer and Progress bar management
    const progressBar = card.querySelector('.surge-notify-progress-bar');
    const secEl = card.querySelector('.surge-notify-sec');

    function startTimer(ms) {
      clearTimeout(timerTimeout);
      clearInterval(countdownInterval);
      if (ms <= 0) return;

      remainingTime = ms;
      startTime = Date.now();

      if (progressBar) {
        progressBar.style.transition = 'none';
        progressBar.style.width = '100%';
        void progressBar.offsetWidth; // Force reflow
        progressBar.style.transition = `width ${ms}ms linear`;
        progressBar.style.width = '0%';
      }

      timerTimeout = setTimeout(() => {
        dismiss();
      }, ms);

      countdownInterval = setInterval(() => {
        if (isPaused) return;
        const elapsed = Date.now() - startTime;
        const leftSec = Math.max(0, Math.ceil((remainingTime - elapsed) / 1000));
        if (secEl) secEl.textContent = String(leftSec);
      }, 250);
    }

    function pauseTimer() {
      if (duration <= 0 || isPaused || isDismissed) return;
      isPaused = true;
      card.classList.add('surge-notify-paused');
      clearTimeout(timerTimeout);
      clearInterval(countdownInterval);

      const elapsed = Date.now() - startTime;
      remainingTime = Math.max(0, remainingTime - elapsed);

      if (progressBar) {
        const computedWidth = window.getComputedStyle(progressBar).width;
        progressBar.style.transition = 'none';
        progressBar.style.width = computedWidth;
      }
    }

    function resumeTimer() {
      if (duration <= 0 || !isPaused || isDismissed) return;
      isPaused = false;
      card.classList.remove('surge-notify-paused');
      if (remainingTime > 0) {
        startTimer(remainingTime);
      } else {
        dismiss();
      }
    }

    function resetTimer(newDuration = duration) {
      if (newDuration > 0) {
        startTimer(newDuration);
      }
    }

    if (duration > 0) {
      startTimer(duration);

      // Pause on hover
      card.addEventListener('mouseenter', pauseTimer);
      card.addEventListener('mouseleave', resumeTimer);
    }

    // Mount to top of notification container
    container.appendChild(card);

    // Transition Handle returned to caller
    const handle = {
      id,
      card,
      dismiss,
      resetTimer,

      // Smoothly update notification into new state (e.g. Loading -> Success or Error)
      update(nextOpts) {
        if (isDismissed) return;
        clearTimeout(timerTimeout);
        clearInterval(countdownInterval);
        card.removeEventListener('mouseenter', pauseTimer);
        card.removeEventListener('mouseleave', resumeTimer);

        const next = enhanceMessage(
          nextOpts.message || nextOpts.msg || '',
          nextOpts.type || 'info',
          nextOpts.title || ''
        );

        // Update classes
        card.className = `surge-notify-card surge-notify-${next.type}`;
        card.setAttribute('role', next.type === 'error' || next.type === 'warning' ? 'alert' : 'status');

        const nextDuration = nextOpts.duration !== undefined
          ? nextOpts.duration
          : (nextOpts.persistent ? 0 : (DEFAULT_DURATIONS[next.type] !== undefined ? DEFAULT_DURATIONS[next.type] : 5000));

        const nextSec = Math.max(1, Math.round(nextDuration / 1000));
        const showNextFooter = nextDuration > 0 && next.type !== 'loading';
        const nextAction = nextOpts.action;

        card.innerHTML = `
          <div class="surge-notify-main">
            <div class="surge-notify-icon">${getIconHtml(next.type)}</div>
            <div class="surge-notify-body">
              <div class="surge-notify-title">${escapeHtml(next.title)}</div>
              <p class="surge-notify-message">${escapeHtml(next.message)}</p>
            </div>
            ${next.type !== 'loading' ? `
              <button type="button" class="surge-notify-close" aria-label="Dismiss notification">
                ${ICONS.close}
              </button>
            ` : ''}
          </div>
          ${showNextFooter ? `
            <div class="surge-notify-footer">
              <div class="surge-notify-timer">
                ${ICONS.clock}
                <span>Dismisses in <b class="surge-notify-sec">${nextSec}</b>s</span>
              </div>
              <div class="surge-notify-progress-track">
                <div class="surge-notify-progress-bar"></div>
              </div>
            </div>
          ` : ''}
          ${nextAction ? `
            <div class="surge-notify-actions">
              <button type="button" class="surge-notify-btn ${nextAction.secondary ? 'secondary' : ''}">
                ${escapeHtml(nextAction.label)}
              </button>
            </div>
          ` : ''}
        `;

        const newCloseBtn = card.querySelector('.surge-notify-close');
        if (newCloseBtn) {
          newCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dismiss();
          });
        }

        if (nextAction) {
          const btn = card.querySelector('.surge-notify-btn');
          if (btn && nextAction.onClick) {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              nextAction.onClick(handle);
              if (nextAction.dismissOnClick !== false) dismiss();
            });
          }
        }

        if (nextDuration > 0) {
          duration = nextDuration;
          const newProgressBar = card.querySelector('.surge-notify-progress-bar');
          const newSecEl = card.querySelector('.surge-notify-sec');
          
          function startNewTimer(ms) {
            clearTimeout(timerTimeout);
            clearInterval(countdownInterval);
            remainingTime = ms;
            startTime = Date.now();
            if (newProgressBar) {
              newProgressBar.style.transition = 'none';
              newProgressBar.style.width = '100%';
              void newProgressBar.offsetWidth;
              newProgressBar.style.transition = `width ${ms}ms linear`;
              newProgressBar.style.width = '0%';
            }
            timerTimeout = setTimeout(() => dismiss(), ms);
            countdownInterval = setInterval(() => {
              if (isPaused) return;
              const elapsed = Date.now() - startTime;
              const leftSec = Math.max(0, Math.ceil((remainingTime - elapsed) / 1000));
              if (newSecEl) newSecEl.textContent = String(leftSec);
            }, 250);
          }

          startNewTimer(nextDuration);
          card.addEventListener('mouseenter', pauseTimer);
          card.addEventListener('mouseleave', resumeTimer);
        }
      },

      success(msg, title, opt = {}) {
        this.update({ ...opt, type: 'success', message: msg, title: title || 'Changes saved' });
      },

      error(msg, title, opt = {}) {
        this.update({ ...opt, type: 'error', message: msg, title: title || 'Unable to complete request' });
      }
    };

    activeNotifications.set(dedupeKey, {
      el: card,
      resetTimer,
      handle
    });

    return handle;
  }

  // Convenience Methods
  const NotificationSystem = {
    notify,

    success(message, title, options = {}) {
      return notify({ ...options, type: 'success', message, title });
    },

    error(message, title, options = {}) {
      return notify({ ...options, type: 'error', message, title });
    },

    warning(message, title, options = {}) {
      return notify({ ...options, type: 'warning', message, title });
    },
    warn(message, title, options = {}) {
      return this.warning(message, title, options);
    },

    info(message, title, options = {}) {
      return notify({ ...options, type: 'info', message, title });
    },
    information(message, title, options = {}) {
      return this.info(message, title, options);
    },

    loading(message = 'We\'re processing your request...', title = 'Loading', options = {}) {
      return notify({ ...options, type: 'loading', message, title, duration: 0 });
    },

    // Persistent Error with Retry action button (exact match with design reference)
    persistentError(message, title = 'Persistent Error', onRetry) {
      return notify({
        type: 'error',
        title,
        message,
        persistent: true,
        action: {
          label: 'Retry',
          onClick: onRetry || (() => window.location.reload())
        }
      });
    },

    /**
     * Promise wrapper: automatically transitions Loading -> Success / Error
     */
    async promise(promiseOrFn, {
      loading = 'We\'re processing your request...',
      loadingTitle = 'Loading',
      success = 'Your changes have been saved successfully.',
      successTitle = 'Changes saved',
      error = 'Unable to complete request.',
      errorTitle = 'Unable to complete request'
    } = {}) {
      const toast = NotificationSystem.loading(loading, loadingTitle);
      try {
        const result = typeof promiseOrFn === 'function' ? await promiseOrFn() : await promiseOrFn;
        const succMsg = typeof success === 'function' ? success(result) : success;
        toast.success(succMsg, successTitle);
        return result;
      } catch (err) {
        const errMsg = typeof error === 'function' ? error(err) : (err.message || error);
        toast.error(errMsg, errorTitle);
        throw err;
      }
    },

    /**
     * Confirmation Dialog (Exact match with Design Reference)
     * Returns a Promise<boolean>
     */
    confirm(options = {}) {
      const opts = typeof options === 'string' ? { message: options } : options;
      const title = opts.title || 'Are you sure?';
      const message = opts.message || 'This action cannot be undone. The listing will be permanently removed from your account.';
      const confirmText = opts.confirmText || opts.okText || 'Delete';
      const cancelText = opts.cancelText || 'Cancel';
      const isDanger = opts.danger !== false;
      const iconType = opts.type || (isDanger ? 'error' : 'info');

      return new Promise((resolve) => {
        let backdrop = document.getElementById('surge-confirm-backdrop');
        if (!backdrop) {
          backdrop = document.createElement('div');
          backdrop.id = 'surge-confirm-backdrop';
          backdrop.className = 'surge-confirm-backdrop';
          document.body.appendChild(backdrop);
        }

        const iconHtml = iconType === 'error'
          ? `<div class="surge-confirm-icon-wrap">${ICONS.alertCircle}</div>`
          : (iconType === 'warning'
              ? `<div class="surge-confirm-icon-wrap warning">${ICONS.alertTriangle}</div>`
              : `<div class="surge-confirm-icon-wrap info">${ICONS.info}</div>`);

        backdrop.innerHTML = `
          <div class="surge-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="surge-confirm-title" aria-describedby="surge-confirm-desc">
            <div class="surge-confirm-header">
              ${iconHtml}
              <div class="surge-confirm-title-area">
                <div class="surge-confirm-title" id="surge-confirm-title">${escapeHtml(title)}</div>
                <div class="surge-confirm-message" id="surge-confirm-desc">${escapeHtml(message)}</div>
              </div>
              <button type="button" class="surge-confirm-close" aria-label="Close dialog">
                ${ICONS.close}
              </button>
            </div>
            <div class="surge-confirm-footer">
              <button type="button" class="surge-confirm-btn surge-confirm-btn-cancel">${escapeHtml(cancelText)}</button>
              <button type="button" class="surge-confirm-btn ${isDanger ? 'surge-confirm-btn-danger' : 'surge-confirm-btn-primary'}">${escapeHtml(confirmText)}</button>
            </div>
          </div>
        `;

        function cleanup(result) {
          backdrop.classList.remove('open');
          document.removeEventListener('keydown', onKeyDown);
          setTimeout(() => {
            if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
          }, 200);
          resolve(result);
        }

        function onKeyDown(e) {
          if (e.key === 'Escape') {
            e.preventDefault();
            cleanup(false);
          } else if (e.key === 'Enter') {
            e.preventDefault();
            cleanup(true);
          }
        }

        document.addEventListener('keydown', onKeyDown);

        const cancelBtn = backdrop.querySelector('.surge-confirm-btn-cancel');
        const confirmBtn = backdrop.querySelector('.surge-confirm-btn-danger, .surge-confirm-btn-primary');
        const closeBtn = backdrop.querySelector('.surge-confirm-close');

        cancelBtn.addEventListener('click', () => cleanup(false));
        closeBtn.addEventListener('click', () => cleanup(false));
        confirmBtn.addEventListener('click', () => cleanup(true));

        // Click outside backdrop to cancel
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) cleanup(false);
        });

        // Open dialog with smooth animation
        void backdrop.offsetWidth;
        backdrop.classList.add('open');
        confirmBtn.focus();
      });
    },

    /**
     * Inline & Form Errors (Design Reference Specification)
     */
    setFieldError(inputElOrId, message) {
      const input = typeof inputElOrId === 'string' ? document.getElementById(inputElOrId) : inputElOrId;
      if (!input) return;

      input.setAttribute('aria-invalid', 'true');
      input.classList.add('surge-input-error');

      // Check if wrapper exists
      let wrap = input.closest('.surge-input-has-error');
      if (!wrap && input.parentNode) {
        wrap = document.createElement('div');
        wrap.className = 'surge-input-has-error';
        input.parentNode.insertBefore(wrap, input);
        wrap.appendChild(input);
      }

      if (wrap) {
        let alertIcon = wrap.querySelector('.surge-input-alert-icon');
        if (!alertIcon) {
          alertIcon = document.createElement('div');
          alertIcon.className = 'surge-input-alert-icon';
          alertIcon.innerHTML = ICONS.formAlert;
          wrap.appendChild(alertIcon);
        }

        let errText = wrap.parentNode.querySelector(`.surge-form-error-text[data-for="${input.id}"]`);
        if (!errText) {
          errText = document.createElement('div');
          errText.className = 'surge-form-error-text';
          errText.dataset.for = input.id;
          wrap.parentNode.insertBefore(errText, wrap.nextSibling);
        }
        errText.textContent = message;
      }
    },

    clearFieldError(inputElOrId) {
      const input = typeof inputElOrId === 'string' ? document.getElementById(inputElOrId) : inputElOrId;
      if (!input) return;

      input.removeAttribute('aria-invalid');
      input.classList.remove('surge-input-error');

      const wrap = input.closest('.surge-input-has-error');
      if (wrap) {
        const alertIcon = wrap.querySelector('.surge-input-alert-icon');
        if (alertIcon) alertIcon.remove();

        const errText = wrap.parentNode.querySelector(`.surge-form-error-text[data-for="${input.id}"]`);
        if (errText) errText.remove();
      }
    },

    enhanceMessage
  };

  // Global Registration
  global.NotificationSystem = NotificationSystem;

  // Auto-init container when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureContainer);
  } else {
    ensureContainer();
  }

  // Keyboard shortcut: Escape dismisses topmost notification
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const container = document.getElementById('surge-notification-container');
      if (container && container.lastElementChild) {
        const closeBtn = container.lastElementChild.querySelector('.surge-notify-close');
        if (closeBtn) closeBtn.click();
      }
    }
  });

})(typeof window !== 'undefined' ? window : this);
