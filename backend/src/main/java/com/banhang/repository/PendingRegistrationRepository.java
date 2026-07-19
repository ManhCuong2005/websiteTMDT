package com.banhang.repository;

import com.banhang.domain.PendingRegistration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface PendingRegistrationRepository extends JpaRepository<PendingRegistration, Long> {
    Optional<PendingRegistration> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    void deleteByEmailIgnoreCase(String email);

    void deleteByExpiresAtBefore(LocalDateTime time);
}
