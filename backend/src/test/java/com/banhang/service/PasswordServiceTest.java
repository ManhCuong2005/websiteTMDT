package com.banhang.service;

import com.banhang.domain.PasswordResetRequest;
import com.banhang.domain.User;
import com.banhang.dto.AuthDtos;
import com.banhang.exception.AppException;
import com.banhang.repository.PasswordResetRequestRepository;
import com.banhang.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PasswordServiceTest {
    @Mock
    private CurrentUserService currentUserService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordResetRequestRepository resetRequestRepository;
    @Mock
    private EmailService emailService;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private PasswordService service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new PasswordService(
                currentUserService,
                userRepository,
                resetRequestRepository,
                passwordEncoder,
                emailService);
        user = new User();
        user.setId(10L);
        user.setFullName("Nguyen Van A");
        user.setEmail("user@example.com");
        user.setEnabled(true);
        user.setPasswordHash(passwordEncoder.encode("OldPassword123"));
    }

    @Test
    void changePasswordRequiresCurrentPasswordAndStoresNewHash() {
        when(currentUserService.requireUser()).thenReturn(user);
        when(resetRequestRepository.findByUserId(user.getId())).thenReturn(Optional.empty());

        service.changePassword(new AuthDtos.ChangePasswordRequest(
                "OldPassword123",
                "NewPassword456",
                "NewPassword456"));

        assertTrue(passwordEncoder.matches("NewPassword456", user.getPasswordHash()));
        verify(userRepository).save(user);
    }

    @Test
    void changePasswordRejectsIncorrectCurrentPassword() {
        when(currentUserService.requireUser()).thenReturn(user);

        assertThrows(AppException.class, () -> service.changePassword(
                new AuthDtos.ChangePasswordRequest(
                        "WrongPassword",
                        "NewPassword456",
                        "NewPassword456")));
    }

    @Test
    void verifiedCodeCreatesOneTimeTokenThatCanResetPassword() {
        PasswordResetRequest resetRequest = new PasswordResetRequest();
        resetRequest.setUser(user);
        resetRequest.setVerificationCodeHash(passwordEncoder.encode("123456"));
        resetRequest.setCodeExpiresAt(LocalDateTime.now().plusMinutes(5));
        resetRequest.setLastSentAt(LocalDateTime.now());

        when(userRepository.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));
        when(resetRequestRepository.findByUserId(user.getId())).thenReturn(Optional.of(resetRequest));
        when(resetRequestRepository.save(any(PasswordResetRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        AuthDtos.VerifyPasswordResetCodeResponse verified = service.verifyResetCode(
                new AuthDtos.VerifyPasswordResetCodeRequest(user.getEmail(), "123456"));

        assertNotNull(verified.resetToken());
        assertNotNull(resetRequest.getResetTokenHash());
        when(resetRequestRepository.findByResetTokenHash(resetRequest.getResetTokenHash()))
                .thenReturn(Optional.of(resetRequest));

        service.resetPassword(new AuthDtos.ResetPasswordRequest(
                verified.resetToken(),
                "ResetPassword789",
                "ResetPassword789"));

        assertTrue(passwordEncoder.matches("ResetPassword789", user.getPasswordHash()));
        verify(resetRequestRepository).delete(resetRequest);
    }
}
