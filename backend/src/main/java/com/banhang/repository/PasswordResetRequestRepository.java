package com.banhang.repository;

import com.banhang.domain.PasswordResetRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetRequestRepository extends JpaRepository<PasswordResetRequest, Long> {
    Optional<PasswordResetRequest> findByUserId(Long userId);
    Optional<PasswordResetRequest> findByResetTokenHash(String resetTokenHash);
}
