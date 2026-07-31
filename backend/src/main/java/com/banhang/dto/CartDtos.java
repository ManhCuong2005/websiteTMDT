package com.banhang.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public final class CartDtos {
    private CartDtos() {
    }

    public record AddCartItemRequest(
            @NotNull(message = "Sản phẩm không được để trống")
            Long productId,
            @Min(value = 1, message = "Số lượng tối thiểu là 1")
            @Max(value = 1000, message = "Số lượng tối đa là 1000")
            int quantity
    ) {
    }

    public record UpdateCartItemRequest(
            @Min(value = 1, message = "Số lượng tối thiểu là 1")
            @Max(value = 1000, message = "Số lượng tối đa là 1000")
            int quantity
    ) {
    }

    public record CartItemResponse(
            Long id,
            Long productId,
            String productName,
            String productSlug,
            String productImageUrl,
            BigDecimal unitPrice,
            int quantity,
            int stockQuantity,
            BigDecimal lineTotal
    ) {
    }

    public record CartResponse(
            Long id,
            List<CartItemResponse> items,
            int totalItems,
            BigDecimal subtotal
    ) {
    }
}
