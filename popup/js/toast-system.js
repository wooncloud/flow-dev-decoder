/**
 * Superior Toast System - Professional-grade notification system
 * Features: Queue management, multiple types, accessibility, animations, actions
 */

class ToastManager {
  constructor() {
    this.toasts = new Map();
    this.container = null;
    this.maxToasts = 5;
    this.defaultDuration = 1000;
    this.init();
  }

  init() {
    this.createContainer();
    this.injectStyles();
  }

  createContainer() {
    if (this.container) return;
    
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.setAttribute('aria-live', 'polite');
    this.container.setAttribute('aria-label', '알림');
    document.body.appendChild(this.container);
  }

  /**
   * Show simple toast notification
   * @param {string} message - Toast message
   * @param {object} options - Configuration options
   */
  show(message, options = {}) {
    const config = {
      type: 'info', // success, error, warning, info
      duration: this.defaultDuration,
      persistent: false,
      dismissible: true,
      ...options
    };

    const toast = this.createToast(message, config);
    this.addToast(toast);
    
    return toast.id;
  }

  // Convenience methods
  success(message, options = {}) {
    return this.show(message, { ...options, type: 'success' });
  }

  error(message, options = {}) {
    return this.show(message, { ...options, type: 'error', duration: 2000 });
  }

  warning(message, options = {}) {
    return this.show(message, { ...options, type: 'warning', duration: 1500 });
  }

  info(message, options = {}) {
    return this.show(message, { ...options, type: 'info' });
  }

  createToast(message, config) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const toastElement = document.createElement('div');
    toastElement.className = `toast toast-${config.type}`;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', config.type === 'error' ? 'assertive' : 'polite');
    toastElement.id = id;

    // Toast content structure
    const content = document.createElement('div');
    content.className = 'toast-content';

    // Icon based on type
    const icon = this.createIcon(config.type);
    content.appendChild(icon);

    // Message
    const messageElement = document.createElement('div');
    messageElement.className = 'toast-message';
    messageElement.textContent = message;
    content.appendChild(messageElement);

    // Actions
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'toast-actions';

    // Actions removed for cleaner UX

    // Dismiss button
    if (config.dismissible) {
      const dismissBtn = document.createElement('button');
      dismissBtn.className = 'toast-dismiss';
      dismissBtn.innerHTML = '×';
      dismissBtn.setAttribute('aria-label', '알림 닫기');
      dismissBtn.onclick = () => this.dismiss(id);
      actionsContainer.appendChild(dismissBtn);
    }

    // Only add dismiss button if dismissible
    if (config.dismissible && actionsContainer.children.length > 0) {
      content.appendChild(actionsContainer);
    }

    // No progress bar - simplified design

    toastElement.appendChild(content);

    const toast = {
      id,
      element: toastElement,
      config,
      timer: null
    };

    // Auto-dismiss timer
    if (!config.persistent && config.duration > 0) {
      toast.timer = setTimeout(() => this.dismiss(id), config.duration);
    }

    // Simple timer without hover pause for better UX

    return toast;
  }

  createIcon(type) {
    const icon = document.createElement('div');
    icon.className = 'toast-icon';
    
    const iconMap = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    
    icon.textContent = iconMap[type] || iconMap.info;
    return icon;
  }

  addToast(toast) {
    // Limit number of toasts
    if (this.toasts.size >= this.maxToasts) {
      const oldestId = this.toasts.keys().next().value;
      this.dismiss(oldestId);
    }

    this.toasts.set(toast.id, toast);
    this.container.appendChild(toast.element);

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.element.classList.add('toast-enter');
    });

    // Focus management for screen readers
    if (toast.config.type === 'error') {
      toast.element.focus();
    }
  }

  dismiss(id) {
    const toast = this.toasts.get(id);
    if (!toast) return;

    if (toast.timer) {
      clearTimeout(toast.timer);
    }

    toast.element.classList.add('toast-exit');
    
    setTimeout(() => {
      if (toast.element.parentNode) {
        toast.element.parentNode.removeChild(toast.element);
      }
      this.toasts.delete(id);
    }, 300);
  }

  dismissAll() {
    Array.from(this.toasts.keys()).forEach(id => this.dismiss(id));
  }

  // Removed getRemainingTime method - not needed without progress bars

  injectStyles() {
    if (document.getElementById('toast-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'toast-styles';
    styles.textContent = `
      .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        pointer-events: none;
        max-width: 400px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .toast {
        pointer-events: auto;
        background: rgba(40, 44, 52, 0.98);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        overflow: hidden;
        position: relative;
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .toast-enter {
        opacity: 1;
      }

      .toast-exit {
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .toast-content {
        display: flex;
        align-items: flex-start;
        padding: 16px 20px;
        gap: 12px;
        min-height: 24px;
      }

      .toast-icon {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .toast-success .toast-icon {
        background: linear-gradient(135deg, #4CAF50, #45a049);
        color: white;
      }

      .toast-error .toast-icon {
        background: linear-gradient(135deg, #f44336, #d32f2f);
        color: white;
      }

      .toast-warning .toast-icon {
        background: linear-gradient(135deg, #ff9800, #f57c00);
        color: white;
      }

      .toast-info .toast-icon {
        background: linear-gradient(135deg, #2196F3, #1976D2);
        color: white;
      }

      .toast-message {
        color: #e0e0e0;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.4;
        flex: 1;
        word-wrap: break-word;
      }

      .toast-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: auto;
        flex-shrink: 0;
      }

      .toast-action {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        color: #e0e0e0;
        padding: 4px 12px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .toast-action:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
      }

      .toast-dismiss {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.2s ease;
        line-height: 1;
      }

      .toast-dismiss:hover {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.9);
        transform: scale(1.1);
      }

      /* Progress bars removed for cleaner design */

      /* Responsive adjustments */
      @media (max-width: 480px) {
        .toast-container {
          left: 20px;
          right: 20px;
          max-width: none;
        }
      }
    `;
    
    // Simplified styles - no complex timing

    document.head.appendChild(styles);
  }
}

// Global toast instance
const toast = new ToastManager();

export default toast;