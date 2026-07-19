package com.banhang.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public final class ProductDtos {
    private ProductDtos() {
    }

    public record CategoryResponse(
            Long id,
            String name,
            String slug,
            String description,
            int displayOrder,
            boolean active
    ) {
    }

    public record CategoryRequest(
            @NotBlank(message = "Tên danh mục không được để trống")
            @Size(max = 120)
            String name,
            @Size(max = 140)
            String slug,
            String description,
            @Min(0)
            Integer displayOrder,
            Boolean active
    ) {
    }

    public record ProductResponse(
            Long id,
            Long categoryId,
            String categoryName,
            String categorySlug,
            String name,
            String slug,
            String sku,
            String shortDescription,
            String description,
            BigDecimal price,
            BigDecimal compareAtPrice,
            int stockQuantity,
            int lowStockThreshold,
            String unit,
            String imageUrl,
            boolean active,
            boolean featured,
            double averageRating,
            long reviewCount,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
    }

    public record ProductRequest(
            @NotNull(message = "Danh mục không được để trống")
            Long categoryId,
            @NotBlank(message = "Tên sản phẩm không được để trống")
            @Size(max = 180)
            String name,
            @Size(max = 200)
            String slug,
            @NotBlank(message = "SKU không được để trống")
            @Size(max = 80)
            String sku,
            @Size(max = 500)
            String shortDescription,
            String description,
            @NotNull(message = "Giá bán không được để trống")
            @DecimalMin(value = "0.0", inclusive = false, message = "Giá phải lớn hơn 0")
            BigDecimal price,
            @DecimalMin(value = "0.0", message = "Giá so sánh không hợp lệ")
            BigDecimal compareAtPrice,
            @Min(value = 0, message = "Tồn kho không được âm")
            Integer stockQuantity,
            @Min(value = 0, message = "Ngưỡng tồn kho không được âm")
            Integer lowStockThreshold,
            @Size(max = 30)
            String unit,
            @Size(max = 500)
            String imageUrl,
            Boolean active,
            Boolean featured
    ) {
    }
}
