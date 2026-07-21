package com.banhang.service;

import com.banhang.domain.ServiceRequest;
import com.banhang.domain.User;
import com.banhang.domain.enums.ServiceRequestStatus;
import com.banhang.domain.enums.UserRole;
import com.banhang.dto.CommonDtos;
import com.banhang.dto.ServiceRequestDtos;
import com.banhang.exception.AppException;
import com.banhang.repository.ServiceRequestRepository;
import com.banhang.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class ServiceRequestService {
    private final ServiceRequestRepository serviceRequestRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    public ServiceRequestService(ServiceRequestRepository serviceRequestRepository,
                                 UserRepository userRepository,
                                 CurrentUserService currentUserService) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public ServiceRequestDtos.ServiceRequestResponse create(ServiceRequestDtos.ServiceRequestCreateRequest request) {
        User user = currentUserService.requireUser();
        ServiceRequest serviceRequest = new ServiceRequest();
        serviceRequest.setUser(user);
        serviceRequest.setFullName(clean(request.fullName()));
        serviceRequest.setPhone(clean(request.phone()));
        serviceRequest.setAddress(clean(request.address()));
        serviceRequest.setServiceType(clean(request.serviceType()));
        serviceRequest.setPreferredTime(blankToNull(request.preferredTime()));
        serviceRequest.setNote(blankToNull(request.note()));
        serviceRequest.setStatus(ServiceRequestStatus.NEW);
        return toResponse(serviceRequestRepository.save(serviceRequest));
    }

    @Transactional(readOnly = true)
    public CommonDtos.PageResponse<ServiceRequestDtos.ServiceRequestResponse> adminSearch(ServiceRequestStatus status,
                                                                                         String search,
                                                                                         int page,
                                                                                         int size) {
        Page<ServiceRequestDtos.ServiceRequestResponse> result = serviceRequestRepository
                .searchAdmin(status, search == null ? "" : search.trim(),
                        PageRequest.of(Math.max(0, page), Math.min(Math.max(size, 1), 100),
                                Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::toResponse);
        return CommonDtos.PageResponse.from(result);
    }

    @Transactional
    public ServiceRequestDtos.ServiceRequestResponse updateStatus(Long id,
                                                                  ServiceRequestDtos.UpdateServiceRequestStatusRequest request) {
        if (request.status() == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Trang thai khong hop le");
        }
        ServiceRequest serviceRequest = serviceRequestRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay yeu cau tu van"));
        serviceRequest.setStatus(request.status());
        serviceRequest.setAdminNote(blankToNull(request.adminNote()));
        if (request.status() == ServiceRequestStatus.CONTACTED || request.status() == ServiceRequestStatus.SCHEDULED) {
            serviceRequest.setContactedAt(LocalDateTime.now());
        }
        if (request.status() == ServiceRequestStatus.DONE) {
            serviceRequest.setCompletedAt(LocalDateTime.now());
        }
        return toResponse(serviceRequestRepository.save(serviceRequest));
    }

    @Transactional(readOnly = true)
    public java.util.List<ServiceRequestDtos.StaffOptionResponse> staffOptions() {
        return userRepository.findByRoleAndEnabledTrueOrderByFullNameAsc(UserRole.STAFF).stream()
                .map(staff -> new ServiceRequestDtos.StaffOptionResponse(
                        staff.getId(),
                        staff.getFullName(),
                        staff.getEmail(),
                        staff.getPhone(),
                        serviceRequestRepository.countByAssignedStaffIdAndStatusNot(staff.getId(), ServiceRequestStatus.DONE)))
                .toList();
    }

    @Transactional
    public ServiceRequestDtos.ServiceRequestResponse assignStaff(Long id, ServiceRequestDtos.AssignStaffRequest request) {
        ServiceRequest serviceRequest = serviceRequestRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay yeu cau tu van"));
        if (request.staffId() == null) {
            serviceRequest.setAssignedStaff(null);
            serviceRequest.setAssignedAt(null);
            return toResponse(serviceRequestRepository.save(serviceRequest));
        }
        User staff = userRepository.findById(request.staffId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay nhan vien"));
        if (staff.getRole() != UserRole.STAFF || !staff.isEnabled()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Chi co the giao viec cho nhan vien dang hoat dong");
        }
        serviceRequest.setAssignedStaff(staff);
        serviceRequest.setAssignedAt(LocalDateTime.now());
        if (serviceRequest.getStatus() == ServiceRequestStatus.NEW || serviceRequest.getStatus() == ServiceRequestStatus.CONTACTED) {
            serviceRequest.setStatus(ServiceRequestStatus.SCHEDULED);
        }
        return toResponse(serviceRequestRepository.save(serviceRequest));
    }

    @Transactional(readOnly = true)
    public CommonDtos.PageResponse<ServiceRequestDtos.ServiceRequestResponse> myTasks(int page, int size) {
        User staff = currentUserService.requireUser();
        if (staff.getRole() != UserRole.STAFF && staff.getRole() != UserRole.ADMIN) {
            throw new AppException(HttpStatus.FORBIDDEN, "Chi nhan vien moi co the xem cong viec");
        }
        Page<ServiceRequestDtos.ServiceRequestResponse> result = serviceRequestRepository
                .findByAssignedStaffId(staff.getId(), PageRequest.of(Math.max(0, page), Math.min(Math.max(size, 1), 100),
                        Sort.by(Sort.Direction.ASC, "status").and(Sort.by(Sort.Direction.DESC, "assignedAt"))))
                .map(this::toResponse);
        return CommonDtos.PageResponse.from(result);
    }

    @Transactional
    public ServiceRequestDtos.ServiceRequestResponse completeMyTask(Long id, ServiceRequestDtos.UpdateServiceRequestStatusRequest request) {
        User staff = currentUserService.requireUser();
        ServiceRequest serviceRequest = serviceRequestRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay cong viec"));
        if (serviceRequest.getAssignedStaff() == null || !serviceRequest.getAssignedStaff().getId().equals(staff.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Cong viec nay khong duoc giao cho ban");
        }
        serviceRequest.setStatus(ServiceRequestStatus.DONE);
        serviceRequest.setCompletedAt(LocalDateTime.now());
        serviceRequest.setAdminNote(blankToNull(request.adminNote()));
        return toResponse(serviceRequestRepository.save(serviceRequest));
    }

    public ServiceRequestDtos.ServiceRequestResponse toResponse(ServiceRequest serviceRequest) {
        User assignedStaff = serviceRequest.getAssignedStaff();
        return new ServiceRequestDtos.ServiceRequestResponse(
                serviceRequest.getId(),
                serviceRequest.getUser().getId(),
                serviceRequest.getUser().getEmail(),
                serviceRequest.getFullName(),
                serviceRequest.getPhone(),
                serviceRequest.getAddress(),
                serviceRequest.getServiceType(),
                serviceRequest.getPreferredTime(),
                serviceRequest.getNote(),
                serviceRequest.getStatus(),
                assignedStaff == null ? null : assignedStaff.getId(),
                assignedStaff == null ? null : assignedStaff.getFullName(),
                assignedStaff == null ? null : assignedStaff.getEmail(),
                serviceRequest.getAdminNote(),
                serviceRequest.getContactedAt(),
                serviceRequest.getAssignedAt(),
                serviceRequest.getCompletedAt(),
                serviceRequest.getCreatedAt(),
                serviceRequest.getUpdatedAt());
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
