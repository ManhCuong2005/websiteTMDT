package com.banhang.security;

import com.banhang.domain.User;
import com.banhang.exception.AppException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class JwtService {
    private static final Base64.Encoder URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder URL_DECODER = Base64.getUrlDecoder();

    private final ObjectMapper objectMapper;
    private final byte[] signingKey;
    private final long expirationSeconds;

    public JwtService(ObjectMapper objectMapper,
                      @Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.expiration-minutes}") long expirationMinutes) {
        this.objectMapper = objectMapper;
        this.signingKey = sha256(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationSeconds = expirationMinutes * 60;
    }

    public String generateToken(User user) {
        try {
            String header = encodeJson(Map.of("alg", "HS256", "typ", "JWT"));
            long now = Instant.now().getEpochSecond();
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("sub", user.getEmail());
            payload.put("uid", user.getId());
            payload.put("role", user.getRole().name());
            payload.put("iat", now);
            payload.put("exp", now + expirationSeconds);
            String encodedPayload = encodeJson(payload);
            String unsigned = header + "." + encodedPayload;
            String signature = URL_ENCODER.encodeToString(hmac(unsigned));
            return unsigned + "." + signature;
        } catch (Exception ex) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể tạo phiên đăng nhập");
        }
    }

    public boolean isValid(String token) {
        try {
            Map<String, Object> claims = parseAndVerify(token);
            long exp = ((Number) claims.get("exp")).longValue();
            return exp > Instant.now().getEpochSecond();
        } catch (Exception ex) {
            return false;
        }
    }

    public String extractUsername(String token) {
        try {
            return String.valueOf(parseAndVerify(token).get("sub"));
        } catch (Exception ex) {
            return null;
        }
    }

    private Map<String, Object> parseAndVerify(String token) throws Exception {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new IllegalArgumentException("Invalid token");
        }
        String unsigned = parts[0] + "." + parts[1];
        byte[] expected = hmac(unsigned);
        byte[] actual = URL_DECODER.decode(parts[2]);
        if (!MessageDigest.isEqual(expected, actual)) {
            throw new IllegalArgumentException("Invalid signature");
        }
        byte[] payloadBytes = URL_DECODER.decode(parts[1]);
        return objectMapper.readValue(payloadBytes, new TypeReference<>() {});
    }

    private String encodeJson(Map<String, Object> value) throws Exception {
        return URL_ENCODER.encodeToString(objectMapper.writeValueAsBytes(value));
    }

    private byte[] hmac(String value) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(signingKey, "HmacSHA256"));
        return mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
    }

    private byte[] sha256(byte[] bytes) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(bytes);
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }
}
