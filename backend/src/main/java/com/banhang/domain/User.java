package com.banhang.domain;

import com.banhang.domain.enums.AuthProvider;
import com.banhang.domain.enums.UserRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "users")
public class User extends BaseEntity {
    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Column(nullable = false, unique = true, length = 190)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role = UserRole.CUSTOMER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AuthProvider provider = AuthProvider.LOCAL;

    @Column(name = "google_subject", unique = true, length = 100)
    private String googleSubject;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(nullable = false)
    private boolean enabled = true;
}
