package com.banhang.controller;

import com.banhang.dto.ReviewDtos;
import com.banhang.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/product/{productId}")
    public List<ReviewDtos.ReviewResponse> byProduct(@PathVariable Long productId) {
        return reviewService.byProduct(productId);
    }

    @GetMapping("/product/{productId}/eligibility")
    public ReviewDtos.ReviewEligibilityResponse eligibility(@PathVariable Long productId) {
        return reviewService.eligibility(productId);
    }

    @PostMapping("/product/{productId}")
    public ReviewDtos.ReviewResponse createOrUpdate(@PathVariable Long productId,
                                                     @Valid @RequestBody ReviewDtos.ReviewRequest request) {
        return reviewService.createOrUpdate(productId, request);
    }
}
