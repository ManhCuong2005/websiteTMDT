package com.banhang.service;

import com.banhang.domain.Cart;
import com.banhang.domain.Order;
import com.banhang.domain.OrderItem;
import com.banhang.domain.Product;
import com.banhang.domain.User;
import com.banhang.domain.enums.OrderStatus;
import com.banhang.dto.RecommendationDtos;
import com.banhang.repository.CartRepository;
import com.banhang.repository.OrderRepository;
import com.banhang.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class RecommendationService {
    private static final int RESULT_LIMIT = 4;

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final CurrentUserService currentUserService;
    private final MappingService mappingService;

    public RecommendationService(ProductRepository productRepository,
                                 OrderRepository orderRepository,
                                 CartRepository cartRepository,
                                 CurrentUserService currentUserService,
                                 MappingService mappingService) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.currentUserService = currentUserService;
        this.mappingService = mappingService;
    }

    @Transactional(readOnly = true)
    public RecommendationDtos.RecommendationResponse recommendations() {
        User user = currentUserService.findCurrentUser().orElse(null);
        PreferenceProfile profile = user == null ? PreferenceProfile.empty() : profileFor(user);
        Map<Long, Long> popularity = deliveredProductPopularity();

        List<RecommendationDtos.ProductRecommendation> products = productRepository.findAvailableForRecommendations().stream()
                .filter(product -> !profile.cartProductIds().contains(product.getId()))
                .map(product -> recommendationFor(product, profile, popularity))
                .sorted(Comparator.comparingDouble(ScoredRecommendation::score).reversed()
                        .thenComparing(item -> item.product().getName()))
                .limit(RESULT_LIMIT)
                .map(ScoredRecommendation::recommendation)
                .toList();

        String subtitle = profile.hasPersonalSignals()
                ? "Chọn theo đơn hàng và giỏ hàng của bạn"
                : "Các sản phẩm được nhiều khách hàng lựa chọn";
        return new RecommendationDtos.RecommendationResponse(subtitle, products);
    }

    private PreferenceProfile profileFor(User user) {
        Map<Long, Integer> cartCategoryWeights = new HashMap<>();
        Set<Long> cartProductIds = new HashSet<>();
        cartRepository.findByUserId(user.getId()).ifPresent(cart -> addCartPreferences(cart, cartCategoryWeights, cartProductIds));

        Map<Long, Integer> orderedCategoryWeights = new HashMap<>();
        for (Order order : orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())) {
            if (order.getStatus() == OrderStatus.CANCELLED) {
                continue;
            }
            int orderWeight = order.getStatus() == OrderStatus.DELIVERED ? 3 : 2;
            for (OrderItem item : order.getItems()) {
                orderedCategoryWeights.merge(item.getProduct().getCategory().getId(), item.getQuantity() * orderWeight, Integer::sum);
            }
        }
        return new PreferenceProfile(cartCategoryWeights, orderedCategoryWeights, cartProductIds);
    }

    private void addCartPreferences(Cart cart, Map<Long, Integer> categoryWeights, Set<Long> productIds) {
        cart.getItems().forEach(item -> {
            Product product = item.getProduct();
            productIds.add(product.getId());
            categoryWeights.merge(product.getCategory().getId(), item.getQuantity(), Integer::sum);
        });
    }

    private Map<Long, Long> deliveredProductPopularity() {
        Map<Long, Long> popularity = new HashMap<>();
        for (Object[] row : orderRepository.findDeliveredProductQuantities()) {
            popularity.put((Long) row[0], ((Number) row[1]).longValue());
        }
        return popularity;
    }

    private ScoredRecommendation recommendationFor(Product product,
                                                    PreferenceProfile profile,
                                                    Map<Long, Long> popularity) {
        Long categoryId = product.getCategory().getId();
        int cartAffinity = profile.cartCategoryWeights().getOrDefault(categoryId, 0);
        int orderAffinity = profile.orderedCategoryWeights().getOrDefault(categoryId, 0);
        long sales = popularity.getOrDefault(product.getId(), 0L);
        double score = cartAffinity * 100D + orderAffinity * 25D + sales * 5D + (product.isFeatured() ? 2D : 0D);

        String reason = cartAffinity > 0
                ? "Phù hợp với sản phẩm trong giỏ"
                : orderAffinity > 0
                ? "Cùng nhóm sản phẩm bạn đã chọn"
                : sales > 0
                ? "Được nhiều khách hàng lựa chọn"
                : "Sản phẩm nổi bật đang có sẵn";
        return new ScoredRecommendation(score, product,
                new RecommendationDtos.ProductRecommendation(mappingService.toProduct(product), reason));
    }

    private record PreferenceProfile(Map<Long, Integer> cartCategoryWeights,
                                     Map<Long, Integer> orderedCategoryWeights,
                                     Set<Long> cartProductIds) {
        static PreferenceProfile empty() {
            return new PreferenceProfile(Map.of(), Map.of(), Set.of());
        }

        boolean hasPersonalSignals() {
            return !cartCategoryWeights.isEmpty() || !orderedCategoryWeights.isEmpty();
        }
    }

    private record ScoredRecommendation(double score,
                                        Product product,
                                        RecommendationDtos.ProductRecommendation recommendation) {
    }
}
