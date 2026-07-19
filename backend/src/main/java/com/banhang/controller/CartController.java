package com.banhang.controller;

import com.banhang.dto.CartDtos;
import com.banhang.service.CartService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cart")
public class CartController {
    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public CartDtos.CartResponse getCart() {
        return cartService.getCart();
    }

    @PostMapping("/items")
    public CartDtos.CartResponse add(@Valid @RequestBody CartDtos.AddCartItemRequest request) {
        return cartService.add(request);
    }

    @PutMapping("/items/{id}")
    public CartDtos.CartResponse update(@PathVariable Long id,
                                        @Valid @RequestBody CartDtos.UpdateCartItemRequest request) {
        return cartService.update(id, request);
    }

    @DeleteMapping("/items/{id}")
    public CartDtos.CartResponse remove(@PathVariable Long id) {
        return cartService.remove(id);
    }
}
