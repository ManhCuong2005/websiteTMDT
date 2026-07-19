package com.banhang.controller;

import com.banhang.domain.enums.OrderStatus;
import com.banhang.dto.AdminDtos;
import com.banhang.dto.CommonDtos;
import com.banhang.dto.OrderDtos;
import com.banhang.dto.ProductDtos;
import com.banhang.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard")
    public AdminDtos.DashboardResponse dashboard() {
        return adminService.dashboard();
    }

    @GetMapping("/categories")
    public List<ProductDtos.CategoryResponse> categories() {
        return adminService.allCategories();
    }

    @PostMapping("/categories")
    public ProductDtos.CategoryResponse createCategory(@Valid @RequestBody ProductDtos.CategoryRequest request) {
        return adminService.createCategory(request);
    }

    @PutMapping("/categories/{id}")
    public ProductDtos.CategoryResponse updateCategory(@PathVariable Long id,
                                                        @Valid @RequestBody ProductDtos.CategoryRequest request) {
        return adminService.updateCategory(id, request);
    }

    @DeleteMapping("/categories/{id}")
    public CommonDtos.MessageResponse deleteCategory(@PathVariable Long id) {
        adminService.deleteCategory(id);
        return new CommonDtos.MessageResponse("Đã xử lý danh mục");
    }

    @GetMapping("/products")
    public CommonDtos.PageResponse<ProductDtos.ProductResponse> products(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return adminService.products(search, categoryId, page, size);
    }

    @PostMapping("/products")
    public ProductDtos.ProductResponse createProduct(@Valid @RequestBody ProductDtos.ProductRequest request) {
        return adminService.createProduct(request);
    }

    @PutMapping("/products/{id}")
    public ProductDtos.ProductResponse updateProduct(@PathVariable Long id,
                                                      @Valid @RequestBody ProductDtos.ProductRequest request) {
        return adminService.updateProduct(id, request);
    }

    @DeleteMapping("/products/{id}")
    public CommonDtos.MessageResponse deleteProduct(@PathVariable Long id) {
        adminService.deleteProduct(id);
        return new CommonDtos.MessageResponse("Đã ẩn sản phẩm");
    }

    @GetMapping("/coupons")
    public List<AdminDtos.CouponResponse> coupons() {
        return adminService.coupons();
    }

    @PostMapping("/coupons")
    public AdminDtos.CouponResponse createCoupon(@Valid @RequestBody AdminDtos.CouponRequest request) {
        return adminService.createCoupon(request);
    }

    @PutMapping("/coupons/{id}")
    public AdminDtos.CouponResponse updateCoupon(@PathVariable Long id,
                                                  @Valid @RequestBody AdminDtos.CouponRequest request) {
        return adminService.updateCoupon(id, request);
    }

    @DeleteMapping("/coupons/{id}")
    public CommonDtos.MessageResponse deleteCoupon(@PathVariable Long id) {
        adminService.deleteCoupon(id);
        return new CommonDtos.MessageResponse("Đã tắt mã giảm giá");
    }

    @GetMapping("/orders")
    public CommonDtos.PageResponse<OrderDtos.OrderResponse> orders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return adminService.orders(status, search, page, size);
    }

    @PatchMapping("/orders/{id}/status")
    public OrderDtos.OrderResponse updateOrderStatus(@PathVariable Long id,
                                                      @RequestBody OrderDtos.UpdateOrderStatusRequest request) {
        return adminService.updateOrderStatus(id, request);
    }

    @GetMapping("/users")
    public CommonDtos.PageResponse<AdminDtos.AdminUserResponse> users(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return adminService.users(page, size);
    }

    @PatchMapping("/users/{id}/status")
    public AdminDtos.AdminUserResponse updateUserStatus(@PathVariable Long id,
                                                         @RequestBody AdminDtos.UpdateUserStatusRequest request) {
        return adminService.updateUserStatus(id, request);
    }
}
