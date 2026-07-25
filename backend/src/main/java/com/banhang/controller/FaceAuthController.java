package com.banhang.controller;

import com.banhang.dto.AuthDtos;
import com.banhang.dto.FaceAuthDtos;
import com.banhang.service.FaceAuthService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/auth/face")
public class FaceAuthController {
    private final FaceAuthService faceAuthService;

    public FaceAuthController(FaceAuthService faceAuthService) {
        this.faceAuthService = faceAuthService;
    }

    @GetMapping("/status")
    public FaceAuthDtos.StatusResponse status() {
        return faceAuthService.status();
    }

    @PostMapping(value = "/enroll", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public FaceAuthDtos.EnrollmentResponse enroll(@RequestPart("images") List<MultipartFile> images) {
        return faceAuthService.enroll(images);
    }

    @DeleteMapping
    public FaceAuthDtos.DeleteResponse delete() {
        return faceAuthService.delete();
    }

    @PostMapping("/challenge")
    public FaceAuthDtos.ChallengeResponse challenge(
            @Valid @RequestBody FaceAuthDtos.ChallengeRequest request) {
        return faceAuthService.createChallenge(request);
    }

    @PostMapping(value = "/verify", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AuthDtos.AuthResponse verify(
            @RequestParam String email,
            @RequestParam String challengeToken,
            @RequestPart MultipartFile neutralImage,
            @RequestPart MultipartFile challengeImage) {
        return faceAuthService.verify(email, challengeToken, neutralImage, challengeImage);
    }
}
