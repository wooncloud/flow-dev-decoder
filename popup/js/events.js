import { elements } from './elements.js';
import { stateManager } from './state.js';
import { showStatus, toggleOutput, updateStorageStatus, toastUtils, toast } from './ui.js';
import { STORAGE_KEYS } from './constants.js';

/**
 * URL 인코딩된 JSON을 디코딩하고 포맷팅하는 함수
 * Enhanced with superior toast notifications and progress tracking
 * @returns {Promise<void>}
 */
const decodeAndFormatJSON = async () => {
  let progressToastId = null;
  
  try {
    const SPACE_COUNT = 4;
    const encodedData = elements.textarea.value;
    
    if (!encodedData.trim()) {
      toast.warning('입력 값이 없습니다', {
        actions: [{
          label: '예시 붙여넣기',
          handler: () => {
            elements.textarea.value = '%7B%22USER_ID%22%3A%22wooncloud%22%2C%22message%22%3A%22Hello%20World%22%7D';
            elements.textarea.focus();
          }
        }]
      });
      return;
    }
    
    // Show progress for longer operations
    progressToastId = toastUtils.decodingProgress();
    
    const originalInput = encodedData;
    const decodedData = decodeURIComponent(encodedData);
    const parsedJSON = JSON.parse(decodedData);
    const formattedJSON = JSON.stringify(parsedJSON, null, SPACE_COUNT);
    
    elements.textarea.value = formattedJSON;
    elements.jsonOutput.textContent = formattedJSON.trim();
    hljs.highlightElement(elements.jsonOutput);
    toggleOutput(true);
    
    updateStorageStatus('saving');
    await stateManager.update({
      [STORAGE_KEYS.ORIGINAL_INPUT]: originalInput,
      [STORAGE_KEYS.CURRENT_TEXT]: formattedJSON,
      [STORAGE_KEYS.IS_DECODED]: true,
      [STORAGE_KEYS.HAS_RESULT]: true
    });
    updateStorageStatus('saved');
    
    // Dismiss progress and show success
    if (progressToastId) toast.dismiss(progressToastId);
    toastUtils.decodingSuccess();
    
  } catch (error) {
    // Dismiss progress toast
    if (progressToastId) toast.dismiss(progressToastId);
    
    if (error instanceof URIError) {
      toastUtils.decodingError('URL 디코딩에 실패했습니다. 입력값을 확인해주세요.', () => {
        elements.textarea.focus();
        elements.textarea.select();
      });
      updateStorageStatus('hidden');
      return;
    }
    
    if (error instanceof SyntaxError) {
      toastUtils.decodingError('잘못된 JSON 형식입니다. 내용을 확인해주세요.', () => decodeAndFormatJSON());
    } else {
      toastUtils.decodingError('데이터 처리 중 오류가 발생했습니다.', () => decodeAndFormatJSON());
    }
    
    try {
      const originalInput = elements.textarea.value;
      const decodedData = decodeURIComponent(elements.textarea.value);
      elements.textarea.value = decodedData;
      
      updateStorageStatus('saving');
      await stateManager.update({
        [STORAGE_KEYS.ORIGINAL_INPUT]: originalInput,
        [STORAGE_KEYS.CURRENT_TEXT]: decodedData,
        [STORAGE_KEYS.IS_DECODED]: false,
        [STORAGE_KEYS.HAS_RESULT]: false
      });
      updateStorageStatus('saved');
    } catch (e) {
      toast.error('디코딩 실패', { duration: 1000 });
      updateStorageStatus('hidden');
    }
  }
};

/**
 * 이벤트 리스너들을 초기화하는 함수
 * Enhanced with superior user experience and toast notifications
 * @returns {void}
 */
export const initializeEventListeners = () => {
  elements.decoding.addEventListener('click', decodeAndFormatJSON);

  elements.copy.addEventListener('click', async () => {
    const text = elements.textarea.value.trim();
    if (!text) {
      toast.warning('복사할 내용이 없습니다', {
        actions: [{
          label: '예시 데이터 생성',
          handler: () => {
            elements.textarea.value = '{"example": "data", "timestamp": "' + new Date().toISOString() + '"}';
            elements.textarea.focus();
          }
        }]
      });
      return;
    }
    
    try {
      await navigator.clipboard.writeText(text);
      toastUtils.copySuccess();
    } catch (error) {
      // Fallback for older browsers or permission issues
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        toastUtils.copySuccess();
      } catch (fallbackError) {
        toast.error('복사 실패: 브라우저가 클립보드 접근을 지원하지 않습니다', {
          duration: 2000,
          actions: [{
            label: '수동 복사',
            handler: () => {
              textArea.select();
              toast.info('Ctrl+C 또는 Cmd+C를 눌러 복사하세요');
            }
          }]
        });
      } finally {
        document.body.removeChild(textArea);
      }
    }
  });

  elements.reset.addEventListener('click', async () => {
    // Confirm before clearing with action toast
    const confirmToastId = toast.warning('모든 내용을 초기화하시겠습니까?', {
      duration: 0,
      actions: [
        {
          label: '취소',
          handler: () => toast.dismiss(confirmToastId)
        },
        {
          label: '초기화',
          handler: async () => {
            toast.dismiss(confirmToastId);
            
            try {
              elements.textarea.value = '';
              elements.jsonOutput.textContent = '';
              toggleOutput(false);
              updateStorageStatus('saving');
              await stateManager.clear();
              updateStorageStatus('saved');
              
              toast.success('상태가 초기화되었습니다', {
                duration: 1000,
                actions: [{
                  label: '되돌리기',
                  handler: () => {
                    toast.info('되돌리기 기능은 곧 추가될 예정입니다');
                  }
                }]
              });
              
              elements.textarea.focus();
            } catch (error) {
              toast.error(`초기화 실패: ${error.message}`);
              updateStorageStatus('hidden');
            }
          }
        }
      ]
    });
  });

  elements.textarea.addEventListener('input', () => {
    // '저장 중' 상태로 UI 업데이트
    updateStorageStatus('saving');

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