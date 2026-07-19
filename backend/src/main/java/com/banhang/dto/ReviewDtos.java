package com.banhang.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class ReviewDtos {
    private ReviewDtos() {
    }

    public record ReviewRequest(
            @Min(value = 1, message = "Số sao tối thiểu là 1")
            @Max(value = 5, message = "Số sao tối đa là 5")
            int rating,
            @Size(max = 180)
            String title,
            @NotBlank(message = "Nội dung đánh giá không được để trống")
            @Size(max = 3000)
            String content
    ) {
    }

    public record ReviewResponse(
            Long id,
            Long userId,
            String userName,
            String userAvatarUrl,
            int rating,
            String title,
            String content,
            LocalDateTime createdAt
    ) {
    }

    public record ReviewEligibilityResponse(
            boolean canReview,
            String message
    ) {
    }
}
