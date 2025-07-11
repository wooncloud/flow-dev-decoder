/**
 * flow dev decoder
 * URL 인코딩된 JSON 데이터를 디코딩하고 포맷팅하는 확장 프로그램
 */

// DOM 요소 선택
const elements = {
  copy: document.getElementById("copy"),
  decoding: document.getElementById("decoding"),
  reset: document.getElementById("reset"),
  textarea: document.getElementById("textarea"),
  jsonOutputContainer: document.getElementById("jsonOutputContainer"),
  jsonOutput: document.getElementById("jsonOutput"),
  statusLabel: document.getElementById("status")
};

// 상태 표시 관련 변수 및 설정
const STATUS_DISPLAY_TIME = 2000; // 상태 메시지 표시 시간 (ms)
let statusTimeoutId = null;

// 저장소 키 상수
const STORAGE_KEYS = {
  INPUT_TEXT: 'inputText',
  IS_DECODED: 'isDecoded',
  DECODED_RESULT: 'decodedResult',
  HAS_RESULT: 'hasResult',
  ORIGINAL_INPUT: 'originalInput'
};

/**
 * 상태를 저장소에 저장하는 함수
 * @param {Object} state - 저장할 상태 객체
 */
const saveState = async (state) => {
  try {
    await chrome.storage.session.set(state);
  } catch (error) {
    console.error('상태 저장 실패:', error);
  }
};

/**
 * 저장소에서 상태를 불러오는 함수
 * @returns {Object} 저장된 상태 객체
 */
const loadState = async () => {
  try {
    const result = await chrome.storage.session.get(Object.values(STORAGE_KEYS));
    return result;
  } catch (error) {
    console.error('상태 불러오기 실패:', error);
    return {};
  }
};

/**
 * 저장소의 모든 상태를 제거하는 함수
 */
const clearState = async () => {
  try {
    await chrome.storage.session.clear();
  } catch (error) {
    console.error('상태 제거 실패:', error);
  }
};



/**
 * 저장된 상태를 복원하는 함수
 */
const restoreState = async () => {
  const state = await loadState();
  
  // 디코딩 상태에 따라 적절한 값을 textarea에 설정
  if (state[STORAGE_KEYS.IS_DECODED] && state[STORAGE_KEYS.DECODED_RESULT]) {
    // 디코딩 후 상태라면 디코딩 결과를 표시
    elements.textarea.value = state[STORAGE_KEYS.DECODED_RESULT];
  } else if (state[STORAGE_KEYS.ORIGINAL_INPUT]) {
    // 디코딩 전 상태라면 원본 입력을 표시
    elements.textarea.value = state[STORAGE_KEYS.ORIGINAL_INPUT];
  } else if (state[STORAGE_KEYS.INPUT_TEXT]) {
    // 호환성을 위해 기존 INPUT_TEXT도 확인
    elements.textarea.value = state[STORAGE_KEYS.INPUT_TEXT];
  }
  
  // 디코딩 결과가 있다면 JSON 출력 영역에 설정
  if (state[STORAGE_KEYS.HAS_RESULT] && state[STORAGE_KEYS.DECODED_RESULT]) {
    elements.jsonOutput.textContent = state[STORAGE_KEYS.DECODED_RESULT];
    hljs.highlightElement(elements.jsonOutput);
    
    // 디코딩 후 상태라면 결과를 표시
    if (state[STORAGE_KEYS.IS_DECODED]) {
      toggleOutput(true);
    }
  }
};

/**
 * 페이지 로드 시 저장된 상태를 복원하고 텍스트 영역에 포커스
 */
document.addEventListener("DOMContentLoaded", async () => {
  await restoreState();
  elements.textarea.focus();
});

/**
 * 상태 메시지를 표시하는 함수
 * @param {string} message - 표시할 메시지
 */
const showStatus = (message) => {
  // 이전 타이머가 있으면 초기화
  if (statusTimeoutId) {
    clearTimeout(statusTimeoutId);
    statusTimeoutId = null;
  }
  
  // 상태 메시지 설정 및 표시
  elements.statusLabel.innerText = message;
  elements.statusLabel.style.display = "block";
  
  // 일정 시간 후 메시지 숨김
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
const toggleOutput = (showResult) => {
  elements.jsonOutputContainer.style.display = showResult ? "" : "none";
  elements.textarea.style.display = showResult ? "none" : "";
};

/**
 * URL 인코딩된 JSON을 디코딩하고 포맷팅하는 함수
 */
const decodeAndFormatJSON = async () => {
  try {
    const SPACE_COUNT = 4;
    const encodedData = elements.textarea.value;
    
    // 빈 입력값 체크
    if (!encodedData.trim()) {
      showStatus('입력 값이 없습니다');
      return;
    }
    
    // 원본 입력 데이터 저장
    const originalInput = encodedData;
    
    const decodedData = decodeURIComponent(encodedData);
    const parsedJSON = JSON.parse(decodedData);
    const formattedJSON = JSON.stringify(parsedJSON, null, SPACE_COUNT);
    
    // 결과 표시
    elements.textarea.value = formattedJSON;
    elements.jsonOutput.textContent = formattedJSON.trim();
    hljs.highlightElement(elements.jsonOutput);
    toggleOutput(true);
    
    // 상태 저장 (원본 입력 데이터 별도 저장)
    await saveState({
      [STORAGE_KEYS.ORIGINAL_INPUT]: originalInput,
      [STORAGE_KEYS.INPUT_TEXT]: formattedJSON,
      [STORAGE_KEYS.IS_DECODED]: true,
      [STORAGE_KEYS.DECODED_RESULT]: formattedJSON.trim(),
      [STORAGE_KEYS.HAS_RESULT]: true
    });
    
  } catch (error) {
    showStatus(`오류: ${error.message}`);
    
    // 디코딩은 되었으나 JSON 파싱에 실패한 경우
    try {
      const originalInput = elements.textarea.value;
      const decodedData = decodeURIComponent(elements.textarea.value);
      elements.textarea.value = decodedData;
      
      // 상태 저장 (원본 입력 데이터 별도 저장)
      await saveState({
        [STORAGE_KEYS.ORIGINAL_INPUT]: originalInput,
        [STORAGE_KEYS.INPUT_TEXT]: decodedData,
        [STORAGE_KEYS.IS_DECODED]: false,
        [STORAGE_KEYS.DECODED_RESULT]: '',
        [STORAGE_KEYS.HAS_RESULT]: false
      });
    } catch (e) {
      showStatus('디코딩 실패');
    }
  }
};

/**
 * 이벤트 리스너 등록
 */
// 디코딩 버튼 클릭
elements.decoding.addEventListener('click', decodeAndFormatJSON);

// 복사 버튼 클릭
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

// 초기화 버튼 클릭 - 저장 상태도 모두 제거
elements.reset.addEventListener('click', async () => {
  elements.textarea.value = '';
  elements.jsonOutput.textContent = '';
  toggleOutput(false);
  
  // 저장된 상태 모두 제거
  await clearState();
  showStatus('상태가 초기화되었습니다');
});

// textarea 실시간 입력 저장
elements.textarea.addEventListener('input', async () => {
  const state = await loadState();
  
  // 현재 디코딩 상태에 따라 적절한 키에 저장
  if (state[STORAGE_KEYS.IS_DECODED]) {
    // 디코딩 후 상태라면 디코딩 결과를 업데이트
    await saveState({
      ...state,
      [STORAGE_KEYS.INPUT_TEXT]: elements.textarea.value,
      [STORAGE_KEYS.DECODED_RESULT]: elements.textarea.value
    });
  } else {
    // 디코딩 전 상태라면 원본 입력을 업데이트
    await saveState({
      ...state,
      [STORAGE_KEYS.INPUT_TEXT]: elements.textarea.value,
      [STORAGE_KEYS.ORIGINAL_INPUT]: elements.textarea.value
    });
  }
});

// textarea 클릭 시 원본 입력으로 돌아가기
elements.textarea.addEventListener('click', async () => {
  if (elements.jsonOutputContainer.style.display !== 'none') {
    // 현재 디코딩 결과를 보고 있는 상태라면 원본 입력으로 돌아가기
    const state = await loadState();
    if (state[STORAGE_KEYS.ORIGINAL_INPUT]) {
      elements.textarea.value = state[STORAGE_KEYS.ORIGINAL_INPUT];
    }
    toggleOutput(false);
    
    // 상태 업데이트 (디코딩 전 상태로 변경)
    await saveState({
      ...state,
      [STORAGE_KEYS.INPUT_TEXT]: state[STORAGE_KEYS.ORIGINAL_INPUT] || '',
      [STORAGE_KEYS.IS_DECODED]: false
    });
  }
});

// JSON 결과 영역 클릭 시 다시 결과 보기
elements.jsonOutputContainer.addEventListener('click', async () => {
  if (elements.textarea.style.display !== 'none') {
    const state = await loadState();
    if (state[STORAGE_KEYS.DECODED_RESULT]) {
      elements.textarea.value = state[STORAGE_KEYS.DECODED_RESULT];
    }
    toggleOutput(true);
    
    // 상태 업데이트 (디코딩 후 상태로 변경)
    await saveState({
      ...state,
      [STORAGE_KEYS.INPUT_TEXT]: state[STORAGE_KEYS.DECODED_RESULT] || '',
      [STORAGE_KEYS.IS_DECODED]: true
    });
  }
});

// textarea에서 키보드 단축키 처리
elements.textarea.addEventListener('keydown', (event) => {
  // Windows/Linux: Control + Enter
  // Mac: Cmd + Enter
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault(); // 기본 동작 방지
    decodeAndFormatJSON();
  }
});    