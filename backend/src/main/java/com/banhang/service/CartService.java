package com.banhang.service;

import com.banhang.domain.Cart;
import com.banhang.domain.CartItem;
import com.banhang.domain.Product;
import com.banhang.domain.User;
import com.banhang.dto.CartDtos;
import com.banhang.exception.AppException;
import com.banhang.repository.CartItemRepository;
import com.banhang.repository.CartRepository;
import com.banhang.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CartService {
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final CurrentUserService currentUserService;
    private final MappingService mappingService;

    public CartService(CartRepository cartRepository,
                       CartItemRepository cartItemRepository,
                       ProductRepository productRepository,
                       CurrentUserService currentUserService,
                       MappingService mappingService) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.currentUserService = currentUserService;
        this.mappingService = mappingService;
    }

    @Transactional
    public CartDtos.CartResponse getCart() {
        User user = currentUserService.requireUser();
        return mappingService.toCart(findOrCreate(user));
    }

    @Transactional
    public CartDtos.CartResponse add(CartDtos.AddCartItemRequest request) {
        User user = currentUserService.requireUser();
        Cart cart = findOrCreate(user);
        Product product = productRepository.findById(request.productId())
                .filter(Product::isActive)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Sản phẩm không tồn tại"));
        int requested = request.quantity();
        CartItem item = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId()).orElse(null);
        if (item == null) {
            item = new CartItem();
            item.setCart(cart);
            item.setProduct(product);
            item.setQuantity(0);
            cart.getItems().add(item);
        }
        int total = item.getQuantity() + requested;
        validateStock(product, total);
        item.setQuantity(total);
        cartItemRepository.save(item);
        return mappingService.toCart(cart);
    }

    @Transactional
    public CartDtos.CartResponse update(Long itemId, CartDtos.UpdateCartItemRequest request) {
        User user = currentUserService.requireUser();
        Cart cart = findOrCreate(user);
        CartItem item = cartItemRepository.findById(itemId)
                .filter(value -> value.getCart().getId().equals(cart.getId()))
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm trong giỏ"));
        validateStock(item.getProduct(), request.quantity());
        item.setQuantity(request.quantity());
        cartItemRepository.save(item);
        return mappingService.toCart(cart);
    }

    @Transactional
    public CartDtos.CartResponse remove(Long itemId) {
        User user = currentUserService.requireUser();
        Cart cart = findOrCreate(user);
        CartItem item = cartItemRepository.findById(itemId)
                .filter(value -> value.getCart().getId().equals(cart.getId()))
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm trong giỏ"));
        cart.getItems().removeIf(value -> value.getId().equals(itemId));
        cartItemRepository.delete(item);
        return mappingService.toCart(cart);
    }

    private Cart findOrCreate(User user) {
        return cartRepository.findByUserId(user.getId()).orElseGet(() -> {
            Cart cart = new Cart();
            cart.setUser(user);
            return cartRepository.save(cart);
        });
    }

    private void validateStock(Product product, int quantity) {
        if (quantity < 1) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Số lượng không hợp lệ");
        }
        if (product.getStockQuantity() < quantity) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Sản phẩm " + product.getName() + " chỉ còn " + product.getStockQuantity() + " trong kho");
        }
    }
}
