package com.banhang.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public final class FaceAuthDtos {
    private FaceAuthDtos() {
    }

    public record ChallengeRequest(
            @NotBlank(message = "Email không được để trống")
            @Email(message = "Email không hợp lệ")
            String email
    ) {
    }

    public record ChallengeResponse(
            String challengeToken,
            String challengeType,
            String instruction,
            int expiresInSeconds
    ) {
    }

    public record StatusResponse(
            boolean enrolled,
            LocalDateTime enrolledAt,
            LocalDateTime lastVerifiedAt
    ) {
    }

    public record EnrollmentResponse(
            boolean enrolled,
            int acceptedSamples,
            String message
    ) {
    }

    public record DeleteResponse(String message) {
    }
}
