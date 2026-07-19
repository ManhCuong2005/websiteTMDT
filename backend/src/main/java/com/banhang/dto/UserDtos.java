package com.banhang.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class UserDtos {
    private UserDtos() {
    }

    public record UpdateProfileRequest(
            @Size(max = 120, message = "Ho ten toi da 120 ky tu")
            String fullName,
            @Size(max = 20, message = "So dien thoai toi da 20 ky tu")
            String phone,
            @Size(max = 500, message = "URL avatar toi da 500 ky tu")
            String avatarUrl
    ) {
    }

    public record AddressRequest(
            @NotBlank(message = "Ten nguoi nhan khong duoc de trong")
            @Size(max = 120)
            String recipientName,
            @NotBlank(message = "So dien thoai khong duoc de trong")
            @Size(max = 20)
            String phone,
            @NotBlank(message = "Dia chi khong duoc de trong")
            @Size(max = 255)
            String addressLine,
            @Size(max = 120)
            String ward,
            @Size(max = 120)
            String district,
            @NotBlank(message = "Tinh/thanh pho khong duoc de trong")
            @Size(max = 120)
            String province,
            Boolean defaultAddress
    ) {
    }

    public record AddressResponse(
            Long id,
            String recipientName,
            String phone,
            String addressLine,
            String ward,
            String district,
            String province,
            boolean defaultAddress,
            LocalDateTime createdAt
    ) {
    }
}
