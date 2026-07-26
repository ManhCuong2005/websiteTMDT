package com.banhang.service;

import com.banhang.domain.PasswordResetRequest;
import com.banhang.domain.User;
import com.banhang.dto.AuthDtos;
import com.banhang.dto.CommonDtos;
import com.banhang.exception.AppException;
import com.banhang.repository.PasswordResetRequestRepository;
import com.banhang.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
public class PasswordService {
    private static final int CODE_EXPIRATION_MINUTES = 10;
    private static final int RESET_TOKEN_EXPIRATION_MINUTES = 10;
    private static final int RESEND_COOLDOWN_SECONDS = 60;
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String RESET_REQUEST_MESSAGE =
            "Nếu email tồn tại trong hệ thống, mã xác thực đã được gửi đến hộp thư của bạn";

    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;
    private final PasswordResetRequestRepository resetRequestRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public PasswordService(CurrentUserService currentUserService,
                           UserRepository userRepository,
                           PasswordResetRequestRepository resetRequestRepository,
                           PasswordEncoder passwordEncoder,
                           EmailService emailService) {
        this.currentUserService = currentUserService;
        this.userRepository = userRepository;
        this.resetRequestRepository = resetRequestRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @Transactional
    public CommonDtos.MessageResponse changePassword(AuthDtos.ChangePasswordRequest request) {
        User user = currentUserService.requireUser();
        if (user.getPasswordHash() == null
                || !passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại không đúng");
        }
        validateNewPassword(request.newPassword(), request.newPasswordConfirmation(), user);
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        resetRequestRepository.findByUserId(user.getId()).ifPresent(resetRequestRepository::delete);
        return new CommonDtos.MessageResponse("Đổi mật khẩu thành công");
    }

    @Transactional
    public AuthDtos.PasswordResetStartResponse requestReset(AuthDtos.ForgotPasswordRequest request) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null || !user.isEnabled()) {
            return new AuthDtos.PasswordResetStartResponse(RESET_REQUEST_MESSAGE, CODE_EXPIRATION_MINUTES);
        }

        LocalDateTime now = LocalDateTime.now();
        PasswordResetRequest resetRequest = resetRequestRepository.findByUserId(user.getId())
                .orElseGet(PasswordResetRequest::new);
        if (resetRequest.getId() != null
                && resetRequest.getLastSentAt().plusSeconds(RESEND_COOLDOWN_SECONDS).isAfter(now)) {
            return new AuthDtos.PasswordResetStartResponse(RESET_REQUEST_MESSAGE, CODE_EXPIRATION_MINUTES);
        }

        String code = verificationCode();
        resetRequest.setUser(user);
        resetRequest.setVerificationCodeHash(passwordEncoder.encode(code));
        resetRequest.setCodeExpiresAt(now.plusMinutes(CODE_EXPIRATION_MINUTES));
        resetRequest.setResetTokenHash(null);
        resetRequest.setResetTokenExpiresAt(null);
        resetRequest.setFailedAttempts(0);
        resetRequest.setLastSentAt(now);
        resetRequestRepository.save(resetRequest);
        emailService.sendPasswordResetCode(email, user.getFullName(), code, CODE_EXPIRATION_MINUTES);
        return new AuthDtos.PasswordResetStartResponse(RESET_REQUEST_MESSAGE, CODE_EXPIRATION_MINUTES);
    }

    public AuthDtos.VerifyPasswordResetCodeResponse verifyResetCode(
            AuthDtos.VerifyPasswordResetCodeRequest request) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> invalidCode("Mã xác thực không đúng hoặc đã hết hạn"));
        PasswordResetRequest resetRequest = resetRequestRepository.findByUserId(user.getId())
                .orElseThrow(() -> invalidCode("Mã xác thực không đúng hoặc đã hết hạn"));
        LocalDateTime now = LocalDateTime.now();

        if (resetRequest.getCodeExpiresAt().isBefore(now)
                || resetRequest.getVerificationCodeHash() == null) {
            resetRequestRepository.delete(resetRequest);
            throw invalidCode("Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới");
        }
        if (resetRequest.getFailedAttempts() >= MAX_FAILED_ATTEMPTS) {
            resetRequestRepository.delete(resetRequest);
            throw invalidCode("Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới");
        }
        if (!passwordEncoder.matches(request.code().trim(), resetRequest.getVerificationCodeHash())) {
            resetRequest.setFailedAttempts(resetRequest.getFailedAttempts() + 1);
            resetRequestRepository.save(resetRequest);
            if (resetRequest.getFailedAttempts() >= MAX_FAILED_ATTEMPTS) {
                resetRequestRepository.delete(resetRequest);
                throw invalidCode("Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới");
            }
            throw invalidCode("Mã xác thực không đúng");
        }

        String resetToken = generateResetToken();
        resetRequest.setVerificationCodeHash(null);
        resetRequest.setResetTokenHash(hashToken(resetToken));
        resetRequest.setResetTokenExpiresAt(now.plusMinutes(RESET_TOKEN_EXPIRATION_MINUTES));
        resetRequestRepository.save(resetRequest);
        return new AuthDtos.VerifyPasswordResetCodeResponse(resetToken, RESET_TOKEN_EXPIRATION_MINUTES);
    }

    @Transactional
    public CommonDtos.MessageResponse resetPassword(AuthDtos.ResetPasswordRequest request) {
        PasswordResetRequest resetRequest = resetRequestRepository
                .findByResetTokenHash(hashToken(request.resetToken()))
                .orElseThrow(() -> invalidCode("Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn"));
        if (resetRequest.getResetTokenExpiresAt() == null
                || resetRequest.getResetTokenExpiresAt().isBefore(LocalDateTime.now())) {
            resetRequestRepository.delete(resetRequest);
            throw invalidCode("Phiên đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu mã mới");
        }

        User user = resetRequest.getUser();
        validateNewPassword(request.newPassword(), request.newPasswordConfirmation(), user);
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        resetRequestRepository.delete(resetRequest);
        return new CommonDtos.MessageResponse("Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay");
    }

    private void validateNewPassword(String password, String confirmation, User user) {
        if (!password.equals(confirmation)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Mật khẩu mới và xác nhận mật khẩu không khớp");
        }
        if (user.getPasswordHash() != null && passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Mật khẩu mới phải khác mật khẩu hiện tại");
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String verificationCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private String generateResetToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable", ex);
        }
    }

    private AppException invalidCode(String message) {
        return new AppException(HttpStatus.BAD_REQUEST, message);
    }
}
