package com.banhang.seed;

import com.banhang.domain.Cart;
import com.banhang.domain.User;
import com.banhang.domain.enums.AuthProvider;
import com.banhang.domain.enums.UserRole;
import com.banhang.repository.CartRepository;
import com.banhang.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataSeeder implements CommandLineRunner {
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;

    public DataSeeder(UserRepository userRepository,
                      CartRepository cartRepository,
                      PasswordEncoder passwordEncoder,
                      @Value("${app.seed.admin-email}") String adminEmail,
                      @Value("${app.seed.admin-password}") String adminPassword) {
        this.userRepository = userRepository;
        this.cartRepository = cartRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @Override
    @Transactional
    public void run(String... args) {
        User admin = userRepository.findByEmailIgnoreCase(adminEmail).orElseGet(() -> {
            User user = new User();
            user.setFullName("Quản trị viên");
            user.setEmail(adminEmail.toLowerCase());
            user.setPasswordHash(passwordEncoder.encode(adminPassword));
            user.setRole(UserRole.ADMIN);
            user.setProvider(AuthProvider.LOCAL);
            user.setEnabled(true);
            return userRepository.save(user);
        });
        if (cartRepository.findByUserId(admin.getId()).isEmpty()) {
            Cart cart = new Cart();
            cart.setUser(admin);
            cartRepository.save(cart);
        }
    }
}
