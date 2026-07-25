package com.banhang.service;

import com.banhang.domain.FaceChallenge;
import com.banhang.domain.FaceTemplate;
import com.banhang.domain.User;
import com.banhang.dto.AuthDtos;
import com.banhang.dto.FaceAuthDtos;
import com.banhang.exception.AppException;
import com.banhang.repository.FaceChallengeRepository;
import com.banhang.repository.FaceTemplateRepository;
import com.banhang.repository.UserRepository;
import com.banhang.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

@Service
public class FaceAuthService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int CHALLENGE_SECONDS = 120;
    private static final int MAX_CHALLENGES_PER_TEN_MINUTES = 8;
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_MINUTES = 15;
    private static final String MODEL_VERSION = "buffalo_s-w600k_mbf-v1";

    private final FaceTemplateRepository templateRepository;
    private final FaceChallengeRepository challengeRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final FaceRecognitionClient recognitionClient;
    private final FaceTemplateCrypto crypto;
    private final JwtService jwtService;
    private final MappingService mappingService;
    private final double matchThreshold;

    public FaceAuthService(FaceTemplateRepository templateRepository,
                           FaceChallengeRepository challengeRepository,
                           UserRepository userRepository,
                           CurrentUserService currentUserService,
                           FaceRecognitionClient recognitionClient,
                           FaceTemplateCrypto crypto,
                           JwtService jwtService,
                           MappingService mappingService,
                           @Value("${app.face.match-threshold:0.45}") double matchThreshold) {
        this.templateRepository = templateRepository;
        this.challengeRepository = challengeRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.recognitionClient = recognitionClient;
        this.crypto = crypto;
        this.jwtService = jwtService;
        this.mappingService = mappingService;
        this.matchThreshold = matchThreshold;
    }

    @Transactional(readOnly = true)
    public FaceAuthDtos.StatusResponse status() {
        User user = currentUserService.requireUser();
        return templateRepository.findByUserId(user.getId())
                .map(template -> new FaceAuthDtos.StatusResponse(
                        true, template.getCreatedAt(), template.getLastVerifiedAt()))
                .orElseGet(() -> new FaceAuthDtos.StatusResponse(false, null, null));
    }

    @Transactional
    public FaceAuthDtos.EnrollmentResponse enroll(List<MultipartFile> images) {
        User user = currentUserService.requireUser();
        if (images == null || images.size() < 3 || images.size() > 5) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Cần từ 3 đến 5 ảnh gương mặt");
        }
        if (images.stream().anyMatch(MultipartFile::isEmpty)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Ảnh gương mặt không được để trống");
        }

        FaceRecognitionClient.EnrollmentResult result = recognitionClient.enroll(images);
        FaceTemplate template = templateRepository.findForUpdateByUserId(user.getId())
                .orElseGet(FaceTemplate::new);
        template.setUser(user);
        template.setEncryptedEmbedding(crypto.encrypt(result.embedding()));
        template.setModelVersion(MODEL_VERSION);
        template.setFailedAttempts(0);
        template.setLockedUntil(null);
        templateRepository.save(template);
        return new FaceAuthDtos.EnrollmentResponse(
                true, result.acceptedSamples(), "Đã đăng ký đăng nhập bằng gương mặt");
    }

    @Transactional
    public FaceAuthDtos.DeleteResponse delete() {
        User user = currentUserService.requireUser();
        templateRepository.findForUpdateByUserId(user.getId()).ifPresent(templateRepository::delete);
        return new FaceAuthDtos.DeleteResponse("Đã xóa dữ liệu đăng nhập bằng gương mặt");
    }

    @Transactional
    public FaceAuthDtos.ChallengeResponse createChallenge(FaceAuthDtos.ChallengeRequest request) {
        LocalDateTime now = LocalDateTime.now();
        challengeRepository.deleteByExpiresAtBefore(now.minusMinutes(10));
        String normalizedEmail = normalizeEmail(request.email());
        String emailHash = hash(normalizedEmail);
        long recent = challengeRepository.countByEmailHashAndCreatedAtAfter(
                emailHash, now.minusMinutes(10));
        if (recent >= MAX_CHALLENGES_PER_TEN_MINUTES) {
            throw new AppException(HttpStatus.TOO_MANY_REQUESTS,
                    "Bạn đã thử quá nhiều lần. Vui lòng đợi ít phút.");
        }

        String token = randomToken();
        String type = RANDOM.nextBoolean() ? "TURN_HEAD" : "MOVE_CLOSER";
        FaceChallenge challenge = new FaceChallenge();
        challenge.setTokenHash(hash(token));
        challenge.setEmailHash(emailHash);
        challenge.setChallengeType(type);
        challenge.setExpiresAt(now.plusSeconds(CHALLENGE_SECONDS));
        challengeRepository.save(challenge);

        String instruction = "TURN_HEAD".equals(type)
                ? "Quay đầu nhẹ sang trái hoặc phải"
                : "Tiến lại gần camera hơn một chút";
        return new FaceAuthDtos.ChallengeResponse(token, type, instruction, CHALLENGE_SECONDS);
    }

    @Transactional(noRollbackFor = AppException.class)
    public AuthDtos.AuthResponse verify(String email,
                                        String challengeToken,
                                        MultipartFile neutralImage,
                                        MultipartFile challengeImage) {
        LocalDateTime now = LocalDateTime.now();
        String normalizedEmail = normalizeEmail(email);
        FaceChallenge challenge = challengeRepository.findForUpdateByTokenHash(hash(challengeToken))
                .orElseThrow(this::invalidLogin);
        if (!MessageDigest.isEqual(
                challenge.getEmailHash().getBytes(StandardCharsets.UTF_8),
                hash(normalizedEmail).getBytes(StandardCharsets.UTF_8))
                || challenge.getConsumedAt() != null
                || challenge.getExpiresAt().isBefore(now)) {
            throw invalidLogin();
        }
        challenge.setConsumedAt(now);
        challengeRepository.save(challenge);

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .filter(User::isEnabled)
                .orElseThrow(this::invalidLogin);
        FaceTemplate template = templateRepository.findForUpdateByUserId(user.getId())
                .orElseThrow(this::invalidLogin);
        if (template.getLockedUntil() != null && template.getLockedUntil().isAfter(now)) {
            throw new AppException(HttpStatus.TOO_MANY_REQUESTS,
                    "Đăng nhập gương mặt tạm khóa 15 phút. Hãy dùng mật khẩu hoặc Google.");
        }

        FaceRecognitionClient.VerificationResult result = recognitionClient.verify(
                neutralImage, challengeImage, challenge.getChallengeType());
        double score = cosine(crypto.decrypt(template.getEncryptedEmbedding()), result.embedding());
        if (!result.livenessPassed() || score < matchThreshold) {
            recordFailure(template, now);
            throw invalidLogin();
        }

        template.setFailedAttempts(0);
        template.setLockedUntil(null);
        template.setLastVerifiedAt(now);
        templateRepository.save(template);
        return new AuthDtos.AuthResponse(
                jwtService.generateToken(user), "Bearer", mappingService.toUser(user));
    }

    private void recordFailure(FaceTemplate template, LocalDateTime now) {
        int failures = template.getFailedAttempts() + 1;
        template.setFailedAttempts(failures);
        if (failures >= MAX_FAILED_ATTEMPTS) {
            template.setFailedAttempts(0);
            template.setLockedUntil(now.plusMinutes(LOCK_MINUTES));
        }
        templateRepository.save(template);
    }

    private double cosine(float[] stored, List<Double> observed) {
        if (stored.length != observed.size()) {
            return -1;
        }
        double dot = 0;
        double leftNorm = 0;
        double rightNorm = 0;
        for (int index = 0; index < stored.length; index++) {
            double right = observed.get(index);
            dot += stored[index] * right;
            leftNorm += stored[index] * stored[index];
            rightNorm += right * right;
        }
        return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm) + 1e-8);
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw invalidLogin();
        }
        return email.trim().toLowerCase();
    }

    private String randomToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (Exception exception) {
            throw new IllegalStateException("Khong the bam du lieu xac thuc", exception);
        }
    }

    private AppException invalidLogin() {
        return new AppException(HttpStatus.UNAUTHORIZED,
                "Không thể xác minh gương mặt. Hãy thử lại hoặc dùng cách đăng nhập khác.");
    }
}
