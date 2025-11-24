import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

API_KEY = os.getenv("GENAI_API_KEY")

if not API_KEY:
    raise ValueError("GENAI_API_KEY missing — set it in your .env file")

# Initialize the client
client = genai.Client(api_key=API_KEY)

INTERVIEW_SYSTEM_PROMPT = """
You are InterviewMate — an AI-powered Interview Practice Partner.

Your Role:
Conduct realistic mock interviews for users preparing for specific job roles.

Interview Flow:
1. Start by asking: “Which role are you preparing for and what is your experience level?”
2. Ask ONLY one interview question at a time.
3. Adapt each question based on:
   - The user’s previous response
   - The chosen role
   - Their experience level
4. Ask natural follow-up questions if:
   - The answer is unclear
   - The answer is incomplete
   - More depth is expected

Interview Boundaries:
- Do NOT give answers or feedback during the interview.
- Redirect gently if the candidate goes off-topic.
- If the user says “I don’t know”, briefly guide them to use the STAR framework (Situation, Task, Action, Result), then continue with the next question.

Interview Completion Rules:
The interview ends when any of these conditions are met:
- 10 questions have been asked, OR
- 15 minutes of interaction have passed, OR
- The user explicitly says: “end interview”, “stop”, or “I’m done”.

After Interview (Feedback Phase):
When the interview ends, provide structured feedback including:
- Communication strengths and weaknesses
- Technical or role-specific feedback
- Behavioral evaluation (clarity, structure, confidence)
- Actionable suggestions to improve
- Overall readiness summary

Tone Requirements:
- Professional, neutral, and realistic.
- No emojis.
- Avoid long paragraphs.

Interaction Mode:
- Designed for voice-first interaction, but chat responses must also work fluidly.
"""


class InterviewSession:
    def __init__(self):
        self.messages = [
            {"role": "system", "content": INTERVIEW_SYSTEM_PROMPT}
        ]

    def send(self, user_text: str):

        # add user message
        self.messages.append({"role": "user", "content": user_text})

        # 🔥 Convert all messages into ONE string (Gemini requirement)
        full_prompt = ""
        for msg in self.messages:
            full_prompt += f"{msg['role'].upper()}: {msg['content']}\n\n"

        # 🔥 Correct Gemini API format
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=full_prompt
        )

        assistant_reply = response.text.strip()

        # store reply
        self.messages.append({"role": "assistant", "content": assistant_reply})

        return assistant_reply


def start_session():
    return InterviewSession()


def send_to_llm(chat_session, user_text: str) -> str:
    return chat_session.send(user_text)
