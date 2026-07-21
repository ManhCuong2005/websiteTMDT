do $$
declare
    constraint_name text;
begin
    select conname into constraint_name
    from pg_constraint
    where conrelid = 'users'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%role%'
    limit 1;

    if constraint_name is not null then
        execute format('alter table users drop constraint %I', constraint_name);
    end if;
end $$;

alter table users
    add constraint users_role_check check (role in ('ADMIN', 'STAFF', 'CUSTOMER'));
