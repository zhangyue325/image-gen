from google import genai
from google.genai import types
from PIL import Image
from io import BytesIO

client = genai.Client(api_key='AIzaSyCiZsCnmq4lXr1i9vRtVdD-gk0lSCZwVqI')

# Comfort in Every Step – Genuine Leather Craft.
# match the mood, keep the comfort
def build_prompt(style, tagline, cta):
    base = (
        "Generate a Google Ads creative using the provided product photo. Keep the product identical and realistic — "
        "same color, texture, and proportions as in the original photo."
        "Brand tone: minimalist, elegant, comfortable shoes, and made with real leather. "
        "Lighting: soft and diffused."
    )

    styles = {
        "product w CTA": (
            f"tagline: {tagline}"
            f"call-to-action button: {cta}"

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
            f"tagline: {tagline}"
            f"call-to-action button: {cta}"

            "product layout: Should have a model stands naturally with legs visible from bottom calf, showing the shoes clearly in the center of the frame. Focus on Shoes."
            "logo layout: Place the provided brand logo on the upper-left corner, small and elegant."
            "tagline layout: tagline should be highlighted below the model legs with the shoes"
            "call-to-action layout: should be hightlighted with a black background button and below the tagline"
            
            "Scene: Use a warm, softly lit environment with neutral tones (beige, blush, cream). "
            "Lighting should be diffused to create soft shadows. "
            "Overall aesthetic: clean, modern, elegant fashion advertisement."
        ),
        "comfort lifestyle": (
            f"Tagline: {tagline}. "
            f"Call-to-action button: {cta}. "

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
            f"Tagline: {tagline}. "

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

    return f"{base}\n{styles[style]}"

def generate_img():
    product_image = Image.open('style4-o.jpg')
    brand_logo_image = Image.open('img/brand_logo.png')
    prompt = build_prompt('editorial power fashion', 'Step Into Comfort', None)

    response = client.models.generate_content(
        model="gemini-2.5-flash-image",
        contents=[prompt, product_image, brand_logo_image],
        config = types.GenerateContentConfig(
            image_config=types.ImageConfig(
                aspect_ratio="1:1",  #1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
            )
        )
    )

    for part in response.candidates[0].content.parts:
        if part.text is not None:
            print(part.text)
        elif part.inline_data is not None:
            image = Image.open(BytesIO(part.inline_data.data))
            image.save("generated_image.png")
            return image

