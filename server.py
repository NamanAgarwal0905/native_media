from flask import Flask, request, jsonify
from pydub import AudioSegment
import os
from deep_translator import GoogleTranslator
from openai import OpenAI

app = Flask(__name__)
os.environ['OPENAI_API_KEY'] = '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'  
client = OpenAI()

def speech_to_text(file):
    try:
        audio_file = open(file, "rb")
        transcription = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file
        )
        return transcription.text
    except Exception as e:
        print(f"Transcription error: {e}")
        return ""

def translate_text(text, target_language="hi"):
    try:
        translated_text = GoogleTranslator(source="auto", target=target_language).translate(text)
        return translated_text
    except Exception as e:
        print(f"Translation error: {e}")
        return ""

def text_to_speech(text):
    try:
        speech_file_path = "speech.mp3"
        response = client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=text
        )
        response.stream_to_file(speech_file_path)
        audio = AudioSegment.from_file(speech_file_path)
        os.remove(speech_file_path)  # Clean up the file after use
        return audio
    except Exception as e:
        print(f"Text-to-speech error: {e}")
        return None

@app.route('/upload', methods=['POST'])
def upload_audio():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']
    audio_path = 'uploaded_audio.wav'
    audio_file.save(audio_path)

    # Process the audio file
    text = speech_to_text(audio_path)
    translated_text = translate_text(text, target_language="hi")
    translated_audio = text_to_speech(translated_text)

    # Save the translated audio to a file
    output_path = 'translated_audio.wav'
    translated_audio.export(output_path, format="wav")

    return jsonify({'message': 'Audio processed', 'translated_audio': output_path})

if __name__ == '__main__':
    app.run(debug=True)
