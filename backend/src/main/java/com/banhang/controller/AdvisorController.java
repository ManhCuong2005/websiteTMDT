package com.banhang.controller;

import com.banhang.dto.AdvisorDtos;
import com.banhang.service.AdvisorService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/advisor")
public class AdvisorController {
    private final AdvisorService advisorService;

    public AdvisorController(AdvisorService advisorService) {
        this.advisorService = advisorService;
    }

    @PostMapping("/chat")
    public AdvisorDtos.ChatResponse chat(@Valid @RequestBody AdvisorDtos.ChatRequest request) {
        return advisorService.chat(request);
    }

    @GetMapping("/conversations/{sessionToken}")
    public AdvisorDtos.ConversationResponse conversation(@PathVariable String sessionToken) {
        return advisorService.conversation(sessionToken);
    }
}
