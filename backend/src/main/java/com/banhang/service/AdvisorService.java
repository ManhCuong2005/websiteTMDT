package com.banhang.service;

import com.banhang.domain.AdvisorConversation;
import com.banhang.domain.AdvisorMessage;
import com.banhang.domain.Product;
import com.banhang.domain.User;
import com.banhang.dto.AdvisorDtos;
import com.banhang.dto.ProductDtos;
import com.banhang.exception.AppException;
import com.banhang.repository.AdvisorConversationRepository;
import com.banhang.repository.AdvisorMessageRepository;
import com.banhang.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AdvisorService {
    private final AdvisorConversationRepository conversationRepository;
    private final AdvisorMessageRepository messageRepository;
    private final ProductRepository productRepository;
    private final CurrentUserService currentUserService;
    private final MappingService mappingService;
    private final GeminiClient geminiClient;

    public AdvisorService(AdvisorConversationRepository conversationRepository,
                          AdvisorMessageRepository messageRepository,
                          ProductRepository productRepository,
                          CurrentUserService currentUserService,
                          MappingService mappingService,
                          GeminiClient geminiClient) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.productRepository = productRepository;
        this.currentUserService = currentUserService;
        this.mappingService = mappingService;
        this.geminiClient = geminiClient;
    }

    public AdvisorDtos.ChatResponse chat(AdvisorDtos.ChatRequest request) {
        User currentUser = currentUserService.findCurrentUser().orElse(null);
        AdvisorConversation conversation = resolveConversation(request.sessionToken(), currentUser, true);

        AdvisorMessage userMessage = new AdvisorMessage();
        userMessage.setConversation(conversation);
        userMessage.setRole("user");
        userMessage.setContent(request.message().trim());
        messageRepository.save(userMessage);

        List<AdvisorMessage> history = messageRepository
                .findTop12ByConversationIdOrderByCreatedAtDesc(conversation.getId());
        Collections.reverse(history);

        List<Product> availableProducts = productRepository.findAvailableForRecommendations();
        GeminiClient.GeminiAnswer answer = geminiClient.advise(history, catalogContext(availableProducts));
        List<ProductDtos.ProductResponse> recommendedProducts =
                mapRecommendedProducts(answer.productIds(), availableProducts);

        AdvisorMessage modelMessage = new AdvisorMessage();
        modelMessage.setConversation(conversation);
        modelMessage.setRole("model");
        modelMessage.setContent(answer.answer());
        modelMessage.setRecommendedProductIds(joinProductIds(recommendedProducts));
        messageRepository.save(modelMessage);

        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        return new AdvisorDtos.ChatResponse(
                conversation.getSessionToken().toString(),
                answer.answer(),
                recommendedProducts,
                answer.quickReplies());
    }

    public AdvisorDtos.ConversationResponse conversation(String sessionToken) {
        User currentUser = currentUserService.findCurrentUser().orElse(null);
        AdvisorConversation conversation = resolveConversation(sessionToken, currentUser, false);
        List<AdvisorMessage> messages = messageRepository
                .findByConversationIdOrderByCreatedAtAsc(conversation.getId());

        Set<Long> allProductIds = messages.stream()
                .flatMap(message -> parseProductIds(message.getRecommendedProductIds()).stream())
                .collect(Collectors.toCollection(LinkedHashSet::new));
        Map<Long, ProductDtos.ProductResponse> productsById = new HashMap<>();
        productRepository.findAvailableForRecommendations().stream()
                .filter(product -> allProductIds.contains(product.getId()))
                .forEach(product -> productsById.put(product.getId(), mappingService.toProduct(product)));

        List<AdvisorDtos.MessageResponse> responses = messages.stream()
                .map(message -> new AdvisorDtos.MessageResponse(
                        message.getRole(),
                        message.getContent(),
                        parseProductIds(message.getRecommendedProductIds()).stream()
                                .map(productsById::get)
                                .filter(java.util.Objects::nonNull)
                                .toList()))
                .toList();
        return new AdvisorDtos.ConversationResponse(conversation.getSessionToken().toString(), responses);
    }

    private AdvisorConversation resolveConversation(String rawToken, User currentUser, boolean create) {
        UUID token = parseToken(rawToken);
        AdvisorConversation conversation = token == null
                ? null
                : conversationRepository.findBySessionToken(token).orElse(null);

        if (conversation != null && !canAccess(conversation, currentUser)) {
            conversation = null;
        }
        if (conversation == null && !create) {
            throw new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy cuộc trò chuyện");
        }
        if (conversation == null) {
            conversation = new AdvisorConversation();
            conversation.setSessionToken(UUID.randomUUID());
            conversation.setUser(currentUser);
            conversation.setLastMessageAt(LocalDateTime.now());
            return conversationRepository.save(conversation);
        }
        if (conversation.getUser() == null && currentUser != null) {
            conversation.setUser(currentUser);
            conversation = conversationRepository.save(conversation);
        }
        return conversation;
    }

    private boolean canAccess(AdvisorConversation conversation, User currentUser) {
        if (conversation.getUser() == null) {
            return true;
        }
        return currentUser != null && conversation.getUser().getId().equals(currentUser.getId());
    }

    private UUID parseToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(rawToken);
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private String catalogContext(List<Product> products) {
        if (products.isEmpty()) {
            return "Hiện không có sản phẩm còn hàng.";
        }
        return products.stream()
                .limit(100)
                .map(product -> String.format(
                        "ID=%d | Danh mục=%s | Tên=%s | Giá=%s VND | Tồn kho=%d %s | Mô tả=%s",
                        product.getId(),
                        product.getCategory().getName(),
                        product.getName(),
                        product.getPrice().toPlainString(),
                        product.getStockQuantity(),
                        product.getUnit(),
                        compactDescription(product)))
                .collect(Collectors.joining("\n"));
    }

    private String compactDescription(Product product) {
        String description = product.getDescription();
        if (description == null || description.isBlank()) {
            description = product.getShortDescription();
        }
        if (description == null || description.isBlank()) {
            return "Chưa có mô tả chi tiết";
        }
        String compact = description.replaceAll("\\s+", " ").trim();
        return compact.length() <= 700 ? compact : compact.substring(0, 700);
    }

    private List<ProductDtos.ProductResponse> mapRecommendedProducts(List<Long> ids, List<Product> availableProducts) {
        Map<Long, Product> byId = availableProducts.stream()
                .collect(Collectors.toMap(Product::getId, product -> product));
        return ids.stream()
                .distinct()
                .limit(3)
                .map(byId::get)
                .filter(java.util.Objects::nonNull)
                .map(mappingService::toProduct)
                .toList();
    }

    private String joinProductIds(List<ProductDtos.ProductResponse> products) {
        return products.stream()
                .map(product -> product.id().toString())
                .collect(Collectors.joining(","));
    }

    private List<Long> parseProductIds(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        List<Long> ids = new ArrayList<>();
        for (String part : value.split(",")) {
            try {
                ids.add(Long.parseLong(part.trim()));
            } catch (NumberFormatException ignored) {
                // Ignore stale or malformed IDs from old messages.
            }
        }
        return ids;
    }
}
