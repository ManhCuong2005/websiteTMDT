package com.banhang.dto;

import com.banhang.domain.enums.AuthProvider;
import com.banhang.domain.enums.CouponType;
import com.banhang.domain.enums.UserRole;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public final class AdminDtos {
    private AdminDtos() {
    }

    public record DashboardResponse(
            long totalUsers,
            long activeUsers,
            long totalProducts,
            long pendingOrders,
            long shippingOrders,
            long deliveredOrders,
            long lowStockProducts,
            long newServiceRequests,
            BigDecimal deliveredRevenue
    ) {
    }

    public record CouponRequest(
            @NotBlank(message = "Mã giảm giá không được để trống")
            @Size(max = 50)
            String code,
            @NotBlank(message = "Tên chương trình không được để trống")
            @Size(max = 180)
            String name,
            @NotNull(message = "Loại giảm giá không được để trống")
            CouponType type,
            @NotNull(message = "Giá trị giảm không được để trống")
            @DecimalMin(value = "0.01")
            BigDecimal value,
            @DecimalMin(value = "0.0")
            BigDecimal minOrderAmount,
            @DecimalMin(value = "0.0")
            BigDecimal maxDiscount,
            LocalDateTime startAt,
            LocalDateTime endAt,
            Integer usageLimit,
            Boolean active
    ) {
    }

    public record CouponResponse(
            Long id,
            String code,
            String name,
            CouponType type,
            BigDecimal value,
            BigDecimal minOrderAmount,
            BigDecimal maxDiscount,
            LocalDateTime startAt,
            LocalDateTime endAt,
            Integer usageLimit,
            int usedCount,
            boolean active,
            LocalDateTime createdAt
    ) {
    }

    public record AdminUserResponse(
            Long id,
            String fullName,
            String email,
            String phone,
            String avatarUrl,
            UserRole role,
            AuthProvider provider,
            boolean enabled,
            LocalDateTime createdAt
    ) {
    }

    public record UpdateUserStatusRequest(boolean enabled) {
    }

    public record UpdateUserRoleRequest(UserRole role) {
    }
}
