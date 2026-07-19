package com.banhang.dto;

import com.banhang.domain.enums.AuthProvider;
import com.banhang.domain.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank(message = "Họ tên không được để trống")
            @Size(max = 120, message = "Họ tên tối đa 120 ký tự")
            String fullName,
            @NotBlank(message = "Email không được để trống")
            @Email(message = "Email không hợp lệ")
            String email,
            @NotBlank(message = "Mật khẩu không được để trống")
            @Size(min = 6, max = 100, message = "Mật khẩu phải từ 6 đến 100 ký tự")
            String password,
            @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
            String phone
    ) {
    }

    public record LoginRequest(
            @NotBlank(message = "Email không được để trống")
            @Email(message = "Email không hợp lệ")
            String email,
            @NotBlank(message = "Mật khẩu không được để trống")
            String password
    ) {
    }

    public record GoogleLoginRequest(
            @NotBlank(message = "Google credential không được để trống")
            String credential
    ) {
    }

    public record RegisterStartResponse(
            String email,
            String message,
            int expiresInMinutes
    ) {
    }

    public record VerifyRegistrationRequest(
            @NotBlank
            @Email
            String email,
            @NotBlank
            String code
    ) {
    }

    public record UserResponse(
            Long id,
            String fullName,
            String email,
            String phone,
            UserRole role,
            AuthProvider provider,
            String avatarUrl,
            boolean enabled
    ) {
    }

    public record AuthResponse(
            String token,
            String tokenType,
            UserResponse user
    ) {
    }
}
