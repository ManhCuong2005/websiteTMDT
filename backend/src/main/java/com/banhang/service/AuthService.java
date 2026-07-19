package com.banhang.service;

import com.banhang.domain.Cart;
import com.banhang.domain.PendingRegistration;
import com.banhang.domain.User;
import com.banhang.domain.enums.AuthProvider;
import com.banhang.domain.enums.UserRole;
import com.banhang.dto.AuthDtos;
import com.banhang.exception.AppException;
import com.banhang.repository.CartRepository;
import com.banhang.repository.PendingRegistrationRepository;
import com.banhang.repository.UserRepository;
import com.banhang.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;

@Service
public class AuthService {
    private static final int REGISTRATION_CODE_MINUTES = 10;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PendingRegistrationRepository pendingRegistrationRepository;
    private final CartRepository cartRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final MappingService mappingService;
    private final EmailService emailService;
    private final RestClient googleRestClient;
    private final String googleClientId;

    public AuthService(UserRepository userRepository,
                       PendingRegistrationRepository pendingRegistrationRepository,
                       CartRepository cartRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       MappingService mappingService,
                       EmailService emailService,
                       RestClient googleRestClient,
                       @Value("${app.google.client-id}") String googleClientId) {
        this.userRepository = userRepository;
        this.pendingRegistrationRepository = pendingRegistrationRepository;
        this.cartRepository = cartRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.mappingService = mappingService;
        this.emailService = emailService;
        this.googleRestClient = googleRestClient;
        this.googleClientId = googleClientId;
    }

    @Transactional
    public AuthDtos.RegisterStartResponse register(AuthDtos.RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new AppException(HttpStatus.CONFLICT, "Email da duoc su dung");
        }
        pendingRegistrationRepository.deleteByExpiresAtBefore(LocalDateTime.now());
        PendingRegistration pending = pendingRegistrationRepository.findByEmailIgnoreCase(email).orElseGet(PendingRegistration::new);
        pending.setFullName(request.fullName().trim());
        pending.setEmail(email);
        pending.setPasswordHash(passwordEncoder.encode(request.password()));
        pending.setPhone(clean(request.phone()));
        String code = verificationCode();
        pending.setVerificationCode(code);
        pending.setExpiresAt(LocalDateTime.now().plusMinutes(REGISTRATION_CODE_MINUTES));
        pendingRegistrationRepository.save(pending);
        emailService.sendRegistrationCode(email, code, REGISTRATION_CODE_MINUTES);
        return new AuthDtos.RegisterStartResponse(email, "Ma xac thuc da duoc gui den email cua ban", REGISTRATION_CODE_MINUTES);
    }

    @Transactional
    public AuthDtos.AuthResponse verifyRegistration(AuthDtos.VerifyRegistrationRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            pendingRegistrationRepository.deleteByEmailIgnoreCase(email);
            throw new AppException(HttpStatus.CONFLICT, "Email da duoc su dung");
        }
        PendingRegistration pending = pendingRegistrationRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "Khong tim thay yeu cau dang ky"));
        if (pending.getExpiresAt().isBefore(LocalDateTime.now())) {
            pendingRegistrationRepository.delete(pending);
            throw new AppException(HttpStatus.BAD_REQUEST, "Ma xac thuc da het han");
        }
        if (!pending.getVerificationCode().equals(request.code().trim())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Ma xac thuc khong dung");
        }
        User user = new User();
        user.setFullName(pending.getFullName());
        user.setEmail(email);
        user.setPasswordHash(pending.getPasswordHash());
        user.setPhone(pending.getPhone());
        user.setRole(UserRole.CUSTOMER);
        user.setProvider(AuthProvider.LOCAL);
        user.setEnabled(true);
        userRepository.save(user);
        pendingRegistrationRepository.delete(pending);
        ensureCart(user);
        return responseFor(user);
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        String email = request.email().trim().toLowerCase();
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));
        } catch (DisabledException ex) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tai khoan da bi khoa");
        } catch (AuthenticationException ex) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Email hoac mat khau khong dung");
        }
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED, "Tai khoan khong ton tai"));
        if (!user.isEnabled()) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tai khoan da bi khoa");
        }
        return responseFor(user);
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public AuthDtos.AuthResponse loginWithGoogle(AuthDtos.GoogleLoginRequest request) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Dang nhap Google chua duoc cau hinh. Hay them GOOGLE_CLIENT_ID");
        }
        Map<String, Object> tokenInfo;
        try {
            tokenInfo = googleRestClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/tokeninfo")
                            .queryParam("id_token", request.credential())
                            .build())
                    .retrieve()
                    .body(Map.class);
        } catch (RestClientException ex) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Google credential khong hop le");
        }
        if (tokenInfo == null
                || !googleClientId.equals(String.valueOf(tokenInfo.get("aud")))
                || !"true".equalsIgnoreCase(String.valueOf(tokenInfo.get("email_verified")))) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Khong the xac minh tai khoan Google");
        }
        String email = String.valueOf(tokenInfo.get("email")).trim().toLowerCase();
        String subject = String.valueOf(tokenInfo.get("sub"));
        String name = tokenInfo.get("name") == null ? email : String.valueOf(tokenInfo.get("name"));
        String picture = tokenInfo.get("picture") == null ? null : String.valueOf(tokenInfo.get("picture"));

        User user = userRepository.findByEmailIgnoreCase(email).orElseGet(User::new);
        boolean isNew = user.getId() == null;
        if (isNew) {
            user.setEmail(email);
            user.setRole(UserRole.CUSTOMER);
            user.setEnabled(true);
        }
        user.setFullName(name);
        user.setGoogleSubject(subject);
        if (clean(user.getAvatarUrl()) == null) {
            user.setAvatarUrl(clean(picture));
        }
        user.setProvider(AuthProvider.GOOGLE);
        userRepository.save(user);
        ensureCart(user);
        if (!user.isEnabled()) {
            throw new AppException(HttpStatus.FORBIDDEN, "Tai khoan da bi khoa");
        }
        emailService.sendGoogleLoginSuccess(user.getEmail(), user.getFullName());
        return responseFor(user);
    }

    public AuthDtos.UserResponse me() {
        return mappingService.toUser(currentUser());
    }

    private User currentUser() {
        return userRepository.findByEmailIgnoreCase(
                        org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName())
                .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED, "Tai khoan khong ton tai"));
    }

    private AuthDtos.AuthResponse responseFor(User user) {
        return new AuthDtos.AuthResponse(jwtService.generateToken(user), "Bearer", mappingService.toUser(user));
    }

    private void ensureCart(User user) {
        if (cartRepository.findByUserId(user.getId()).isEmpty()) {
            Cart cart = new Cart();
            cart.setUser(user);
            cartRepository.save(cart);
        }
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String verificationCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }
}
