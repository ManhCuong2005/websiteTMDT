package com.banhang.service;

import com.banhang.domain.ServiceRequest;
import com.banhang.domain.ServiceReview;
import com.banhang.domain.User;
import com.banhang.domain.enums.ServiceRequestStatus;
import com.banhang.domain.enums.UserRole;
import com.banhang.dto.CommonDtos;
import com.banhang.dto.ServiceRequestDtos;
import com.banhang.exception.AppException;
import com.banhang.repository.ServiceRequestRepository;
import com.banhang.repository.ServiceReviewRepository;
import com.banhang.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
public class ServiceRequestService {
    private static final Set<ServiceRequestStatus> CUSTOMER_EDITABLE = EnumSet.of(
            ServiceRequestStatus.NEW,
            ServiceRequestStatus.CONTACTED,
            ServiceRequestStatus.ASSIGNED);
    private static final Set<ServiceRequestStatus> STAFF_ACTIVE = EnumSet.of(
            ServiceRequestStatus.ASSIGNED,
            ServiceRequestStatus.DISPUTED);

    private final ServiceRequestRepository serviceRequestRepository;
    private final ServiceReviewRepository serviceReviewRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    public ServiceRequestService(ServiceRequestRepository serviceRequestRepository,
                                 ServiceReviewRepository serviceReviewRepository,
                                 UserRepository userRepository,
                                 CurrentUserService currentUserService) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.serviceReviewRepository = serviceReviewRepository;
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
    public CommonDtos.PageResponse<ServiceRequestDtos.ServiceRequestResponse> myRequests(int page, int size) {
        User user = currentUserService.requireUser();
        Page<ServiceRequestDtos.ServiceRequestResponse> result = serviceRequestRepository
                .findByUserId(user.getId(), PageRequest.of(
                        Math.max(0, page),
                        Math.min(Math.max(size, 1), 100),
                        Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(this::toResponse);
        return CommonDtos.PageResponse.from(result);
    }

    @Transactional
    public ServiceRequestDtos.ServiceRequestResponse updateMine(
            Long id,
            ServiceRequestDtos.UpdateServiceRequestRequest request) {
        ServiceRequest serviceRequest = requireOwnedRequest(id);
        if (!CUSTOMER_EDITABLE.contains(serviceRequest.getStatus())) {
            throw new AppException(HttpStatus.CONFLICT,
                    "Chi co the sua thong tin truoc khi nhan vien bao hoan thanh");
        }
        serviceRequest.setAddress(clean(request.address()));
        serviceRequest.setPreferredTime(blankToNull(request.preferredTime()));
        serviceRequest.setNote(blankToNull(request.note()));
        return toResponse(serviceRequestRepository.save(serviceRequest));
    }

    @Transactional
    public ServiceRequestDtos.ServiceRequestResponse confirmMine(Long id) {
        ServiceRequest serviceRequest = requireOwnedRequest(id);
        requireStatus(serviceRequest, ServiceRequestStatus.STAFF_COMPLETED,
                "Yeu cau chua duoc nhan vien bao hoan thanh");
        LocalDateTime now = LocalDateTime.now();
        serviceRequest.setStatus(ServiceRequestStatus.COMPLETED);
        serviceRequest.setCustomerConfirmedAt(now);
        serviceRequest.setCompletedAt(now);
        serviceRequest.setComplaint(null);
        return toResponse(serviceRequestRepository.save(serviceRequest));
    }

    @Transactional
    public ServiceRequestDtos.ServiceRequestResponse disputeMine(
            Long id,
            ServiceRequestDtos.ServiceDisputeRequest request) {
        ServiceRequest serviceRequest = requireOwnedRequest(id);
        requireStatus(serviceRequest, ServiceRequestStatus.STAFF_COMPLETED,
                "Chi co the khieu nai khi nhan vien da bao hoan thanh");
        serviceRequest.setStatus(ServiceRequestStatus.DISPUTED);
        serviceRequest.setComplaint(clean(request.complaint()));
        return toResponse(serviceRequestRepository.save(serviceRequest));
    }

    @Transactional
    public ServiceRequestDtos.ServiceReviewResponse reviewMine(
            Long id,
            ServiceRequestDtos.ServiceReviewRequest request) {
        ServiceRequest serviceRequest = requireOwnedRequest(id);
        requireStatus(serviceRequest, ServiceRequestStatus.COMPLETED,
                "Chi co the danh gia dich vu da xac nhan hoan tat");
        if (serviceReviewRepository.existsByServiceRequestId(id)) {
            throw new AppException(HttpStatus.CONFLICT, "Dich vu nay da duoc danh gia");
        }
        ServiceReview review = new ServiceReview();
        review.setServiceRequest(serviceRequest);
        review.setUser(serviceRequest.getUser());
        review.setRating(request.rating());
        review.setContent(clean(request.content()));
        return toReviewResponse(serviceReviewRepository.save(review));
    }

    @Transactional(readOnly = true)
    public List<ServiceRequestDtos.ServiceReviewResponse> featuredReviews(int size) {
        return serviceReviewRepository
                .findAllByOrderByCreatedAtDesc(PageRequest.of(0, Math.min(Math.max(size, 1), 12)))
                .stream()
                .map(this::toReviewResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CommonDtos.PageResponse<ServiceRequestDtos.ServiceRequestResponse> adminSearch(
            ServiceRequestStatus status,
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
    public ServiceRequestDtos.ServiceRequestResponse adminContact(
            Long id,
            ServiceRequestDtos.AdminServiceActionRequest request) {
        ServiceRequest serviceRequest = requireRequest(id);
        if (serviceRequest.getStatus() == ServiceRequestStatus.COMPLETED
                || serviceRequest.getStatus() == ServiceRequestStatus.CANCELLED) {
            throw new AppException(HttpStatus.CONFLICT, "Yeu cau da ket thuc");
        }
        serviceRequest.setContactedAt(LocalDateTime.now());
        serviceRequest.setAdminNote(blankToNull(request.adminNote()));
        if (serviceRequest.getStatus() == ServiceRequestStatus.NEW) {
            serviceRequest.setStatus(ServiceRequestStatus.CONTACTED);
        }
        return toResponse(serviceRequestRepository.save(serviceRequest));
    }

    @Transactional
    public ServiceRequestDtos.ServiceRequestResponse adminCancel(
            Long id,
            ServiceRequestDtos.AdminServiceActionRequest request) {
        ServiceRequest serviceRequest = requireRequest(id);
        if (serviceRequest.getStatus() == ServiceRequestStatus.COMPLETED) {
            throw new AppException(HttpStatus.CONFLICT, "Khong the huy dich vu da hoan tat");
        }
        serviceRequest.setStatus(ServiceRequestStatus.CANCELLED);
        serviceRequest.setAdminNote(blankToNull(request.adminNote()));
        return toResponse(serviceRequestRepository.save(serviceRequest));
    }

    @Transactional(readOnly = true)
    public List<ServiceRequestDtos.StaffOptionResponse> staffOptions() {
        List<ServiceRequestStatus> activeStatuses = List.of(
                ServiceRequestStatus.ASSIGNED,
                ServiceRequestStatus.STAFF_COMPLETED,
                ServiceRequestStatus.DISPUTED);
        return userRepository.findByRoleAndEnabledTrueOrderByFullNameAsc(UserRole.STAFF).stream()
                .map(staff -> new ServiceRequestDtos.StaffOptionResponse(
                        staff.getId(),
                        staff.getFullName(),
                        staff.getEmail(),
                        staff.getPhone(),
                        serviceRequestRepository.countByAssignedStaffIdAndStatusIn(
                                staff.getId(), activeStatuses)))
                .toList();
    }

    @Transactional
    public ServiceRequestDtos.ServiceRequestResponse assignStaff(
            Long id,
            ServiceRequestDtos.AssignStaffRequest request) {
        ServiceRequest serviceRequest = requireRequest(id);
        if (serviceRequest.getStatus() == ServiceRequestStatus.COMPLETED
                || serviceRequest.getStatus() == ServiceRequestStatus.CANCELLED
                || serviceRequest.getStatus() == ServiceRequestStatus.STAFF_COMPLETED) {
            throw new AppException(HttpStatus.CONFLICT,
                    "Khong the giao lai yeu cau o trang thai hien tai");
        }

        if (request.staffId() == null) {
            serviceRequest.setAssignedStaff(null);
            serviceRequest.setAssignedAt(null);
            serviceRequest.setStatus(serviceRequest.getContactedAt() == null
                    ? ServiceRequestStatus.NEW
                    : ServiceRequestStatus.CONTACTED);
            return toResponse(serviceRequestRepository.save(serviceRequest));
        }

        User staff = userRepository.findById(request.staffId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Khong tim thay nhan vien"));
        if (staff.getRole() != UserRole.STAFF || !staff.isEnabled()) {
            throw new AppException(HttpStatus.BAD_REQUEST,
                    "Chi co the giao viec cho nhan vien dang hoat dong");
        }

        serviceRequest.setAssignedStaff(staff);
        serviceRequest.setAssignedAt(LocalDateTime.now());
        serviceRequest.setStaffCompletedAt(null);
        serviceRequest.setCustomerConfirmedAt(null);
        serviceRequest.setCompletedAt(null);
        serviceRequest.setStatus(ServiceRequestStatus.ASSIGNED);
        return toResponse(serviceRequestRepository.save(serviceRequest));
    }

    @Transactional(readOnly = true)
    public CommonDtos.PageResponse<ServiceRequestDtos.ServiceRequestResponse> myTasks(int page, int size) {
        User staff = currentUserService.requireUser();
        if (staff.getRole() != UserRole.STAFF && staff.getRole() != UserRole.ADMIN) {
            throw new AppException(HttpStatus.FORBIDDEN, "Chi nhan vien moi co the xem cong viec");
        }
        Page<ServiceRequestDtos.ServiceRequestResponse> result = serviceRequestRepository
                .findByAssignedStaffId(staff.getId(), PageRequest.of(
                        Math.max(0, page),
                        Math.min(Math.max(size, 1), 100),
                        Sort.by(Sort.Direction.ASC, "status")
                                .and(Sort.by(Sort.Direction.DESC, "assignedAt"))))
                .map(this::toResponse);
        return CommonDtos.PageResponse.from(result);
    }

    @Transactional
    public ServiceRequestDtos.ServiceRequestResponse staffContact(Long id) {
        ServiceRequest serviceRequest = requireAssignedRequest(id);
        if (!STAFF_ACTIVE.contains(serviceRequest.getStatus())) {
            throw new AppException(HttpStatus.CONFLICT, "Cong viec khong con o trang thai dang xu ly");
        }
        LocalDateTime now = LocalDateTime.now();
        serviceRequest.setStaffContactedAt(now);
        if (serviceRequest.getContactedAt() == null) {
            serviceRequest.setContactedAt(now);
        }
        return toResponse(serviceRequestRepository.save(serviceRequest));
    }

    @Transactional
    public ServiceRequestDtos.ServiceRequestResponse completeMyTask(
            Long id,
            ServiceRequestDtos.StaffCompleteRequest request) {
        ServiceRequest serviceRequest = requireAssignedRequest(id);
        if (!STAFF_ACTIVE.contains(serviceRequest.getStatus())) {
            throw new AppException(HttpStatus.CONFLICT, "Cong viec khong con o trang thai dang xu ly");
        }
        serviceRequest.setStatus(ServiceRequestStatus.STAFF_COMPLETED);
        serviceRequest.setStaffCompletedAt(LocalDateTime.now());
        serviceRequest.setStaffResultNote(blankToNull(request.resultNote()));
        return toResponse(serviceRequestRepository.save(serviceRequest));
    }

    public ServiceRequestDtos.ServiceRequestResponse toResponse(ServiceRequest serviceRequest) {
        User assignedStaff = serviceRequest.getAssignedStaff();
        ServiceRequestDtos.ServiceReviewResponse review = serviceReviewRepository
                .findByServiceRequestId(serviceRequest.getId())
                .map(this::toReviewResponse)
                .orElse(null);
        return new ServiceRequestDtos.ServiceRequestResponse(
                serviceRequest.getId(),
                serviceRequest.getUser().getId(),
                serviceRequest.getUser().getEmail(),
                serviceRequest.getUser().getAvatarUrl(),
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
                assignedStaff == null ? null : assignedStaff.getAvatarUrl(),
                serviceRequest.getAdminNote(),
                serviceRequest.getStaffResultNote(),
                serviceRequest.getComplaint(),
                serviceRequest.getContactedAt(),
                serviceRequest.getStaffContactedAt(),
                serviceRequest.getAssignedAt(),
                serviceRequest.getStaffCompletedAt(),
                serviceRequest.getCustomerConfirmedAt(),
                serviceRequest.getCompletedAt(),
                serviceRequest.getCreatedAt(),
                serviceRequest.getUpdatedAt(),
                review);
    }

    private ServiceRequestDtos.ServiceReviewResponse toReviewResponse(ServiceReview review) {
        return new ServiceRequestDtos.ServiceReviewResponse(
                review.getId(),
                review.getServiceRequest().getId(),
                review.getUser().getFullName(),
                review.getUser().getAvatarUrl(),
                review.getServiceRequest().getServiceType(),
                review.getRating(),
                review.getContent(),
                review.getCreatedAt());
    }

    private ServiceRequest requireRequest(Long id) {
        return serviceRequestRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND,
                        "Khong tim thay yeu cau dich vu"));
    }

    private ServiceRequest requireOwnedRequest(Long id) {
        User user = currentUserService.requireUser();
        ServiceRequest serviceRequest = requireRequest(id);
        if (!serviceRequest.getUser().getId().equals(user.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN,
                    "Ban khong co quyen thao tac yeu cau nay");
        }
        return serviceRequest;
    }

    private ServiceRequest requireAssignedRequest(Long id) {
        User staff = currentUserService.requireUser();
        ServiceRequest serviceRequest = requireRequest(id);
        if (serviceRequest.getAssignedStaff() == null
                || !serviceRequest.getAssignedStaff().getId().equals(staff.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Cong viec nay khong duoc giao cho ban");
        }
        return serviceRequest;
    }

    private void requireStatus(ServiceRequest serviceRequest,
                               ServiceRequestStatus expected,
                               String message) {
        if (serviceRequest.getStatus() != expected) {
            throw new AppException(HttpStatus.CONFLICT, message);
        }
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
