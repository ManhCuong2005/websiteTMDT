package com.banhang.service;

import com.banhang.exception.AppException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;

@Component
public class FaceTemplateCrypto {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int IV_BYTES = 12;
    private static final int GCM_TAG_BITS = 128;
    private final SecretKeySpec key;

    public FaceTemplateCrypto(@Value("${app.face.encryption-secret:${app.jwt.secret}}") String secret) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] derived = digest.digest(
                    ("face-template-v1|" + secret).getBytes(StandardCharsets.UTF_8)
            );
            this.key = new SecretKeySpec(derived, "AES");
        } catch (Exception exception) {
            throw new IllegalStateException("Khong the khoi tao ma hoa du lieu guong mat", exception);
        }
    }

    public String encrypt(List<Double> embedding) {
        try {
            ByteBuffer plain = ByteBuffer.allocate(embedding.size() * Float.BYTES);
            embedding.forEach(value -> plain.putFloat(value.floatValue()));
            byte[] iv = new byte[IV_BYTES];
            RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] encrypted = cipher.doFinal(plain.array());
            ByteBuffer payload = ByteBuffer.allocate(1 + iv.length + encrypted.length);
            payload.put((byte) 1).put(iv).put(encrypted);
            return Base64.getEncoder().encodeToString(payload.array());
        } catch (Exception exception) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Khong the bao ve du lieu guong mat");
        }
    }

    public float[] decrypt(String encoded) {
        try {
            ByteBuffer payload = ByteBuffer.wrap(Base64.getDecoder().decode(encoded));
            if (payload.get() != 1) {
                throw new IllegalArgumentException("Unsupported template version");
            }
            byte[] iv = new byte[IV_BYTES];
            payload.get(iv);
            byte[] encrypted = new byte[payload.remaining()];
            payload.get(encrypted);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, iv));
            ByteBuffer plain = ByteBuffer.wrap(cipher.doFinal(encrypted));
            float[] embedding = new float[plain.remaining() / Float.BYTES];
            for (int index = 0; index < embedding.length; index++) {
                embedding[index] = plain.getFloat();
            }
            return embedding;
        } catch (Exception exception) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Du lieu guong mat khong the giai ma");
        }
    }
}
