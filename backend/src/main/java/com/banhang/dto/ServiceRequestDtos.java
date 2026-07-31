package com.banhang.dto;

import com.banhang.domain.enums.ServiceRequestStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public final class ServiceRequestDtos {
    private ServiceRequestDtos() {
    }

    public record ServiceRequestCreateRequest(
            @NotBlank(message = "Ho ten khong duoc de trong")
            @Size(max = 120)
            String fullName,
            @NotBlank(message = "So dien thoai khong duoc de trong")
            @Size(max = 20)
            String phone,
            @NotBlank(message = "Dia chi khong duoc de trong")
            @Size(max = 255)
            String address,
            @NotBlank(message = "Vui long chon dich vu")
            @Size(max = 80)
            String serviceType,
            @Size(max = 120)
            String preferredTime,
            @Size(max = 1000)
            String note
    ) {
    }

    public record UpdateServiceRequestRequest(
            @NotBlank(message = "Dia chi khong duoc de trong")
            @Size(max = 255)
            String address,
            @Size(max = 120)
            String preferredTime,
            @Size(max = 1000)
            String note
    ) {
    }

    public record AdminServiceActionRequest(
            @Size(max = 1000)
            String adminNote
    ) {
    }

    public record AssignStaffRequest(Long staffId) {
    }

    public record StaffCompleteRequest(
            @Size(max = 1000)
            String resultNote
    ) {
    }

    public record ServiceDisputeRequest(
            @NotBlank(message = "Vui long nhap noi dung khieu nai")
            @Size(max = 1000)
            String complaint
    ) {
    }

    public record ServiceReviewRequest(
            @Min(value = 1, message = "Danh gia tu 1 den 5 sao")
            @Max(value = 5, message = "Danh gia tu 1 den 5 sao")
            int rating,
            @NotBlank(message = "Vui long nhap noi dung danh gia")
            @Size(max = 1000)
            String content
    ) {
    }

    public record StaffOptionResponse(
            Long id,
            String fullName,
            String email,
            String phone,
            long openTasks
    ) {
    }

    public record ServiceRequestResponse(
            Long id,
            Long userId,
            String customerEmail,
            String customerAvatarUrl,
            String fullName,
            String phone,
            String address,
            String serviceType,
            String preferredTime,
            String note,
            ServiceRequestStatus status,
            Long assignedStaffId,
            String assignedStaffName,
            String assignedStaffEmail,
            String assignedStaffAvatarUrl,
            String adminNote,
            String staffResultNote,
            String complaint,
            LocalDateTime contactedAt,
            LocalDateTime staffContactedAt,
            LocalDateTime assignedAt,
            LocalDateTime staffCompletedAt,
            LocalDateTime customerConfirmedAt,
            LocalDateTime completedAt,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            ServiceReviewResponse review
    ) {
    }

    public record ServiceReviewResponse(
            Long id,
            Long serviceRequestId,
            String customerName,
            String customerAvatarUrl,
            String customerEmailMasked,
            String serviceType,
            int rating,
            String content,
            LocalDateTime createdAt
    ) {
    }

    public record ServiceReviewPageResponse(
            List<ServiceReviewResponse> content,
            int page,
            int size,
            long totalElements,
            int totalPages,
            boolean first,
            boolean last,
            double averageRating,
            Map<Integer, Long> ratingCounts
    ) {
    }
}
