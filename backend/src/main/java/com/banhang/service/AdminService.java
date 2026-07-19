package com.banhang.service;

import com.banhang.domain.Category;
import com.banhang.domain.Coupon;
import com.banhang.domain.Order;
import com.banhang.domain.Payment;
import com.banhang.domain.Product;
import com.banhang.domain.User;
import com.banhang.domain.enums.OrderStatus;
import com.banhang.domain.enums.PaymentStatus;
import com.banhang.domain.enums.UserRole;
import com.banhang.dto.AdminDtos;
import com.banhang.dto.CommonDtos;
import com.banhang.dto.OrderDtos;
import com.banhang.dto.ProductDtos;
import com.banhang.exception.AppException;
import com.banhang.repository.CategoryRepository;
import com.banhang.repository.CouponRepository;
import com.banhang.repository.OrderRepository;
import com.banhang.repository.PaymentRepository;
import com.banhang.repository.ProductRepository;
import com.banhang.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class AdminService {
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CouponRepository couponRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final MappingService mappingService;
    private final CurrentUserService currentUserService;
    private final EmailService emailService;

    public AdminService(UserRepository userRepository,
                        CategoryRepository categoryRepository,
                        ProductRepository productRepository,
                        CouponRepository couponRepository,
                        OrderRepository orderRepository,
                        PaymentRepository paymentRepository,
                        MappingService mappingService,
                        CurrentUserService currentUserService,
                        EmailService emailService) {
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.couponRepository = couponRepository;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.mappingService = mappingService;
        this.currentUserService = currentUserService;
        this.emailService = emailService;
    }

    @Transactional(readOnly = true)
    public AdminDtos.DashboardResponse dashboard() {
        return new AdminDtos.DashboardResponse(
                userRepository.count(),
                userRepository.countByEnabledTrue(),
                productRepository.countByActiveTrue(),
                orderRepository.countByStatus(OrderStatus.PENDING),
                orderRepository.countByStatus(OrderStatus.SHIPPING),
                orderRepository.countByStatus(OrderStatus.DELIVERED),
                productRepository.countByActiveTrueAndStockQuantityLessThanEqual(5),
                orderRepository.sumDeliveredRevenue());
    }

    @Transactional(readOnly = true)
    public List<ProductDtos.CategoryResponse> allCategories() {
        return categoryRepository.findAll(Sort.by("displayOrder", "name")).stream()
                .map(mappingService::toCategory).toList();
    }

    @Transactional
    public ProductDtos.CategoryResponse createCategory(ProductDtos.CategoryRequest request) {
        return saveCategory(new Category(), request);
    }

    @Transactional
    public ProductDtos.CategoryResponse updateCategory(Long id, ProductDtos.CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy danh mục"));
        return saveCategory(category, request);
    }

    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy danh mục"));
        if (productRepository.existsByCategoryId(id)) {
            category.setActive(false);
            categoryRepository.save(category);
            return;
        }
        categoryRepository.delete(category);
    }

    @Transactional(readOnly = true)
    public CommonDtos.PageResponse<ProductDtos.ProductResponse> products(String search, Long categoryId, int page, int size) {
        Page<ProductDtos.ProductResponse> result = productRepository.searchAdmin(
            normalize(search),
            categoryId,
            PageRequest.of(
                    Math.max(0, page),
                    Math.min(Math.max(size, 1), 100),
                    Sort.by(Sort.Direction.DESC, "createdAt")
            )
    ).map(mappingService::toProduct);
        return CommonDtos.PageResponse.from(result);
    }

    @Transactional
    public ProductDtos.ProductResponse createProduct(ProductDtos.ProductRequest request) {
        return saveProduct(new Product(), request);
    }

    @Transactional
    public ProductDtos.ProductResponse updateProduct(Long id, ProductDtos.ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm"));
        return saveProduct(product, request);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm"));
        product.setActive(false);
        productRepository.save(product);
    }

    @Transactional(readOnly = true)
    public List<AdminDtos.CouponResponse> coupons() {
        return couponRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().map(mappingService::toCoupon).toList();
    }

    @Transactional
    public AdminDtos.CouponResponse createCoupon(AdminDtos.CouponRequest request) {
        return saveCoupon(new Coupon(), request);
    }

    @Transactional
    public AdminDtos.CouponResponse updateCoupon(Long id, AdminDtos.CouponRequest request) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy mã giảm giá"));
        return saveCoupon(coupon, request);
    }

    @Transactional
    public void deleteCoupon(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy mã giảm giá"));
        coupon.setActive(false);
        couponRepository.save(coupon);
    }

    @Transactional(readOnly = true)
    public CommonDtos.PageResponse<OrderDtos.OrderResponse> orders(OrderStatus status, String search, int page, int size) {
        Page<OrderDtos.OrderResponse> result = orderRepository.searchAdmin(status, normalize(search).toLowerCase(Locale.ROOT),
                        PageRequest.of(Math.max(0, page), Math.min(Math.max(size, 1), 100), Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(mappingService::toOrder);
        return CommonDtos.PageResponse.from(result);
    }

    @Transactional
    public OrderDtos.OrderResponse updateOrderStatus(Long id, OrderDtos.UpdateOrderStatusRequest request) {
        if (request.status() == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Trạng thái không hợp lệ");
        }
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng"));
        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.DELIVERED) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Đơn hàng đã kết thúc, không thể cập nhật");
        }
        order.setStatus(request.status());
        if (request.status() == OrderStatus.CONFIRMED) {
            order.setConfirmedAt(LocalDateTime.now());
        }
        if (request.status() == OrderStatus.CANCELLED) {
            order.getItems().forEach(item -> {
                Product product = item.getProduct();
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                productRepository.save(product);
            });
            order.setCancelReason("Đơn hàng được hủy bởi quản trị viên");
            if (order.getCouponCode() != null && !order.getCouponCode().isBlank()) {
                couponRepository.findByCodeIgnoreCase(order.getCouponCode()).ifPresent(coupon -> {
                    coupon.setUsedCount(Math.max(0, coupon.getUsedCount() - 1));
                    couponRepository.save(coupon);
                });
            }
            paymentRepository.findByOrderId(order.getId()).ifPresent(payment -> {
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
            });
        }
        if (request.status() == OrderStatus.DELIVERED) {
            order.setDeliveredAt(LocalDateTime.now());
            Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);
            if (payment != null) {
                payment.setStatus(PaymentStatus.PAID);
                payment.setPaidAt(LocalDateTime.now());
                paymentRepository.save(payment);
            }
        }
        Order saved = orderRepository.save(order);
        emailService.sendOrderStatus(saved);
        return mappingService.toOrder(saved);
    }

    @Transactional(readOnly = true)
    public CommonDtos.PageResponse<AdminDtos.AdminUserResponse> users(int page, int size) {
        Page<AdminDtos.AdminUserResponse> result = userRepository
                .findAll(PageRequest.of(Math.max(0, page), Math.min(Math.max(size, 1), 100), Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(mappingService::toAdminUser);
        return CommonDtos.PageResponse.from(result);
    }

    @Transactional
    public AdminDtos.AdminUserResponse updateUserStatus(Long id, AdminDtos.UpdateUserStatusRequest request) {
        User current = currentUserService.requireUser();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
        if (user.getId().equals(current.getId()) && !request.enabled()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Bạn không thể tự khóa tài khoản của mình");
        }
        user.setEnabled(request.enabled());
        return mappingService.toAdminUser(userRepository.save(user));
    }

    private ProductDtos.CategoryResponse saveCategory(Category category, ProductDtos.CategoryRequest request) {
        String slug = request.slug() == null || request.slug().isBlank() ? SlugUtils.toSlug(request.name()) : SlugUtils.toSlug(request.slug());
        long id = category.getId() == null ? -1L : category.getId();
        if (categoryRepository.existsBySlugAndIdNot(slug, id)) {
            throw new AppException(HttpStatus.CONFLICT, "Slug danh mục đã tồn tại");
        }
        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(request.name().trim(), id)) {
            throw new AppException(HttpStatus.CONFLICT, "Tên danh mục đã tồn tại");
        }
        category.setName(request.name().trim());
        category.setSlug(slug);
        category.setDescription(clean(request.description()));
        category.setDisplayOrder(request.displayOrder() == null ? 0 : request.displayOrder());
        category.setActive(request.active() == null || request.active());
        return mappingService.toCategory(categoryRepository.save(category));
    }

    private ProductDtos.ProductResponse saveProduct(Product product, ProductDtos.ProductRequest request) {
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy danh mục"));
        String slug = request.slug() == null || request.slug().isBlank() ? SlugUtils.toSlug(request.name()) : SlugUtils.toSlug(request.slug());
        long id = product.getId() == null ? -1L : product.getId();
        if (productRepository.existsBySlugAndIdNot(slug, id)) {
            throw new AppException(HttpStatus.CONFLICT, "Slug sản phẩm đã tồn tại");
        }
        if (productRepository.existsBySkuIgnoreCaseAndIdNot(request.sku().trim(), id)) {
            throw new AppException(HttpStatus.CONFLICT, "SKU đã tồn tại");
        }
        product.setCategory(category);
        product.setName(request.name().trim());
        product.setSlug(slug);
        product.setSku(request.sku().trim().toUpperCase(Locale.ROOT));
        product.setShortDescription(clean(request.shortDescription()));
        product.setDescription(clean(request.description()));
        product.setPrice(request.price());
        product.setCompareAtPrice(request.compareAtPrice());
        product.setStockQuantity(request.stockQuantity() == null ? 0 : request.stockQuantity());
        product.setLowStockThreshold(request.lowStockThreshold() == null ? 5 : request.lowStockThreshold());
        product.setUnit(request.unit() == null || request.unit().isBlank() ? "sản phẩm" : request.unit().trim());
        product.setImageUrl(clean(request.imageUrl()));
        product.setActive(request.active() == null || request.active());
        product.setFeatured(Boolean.TRUE.equals(request.featured()));
        return mappingService.toProduct(productRepository.save(product));
    }

    private AdminDtos.CouponResponse saveCoupon(Coupon coupon, AdminDtos.CouponRequest request) {
        String code = request.code().trim().toUpperCase(Locale.ROOT);
        long id = coupon.getId() == null ? -1L : coupon.getId();
        if (couponRepository.existsByCodeIgnoreCaseAndIdNot(code, id)) {
            throw new AppException(HttpStatus.CONFLICT, "Mã giảm giá đã tồn tại");
        }
        if (request.endAt() != null && request.startAt() != null && request.endAt().isBefore(request.startAt())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Ngày kết thúc phải sau ngày bắt đầu");
        }
        if (request.type().name().equals("PERCENT") && request.value().compareTo(new BigDecimal("100")) > 0) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Phần trăm giảm không được vượt quá 100");
        }
        coupon.setCode(code);
        coupon.setName(request.name().trim());
        coupon.setType(request.type());
        coupon.setValue(request.value());
        coupon.setMinOrderAmount(request.minOrderAmount() == null ? BigDecimal.ZERO : request.minOrderAmount());
        coupon.setMaxDiscount(request.maxDiscount());
        coupon.setStartAt(request.startAt());
        coupon.setEndAt(request.endAt());
        coupon.setUsageLimit(request.usageLimit());
        coupon.setActive(request.active() == null || request.active());
        return mappingService.toCoupon(couponRepository.save(coupon));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
    
    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }
}
