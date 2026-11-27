import os
# Install SDK: pip install arkruntime
from arkruntime import Ark
from arkruntime.types.images.response_format import ResponseFormat
from arkruntime.types.images.output_format import OutputFormat

client = Ark.volc(api_key=os.getenv("ARK_API_KEY"))

resp = client.images.generate(
    model="ep-20261127114533-s7q8f",
    prompt="将图片进行精确图层分离，需分离的文字坐标为<bbox>180 64 812 198</bbox>、<bbox>757 210 939 280</bbox>、<bbox>63 212 320 282</bbox>、<bbox>178 714 826 810</bbox>、<bbox>814 819 949 894</bbox>、<bbox>326 824 669 930</bbox>；鹦鹉的坐标为<bbox>347 305 642 997</bbox>。",
    image="https://arkdocs.tos-cn-beijing.volces.com/images/image-generation/seedream_50_pro_layer_input.png",
    size="2K",
    response_format=ResponseFormat.url,
    # output_format 仅控制底图格式；拆分出的图层恒为带透明通道的 PNG
    output_format=OutputFormat.jpeg,
    layer_decomposition=True,
    watermark=True,
)

# data[0] 为底图（z_index=0），其余为图层，含 z_index、bounding_box、name、description
for item in resp.data:
    print(item.z_index, item.name, item.url)