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

/**
 * 페이지 로드 시 텍스트 영역에 포커스
 */
document.addEventListener("DOMContentLoaded", () => {
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
const decodeAndFormatJSON = () => {
  try {
    const SPACE_COUNT = 4;
    const encodedData = elements.textarea.value;
    
    // 빈 입력값 체크
    if (!encodedData.trim()) {
      showStatus('입력 값이 없습니다');
      return;
    }
    
    const decodedData = decodeURIComponent(encodedData);
    const parsedJSON = JSON.parse(decodedData);
    const formattedJSON = JSON.stringify(parsedJSON, null, SPACE_COUNT);
    
    // 결과 표시
    elements.textarea.value = formattedJSON;
    elements.jsonOutput.textContent = formattedJSON.trim();
    hljs.highlightElement(elements.jsonOutput);
    toggleOutput(true);
    
  } catch (error) {
    showStatus(`오류: ${error.message}`);
    
    // 디코딩은 되었으나 JSON 파싱에 실패한 경우
    try {
      const decodedData = decodeURIComponent(elements.textarea.value);
      elements.textarea.value = decodedData;
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

// 초기화 버튼 클릭
elements.reset.addEventListener('click', () => {
  elements.textarea.value = '';
  elements.jsonOutput.textContent = '';
  toggleOutput(false);
});    