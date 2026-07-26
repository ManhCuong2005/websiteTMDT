package com.banhang.controller;

import com.banhang.dto.ServiceRequestDtos;
import com.banhang.service.ServiceRequestService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.banhang.dto.CommonDtos;

import java.util.List;

@RestController
@RequestMapping("/api/service-requests")
public class ServiceRequestController {
    private final ServiceRequestService serviceRequestService;

    public ServiceRequestController(ServiceRequestService serviceRequestService) {
        this.serviceRequestService = serviceRequestService;
    }

    @PostMapping
    public ServiceRequestDtos.ServiceRequestResponse create(@Valid @RequestBody ServiceRequestDtos.ServiceRequestCreateRequest request) {
        return serviceRequestService.create(request);
    }

    @GetMapping("/my")
    public CommonDtos.PageResponse<ServiceRequestDtos.ServiceRequestResponse> myRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return serviceRequestService.myRequests(page, size);
    }

    @PutMapping("/{id}")
    public ServiceRequestDtos.ServiceRequestResponse updateMine(
            @PathVariable Long id,
            @Valid @RequestBody ServiceRequestDtos.UpdateServiceRequestRequest request) {
        return serviceRequestService.updateMine(id, request);
    }

    @PatchMapping("/{id}/confirm")
    public ServiceRequestDtos.ServiceRequestResponse confirmMine(@PathVariable Long id) {
        return serviceRequestService.confirmMine(id);
    }

    @PatchMapping("/{id}/dispute")
    public ServiceRequestDtos.ServiceRequestResponse disputeMine(
            @PathVariable Long id,
            @Valid @RequestBody ServiceRequestDtos.ServiceDisputeRequest request) {
        return serviceRequestService.disputeMine(id, request);
    }

    @PostMapping("/{id}/review")
    public ServiceRequestDtos.ServiceReviewResponse reviewMine(
            @PathVariable Long id,
            @Valid @RequestBody ServiceRequestDtos.ServiceReviewRequest request) {
        return serviceRequestService.reviewMine(id, request);
    }

    @GetMapping("/reviews/featured")
    public List<ServiceRequestDtos.ServiceReviewResponse> featuredReviews(
            @RequestParam(defaultValue = "3") int size) {
        return serviceRequestService.featuredReviews(size);
    }
}
