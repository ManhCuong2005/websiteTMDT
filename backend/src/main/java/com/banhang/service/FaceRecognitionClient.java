package com.banhang.service;

import com.banhang.exception.AppException;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class FaceRecognitionClient {
    private final RestClient restClient;

    public FaceRecognitionClient(@Qualifier("faceRestClient") RestClient restClient) {
        this.restClient = restClient;
    }

    public EnrollmentResult enroll(List<MultipartFile> images) {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        for (int index = 0; index < images.size(); index++) {
            body.add("images", resource(images.get(index), "face-" + index + ".jpg"));
        }
        try {
            EnrollmentResult result = restClient.post()
                    .uri("/v1/enroll")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(EnrollmentResult.class);
            if (result == null || result.embedding() == null || result.embedding().size() != 512) {
                throw new AppException(HttpStatus.BAD_GATEWAY, "Dịch vụ gương mặt trả về dữ liệu không hợp lệ");
            }
            return result;
        } catch (RestClientException exception) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Không thể tạo dữ liệu gương mặt. Hãy đảm bảo ảnh rõ, đủ sáng và chỉ có một người.");
        }
    }

    public VerificationResult verify(MultipartFile neutralImage,
                                     MultipartFile challengeImage,
                                     String challengeType) {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("neutral_image", resource(neutralImage, "neutral.jpg"));
        body.add("challenge_image", resource(challengeImage, "challenge.jpg"));
        body.add("challenge_type", challengeType);
        try {
            VerificationResult result = restClient.post()
                    .uri("/v1/verify")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(VerificationResult.class);
            if (result == null || result.embedding() == null || result.embedding().size() != 512) {
                throw new AppException(HttpStatus.BAD_GATEWAY, "Dịch vụ gương mặt trả về dữ liệu không hợp lệ");
            }
            return result;
        } catch (RestClientException exception) {
            throw new AppException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Không thể xác minh ảnh camera. Hãy giữ mặt rõ và thử lại.");
        }
    }

    private ByteArrayResource resource(MultipartFile file, String fallbackName) {
        try {
            byte[] bytes = file.getBytes();
            return new ByteArrayResource(bytes) {
                @Override
                public String getFilename() {
                    String original = file.getOriginalFilename();
                    return original == null || original.isBlank() ? fallbackName : original;
                }
            };
        } catch (IOException exception) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Không thể đọc ảnh camera");
        }
    }

    public record EnrollmentResult(
            List<Double> embedding,
            @JsonProperty("accepted_samples") int acceptedSamples,
            double consistency
    ) {
    }

    public record VerificationResult(
            List<Double> embedding,
            @JsonProperty("liveness_passed") boolean livenessPassed,
            @JsonProperty("same_face_score") double sameFaceScore,
            @JsonProperty("movement_score") double movementScore
    ) {
    }
}
