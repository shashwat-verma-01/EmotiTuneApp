from flask import Flask, request, jsonify
import numpy as np
import cv2
from tensorflow.keras.models import load_model
from keras.utils import img_to_array
from emotion_utils import detect_emotion
from youtube_utils import get_youtube_songs_for_emotion  # ✅ NEW IMPORT
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
# Load the emotion model
model = load_model("model/emotion_model.keras")

@app.route("/")
def index():
    return "✅ Flask backend is running!"

@app.route("/predict-emotion", methods=["POST"])
def predict_emotion_route():
    try:
        file = request.files["file"]
        if not file:
            return jsonify({"error": "No file uploaded"}), 400

        contents = file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({"error": "Failed to decode image"}), 400

        emotion = detect_emotion(img, model)
        songs = get_youtube_songs_for_emotion(emotion, limit=5)  # ✅ FETCH SONGS

        return jsonify({"emotion": emotion, "songs": songs})  # ✅ INCLUDE SONGS

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5050)
