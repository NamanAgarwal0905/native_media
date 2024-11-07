let isTranslating = false;
let translationProcess = null;
let playbackQueue = []; // Array to hold translated audio segments
let isPlaying = false; // Flag to track if audio is currently playing

// Handle messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startTranslation" && !isTranslating) {
        isTranslating = true;
        sendResponse({ status: "started" });
        startTranslation();
    } else if (message.action === "stopTranslation" && isTranslating) {
        isTranslating = false;
        stopTranslation();
        sendResponse({ status: "stopped" });
    } else {
        sendResponse({ status: "not_started" });
    }
});

// Function to start the translation process
function startTranslation() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            function: initiateTranslation
        });
    });
}

// Function to stop the translation process
function stopTranslation() {
    if (translationProcess) {
        translationProcess.terminate();
        translationProcess = null;
        console.log("Translation process stopped.");
    }
}

// Function to be injected into the active tab
function initiateTranslation() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            const mediaRecorder = new MediaRecorder(stream);
            const audioChunks = [];

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks);
                // Send audio segment to the server for processing
                sendAudioToServer(audioBlob);
            };

            // Start recording
            mediaRecorder.start();
            console.log("Recording started...");

            // Automatically stop recording after a set duration
            setTimeout(() => {
                mediaRecorder.stop();
                console.log("Recording stopped.");
            }, 10000); // Adjust the time as needed
        })
        .catch(error => {
            console.error("Error accessing microphone:", error);
        });
}

// Function to send audio blob to your server for processing
function sendAudioToServer(audioBlob) {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.wav");

    fetch('YOUR_SERVER_URL', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log("Audio processed:", data);
        // Add translated audio to the playback queue
        if (data.translated_audio) {
            playbackQueue.push(data.translated_audio);
            playNextAudio(); // Attempt to play the next audio in the queue
        }
    })
    .catch(error => {
        console.error("Error sending audio to server:", error);
    });
}

// Function to play the next audio segment in the playback queue
function playNextAudio() {
    if (playbackQueue.length > 0 && !isPlaying) {
        isPlaying = true;
        const audioUrl = playbackQueue.shift(); // Get the next audio URL from the queue

        const audio = new Audio(audioUrl);
        audio.play();
        
        audio.onended = () => {
            isPlaying = false; // Reset the playing flag when finished
            playNextAudio(); // Play the next audio segment
        };

        audio.onerror = (error) => {
            console.error("Error playing audio:", error);
            isPlaying = false; // Reset the playing flag on error
            playNextAudio(); // Try to play the next segment
        };
    }
}
