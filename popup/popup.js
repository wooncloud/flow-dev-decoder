import { elements } from './js/elements.js';
import { stateManager } from './js/state.js';
import { showStatus, restoreUI } from './js/ui.js';
import { initializeEventListeners } from './js/events.js';

/**
 * 애플리케이션 초기화 함수
 */
const initialize = async () => {
  try {
    // 1. 저장된 상태를 불러옵니다.
    const state = await stateManager.load();
    
    // 2. 불러온 상태를 기반으로 UI를 복원합니다.
    restoreUI(state);
    
    // 3. 모든 이벤트 리스너를 등록합니다.
    initializeEventListeners();
    
    // 4. 텍스트 영역에 포커스를 줍니다.
    elements.textarea.focus();
    
  } catch (error) {
    // 상태 로딩 실패 시 사용자에게 알립니다.
    showStatus(error.message);
  }
};

// 페이지 로드가 완료되면 애플리케이션을 초기화합니다.
document.addEventListener("DOMContentLoaded", initialize);    