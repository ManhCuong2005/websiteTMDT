package com.banhang.controller;

import com.banhang.dto.CommonDtos;
import com.banhang.dto.ProductDtos;
import com.banhang.service.CatalogService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class CatalogController {
    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/categories")
    public List<ProductDtos.CategoryResponse> categories() {
        return catalogService.categories();
    }

    @GetMapping("/products")
    public CommonDtos.PageResponse<ProductDtos.ProductResponse> products(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "newest") String sort) {
        return catalogService.products(search, category, page, size, sort);
    }

    @GetMapping("/products/featured")
    public List<ProductDtos.ProductResponse> featured() {
        return catalogService.featured();
    }

    @GetMapping("/products/{slug}")
    public ProductDtos.ProductResponse product(@PathVariable String slug) {
        return catalogService.productBySlug(slug);
    }
}
