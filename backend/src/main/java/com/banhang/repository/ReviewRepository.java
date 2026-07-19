package com.banhang.repository;

import com.banhang.domain.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProductIdAndApprovedTrueOrderByCreatedAtDesc(Long productId);
    Optional<Review> findByUserIdAndProductId(Long userId, Long productId);

    @Query("select coalesce(avg(r.rating), 0) from Review r where r.product.id = :productId and r.approved = true")
    Double averageRating(@Param("productId") Long productId);

    long countByProductIdAndApprovedTrue(Long productId);
}
