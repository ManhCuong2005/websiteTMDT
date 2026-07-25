package com.banhang.repository;

import com.banhang.domain.FaceChallenge;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface FaceChallengeRepository extends JpaRepository<FaceChallenge, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select challenge from FaceChallenge challenge where challenge.tokenHash = :tokenHash")
    Optional<FaceChallenge> findForUpdateByTokenHash(@Param("tokenHash") String tokenHash);

    long countByEmailHashAndCreatedAtAfter(String emailHash, LocalDateTime createdAt);
    long deleteByExpiresAtBefore(LocalDateTime expiresAt);
}
