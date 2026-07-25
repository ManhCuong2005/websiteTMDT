package com.banhang.dto;

import java.util.List;

public final class RecommendationDtos {
    private RecommendationDtos() {
    }

    public record ProductRecommendation(
            ProductDtos.ProductResponse product,
            String reason
    ) {
    }

    public record RecommendationResponse(
            String subtitle,
            List<ProductRecommendation> products
    ) {
    }
}
