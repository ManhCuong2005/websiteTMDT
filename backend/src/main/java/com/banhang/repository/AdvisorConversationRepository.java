package com.banhang.repository;

import com.banhang.domain.AdvisorConversation;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AdvisorConversationRepository extends JpaRepository<AdvisorConversation, Long> {
    @EntityGraph(attributePaths = "user")
    Optional<AdvisorConversation> findBySessionToken(UUID sessionToken);
}
