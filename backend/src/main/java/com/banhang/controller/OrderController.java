package com.banhang.controller;

import com.banhang.dto.OrderDtos;
import com.banhang.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/validate-coupon")
    public OrderDtos.CouponValidationResponse validateCoupon(
            @Valid @RequestBody OrderDtos.CouponValidationRequest request) {
        return orderService.validateCoupon(request);
    }

    @PostMapping
    public OrderDtos.OrderResponse checkout(@Valid @RequestBody OrderDtos.CheckoutRequest request) {
        return orderService.checkout(request);
    }

    @GetMapping("/crypto/config")
    public OrderDtos.CryptoPaymentResponse cryptoConfig() {
        return orderService.cryptoConfig();
    }

    @PostMapping("/{id}/crypto-payment/confirm")
    public OrderDtos.OrderResponse confirmCryptoPayment(
            @PathVariable Long id,
            @Valid @RequestBody OrderDtos.ConfirmCryptoPaymentRequest request) {
        return orderService.confirmCryptoPayment(id, request);
    }

    @GetMapping("/my")
    public List<OrderDtos.OrderResponse> myOrders() {
        return orderService.myOrders();
    }

    @GetMapping("/{id}")
    public OrderDtos.OrderResponse order(@PathVariable Long id) {
        return orderService.getMyOrder(id);
    }

    @PostMapping("/{id}/cancel")
    public OrderDtos.OrderResponse cancel(@PathVariable Long id,
                                          @RequestBody(required = false) OrderDtos.CancelOrderRequest request) {
        return orderService.cancel(id, request == null ? new OrderDtos.CancelOrderRequest(null) : request);
    }
}
