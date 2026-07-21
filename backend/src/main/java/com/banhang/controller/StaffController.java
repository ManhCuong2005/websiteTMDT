package com.banhang.controller;

import com.banhang.dto.CommonDtos;
import com.banhang.dto.ServiceRequestDtos;
import com.banhang.service.ServiceRequestService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/staff")
public class StaffController {
    private final ServiceRequestService serviceRequestService;

    public StaffController(ServiceRequestService serviceRequestService) {
        this.serviceRequestService = serviceRequestService;
    }

    @GetMapping("/tasks")
    public CommonDtos.PageResponse<ServiceRequestDtos.ServiceRequestResponse> myTasks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return serviceRequestService.myTasks(page, size);
    }

    @PatchMapping("/tasks/{id}/complete")
    public ServiceRequestDtos.ServiceRequestResponse completeTask(
            @PathVariable Long id,
            @RequestBody ServiceRequestDtos.UpdateServiceRequestStatusRequest request) {
        return serviceRequestService.completeMyTask(id, request);
    }
}
