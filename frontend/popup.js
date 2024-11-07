// Elements
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const statusText = document.getElementById("status");

// Send a message to the background script to start the translation process
function startTranslation() {
    startButton.disabled = true;
    stopButton.disabled = false;
    statusText.textContent = "Status: Translating...";

    // Send start message to the background script
    chrome.runtime.sendMessage({ action: "startTranslation" }, (response) => {
        if (response && response.status === "started") {
            console.log("Translation started successfully.");
        } else {
            console.error("Failed to start translation.");
            resetUI();
        }
    });
}

// Send a message to the background script to stop the translation process
function stopTranslation() {
    startButton.disabled = false;
    stopButton.disabled = true;
    statusText.textContent = "Status: Stopped";

    // Send stop message to the background script
    chrome.runtime.sendMessage({ action: "stopTranslation" }, (response) => {
        if (response && response.status === "stopped") {
            console.log("Translation stopped successfully.");
        } else {
            console.error("Failed to stop translation.");
        }
    });
}

// Reset UI elements
function resetUI() {
    startButton.disabled = false;
    stopButton.disabled = true;
    statusText.textContent = "Status: Ready";
}

// Event listeners
startButton.addEventListener("click", startTranslation);
stopButton.addEventListener("click", stopTranslation);

// Listen for messages from the background script to update UI
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "updateStatus" && message.status) {
        statusText.textContent = `Status: ${message.status}`;
    }
});
