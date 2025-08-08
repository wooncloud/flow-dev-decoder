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
   * Show toast with comprehensive options
   * @param {string} message - Toast message
   * @param {object} options - Configuration options
   */
  show(message, options = {}) {
    const config = {
      type: 'info', // success, error, warning, info
      duration: this.defaultDuration,
      persistent: false,
      actions: [],
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

    // Custom actions
    config.actions.forEach(action => {
      const button = document.createElement('button');
      button.className = 'toast-action';
      button.textContent = action.label;
      button.onclick = (e) => {
        e.stopPropagation();
        if (action.handler) action.handler();
        if (!action.keepOpen) this.dismiss(id);
      };
      actionsContainer.appendChild(button);
    });

    // Dismiss button
    if (config.dismissible) {
      const dismissBtn = document.createElement('button');
      dismissBtn.className = 'toast-dismiss';
      dismissBtn.innerHTML = '×';
      dismissBtn.setAttribute('aria-label', '알림 닫기');
      dismissBtn.onclick = () => this.dismiss(id);
      actionsContainer.appendChild(dismissBtn);
    }

    if (actionsContainer.children.length > 0) {
      content.appendChild(actionsContainer);
    }

    // Progress bar for non-persistent toasts
    if (!config.persistent && config.duration > 0) {
      const progressBar = document.createElement('div');
      progressBar.className = 'toast-progress';
      toastElement.appendChild(progressBar);
      
      // Animate progress bar
      setTimeout(() => {
        progressBar.style.transform = 'scaleX(0)';
      }, 100);
    }

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

    // Pause timer on hover
    if (toast.timer) {
      toastElement.addEventListener('mouseenter', () => {
        if (toast.timer) {
          clearTimeout(toast.timer);
          toastElement.querySelector('.toast-progress')?.style.setProperty('animation-play-state', 'paused');
        }
      });

      toastElement.addEventListener('mouseleave', () => {
        const remaining = this.getRemainingTime(toastElement);
        toast.timer = setTimeout(() => this.dismiss(id), remaining);
        toastElement.querySelector('.toast-progress')?.style.setProperty('animation-play-state', 'running');
      });
    }

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

  getRemainingTime(element) {
    const progress = element.querySelector('.toast-progress');
    if (!progress) return 0;
    
    const style = getComputedStyle(progress);
    const duration = parseFloat(style.transitionDuration) * 1000;
    const transform = style.transform;
    
    if (transform && transform.includes('matrix')) {
      const matrix = transform.match(/matrix.*\((.+)\)/)[1].split(', ');
      const scaleX = parseFloat(matrix[0]);
      return duration * scaleX;
    }
    
    return duration;
  }

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
        transform: translateX(100%) scale(0.95);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .toast-enter {
        transform: translateX(0) scale(1);
        opacity: 1;
      }

      .toast-exit {
        transform: translateX(100%) scale(0.9);
        opacity: 0;
        transition: all 0.25s ease-in;
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

      .toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 2px;
        width: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2));
        transform-origin: left;
        transition: transform linear;
      }

      .toast-success .toast-progress {
        background: linear-gradient(90deg, rgba(76, 175, 80, 0.3), rgba(76, 175, 80, 0.6));
      }

      .toast-error .toast-progress {
        background: linear-gradient(90deg, rgba(244, 67, 54, 0.3), rgba(244, 67, 54, 0.6));
      }

      .toast-warning .toast-progress {
        background: linear-gradient(90deg, rgba(255, 152, 0, 0.3), rgba(255, 152, 0, 0.6));
      }

      .toast-info .toast-progress {
        background: linear-gradient(90deg, rgba(33, 150, 243, 0.3), rgba(33, 150, 243, 0.6));
      }

      /* Responsive adjustments */
      @media (max-width: 480px) {
        .toast-container {
          left: 20px;
          right: 20px;
          max-width: none;
        }
        
        .toast {
          transform: translateY(-100%) scale(0.95);
        }
        
        .toast-enter {
          transform: translateY(0) scale(1);
        }
        
        .toast-exit {
          transform: translateY(-100%) scale(0.9);
        }
      }
    `;
    
    // Insert styles with proper transition timing
    const progress = styles.textContent.match(/transition: transform linear;/g);
    if (progress) {
      styles.textContent = styles.textContent.replace(
        'transition: transform linear;',
        `transition: transform var(--duration, 4s) linear;`
      );
    }

    document.head.appendChild(styles);
  }
}

// Global toast instance
const toast = new ToastManager();

export default toast;