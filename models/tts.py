import os
from gtts import gTTS

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICE_DIR = os.path.join(BASE_DIR, "voice")
os.makedirs(VOICE_DIR, exist_ok=True)

def generate_tts(text, filename="assistant_response.mp3"):
    file_path = os.path.join(VOICE_DIR, filename)

    if os.path.exists(file_path):
        os.remove(file_path)

    tts = gTTS(text=text, lang="en")
    tts.save(file_path)

    return file_path