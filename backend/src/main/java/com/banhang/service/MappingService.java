package com.banhang.service;

import com.banhang.domain.*;
import com.banhang.dto.AdminDtos;
import com.banhang.dto.AuthDtos;
import com.banhang.dto.CartDtos;
import com.banhang.dto.OrderDtos;
import com.banhang.dto.ProductDtos;
import com.banhang.dto.ReviewDtos;
import com.banhang.dto.UserDtos;
import com.banhang.repository.PaymentRepository;
import com.banhang.repository.ReviewRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class MappingService {
    private final ReviewRepository reviewRepository;
    private final PaymentRepository paymentRepository;

    public MappingService(ReviewRepository reviewRepository, PaymentRepository paymentRepository) {
        this.reviewRepository = reviewRepository;
        this.paymentRepository = paymentRepository;
    }

    public AuthDtos.UserResponse toUser(User user) {
        return new AuthDtos.UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getPhone(),
                user.getRole(), user.getProvider(), user.getAvatarUrl(), user.isEnabled());
    }

    public ProductDtos.CategoryResponse toCategory(Category category) {
        return new ProductDtos.CategoryResponse(category.getId(), category.getName(), category.getSlug(),
                category.getDescription(), category.getDisplayOrder(), category.isActive());
    }

    public ProductDtos.ProductResponse toProduct(Product product) {
        double average = reviewRepository.averageRating(product.getId());
        long count = reviewRepository.countByProductIdAndApprovedTrue(product.getId());
        return new ProductDtos.ProductResponse(
                product.getId(), product.getCategory().getId(), product.getCategory().getName(), product.getCategory().getSlug(),
                product.getName(), product.getSlug(), product.getSku(), product.getShortDescription(), product.getDescription(),
                product.getPrice(), product.getCompareAtPrice(), product.getStockQuantity(), product.getLowStockThreshold(),
                product.getUnit(), product.getImageUrl(), product.isActive(), product.isFeatured(), average, count,
                product.getCreatedAt(), product.getUpdatedAt());
    }

    public CartDtos.CartResponse toCart(Cart cart) {
        List<CartDtos.CartItemResponse> items = cart.getItems().stream().map(item -> {
            BigDecimal lineTotal = item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            return new CartDtos.CartItemResponse(item.getId(), item.getProduct().getId(), item.getProduct().getName(),
                    item.getProduct().getSlug(), item.getProduct().getImageUrl(), item.getProduct().getPrice(),
                    item.getQuantity(), item.getProduct().getStockQuantity(), lineTotal);
        }).toList();
        int totalItems = items.stream().mapToInt(CartDtos.CartItemResponse::quantity).sum();
        BigDecimal subtotal = items.stream().map(CartDtos.CartItemResponse::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new CartDtos.CartResponse(cart.getId(), items, totalItems, subtotal);
    }

    public UserDtos.AddressResponse toAddress(Address address) {
        return new UserDtos.AddressResponse(address.getId(), address.getRecipientName(), address.getPhone(),
                address.getAddressLine(), address.getWard(), address.getDistrict(), address.getProvince(),
                address.isDefaultAddress(), address.getCreatedAt());
    }

    public OrderDtos.OrderResponse toOrder(Order order) {
        var payment = paymentRepository.findByOrderId(order.getId()).orElse(null);
        List<OrderDtos.OrderItemResponse> items = order.getItems().stream()
                .map(item -> new OrderDtos.OrderItemResponse(item.getId(), item.getProduct().getId(), item.getProductName(),
                        item.getProductSku(), item.getProductImageUrl(), item.getUnitPrice(), item.getQuantity(), item.getLineTotal()))
                .toList();
        return new OrderDtos.OrderResponse(order.getId(), order.getOrderCode(), order.getUser().getId(),
                order.getUser().getFullName(), order.getUser().getEmail(), order.getStatus(), order.getPaymentMethod(),
                payment == null ? null : payment.getStatus(), order.getRecipientName(), order.getRecipientPhone(),
                order.getShippingAddress(), order.getSubtotal(), order.getDiscountAmount(), order.getShippingFee(),
                order.getTotal(), order.getCouponCode(), order.getNote(), order.getCancelReason(), order.getCreatedAt(),
                order.getConfirmedAt(), order.getDeliveredAt(), items);
    }

    public ReviewDtos.ReviewResponse toReview(Review review) {
        return new ReviewDtos.ReviewResponse(review.getId(), review.getUser().getId(), review.getUser().getFullName(),
                review.getUser().getAvatarUrl(), review.getRating(), review.getTitle(), review.getContent(), review.getCreatedAt());
    }

    public AdminDtos.CouponResponse toCoupon(Coupon coupon) {
        return new AdminDtos.CouponResponse(coupon.getId(), coupon.getCode(), coupon.getName(), coupon.getType(), coupon.getValue(),
                coupon.getMinOrderAmount(), coupon.getMaxDiscount(), coupon.getStartAt(), coupon.getEndAt(),
                coupon.getUsageLimit(), coupon.getUsedCount(), coupon.isActive(), coupon.getCreatedAt());
    }

    public AdminDtos.AdminUserResponse toAdminUser(User user) {
        return new AdminDtos.AdminUserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getPhone(),
                user.getRole(), user.getProvider(), user.isEnabled(), user.getCreatedAt());
    }
}
