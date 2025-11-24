from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import os

from models.llm import start_session, send_to_llm
from models.stt import transcribe_audio
from models.tts import generate_tts


app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "voice"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

chat_session = None


@app.route('/')
def welcome():
    global chat_session

    # cleanup old files
    for f in ["voice.webm", "assistant_response.mp3"]:
        path = os.path.join(UPLOAD_FOLDER, f)
        if os.path.exists(path):
            os.remove(path)

    # start fresh LLM chat
    chat_session = start_session()

    return render_template('index.html')


@app.route('/api/upload', methods=['POST'])
def upload_audio():
    global chat_session

    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files['audio']
    file_path = os.path.join(UPLOAD_FOLDER, audio_file.filename)
    audio_file.save(file_path)

    print(f"✅ Audio received and saved at: {file_path}")

    # Remove any previous assistant TTS file so the new response is always fresh
    old_tts_path = os.path.join(UPLOAD_FOLDER, "assistant_response.mp3")
    if os.path.exists(old_tts_path):
        try:
            os.remove(old_tts_path)
            print(f"🗑️ Removed old TTS file: {old_tts_path}")
        except Exception as e:
            print(f"⚠️ Failed to remove old TTS file: {e}")

    # ✅ STT — transcribe audio to text
    teacher_text = transcribe_audio(file_path)
    print("Teacher said:", teacher_text)

    # ✅ LLM — get response
    if chat_session is None:
        chat_session = start_session()

    assistant_text = send_to_llm(chat_session, teacher_text)
    print("Assistant:", assistant_text)

    # If LLM returned an error string, surface it to the client with 502
    if isinstance(assistant_text, str) and assistant_text.startswith("LLM error:"):
        return jsonify({
            "message": "LLM error",
            "teacher_text": teacher_text,
            "assistant_response": assistant_text,
            "tts_file": None,
        }), 502

    # ✅ TTS — convert assistant reply to speech
    tts_file = generate_tts(assistant_text)
    tts_url = "/voice/assistant_response.mp3"

    return jsonify({
        "message": "Audio processed successfully!",
        "teacher_text": teacher_text,
        "assistant_response": assistant_text,
        "tts_file": tts_url
    }), 200


@app.route('/voice/<path:filename>', methods=['GET'])
def serve_voice(filename):
    # Serve voice files with no-cache headers so the browser always fetches
    # the latest generated TTS file (assistant_response.mp3).
    response = send_from_directory(UPLOAD_FOLDER, filename, as_attachment=False)
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response


if __name__ == '__main__':
    app.run(debug=True, port=5000)