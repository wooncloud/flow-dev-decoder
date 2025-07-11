import { elements } from './elements.js';
import { STATUS_DISPLAY_TIME, STORAGE_KEYS } from './constants.js';

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
 * 상태 메시지를 표시하는 함수
 * @param {string} message - 표시할 메시지
 */
export const showStatus = (message) => {
  if (statusTimeoutId) {
    clearTimeout(statusTimeoutId);
    statusTimeoutId = null;
  }
  
  elements.statusLabel.innerText = message;
  elements.statusLabel.style.display = "block";
  
  statusTimeoutId = setTimeout(() => {
    elements.statusLabel.innerText = "";
    elements.statusLabel.style.display = "none";
    statusTimeoutId = null;
  }, STATUS_DISPLAY_TIME);
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