package com.banhang.dto;

import com.banhang.domain.enums.OrderStatus;
import com.banhang.domain.enums.PaymentMethod;
import com.banhang.domain.enums.PaymentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class OrderDtos {
    private OrderDtos() {
    }

    public record CheckoutRequest(
            @NotBlank(message = "Tên người nhận không được để trống")
            @Size(max = 120)
            String recipientName,
            @NotBlank(message = "Số điện thoại không được để trống")
            @Size(max = 20)
            String recipientPhone,
            @NotBlank(message = "Địa chỉ không được để trống")
            @Size(max = 255)
            String addressLine,
            @Size(max = 120)
            String ward,
            @Size(max = 120)
            String district,
            @NotBlank(message = "Tỉnh/thành phố không được để trống")
            @Size(max = 120)
            String province,
            @Size(max = 50)
            String couponCode,
            @Size(max = 1000)
            String note,
            Boolean saveAddress
    ) {
    }

    public record CouponValidationRequest(
            @NotBlank(message = "Mã giảm giá không được để trống")
            String code,
            BigDecimal subtotal
    ) {
    }

    public record CouponValidationResponse(
            String code,
            boolean valid,
            String message,
            BigDecimal discountAmount
    ) {
    }

    public record OrderItemResponse(
            Long id,
            Long productId,
            String productName,
            String productSku,
            String productImageUrl,
            BigDecimal unitPrice,
            int quantity,
            BigDecimal lineTotal
    ) {
    }

    public record OrderResponse(
            Long id,
            String orderCode,
            Long userId,
            String customerName,
            String customerEmail,
            String customerAvatarUrl,
            OrderStatus status,
            PaymentMethod paymentMethod,
            PaymentStatus paymentStatus,
            String recipientName,
            String recipientPhone,
            String shippingAddress,
            BigDecimal subtotal,
            BigDecimal discountAmount,
            BigDecimal shippingFee,
            BigDecimal total,
            String couponCode,
            String note,
            String cancelReason,
            LocalDateTime createdAt,
            LocalDateTime confirmedAt,
            LocalDateTime deliveredAt,
            List<OrderItemResponse> items
    ) {
    }

    public record CancelOrderRequest(@Size(max = 500) String reason) {
    }

    public record UpdateOrderStatusRequest(OrderStatus status) {
    }
}
