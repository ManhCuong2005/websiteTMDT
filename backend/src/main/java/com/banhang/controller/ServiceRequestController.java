package com.banhang.controller;

import com.banhang.dto.ServiceRequestDtos;
import com.banhang.service.ServiceRequestService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
