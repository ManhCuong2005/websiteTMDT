package com.banhang.controller;

import com.banhang.dto.AuthDtos;
import com.banhang.service.AuthService;
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

    public AuthController(AuthService authService) {
        this.authService = authService;
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
}
