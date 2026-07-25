package com.banhang.repository;

import com.banhang.domain.FaceTemplate;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface FaceTemplateRepository extends JpaRepository<FaceTemplate, Long> {
    Optional<FaceTemplate> findByUserId(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select template from FaceTemplate template where template.user.id = :userId")
    Optional<FaceTemplate> findForUpdateByUserId(@Param("userId") Long userId);
}
