const video = document.getElementById("webcam");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const emotionResult = document.getElementById("emotionResult");
const captureButton = document.getElementById("capture");
const openWebcamButton = document.getElementById("openWebcam");

let currentEmotion = "";
let intervalId = null;
let stream = null; // to keep track of the webcam stream
let isCapturing = false;

// Start webcam
openWebcamButton.addEventListener("click", async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    isCapturing = true;
    startFrameCapture();
  } catch (err) {
    console.error("Failed to open webcam:", err);
  }
});

// Periodic emotion detection
async function detectEmotion() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(async (blob) => {
    if (!blob) {
      console.error("Canvas blob is null");
      return;
    }

    const formData = new FormData();
    formData.append("file", blob, "frame.jpg");

    try {
      const response = await fetch("http://127.0.0.1:5050/predict-emotion", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      console.log("Server response:", data);

      if (data.emotion) {
        currentEmotion = data.emotion;
        emotionResult.innerText = `😊 Detected Emotion: ${currentEmotion}`;
      } else if (data.error) {
        emotionResult.innerText = `⚠️ ${data.error}`;
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }, "image/jpeg");
}

// Frame capture loop
function startFrameCapture() {
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(() => {
    if (isCapturing) {
      detectEmotion();
    }
  }, 2000); // every 2 seconds
}

// Suggest music button
captureButton.addEventListener("click", async () => {
  if (!currentEmotion) {
    alert("Please wait until an emotion is detected.");
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:5050/predict-emotion", {
      method: "POST",
      body: getCurrentFrameAsFormData()
    });

    const data = await response.json();
    if (data.songs) {
      displaySongs(data.songs);
      stopWebcam(); // ✅ Stop webcam after suggesting music
    } else {
      alert("No songs found.");
    }
  } catch (err) {
    console.error("Music suggestion error:", err);
  }
});

// Utility: capture current frame for music suggestion
function getCurrentFrameAsFormData() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const formData = new FormData();
  const blob = canvas.toDataURL("image/jpeg");
  const byteString = atob(blob.split(',')[1]);
  const mimeString = blob.split(',')[0].split(':')[1].split(';')[0];

  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  const file = new Blob([ab], { type: mimeString });
  formData.append("file", file, "frame.jpg");
  return formData;
}

// Display recommended songs
function displaySongs(songs) {
  const container = document.getElementById("songsContainer");
  container.innerHTML = "";

  songs.forEach((song) => {
    const card = document.createElement("div");
    card.className = "song-card";
    card.innerHTML = `
      <img src="${song.thumbnail}" width="120" />
      <div>
        <p><strong>${song.title}</strong></p>
        <a href="${song.link}" target="_blank">Play</a>
      </div>
    `;
    container.appendChild(card);
  });
}

// Stop webcam
function stopWebcam() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
    video.srcObject = null;
    isCapturing = false;
    clearInterval(intervalId);
  }
}
