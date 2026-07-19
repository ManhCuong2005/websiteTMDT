package com.banhang.dto;

public final class ImageDtos {

    private ImageDtos() {
    }

    public record ImageUploadResponse(
            String url,
            String publicId,
            String originalFilename,
            long size
    ) {
    }
}