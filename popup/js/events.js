import { elements } from './elements.js';
import { stateManager } from './state.js';
import { showStatus, toggleOutput } from './ui.js';
import { STORAGE_KEYS } from './constants.js';

/**
 * URL 인코딩된 JSON을 디코딩하고 포맷팅하는 함수
 */
const decodeAndFormatJSON = async () => {
  try {
    const SPACE_COUNT = 4;
    const encodedData = elements.textarea.value;
    
    if (!encodedData.trim()) {
      showStatus('입력 값이 없습니다');
      return;
    }
    
    const originalInput = encodedData;
    const decodedData = decodeURIComponent(encodedData);
    const parsedJSON = JSON.parse(decodedData);
    const formattedJSON = JSON.stringify(parsedJSON, null, SPACE_COUNT);
    
    elements.textarea.value = formattedJSON;
    elements.jsonOutput.textContent = formattedJSON.trim();
    hljs.highlightElement(elements.jsonOutput);
    toggleOutput(true);
    
    await stateManager.update({
      [STORAGE_KEYS.ORIGINAL_INPUT]: originalInput,
      [STORAGE_KEYS.CURRENT_TEXT]: formattedJSON,
      [STORAGE_KEYS.IS_DECODED]: true,
      [STORAGE_KEYS.HAS_RESULT]: true
    });
    
  } catch (error) {
    showStatus(`오류: ${error.message}`);
    
    try {
      const originalInput = elements.textarea.value;
      const decodedData = decodeURIComponent(elements.textarea.value);
      elements.textarea.value = decodedData;
      
      await stateManager.update({
        [STORAGE_KEYS.ORIGINAL_INPUT]: originalInput,
        [STORAGE_KEYS.CURRENT_TEXT]: decodedData,
        [STORAGE_KEYS.IS_DECODED]: false,
        [STORAGE_KEYS.HAS_RESULT]: false
      });
    } catch (e) {
      showStatus('디코딩 실패');
    }
  }
};

/**
 * 이벤트 리스너들을 초기화하는 함수
 */
export const initializeEventListeners = () => {
  elements.decoding.addEventListener('click', decodeAndFormatJSON);

  elements.copy.addEventListener('click', () => {
    const text = elements.textarea.value.trim();
    if (!text) {
      showStatus('복사할 내용이 없습니다');
      return;
    }
    
    navigator.clipboard.writeText(text)
      .then(() => showStatus('클립보드에 복사되었습니다'))
      .catch(() => showStatus('복사 실패'));
  });

  elements.reset.addEventListener('click', async () => {
    try {
      elements.textarea.value = '';
      elements.jsonOutput.textContent = '';
      toggleOutput(false);
      await stateManager.clear();
      showStatus('상태가 초기화되었습니다');
    } catch (error) {
      showStatus(error.message);
    }
  });

  elements.textarea.addEventListener('input', () => {
    const state = stateManager.get();
    const currentValue = elements.textarea.value;
    
    const newState = state[STORAGE_KEYS.IS_DECODED]
      ? { [STORAGE_KEYS.CURRENT_TEXT]: currentValue }
      : { [STORAGE_KEYS.CURRENT_TEXT]: currentValue, [STORAGE_KEYS.ORIGINAL_INPUT]: currentValue };
      
    stateManager.updateDebounced(newState);
  });

  elements.textarea.addEventListener('click', async () => {
    if (elements.jsonOutputContainer.style.display !== 'none') {
      const state = stateManager.get();
      const originalInput = state[STORAGE_KEYS.ORIGINAL_INPUT];
      
      elements.textarea.value = originalInput || '';
      toggleOutput(false);
      
      try {
        await stateManager.update({
          [STORAGE_KEYS.CURRENT_TEXT]: originalInput || '',
          [STORAGE_KEYS.IS_DECODED]: false
        });
      } catch(error) {
        showStatus(error.message);
      }
    }
  });

  elements.jsonOutputContainer.addEventListener('click', async () => {
    if (elements.textarea.style.display !== 'none') {
      const state = stateManager.get();
      const decodedResult = state[STORAGE_KEYS.CURRENT_TEXT];
      
      if (state[STORAGE_KEYS.HAS_RESULT] && decodedResult) {
        elements.textarea.value = decodedResult;
        toggleOutput(true);
        
        try {
          await stateManager.update({ [STORAGE_KEYS.IS_DECODED]: true });
        } catch (error) {
          showStatus(error.message);
        }
      }
    }
  });

  elements.textarea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      decodeAndFormatJSON();
    }
  });
}; 