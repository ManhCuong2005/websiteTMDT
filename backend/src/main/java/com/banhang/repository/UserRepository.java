package com.banhang.repository;

import com.banhang.domain.User;
import com.banhang.domain.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    long countByEnabledTrue();
    List<User> findByRoleAndEnabledTrueOrderByFullNameAsc(UserRole role);
}
