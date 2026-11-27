package com.ark.sample;

// Maven 依赖：com.volcengine:ark-runtime:0.17.0
import com.volcengine.ark.runtime.models.images.Background;
import com.volcengine.ark.runtime.models.images.CreateImageGenerationRequest;
import com.volcengine.ark.runtime.models.images.ImageDataItem;
import com.volcengine.ark.runtime.models.images.ImageGenerationResponse;
import com.volcengine.ark.runtime.models.images.OutputFormat;
import com.volcengine.ark.runtime.models.images.ResponseFormat;
import com.volcengine.ark.runtime.service.ArkService;

public class Seedream55Transparent {
    public static void main(String[] args) {
        ArkService service = ArkService.volc()
                .apiKey(System.getenv("ARK_API_KEY"))
                .build();

        try {
            CreateImageGenerationRequest request = new CreateImageGenerationRequest()
                    .model("ep-20261127114533-s7q8f")
                    .prompt("刺绣贴布款复古贴纸，透明背景。每一枚贴布都极度写实地还原了真实刺绣工艺，具有密实立体的浮雕感，边缘一圈厚实的米白色锁边刺绣；部分元素（星星、口袋等）还表现出真实丹宁牛仔布纹理 + 黄色双明线缝迹。图案均为少女心经典元素：爱心、雏菊、樱桃、彩虹、泰迪熊、蝴蝶等；文字包含黑色手写花体草书“Good VIBES”“By Cecy Papper”。")
                    .size("2K")
                    .responseFormat(ResponseFormat.URL)
                    // 透明背景必须使用 PNG，并显式指定 background
                    .outputFormat(OutputFormat.PNG)
                    .background(Background.TRANSPARENT)
                    .watermark(true);

            ImageGenerationResponse response = service.generateImages(request);
            for (ImageDataItem item : response.getData()) {
                System.out.println(item.getUrl());
            }
        } finally {
            service.shutdownExecutor();
        }
    }
}