package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/volcengine/ark-runtime-go/arkruntime"
	"github.com/volcengine/ark-runtime-go/arkruntime/model/images"
)

func main() {
	client := arkruntime.NewVolcClientWithApiKey(os.Getenv("ARK_API_KEY"))

	resp, err := client.GenerateImages(context.Background(), &images.CreateImageGenerationRequest{
		Model: "ep-20261127114533-s7q8f",
		Prompt: images.NewOptString(
			"将图片进行精确图层分离，需分离的文字坐标为<bbox>180 64 812 198</bbox>、<bbox>757 210 939 280</bbox>、<bbox>63 212 320 282</bbox>、<bbox>178 714 826 810</bbox>、<bbox>814 819 949 894</bbox>、<bbox>326 824 669 930</bbox>；鹦鹉的坐标为<bbox>347 305 642 997</bbox>。",
		),
		Image: images.NewOptCreateImageGenerationRequestImage(
			images.NewStringCreateImageGenerationRequestImage("https://arkdocs.tos-cn-beijing.volces.com/images/image-generation/seedream_50_pro_layer_input.png"),
		),
		Size: images.NewOptString("2K"),
		ResponseFormat: images.NewOptResponseFormat(images.ResponseFormatURL),
		// output_format 仅控制底图格式；拆分出的图层恒为带透明通道的 PNG
		OutputFormat:       images.NewOptOutputFormat(images.OutputFormatJpeg),
		LayerDecomposition: images.NewOptBool(true),
		Watermark:          images.NewOptBool(true),
	})
	if err != nil {
		log.Fatalf("generate images error: %v", err)
	}

	// data[0] 为底图（z_index=0），其余为图层
	for _, item := range resp.Data {
		name := ""
		if item.Name.IsSet() {
			name = item.Name.Value
		}
		if item.URL.IsSet() {
			z := int32(0)
			if item.ZIndex.IsSet() {
				z = item.ZIndex.Value
			}
			fmt.Printf("z_index=%d name=%s url=%s\n", z, name, item.URL.Value)
		}
	}
}