package com.banhang.repository;

import com.banhang.domain.ServiceReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ServiceReviewRepository extends JpaRepository<ServiceReview, Long> {
    boolean existsByServiceRequestId(Long serviceRequestId);
    Optional<ServiceReview> findByServiceRequestId(Long serviceRequestId);
    Page<ServiceReview> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
