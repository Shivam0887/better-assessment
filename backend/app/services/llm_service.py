"""All Gemini API calls — structured output for scopes, prose for summaries."""

import logging
import os

from google import genai
from google.genai import types
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# ── Debug file logger ──
_file_handler = logging.FileHandler("llm_debug.log")
_file_handler.setLevel(logging.DEBUG)
logger.addHandler(_file_handler)
logger.setLevel(logging.DEBUG)

# ── Client setup ──
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))
MODEL = "gemini-2.5-flash"


# ── Pydantic schemas for structured output ──
class UserStorySchema(BaseModel):
    title: str
    description: str
    order_index: int


class EpicSchema(BaseModel):
    name: str
    description: str
    effort_days: int
    order_index: int
    user_stories: list[UserStorySchema]


class RiskSchema(BaseModel):
    description: str
    severity: str  # "high" | "medium" | "low"


class ScopeOutputSchema(BaseModel):
    epics: list[EpicSchema]
    suggested_stack: list[str]
    timeline_weeks: int
    risks: list[RiskSchema]


def generate_scope(system_prompt: str, user_prompt: str) -> ScopeOutputSchema:
    """Generate structured scope from idea using Gemini structured output.

    Retries once on failure with a corrective message.
    """
    logger.debug("=== SCOPE GENERATION ===")
    logger.debug("System: %s", system_prompt)
    logger.debug("User: %s", user_prompt)

    for attempt in range(2):
        try:
            contents = user_prompt
            if attempt == 1:
                contents = (
                    user_prompt
                    + "\n\nIMPORTANT: The previous attempt failed to produce "
                    "valid structured output. Please ensure your response "
                    "strictly follows the required JSON schema."
                )

            response = client.models.generate_content(
                model=MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                    response_schema=ScopeOutputSchema,
                    temperature=0.7,
                    http_options={"timeout": 30_000},
                ),
            )

            parsed = response.parsed
            logger.debug("Response (attempt %d): %s", attempt + 1, parsed)
            return parsed

        except Exception as e:
            logger.error("Scope generation attempt %d failed: %s", attempt + 1, e)
            if attempt == 1:
                raise RuntimeError("AI generation failed — please try again") from e

    # Should never reach here, but satisfy type checker
    raise RuntimeError("AI generation failed — please try again")


def generate_summary(system_prompt: str, user_prompt: str) -> str:
    """Generate weekly summary as plain prose text.

    Returns the raw text content from the LLM.
    """
    logger.debug("=== SUMMARY GENERATION ===")
    logger.debug("System: %s", system_prompt)
    logger.debug("User: %s", user_prompt)

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.7,
                http_options={"timeout": 30_000},
            ),
        )

        text = response.text
        logger.debug("Summary response: %s", text)
        return text

    except Exception as e:
        logger.error("Summary generation failed: %s", e)
        raise RuntimeError("AI generation failed — please try again") from e
