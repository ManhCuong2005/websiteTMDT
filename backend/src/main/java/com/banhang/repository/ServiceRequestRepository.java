package com.banhang.repository;

import com.banhang.domain.ServiceRequest;
import com.banhang.domain.enums.ServiceRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {
    long countByStatus(ServiceRequestStatus status);
    long countByAssignedStaffIdAndStatusNot(Long staffId, ServiceRequestStatus status);
    Page<ServiceRequest> findByAssignedStaffId(Long staffId, Pageable pageable);

    @Query("""
            select request from ServiceRequest request
            where (:status is null or request.status = :status)
              and (:search = '' or lower(request.fullName) like lower(concat('%', :search, '%'))
                or lower(request.phone) like lower(concat('%', :search, '%'))
                or lower(request.address) like lower(concat('%', :search, '%'))
                or lower(request.serviceType) like lower(concat('%', :search, '%')))
            """)
    Page<ServiceRequest> searchAdmin(@Param("status") ServiceRequestStatus status,
                                     @Param("search") String search,
                                     Pageable pageable);
}
