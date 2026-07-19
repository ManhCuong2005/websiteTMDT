package com.banhang.service;

import com.banhang.domain.*;
import com.banhang.domain.enums.CouponType;
import com.banhang.domain.enums.OrderStatus;
import com.banhang.domain.enums.PaymentMethod;
import com.banhang.domain.enums.PaymentStatus;
import com.banhang.dto.OrderDtos;
import com.banhang.exception.AppException;
import com.banhang.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class OrderService {
    private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("500000");
    private static final BigDecimal SHIPPING_FEE = new BigDecimal("30000");

    private final CurrentUserService currentUserService;
    private final CartRepository cartRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final ProductRepository productRepository;
    private final CouponRepository couponRepository;
    private final AddressRepository addressRepository;
    private final MappingService mappingService;
    private final EmailService emailService;

    public OrderService(CurrentUserService currentUserService,
                        CartRepository cartRepository,
                        OrderRepository orderRepository,
                        PaymentRepository paymentRepository,
                        ProductRepository productRepository,
                        CouponRepository couponRepository,
                        AddressRepository addressRepository,
                        MappingService mappingService,
                        EmailService emailService) {
        this.currentUserService = currentUserService;
        this.cartRepository = cartRepository;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.productRepository = productRepository;
        this.couponRepository = couponRepository;
        this.addressRepository = addressRepository;
        this.mappingService = mappingService;
        this.emailService = emailService;
    }

    @Transactional(readOnly = true)
    public OrderDtos.CouponValidationResponse validateCoupon(OrderDtos.CouponValidationRequest request) {
        BigDecimal subtotal = request.subtotal() == null ? BigDecimal.ZERO : request.subtotal();
        try {
            Coupon coupon = requireValidCoupon(request.code(), subtotal);
            BigDecimal discount = calculateDiscount(coupon, subtotal);
            return new OrderDtos.CouponValidationResponse(coupon.getCode(), true, "Áp dụng mã thành công", discount);
        } catch (AppException ex) {
            return new OrderDtos.CouponValidationResponse(request.code().toUpperCase(Locale.ROOT), false, ex.getMessage(), BigDecimal.ZERO);
        }
    }

    @Transactional
    public OrderDtos.OrderResponse checkout(OrderDtos.CheckoutRequest request) {
        User user = currentUserService.requireUser();
        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "Giỏ hàng đang trống"));
        if (cart.getItems().isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Giỏ hàng đang trống");
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem cartItem : cart.getItems()) {
            Product product = productRepository.findById(cartItem.getProduct().getId())
                    .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Sản phẩm không tồn tại"));
            if (!product.isActive() || product.getStockQuantity() < cartItem.getQuantity()) {
                throw new AppException(HttpStatus.BAD_REQUEST,
                        "Sản phẩm " + product.getName() + " không đủ tồn kho");
            }
            subtotal = subtotal.add(product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));
        }

        Coupon coupon = null;
        BigDecimal discount = BigDecimal.ZERO;
        if (request.couponCode() != null && !request.couponCode().isBlank()) {
            coupon = requireValidCoupon(request.couponCode(), subtotal);
            discount = calculateDiscount(coupon, subtotal);
        }
        BigDecimal shippingFee = subtotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0 ? BigDecimal.ZERO : SHIPPING_FEE;
        BigDecimal total = subtotal.subtract(discount).add(shippingFee).max(BigDecimal.ZERO);

        Order order = new Order();
        order.setOrderCode(generateCode());
        order.setUser(user);
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentMethod(PaymentMethod.COD);
        order.setRecipientName(request.recipientName().trim());
        order.setRecipientPhone(request.recipientPhone().trim());
        order.setShippingAddress(formatAddress(request));
        order.setSubtotal(subtotal);
        order.setDiscountAmount(discount);
        order.setShippingFee(shippingFee);
        order.setTotal(total);
        order.setCouponCode(coupon == null ? null : coupon.getCode());
        order.setNote(clean(request.note()));

        for (CartItem cartItem : List.copyOf(cart.getItems())) {
            Product product = cartItem.getProduct();
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setProductName(product.getName());
            item.setProductSku(product.getSku());
            item.setProductImageUrl(product.getImageUrl());
            item.setUnitPrice(product.getPrice());
            item.setQuantity(cartItem.getQuantity());
            item.setLineTotal(product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));
            order.getItems().add(item);

            product.setStockQuantity(product.getStockQuantity() - cartItem.getQuantity());
            productRepository.save(product);
        }
        orderRepository.save(order);

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setMethod(PaymentMethod.COD);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setAmount(total);
        paymentRepository.save(payment);

        if (coupon != null) {
            coupon.setUsedCount(coupon.getUsedCount() + 1);
            couponRepository.save(coupon);
        }
        if (Boolean.TRUE.equals(request.saveAddress())) {
            saveAddress(user, request);
        }
        cart.getItems().clear();
        cartRepository.save(cart);
        emailService.sendOrderStatus(order);
        return mappingService.toOrder(order);
    }

    @Transactional(readOnly = true)
    public List<OrderDtos.OrderResponse> myOrders() {
        User user = currentUserService.requireUser();
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(mappingService::toOrder).toList();
    }

    @Transactional(readOnly = true)
    public OrderDtos.OrderResponse getMyOrder(Long id) {
        User user = currentUserService.requireUser();
        Order order = orderRepository.findById(id)
                .filter(value -> value.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng"));
        return mappingService.toOrder(order);
    }

    @Transactional
    public OrderDtos.OrderResponse cancel(Long id, OrderDtos.CancelOrderRequest request) {
        User user = currentUserService.requireUser();
        Order order = orderRepository.findById(id)
                .filter(value -> value.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng"));
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Chỉ có thể hủy đơn đang chờ xác nhận");
        }
        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelReason(request.reason() == null || request.reason().isBlank()
                ? "Khách hàng hủy đơn" : request.reason().trim());
        restock(order);
        releaseCoupon(order.getCouponCode());
        markPaymentFailed(order.getId());
        Order saved = orderRepository.save(order);
        emailService.sendOrderStatus(saved);
        return mappingService.toOrder(saved);
    }

    private Coupon requireValidCoupon(String code, BigDecimal subtotal) {
        Coupon coupon = couponRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "Mã giảm giá không tồn tại"));
        LocalDateTime now = LocalDateTime.now();
        if (!coupon.isActive()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Mã giảm giá đã bị tắt");
        }
        if (coupon.getStartAt() != null && now.isBefore(coupon.getStartAt())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Mã giảm giá chưa bắt đầu");
        }
        if (coupon.getEndAt() != null && now.isAfter(coupon.getEndAt())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Mã giảm giá đã hết hạn");
        }
        if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Mã giảm giá đã hết lượt sử dụng");
        }
        if (subtotal.compareTo(coupon.getMinOrderAmount()) < 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Đơn hàng chưa đạt giá trị tối thiểu");
        }
        return coupon;
    }

    private BigDecimal calculateDiscount(Coupon coupon, BigDecimal subtotal) {
        BigDecimal discount = coupon.getType() == CouponType.PERCENT
                ? subtotal.multiply(coupon.getValue()).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP)
                : coupon.getValue();
        if (coupon.getMaxDiscount() != null && discount.compareTo(coupon.getMaxDiscount()) > 0) {
            discount = coupon.getMaxDiscount();
        }
        return discount.min(subtotal).max(BigDecimal.ZERO);
    }

    private String formatAddress(OrderDtos.CheckoutRequest request) {
        return String.join(", ", List.of(
                request.addressLine().trim(),
                clean(request.ward()) == null ? "" : request.ward().trim(),
                clean(request.district()) == null ? "" : request.district().trim(),
                request.province().trim()
        ).stream().filter(value -> !value.isBlank()).toList());
    }

    private void saveAddress(User user, OrderDtos.CheckoutRequest request) {
        Address address = new Address();
        address.setUser(user);
        address.setRecipientName(request.recipientName().trim());
        address.setPhone(request.recipientPhone().trim());
        address.setAddressLine(request.addressLine().trim());
        address.setWard(clean(request.ward()));
        address.setDistrict(clean(request.district()));
        address.setProvince(request.province().trim());
        address.setDefaultAddress(false);
        addressRepository.save(address);
    }

    private String generateCode() {
        return "BH" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMddHHmm"))
                + UUID.randomUUID().toString().substring(0, 5).toUpperCase(Locale.ROOT);
    }


    private void releaseCoupon(String couponCode) {
        if (couponCode == null || couponCode.isBlank()) {
            return;
        }
        couponRepository.findByCodeIgnoreCase(couponCode).ifPresent(coupon -> {
            coupon.setUsedCount(Math.max(0, coupon.getUsedCount() - 1));
            couponRepository.save(coupon);
        });
    }

    private void markPaymentFailed(Long orderId) {
        paymentRepository.findByOrderId(orderId).ifPresent(payment -> {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
        });
    }

    private void restock(Order order) {
        order.getItems().forEach(item -> {
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
            productRepository.save(product);
        });
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
