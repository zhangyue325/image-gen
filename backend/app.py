import base64
import json
import os
from io import BytesIO
from typing import Dict, List

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.api_core.exceptions import GoogleAPIError
from google.genai import types
from PIL import Image, UnidentifiedImageError


ALLOWED_RATIOS = {
    "1:1",
    "2:3",
    "3:2",
    "3:4",
    "4:3",
    "4:5",
    "5:4",
    "9:16",
    "16:9",
    "21:9",
}

DEFAULT_TAGLINE = "Step Into Comfort"
DEFAULT_CTA = "Shop Now"

STYLE_PROMPTS: Dict[str, str] = {
    "product w CTA": (
        "tagline: {tagline}"
        "call-to-action button: {cta}"

        "product layout: Center the product."
        "logo layout: Place the provided brand logo on the bottom-right corner, small and elegant."
        "tagline layout: tagline should be highlighted."
        "call-to-action layout: should be hightlighted with a black background button."

        "Place the product on a soft, minimalist studio set with a clean, warm background "
        "(off-white, pastel beige, or light blue tones). "
        "Use diffused daylight to create gentle shadows and a premium, airy atmosphere. "
        "Include a sense of depth with subtle surface reflections or rounded props behind "
        "to frame the product elegantly. "
        "Leave open negative space for text placement (tagline and call-to-action button). "
        "Overall aesthetic: calm, luxurious, minimalist, suitable for Google Ads or social creatives."
    ),
    "model from bottom calf": (
        "tagline: {tagline}"
        "call-to-action button: {cta}"

        "product layout: Should have a model stands naturally with legs visible from bottom calf, showing the shoes clearly in the center of the frame. Focus on Shoes."
        "logo layout: Place the provided brand logo on the upper-left corner, small and elegant."
        "tagline layout: tagline should be highlighted below the model legs with the shoes"
        "call-to-action layout: should be hightlighted with a black background button and below the tagline"
        
        "Scene: Use a warm, softly lit environment with neutral tones (beige, blush, cream). "
        "Lighting should be diffused to create soft shadows. "
        "Overall aesthetic: clean, modern, elegant fashion advertisement."
    ),
    "comfort lifestyle": (
        "Tagline: {tagline}. "
        "Call-to-action button: {cta}. "

        "Product layout: Show a model seated or mid-step in a natural, comfortable pose, "
        "highlighting the shoes clearly. Focus on conveying comfort and elegance. "
        "Logo layout: Place the provided brand logo on the upper-right corner, small and elegant. The logo should not overlap with other contents."
        "Tagline layout: Tagline should appear near the shoes or beside the model and be slightly highlighted."
        "Call-to-action layout: Highlight the call-to-action button with a black background below the tagline."
        "The tagline and call-to-action buttom should not overlap with other contents"

        "Scene: Create a cozy, lifestyle-inspired environment with soft pastel or neutral background tones "
        "(beige, blush, or soft peach). Include minimal props such as fabric textures, chair legs, or paper bags "
        "to suggest daily life. Lighting should be diffused, evoking comfort and warmth. "
    ),
    "editorial power fashion": (
        "Tagline: {tagline}. "

        "Show a model clothes walking outdoors in bright daylight, wearing the product. "
        "The clothes of the model should match the shoes in a natural and comforable way."
        "Use a clean, architectural background such as white stone walls or minimalist textures for the model "
        "Lighting should be strong but natural, creating crisp shadows for a modern fashion editorial look. "
        "Lighting should be strong but natural, creating crisp shadows for a modern fashion editorial look. "
        "Only the model has a rectangle background, the product and tagline should use a same pure color background."

        "Display the product again as a secondary floating beside the model to highlight design details. "

        "Logo layout: Place the provided brand logo on the upper-right corner, small and elegant. The logo should not overlap with other contents."
        "Tagline layout: Large bold headline near the bottom."
        "Overall aesthetic: bold, editorial, confident, modern luxury campaign. "
        "Ensure the product and brand identity remain realistic and unchanged."
    ),
}

def build_prompt(style: str, tagline: str, cta: str, override: str | None = None) -> str:
    base = (
        "Generate a Google Ads creative using the provided product photo. Keep the product identical and realistic — "
        "same color, texture, and proportions as in the original photo."
        "Brand tone: minimalist, elegant, comfortable shoes, and made with real leather. "
        "Use the provided brand logo in the final creative exactly as supplied, without altering its colors or aspect ratio."
        "Lighting: soft and diffused."
        "the 'PAZZION' image is my brand logo, please put my brand logo in the generated image properly and do not generate logo randomly."
    )

    if override is not None:
        template = override
    else:
        try:
            template = STYLE_PROMPTS[style]
        except KeyError as exc:
            raise HTTPException(status_code=400, detail=f"Unsupported style: {style}") from exc

    try:
        style_prompt = template.format(tagline=tagline, cta=cta)
    except (KeyError, ValueError) as exc:
        raise HTTPException(
            status_code=400,
            detail="Prompt instructions must only use {tagline} and {cta} placeholders."
        ) from exc

    return base + style_prompt


def get_client() -> genai.Client:
    api_key = 'AIzaSyCiZsCnmq4lXr1i9vRtVdD-gk0lSCZwVqI'
    # api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY environment variable is not set.")
    return genai.Client(api_key=api_key)


def load_brand_logo() -> Image.Image | None:
    logo_path = os.path.join(os.path.dirname(__file__), "img", "brand_logo.png")
    return Image.open(logo_path)


def to_data_url(image: Image.Image) -> str:
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


client = get_client()

app = FastAPI(title="AI Ads Creative Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def generate_for_style(
    style: str,
    ratio: str,
    product_bytes: bytes,
    tagline: str,
    cta: str,
    custom_prompt: str | None = None,
    user_feedback: str | None = None,
) -> Image.Image:
    if ratio not in ALLOWED_RATIOS:
        raise HTTPException(status_code=400, detail=f"Unsupported aspect ratio: {ratio}")

    try:
        product_image = Image.open(BytesIO(product_bytes))
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="Uploaded product image is invalid.") from exc

    product_image = product_image.convert("RGB")
    logo_image = load_brand_logo()

    prompt = build_prompt(style, tagline, cta, override=custom_prompt)
    if user_feedback and user_feedback.strip():
        prompt += (
            " Apply these additional refinement notes while keeping the product realistic: "
            f"{user_feedback.strip()}."
        )

    contents: List[object] = [prompt, product_image, logo_image]

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=contents,
            config=types.GenerateContentConfig(
                image_config=types.ImageConfig(aspect_ratio=ratio)
            ),
        )
    except GoogleAPIError as exc:
        raise HTTPException(status_code=502, detail=f"Generation failed: {exc.message}") from exc
    except Exception as exc:  # pragma: no cover - unexpected
        raise HTTPException(status_code=502, detail="Unexpected error during generation.") from exc

    if not response.candidates:
        raise HTTPException(status_code=502, detail="No candidates returned by the model.")

    for part in response.candidates[0].content.parts:
        if part.inline_data:
            generated = Image.open(BytesIO(part.inline_data.data)).convert("RGB")
            return generated

    raise HTTPException(status_code=502, detail="Model response did not include an image.")


@app.post("/api/generate")
async def generate_creatives(
    ratio: str = Form(...),
    styles: str = Form(...),
    product: UploadFile = File(...),
    custom_prompts: str | None = Form(None),
    instructions: str | None = Form(None),
) -> Dict[str, Dict[str, str]]:
    try:
        style_list: List[str] = json.loads(styles)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Styles must be a JSON array of strings.") from exc

    if not isinstance(style_list, list) or not all(isinstance(item, str) for item in style_list):
        raise HTTPException(status_code=400, detail="Styles must be a JSON array of strings.")

    instruction_map: Dict[str, str] = {}
    if instructions:
        try:
            maybe_map = json.loads(instructions)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail="Instructions must be a JSON object.") from exc
        if not isinstance(maybe_map, dict) or not all(
            isinstance(key, str) and isinstance(value, str) for key, value in maybe_map.items()
        ):
            raise HTTPException(status_code=400, detail="Instructions must be a JSON object of strings.")
        instruction_map = maybe_map

    prompt_map: Dict[str, str] = {}
    if custom_prompts:
        try:
            maybe_map = json.loads(custom_prompts)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail="Custom prompts must be a JSON object.") from exc
        if not isinstance(maybe_map, dict) or not all(
            isinstance(key, str) and isinstance(value, str) for key, value in maybe_map.items()
        ):
            raise HTTPException(status_code=400, detail="Custom prompts must be a JSON object of strings.")
        prompt_map = maybe_map

    product_bytes = await product.read()
    if not product_bytes:
        raise HTTPException(status_code=400, detail="Uploaded product image is empty.")

    images: Dict[str, str] = {}
    errors: Dict[str, str] = {}

    for style in style_list:
        prompt_override_raw = prompt_map.get(style)
        prompt_override = prompt_override_raw.strip() if isinstance(prompt_override_raw, str) else None
        if prompt_override == "":
            prompt_override = None

        feedback_raw = instruction_map.get(style)
        feedback_value = feedback_raw.strip() if isinstance(feedback_raw, str) else None
        if feedback_value == "":
            feedback_value = None

        if style not in STYLE_PROMPTS and not prompt_override:
            errors[style] = "Custom styles must include prompt instructions."
            continue

        try:
            generated_image = await generate_for_style(
                style=style,
                ratio=ratio,
                product_bytes=product_bytes,
                tagline=DEFAULT_TAGLINE,
                cta=DEFAULT_CTA,
                custom_prompt=prompt_override,
                user_feedback=feedback_value,
            )
            images[style] = to_data_url(generated_image)
        except HTTPException as exc:
            errors[style] = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        except Exception as exc:  # pragma: no cover - unexpected
            errors[style] = str(exc)

    return {"images": images, "errors": errors}
