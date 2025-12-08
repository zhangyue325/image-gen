from google import genai
from google.genai import types
from PIL import Image
from io import BytesIO

client = genai.Client(api_key='AIzaSyCiZsCnmq4lXr1i9vRtVdD-gk0lSCZwVqI')

prompt = """
I have uploaded 3 images:
Image 1: reference image
Image 2: my brand logo image
Image 3: my shoes image

please refer the reference image and change the logo from VIVAIA to my brand logo, 
and change the shoes to my shoes using my shoes image

"""
reference_image = Image.open(r'backend/img/reference_image.jpg')
brand_logo_image = Image.open(r'backend/img/brand_logo.png')
product_image = Image.open(r'backend/img/style1-o.webp')

response = client.models.generate_content(
    model="gemini-2.5-flash-image",
    contents=[prompt, reference_image, product_image, brand_logo_image],
    config = types.GenerateContentConfig(
        image_config=types.ImageConfig(
            aspect_ratio="3:2",  #1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
        )
    )
)

for part in response.candidates[0].content.parts:
    if part.text is not None:
        print(part.text)
    elif part.inline_data is not None:
        image = Image.open(BytesIO(part.inline_data.data))
        image.save("generated_image.png")
