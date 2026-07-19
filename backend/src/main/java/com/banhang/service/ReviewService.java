package com.banhang.service;

import com.banhang.domain.Product;
import com.banhang.domain.Review;
import com.banhang.domain.User;
import com.banhang.dto.ReviewDtos;
import com.banhang.exception.AppException;
import com.banhang.repository.OrderRepository;
import com.banhang.repository.ProductRepository;
import com.banhang.repository.ReviewRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final CurrentUserService currentUserService;
    private final MappingService mappingService;

    public ReviewService(ReviewRepository reviewRepository,
                         ProductRepository productRepository,
                         OrderRepository orderRepository,
                         CurrentUserService currentUserService,
                         MappingService mappingService) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.currentUserService = currentUserService;
        this.mappingService = mappingService;
    }

    @Transactional(readOnly = true)
    public List<ReviewDtos.ReviewResponse> byProduct(Long productId) {
        return reviewRepository.findByProductIdAndApprovedTrueOrderByCreatedAtDesc(productId)
                .stream().map(mappingService::toReview).toList();
    }

    @Transactional(readOnly = true)
    public ReviewDtos.ReviewEligibilityResponse eligibility(Long productId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return new ReviewDtos.ReviewEligibilityResponse(false, "Vui lòng đăng nhập để đánh giá sản phẩm đã mua");
        }
        User user = currentUserService.requireUser();
        boolean canReview = orderRepository.hasDeliveredProduct(user.getId(), productId);
        String message = canReview
                ? "Bạn có thể đánh giá sản phẩm này"
                : "Bạn chỉ có thể đánh giá sau khi đã mua sản phẩm và đơn hàng được admin xác nhận đã giao";
        return new ReviewDtos.ReviewEligibilityResponse(canReview, message);
    }

    @Transactional
    public ReviewDtos.ReviewResponse createOrUpdate(Long productId, ReviewDtos.ReviewRequest request) {
        User user = currentUserService.requireUser();
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm"));
        if (!orderRepository.hasDeliveredProduct(user.getId(), productId)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Bạn chỉ có thể đánh giá sản phẩm đã mua và nhận hàng");
        }
        Review review = reviewRepository.findByUserIdAndProductId(user.getId(), productId).orElseGet(Review::new);
        review.setUser(user);
        review.setProduct(product);
        review.setRating(request.rating());
        review.setTitle(request.title() == null || request.title().isBlank() ? null : request.title().trim());
        review.setContent(request.content().trim());
        review.setApproved(true);
        return mappingService.toReview(reviewRepository.save(review));
    }
}
