package com.ark.sample;

import com.volcengine.ark.runtime.models.images.CreateImageGenerationRequest;
import com.volcengine.ark.runtime.models.images.CreateImageGenerationRequestImage;
import com.volcengine.ark.runtime.models.images.ImageDataItem;
import com.volcengine.ark.runtime.models.images.ImageGenerationResponse;
import com.volcengine.ark.runtime.models.images.OutputFormat;
import com.volcengine.ark.runtime.models.images.ResponseFormat;
import com.volcengine.ark.runtime.service.ArkService;

public class Seedream55LayerDecomposition {
    public static void main(String[] args) {
        ArkService service = ArkService.volc()
                .apiKey(System.getenv("ARK_API_KEY"))
                .build();

        try {
            CreateImageGenerationRequest request = new CreateImageGenerationRequest()
                    .model("ep-20261127114533-s7q8f")
                    .prompt("将图片进行精确图层分离，需分离的文字坐标为<bbox>180 64 812 198</bbox>、<bbox>757 210 939 280</bbox>、<bbox>63 212 320 282</bbox>、<bbox>178 714 826 810</bbox>、<bbox>814 819 949 894</bbox>、<bbox>326 824 669 930</bbox>；鹦鹉的坐标为<bbox>347 305 642 997</bbox>。")
                    .image(CreateImageGenerationRequestImage.ofString("https://arkdocs.tos-cn-beijing.volces.com/images/image-generation/seedream_50_pro_layer_input.png"))
                    .size("2K")
                    .responseFormat(ResponseFormat.URL)
                    // output_format 仅控制底图格式；拆分出的图层恒为带透明通道的 PNG
                    .outputFormat(OutputFormat.JPEG)
                    .layerDecomposition(true)
                    .watermark(true);

            ImageGenerationResponse response = service.generateImages(request);
            // data[0] 为底图（z_index=0），其余为图层，含 zIndex、boundingBox、name、description
            for (ImageDataItem item : response.getData()) {
                System.out.printf("z_index=%s name=%s url=%s%n",
                        item.getzIndex(), item.getName(), item.getUrl());
            }
        } finally {
            service.shutdownExecutor();
        }
    }
}