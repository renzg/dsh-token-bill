package main

import (
	"context"
	"fmt"
	"log"
	"os"

	// go get github.com/volcengine/ark-runtime-go@latest
	"github.com/volcengine/ark-runtime-go/arkruntime"
	"github.com/volcengine/ark-runtime-go/arkruntime/model/images"
)

func main() {
	client := arkruntime.NewVolcClientWithApiKey(os.Getenv("ARK_API_KEY"))

	resp, err := client.GenerateImages(context.Background(), &images.CreateImageGenerationRequest{
		Model:  "ep-20261127114533-s7q8f",
		Prompt: images.NewOptString("刺绣贴布款复古贴纸，透明背景。每一枚贴布都极度写实地还原了真实刺绣工艺，具有密实立体的浮雕感，边缘一圈厚实的米白色锁边刺绣；部分元素（星星、口袋等）还表现出真实丹宁牛仔布纹理 + 黄色双明线缝迹。图案均为少女心经典元素：爱心、雏菊、樱桃、彩虹、泰迪熊、蝴蝶等；文字包含黑色手写花体草书“Good VIBES”“By Cecy Papper”。"),
		Size:   images.NewOptString("2K"),
		ResponseFormat: images.NewOptResponseFormat(images.ResponseFormatURL),
		// 透明背景必须使用 PNG，并显式指定 background
		OutputFormat: images.NewOptOutputFormat(images.OutputFormatPNG),
		Background:   images.NewOptBackground(images.BackgroundTransparent),
		Watermark:    images.NewOptBool(true),
	})
	if err != nil {
		log.Fatalf("generate image error: %v", err)
	}

	for _, item := range resp.Data {
		if item.URL.IsSet() {
			fmt.Println(item.URL.Value)
		}
	}
}