package com.banhang.repository;

import com.banhang.domain.Order;
import com.banhang.domain.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    @EntityGraph(attributePaths = {"items", "items.product"})
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"items", "items.product", "user"})
    Optional<Order> findById(Long id);

    @EntityGraph(attributePaths = {"items", "items.product", "user"})
    @Query("""
        select o from Order o
        join o.user u
        where (:status is null or o.status = :status)
          and (:search = ''
               or lower(o.orderCode) like concat('%', :search, '%')
               or lower(u.email) like concat('%', :search, '%')
               or lower(o.recipientName) like concat('%', :search, '%'))
        """)
    Page<Order> searchAdmin(@Param("status") OrderStatus status,
                            @Param("search") String search,
                            Pageable pageable);

    @Query("select coalesce(sum(o.total), 0) from Order o where o.status = com.banhang.domain.enums.OrderStatus.DELIVERED")
    BigDecimal sumDeliveredRevenue();

    long countByStatus(OrderStatus status);

    @Query("""
        select count(oi) > 0 from OrderItem oi
        where oi.order.user.id = :userId
          and oi.product.id = :productId
          and oi.order.status = com.banhang.domain.enums.OrderStatus.DELIVERED
        """)
    boolean hasDeliveredProduct(@Param("userId") Long userId, @Param("productId") Long productId);
}
