package com.banhang.service;

import com.banhang.domain.ServiceRequest;
import com.banhang.domain.ServiceReview;
import com.banhang.domain.User;
import com.banhang.domain.enums.ServiceRequestStatus;
import com.banhang.domain.enums.UserRole;
import com.banhang.dto.ServiceRequestDtos;
import com.banhang.exception.AppException;
import com.banhang.repository.ServiceRequestRepository;
import com.banhang.repository.ServiceReviewRepository;
import com.banhang.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ServiceRequestServiceTest {
    @Mock
    private ServiceRequestRepository serviceRequestRepository;
    @Mock
    private ServiceReviewRepository serviceReviewRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CurrentUserService currentUserService;

    private ServiceRequestService service;
    private User customer;
    private User staff;

    @BeforeEach
    void setUp() {
        service = new ServiceRequestService(
                serviceRequestRepository,
                serviceReviewRepository,
                userRepository,
                currentUserService);
        customer = user(10L, "Nguyen Thu Lan", UserRole.CUSTOMER);
        staff = user(20L, "Tran Minh Ky Thuat", UserRole.STAFF);
    }

    @Test
    void staffCompletionMustWaitForCustomerConfirmation() {
        ServiceRequest request = request(ServiceRequestStatus.ASSIGNED);
        request.setAssignedStaff(staff);
        when(currentUserService.requireUser()).thenReturn(staff);
        when(serviceRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));
        stubResponseSave();

        ServiceRequestDtos.ServiceRequestResponse response = service.completeMyTask(
                request.getId(),
                new ServiceRequestDtos.StaffCompleteRequest("Da thay loi va kiem tra nuoc"));

        assertEquals(ServiceRequestStatus.STAFF_COMPLETED, response.status());
        assertNotNull(response.staffCompletedAt());
        assertEquals("Da thay loi va kiem tra nuoc", response.staffResultNote());
    }

    @Test
    void customerConfirmationIsTheOnlyStepThatCompletesService() {
        ServiceRequest request = request(ServiceRequestStatus.STAFF_COMPLETED);
        when(currentUserService.requireUser()).thenReturn(customer);
        when(serviceRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));
        stubResponseSave();

        ServiceRequestDtos.ServiceRequestResponse response = service.confirmMine(request.getId());

        assertEquals(ServiceRequestStatus.COMPLETED, response.status());
        assertNotNull(response.customerConfirmedAt());
        assertNotNull(response.completedAt());
    }

    @Test
    void customerCanDisputeOnlyAfterStaffCompletion() {
        ServiceRequest request = request(ServiceRequestStatus.ASSIGNED);
        when(currentUserService.requireUser()).thenReturn(customer);
        when(serviceRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));

        assertThrows(AppException.class, () -> service.disputeMine(
                request.getId(),
                new ServiceRequestDtos.ServiceDisputeRequest("May van bi ro nuoc")));
    }

    @Test
    void completedServiceCanBeReviewedOnlyOnce() {
        ServiceRequest request = request(ServiceRequestStatus.COMPLETED);
        when(currentUserService.requireUser()).thenReturn(customer);
        when(serviceRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));
        when(serviceReviewRepository.existsByServiceRequestId(request.getId())).thenReturn(false);
        when(serviceReviewRepository.save(any(ServiceReview.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ServiceRequestDtos.ServiceReviewResponse review = service.reviewMine(
                request.getId(),
                new ServiceRequestDtos.ServiceReviewRequest(5, "Phuc vu rat tot"));

        assertEquals(5, review.rating());
        assertEquals("Phuc vu rat tot", review.content());
    }

    @Test
    void publicReviewsSupportRatingFilterAndMaskedEmail() {
        ServiceRequest request = request(ServiceRequestStatus.COMPLETED);
        ServiceReview entity = new ServiceReview();
        entity.setId(5L);
        entity.setServiceRequest(request);
        entity.setUser(customer);
        entity.setRating(5);
        entity.setContent("Phuc vu dung gio");
        when(serviceReviewRepository.findByRating(
                org.mockito.ArgumentMatchers.eq(5),
                any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(entity)));
        when(serviceReviewRepository.countByRating(anyInt())).thenReturn(0L);
        when(serviceReviewRepository.countByRating(5)).thenReturn(1L);
        when(serviceReviewRepository.averageRating()).thenReturn(5.0);

        ServiceRequestDtos.ServiceReviewPageResponse response =
                service.publicReviews(5, "rating_desc", 0, 9);

        assertEquals(1, response.totalElements());
        assertEquals(5.0, response.averageRating());
        assertEquals(1L, response.ratingCounts().get(5));
        assertEquals("ng***@example.com", response.content().getFirst().customerEmailMasked());
    }

    private ServiceRequest request(ServiceRequestStatus status) {
        ServiceRequest request = new ServiceRequest();
        request.setId(100L);
        request.setUser(customer);
        request.setFullName(customer.getFullName());
        request.setPhone("0901234567");
        request.setAddress("25 Nguyen Trai");
        request.setServiceType("Bao tri dinh ky");
        request.setStatus(status);
        return request;
    }

    private void stubResponseSave() {
        when(serviceReviewRepository.findByServiceRequestId(any())).thenReturn(Optional.empty());
        when(serviceRequestRepository.save(any(ServiceRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    private User user(Long id, String name, UserRole role) {
        User user = new User();
        user.setId(id);
        user.setFullName(name);
        user.setEmail(name.replace(" ", "").toLowerCase() + "@example.com");
        user.setRole(role);
        user.setEnabled(true);
        return user;
    }
}
