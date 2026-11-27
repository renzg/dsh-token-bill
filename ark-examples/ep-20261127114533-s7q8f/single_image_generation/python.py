import os
# Install SDK: pip install arkruntime
from arkruntime import Ark
from arkruntime.types.images.response_format import ResponseFormat
from arkruntime.types.images.output_format import OutputFormat
from arkruntime.types.images.background import Background

client = Ark.volc(api_key=os.getenv("ARK_API_KEY"))

resp = client.images.generate(
    model="ep-20261127114533-s7q8f",
    prompt="刺绣贴布款复古贴纸，透明背景。每一枚贴布都极度写实地还原了真实刺绣工艺，具有密实立体的浮雕感，边缘一圈厚实的米白色锁边刺绣；部分元素（星星、口袋等）还表现出真实丹宁牛仔布纹理 + 黄色双明线缝迹。图案均为少女心经典元素：爱心、雏菊、樱桃、彩虹、泰迪熊、蝴蝶等；文字包含黑色手写花体草书“Good VIBES”“By Cecy Papper”。",
    size="2K",
    response_format=ResponseFormat.url,
    # 透明背景必须使用 PNG，并显式指定 background
    output_format=OutputFormat.png,
    background=Background.transparent,
    watermark=True,
)

print(resp.data[0].url)