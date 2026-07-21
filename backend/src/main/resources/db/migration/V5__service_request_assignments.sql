alter table service_requests
    add column assigned_staff_id bigint,
    add column assigned_at timestamp,
    add column completed_at timestamp;

alter table service_requests
    add constraint fk_service_requests_assigned_staff foreign key (assigned_staff_id) references users(id);

create index idx_service_requests_assigned_staff on service_requests(assigned_staff_id, status);
