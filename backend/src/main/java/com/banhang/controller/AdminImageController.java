package com.banhang.controller;

import com.banhang.dto.ImageDtos;
import com.banhang.service.CloudinaryService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/images")
public class AdminImageController {

    private final CloudinaryService cloudinaryService;

    public AdminImageController(
            CloudinaryService cloudinaryService
    ) {
        this.cloudinaryService = cloudinaryService;
    }

    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ImageDtos.ImageUploadResponse upload(
            @RequestParam("file") MultipartFile file
    ) {
        return cloudinaryService.uploadProductImage(file);
    }
}