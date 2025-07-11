import { STORAGE_KEYS, SAVE_DEBOUNCE_DELAY } from './constants.js';
import { updateStorageStatus } from './ui.js';

let saveDebounceTimer = null;

/**
 * 상태 관리 클래스
 */
class StateManager {
  constructor() {
    this.currentState = {
      [STORAGE_KEYS.CURRENT_TEXT]: '',
      [STORAGE_KEYS.ORIGINAL_INPUT]: '',
      [STORAGE_KEYS.IS_DECODED]: false,
      [STORAGE_KEYS.HAS_RESULT]: false
    };
    this.isLoaded = false;
  }

  /**
   * 초기 상태 로드
   * @returns {Promise<object>}
   */
  async load() {
    try {
      const result = await chrome.storage.session.get(Object.values(STORAGE_KEYS));
      this.currentState = { ...this.currentState, ...result };
      this.isLoaded = true;
      return this.currentState;
    } catch (error) {
      console.error('상태 불러오기 실패:', error);
      this.isLoaded = true;
      throw new Error('상태를 불러오는데 실패했습니다.');
    }
  }

  /**
   * 상태 업데이트 (메모리와 스토리지 동시 업데이트)
   * @param {object} newState
   */
  async update(newState) {
    this.currentState = { ...this.currentState, ...newState };
    try {
      await chrome.storage.session.set(newState);
    } catch (error) {
      console.error('상태 저장 실패:', error);
      throw new Error('상태를 저장하는데 실패했습니다.');
    }
  }

  /**
   * 디바운싱된 상태 저장
   * @param {object} newState
   */
  updateDebounced(newState) {
    this.currentState = { ...this.currentState, ...newState };
    
    if (saveDebounceTimer) {
      clearTimeout(saveDebounceTimer);
    }
    
    saveDebounceTimer = setTimeout(async () => {
      try {
        await chrome.storage.session.set(newState);
        // '저장 완료' 상태로 변경
        updateStorageStatus('saved');
      } catch (error) {
        console.error('상태 저장 실패:', error);
        // 실패 시 상태 표시기 숨김
        updateStorageStatus('hidden');
      }
      saveDebounceTimer = null;
    }, SAVE_DEBOUNCE_DELAY);
  }

  /**
   * 모든 상태 제거
   */
  async clear() {
    this.currentState = {
      [STORAGE_KEYS.CURRENT_TEXT]: '',
      [STORAGE_KEYS.ORIGINAL_INPUT]: '',
      [STORAGE_KEYS.IS_DECODED]: false,
      [STORAGE_KEYS.HAS_RESULT]: false
    };
    
    try {
      await chrome.storage.session.clear();
    } catch (error) {
      console.error('상태 제거 실패:', error);
      throw new Error('상태를 초기화하는데 실패했습니다.');
    }
  }

  /**
   * 현재 상태 반환
   * @returns {object}
   */
  get() {
    return this.currentState;
  }
}

export const stateManager = new StateManager(); 