import os
import json

from dotenv import load_dotenv
from google import genai

load_dotenv()

# Load up to 6 Gemini API keys
GEMINI_API_KEYS = [
    os.getenv("GEMINI_API_KEY_1"),
    os.getenv("GEMINI_API_KEY_2"),
    os.getenv("GEMINI_API_KEY_3"),
    os.getenv("GEMINI_API_KEY_4"),
    os.getenv("GEMINI_API_KEY_5"),
    os.getenv("GEMINI_API_KEY_6"),
]

# Remove empty keys
GEMINI_API_KEYS = [key for key in GEMINI_API_KEYS if key]

if not GEMINI_API_KEYS:
    raise Exception("No Gemini API keys found in .env")


def generate_json(prompt: str):

    last_error = None

    for index, api_key in enumerate(GEMINI_API_KEYS, start=1):

        try:

            client = genai.Client(api_key=api_key)

            response = client.models.generate_content(
                model="gemini-3.6-flash",
                contents=prompt,
            )

            text = response.text.strip()

            if text.startswith("```json"):
                text = text.replace("```json", "").replace("```", "").strip()
            elif text.startswith("```"):
                text = text.replace("```", "").strip()

            return json.loads(text)

        except json.JSONDecodeError:
            raise Exception(
                f"Gemini returned invalid JSON:\n\n{text}"
            )

        except Exception as e:

            last_error = e
            error_text = str(e).lower()

            # Retry only for quota/rate limit errors
            quota_errors = [
                "429",
                "quota",
                "resource_exhausted",
                "rate limit",
                "too many requests",
            ]

            if any(err in error_text for err in quota_errors):
                print(f"[Gemini] Key {index} quota exceeded. Trying next key...")
                continue

            # Any other error shouldn't switch keys
            raise e

    raise Exception(
        f"All Gemini API keys have been exhausted.\nLast Error: {last_error}"
    )
    