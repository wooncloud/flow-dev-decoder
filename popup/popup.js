// flow dev decoder

const copy = document.getElementById("copy");
const decoding = document.getElementById("decoding");
const reset = document.getElementById("reset");
const textarea = document.getElementById("textarea");
const jsonOutputContainer = document.getElementById("jsonOutputContainer");
const jsonOutput = document.getElementById("jsonOutput");
const statusLabel = document.getElementById("status");
let statusSetTimeoutAttr;

document.addEventListener("DOMContentLoaded", () => {
    textarea.focus();
});

const showStatus = (msg) => {
    const RESET_TIME = 2000;
    if (msg !== statusLabel.innerText) {
        statusLabel.innerText = msg;
        statusSetTimeoutAttr = setTimeout(() => {
            statusLabel.innerText = "";
            statusSetTimeoutAttr = null;
        }, RESET_TIME);
    } else {
        statusSetTimeoutAttr = statusSetTimeoutAttr 
            || (statusLabel.innerText = msg) 
            && setTimeout(() => {
            statusLabel.innerText = "";
            statusSetTimeoutAttr = null;
        }, RESET_TIME);
    }
}

const toggleOutput = (isResult) => {
    if (isResult) {
        jsonOutputContainer.style.display = "";
        textarea.style.display = "none";
    } else {
        jsonOutputContainer.style.display = "none";
        textarea.style.display = "";
    }
};

const formatAndCopyJSON = () => {
    try {
        const SPACE_COUNT = 4;
        const decodedData = decodeURIComponent(textarea.value);
        const parsedJSON = JSON.parse(decodedData);
        const formattedJSON = JSON.stringify(parsedJSON, null, SPACE_COUNT);
        textarea.value = formattedJSON;
        jsonOutput.textContent = formattedJSON.trim();
        hljs.highlightElement(jsonOutput);
        toggleOutput(true)
    } catch (e) {
        textarea.value = decodedData;
    }
};

decoding.addEventListener('click', formatAndCopyJSON);

copy.addEventListener('click', () => {
    if (textarea.value.trim() === "") return;
    navigator.clipboard.writeText(textarea.value);
    showStatus('클립보드에 복사되었습니다.')
});

reset.addEventListener('click', () => {
    textarea.value = '';
    jsonOutput.textContent = '';
    toggleOutput(false);
});    