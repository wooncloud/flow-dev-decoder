import { elements } from './elements.js';
import { STATUS_DISPLAY_TIME, STORAGE_KEYS } from './constants.js';
import toast from './toast-system.js';

let statusTimeoutId = null;
let hideStatusTimer = null;

/**
 * 스토리지 상태 표시기를 업데이트하는 함수
 * @param {'saving' | 'saved' | 'hidden'} status 
 */
export const updateStorageStatus = (status) => {
  const indicator = elements.storageStatusIndicator;
  
  if (hideStatusTimer) {
    clearTimeout(hideStatusTimer);
    hideStatusTimer = null;
  }
  
  indicator.className = '';

  if (status === 'saving' || status === 'saved') {
    indicator.classList.add(status);
  }

  if (status === 'saved') {
    hideStatusTimer = setTimeout(() => {
      indicator.className = '';
    }, STATUS_DISPLAY_TIME);
  }
};

/**
 * 상태 메시지를 표시하는 함수 (Legacy fallback)
 * @param {string} message - 표시할 메시지
 * @deprecated Use toast.show() instead for better UX
 */
export const showStatus = (message) => {
  // Detect message type and use appropriate toast
  const messageType = detectMessageType(message);
  
  // Use superior toast system
  switch (messageType) {
    case 'success':
      toast.success(message);
      break;
    case 'error':
      toast.error(message, { persistent: false });
      break;
    case 'warning':
      toast.warning(message);
      break;
    default:
      toast.info(message);
  }
  
  // Legacy fallback for compatibility
  if (statusTimeoutId) {
    clearTimeout(statusTimeoutId);
    statusTimeoutId = null;
  }

  elements.statusLabel.innerText = message;
  elements.statusLabel.classList.add('show');

  statusTimeoutId = setTimeout(() => {
    elements.statusLabel.classList.remove('show');
    setTimeout(() => {
      elements.statusLabel.innerText = "";
    }, 300);
    statusTimeoutId = null;
  }, STATUS_DISPLAY_TIME);
};

/**
 * Intelligent message type detection
 * @param {string} message - Message to analyze
 * @returns {string} Message type
 */
const detectMessageType = (message) => {
  const lower = message.toLowerCase();
  
  if (lower.includes('복사') || lower.includes('저장') || lower.includes('완료') || lower.includes('성공')) {
    return 'success';
  }
  
  if (lower.includes('오류') || lower.includes('실패') || lower.includes('에러') || lower.includes('error')) {
    return 'error';
  }
  
  if (lower.includes('경고') || lower.includes('주의') || lower.includes('warning')) {
    return 'warning';
  }
  
  return 'info';
};

/**
 * JSON 결과와 입력 텍스트 영역 간 전환
 * @param {boolean} showResult - true면 결과를 표시, false면 입력 영역 표시
 */
export const toggleOutput = (showResult) => {
  elements.jsonOutputContainer.style.display = showResult ? "" : "none";
  elements.textarea.style.display = showResult ? "none" : "";
};

/**
 * 저장된 상태를 기반으로 UI를 복원하는 함수
 * @param {object} state - 현재 상태 객체
 */
export const restoreUI = (state) => {
  const isDecoded = state[STORAGE_KEYS.IS_DECODED];
  const currentText = state[STORAGE_KEYS.CURRENT_TEXT];
  const originalInput = state[STORAGE_KEYS.ORIGINAL_INPUT];
  const hasResult = state[STORAGE_KEYS.HAS_RESULT];

  // 텍스트 영역 복원
  const textToShow = isDecoded 
    ? currentText 
    : (originalInput || currentText);
  
  elements.textarea.value = textToShow || '';

  // 디코딩 결과가 있는 경우 JSON 출력 영역 설정
  if (hasResult && isDecoded) {
    elements.jsonOutput.textContent = currentText;
    hljs.highlightElement(elements.jsonOutput);
    toggleOutput(true);
  } else {
    toggleOutput(false);
  }
};

/**
 * Enhanced toast utilities for specific use cases
 */
export const toastUtils = {
  /**
   * Show simple copy success toast
   */
  copySuccess: (message = '클립보드에 복사되었습니다') => {
    return toast.success(message);
  },

  /**
   * Show decoding progress
   */
  decodingProgress: () => {
    return toast.info('디코딩 중...', {
      persistent: true,
      dismissible: false
    });
  },

  /**
   * Show simple decoding success
   */
  decodingSuccess: (message = '디코딩이 완료되었습니다') => {
    return toast.success(message);
  },

  /**
   * Show simple error message
   */
  decodingError: (message) => {
    return toast.error(message);
  },

  /**
   * Show storage status with visual indicator
   */
  storageStatus: (status, message) => {
    const config = {
      saving: { type: 'info', message: message || '저장 중...' },
      saved: { type: 'success', message: message || '저장되었습니다' },
      error: { type: 'error', message: message || '저장에 실패했습니다' }
    };
    
    const { type, message: msg } = config[status] || config.saved;
    return toast[type](msg, { duration: 1000 });
  }
};

// Export toast system for advanced usage
export { toast };
