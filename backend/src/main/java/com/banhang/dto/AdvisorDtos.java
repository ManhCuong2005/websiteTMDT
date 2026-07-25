package com.banhang.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class AdvisorDtos {
    private AdvisorDtos() {
    }

    public record ChatRequest(
            String sessionToken,
            @NotBlank(message = "Vui lòng nhập câu hỏi")
            @Size(max = 1200, message = "Câu hỏi không được vượt quá 1200 ký tự")
            String message
    ) {
    }

    public record MessageResponse(
            String role,
            String content,
            List<ProductDtos.ProductResponse> products
    ) {
    }

    public record ChatResponse(
            String sessionToken,
            String answer,
            List<ProductDtos.ProductResponse> products,
            List<String> quickReplies
    ) {
    }

    public record ConversationResponse(
            String sessionToken,
            List<MessageResponse> messages
    ) {
    }
}
