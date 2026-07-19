package com.banhang.service;

import com.banhang.dto.ImageDtos;
import com.banhang.exception.AppException;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
public class CloudinaryService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public ImageDtos.ImageUploadResponse uploadProductImage(
            MultipartFile file) {
        return uploadImage(file, "banhang/products");
    }

    public ImageDtos.ImageUploadResponse uploadAvatar(
            MultipartFile file) {
        return uploadImage(file, "banhang/avatars");
    }

    private ImageDtos.ImageUploadResponse uploadImage(
            MultipartFile file,
            String folder) {

        validateImage(file);

        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folder,
                            "resource_type", "image",
                            "unique_filename", true,
                            "overwrite", false
                    )
            );

            String secureUrl = String.valueOf(result.get("secure_url"));
            String publicId = String.valueOf(result.get("public_id"));

            return new ImageDtos.ImageUploadResponse(
                    secureUrl,
                    publicId,
                    file.getOriginalFilename(),
                    file.getSize()
            );
        } catch (IOException exception) {
            throw new AppException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Không thể tải hình ảnh lên Cloudinary"
            );
        }
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Vui lòng chọn hình ảnh"
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Hình ảnh không được vượt quá 5 MB"
            );
        }

        String contentType = file.getContentType();

        if (contentType == null
                || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new AppException(
                    HttpStatus.BAD_REQUEST,
                    "Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP"
            );
        }
    }
}
