package com.banhang.dto;

import com.banhang.domain.enums.ServiceRequestStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

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

    public record UpdateServiceRequestStatusRequest(
            ServiceRequestStatus status,
            @Size(max = 1000)
            String adminNote
    ) {
    }

    public record AssignStaffRequest(Long staffId) {
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
            String adminNote,
            LocalDateTime contactedAt,
            LocalDateTime assignedAt,
            LocalDateTime completedAt,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
    }
}
