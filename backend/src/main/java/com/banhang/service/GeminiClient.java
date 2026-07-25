package com.banhang.service;

import com.banhang.domain.AdvisorMessage;
import com.banhang.exception.AppException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.List;

@Service
public class GeminiClient {
    private static final String SYSTEM_INSTRUCTION = """
            Bạn là chuyên viên tư vấn thiết bị lọc nước của CTCP Xử Lý Nước Minh Phát.
            Hãy trò chuyện tự nhiên, thân thiện và ngắn gọn bằng tiếng Việt.
            Chỉ tư vấn dựa trên DANH MỤC SẢN PHẨM được cung cấp trong yêu cầu.
            Giá và tồn kho phải lấy nguyên văn từ dữ liệu, không được tự suy đoán.
            Khi nhu cầu chưa rõ, hãy hỏi tối đa 2 câu quan trọng về nguồn nước, số người dùng hoặc ngân sách.
            Khi đã đủ dữ liệu, đề xuất tối đa 3 sản phẩm và giải thích ngắn gọn vì sao phù hợp.
            Không đưa ra khẳng định y tế và không cam kết hiệu quả ngoài mô tả sản phẩm.
            productIds chỉ được chứa ID có trong danh mục. Nếu chưa thể đề xuất thì trả về mảng rỗng.
            quickReplies gồm tối đa 3 câu trả lời ngắn mà khách có thể bấm để tiếp tục trò chuyện.
            """;

    private final String apiKey;
    private final String model;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public GeminiClient(@Value("${app.gemini.api-key:}") String apiKey,
                        @Value("${app.gemini.model:gemini-2.5-flash}") String model,
                        ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.model = model;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .build();
    }

    public GeminiAnswer advise(List<AdvisorMessage> history, String catalogContext) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Trợ lý AI chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY và khởi động lại backend.");
        }
        if (!model.matches("[a-zA-Z0-9._-]+")) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Tên model Gemini không hợp lệ");
        }

        ObjectNode request = objectMapper.createObjectNode();
        request.set("systemInstruction", contentNode(null, SYSTEM_INSTRUCTION));
        ArrayNode contents = request.putArray("contents");
        for (AdvisorMessage message : history) {
            String role = "model".equals(message.getRole()) ? "model" : "user";
            contents.add(contentNode(role, message.getContent()));
        }
        contents.add(contentNode("user", "DANH MỤC SẢN PHẨM HIỆN TẠI:\n" + catalogContext));

        ObjectNode generationConfig = request.putObject("generationConfig");
        generationConfig.put("responseMimeType", "application/json");
        generationConfig.put("maxOutputTokens", 1200);
        generationConfig.set("responseSchema", responseSchema());

        try {
            JsonNode response = restClient.post()
                    .uri("/v1beta/models/{model}:generateContent", model)
                    .header("x-goog-api-key", apiKey)
                    .body(request)
                    .retrieve()
                    .body(JsonNode.class);
            return parseResponse(response);
        } catch (RestClientException exception) {
            throw new AppException(HttpStatus.BAD_GATEWAY,
                    "Gemini chưa phản hồi. Vui lòng kiểm tra API key, quota hoặc thử lại sau.");
        }
    }

    private ObjectNode contentNode(String role, String text) {
        ObjectNode content = objectMapper.createObjectNode();
        if (role != null) {
            content.put("role", role);
        }
        content.putArray("parts").addObject().put("text", text);
        return content;
    }

    private ObjectNode responseSchema() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "OBJECT");
        ObjectNode properties = schema.putObject("properties");
        properties.putObject("answer")
                .put("type", "STRING")
                .put("description", "Câu trả lời tự nhiên bằng tiếng Việt");
        properties.putObject("productIds")
                .put("type", "ARRAY")
                .put("description", "Tối đa 3 ID sản phẩm phù hợp")
                .putObject("items")
                .put("type", "INTEGER");
        properties.putObject("quickReplies")
                .put("type", "ARRAY")
                .put("description", "Tối đa 3 câu trả lời gợi ý ngắn")
                .putObject("items")
                .put("type", "STRING");
        schema.putArray("required").add("answer").add("productIds").add("quickReplies");
        return schema;
    }

    private GeminiAnswer parseResponse(JsonNode response) {
        JsonNode parts = response == null
                ? null
                : response.path("candidates").path(0).path("content").path("parts");
        if (parts == null || !parts.isArray()) {
            throw new AppException(HttpStatus.BAD_GATEWAY, "Gemini không trả về nội dung phù hợp");
        }

        String text = "";
        for (JsonNode part : parts) {
            if (part.hasNonNull("text")) {
                text += part.path("text").asText();
            }
        }
        if (text.isBlank()) {
            throw new AppException(HttpStatus.BAD_GATEWAY, "Gemini không trả về nội dung phù hợp");
        }

        try {
            JsonNode result = objectMapper.readTree(stripCodeFence(text));
            String answer = result.path("answer").asText("").trim();
            if (answer.isBlank()) {
                throw new IllegalArgumentException("Missing answer");
            }
            List<Long> productIds = new ArrayList<>();
            result.path("productIds").forEach(node -> {
                if (node.canConvertToLong() && productIds.size() < 3) {
                    productIds.add(node.asLong());
                }
            });
            List<String> quickReplies = new ArrayList<>();
            result.path("quickReplies").forEach(node -> {
                String value = node.asText("").trim();
                if (!value.isBlank() && quickReplies.size() < 3) {
                    quickReplies.add(value);
                }
            });
            return new GeminiAnswer(answer, productIds, quickReplies);
        } catch (Exception exception) {
            throw new AppException(HttpStatus.BAD_GATEWAY, "Gemini trả về dữ liệu không đúng định dạng");
        }
    }

    private String stripCodeFence(String value) {
        String cleaned = value.trim();
        if (cleaned.startsWith("```")) {
            int firstLine = cleaned.indexOf('\n');
            int lastFence = cleaned.lastIndexOf("```");
            if (firstLine >= 0 && lastFence > firstLine) {
                return cleaned.substring(firstLine + 1, lastFence).trim();
            }
        }
        return cleaned;
    }

    public record GeminiAnswer(String answer, List<Long> productIds, List<String> quickReplies) {
    }
}
