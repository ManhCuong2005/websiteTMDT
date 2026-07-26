package com.banhang.controller;

import com.banhang.dto.AuthDtos;
import com.banhang.dto.CommonDtos;
import com.banhang.service.AuthService;
import com.banhang.service.PasswordService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final PasswordService passwordService;

    public AuthController(AuthService authService, PasswordService passwordService) {
        this.authService = authService;
        this.passwordService = passwordService;
    }

    @PostMapping("/register")
    public AuthDtos.RegisterStartResponse register(@Valid @RequestBody AuthDtos.RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/register/verify")
    public AuthDtos.AuthResponse verifyRegistration(@Valid @RequestBody AuthDtos.VerifyRegistrationRequest request) {
        return authService.verifyRegistration(request);
    }

    @PostMapping("/login")
    public AuthDtos.AuthResponse login(@Valid @RequestBody AuthDtos.LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/google")
    public AuthDtos.AuthResponse google(@Valid @RequestBody AuthDtos.GoogleLoginRequest request) {
        return authService.loginWithGoogle(request);
    }

    @GetMapping("/me")
    public AuthDtos.UserResponse me() {
        return authService.me();
    }

    @PostMapping("/password/change")
    public CommonDtos.MessageResponse changePassword(
            @Valid @RequestBody AuthDtos.ChangePasswordRequest request) {
        return passwordService.changePassword(request);
    }

    @PostMapping("/password/forgot")
    public AuthDtos.PasswordResetStartResponse forgotPassword(
            @Valid @RequestBody AuthDtos.ForgotPasswordRequest request) {
        return passwordService.requestReset(request);
    }

    @PostMapping("/password/verify-code")
    public AuthDtos.VerifyPasswordResetCodeResponse verifyPasswordResetCode(
            @Valid @RequestBody AuthDtos.VerifyPasswordResetCodeRequest request) {
        return passwordService.verifyResetCode(request);
    }

    @PostMapping("/password/reset")
    public CommonDtos.MessageResponse resetPassword(
            @Valid @RequestBody AuthDtos.ResetPasswordRequest request) {
        return passwordService.resetPassword(request);
    }
}
