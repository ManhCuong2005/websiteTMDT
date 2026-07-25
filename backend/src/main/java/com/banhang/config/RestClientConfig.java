package com.banhang.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {
    @Bean
    public RestClient googleRestClient() {
        return RestClient.builder().baseUrl("https://oauth2.googleapis.com").build();
    }

    @Bean
    public RestClient faceRestClient(
            @Value("${app.face.service-url:http://127.0.0.1:8001}") String serviceUrl) {
        return RestClient.builder().baseUrl(serviceUrl).build();
    }
}
