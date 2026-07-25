package com.banhang.repository;

import com.banhang.domain.AdvisorMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdvisorMessageRepository extends JpaRepository<AdvisorMessage, Long> {
    List<AdvisorMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId);
    List<AdvisorMessage> findTop12ByConversationIdOrderByCreatedAtDesc(Long conversationId);
}
