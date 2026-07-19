package com.banhang.service;

import com.banhang.domain.Category;
import com.banhang.domain.Product;
import com.banhang.dto.CommonDtos;
import com.banhang.dto.ProductDtos;
import com.banhang.exception.AppException;
import com.banhang.repository.CategoryRepository;
import com.banhang.repository.ProductRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class CatalogService {
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final MappingService mappingService;

    public CatalogService(CategoryRepository categoryRepository,
                          ProductRepository productRepository,
                          MappingService mappingService) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.mappingService = mappingService;
    }

    @Transactional(readOnly = true)
    public List<ProductDtos.CategoryResponse> categories() {
        return categoryRepository.findByActiveTrueOrderByDisplayOrderAscNameAsc()
                .stream().map(mappingService::toCategory).toList();
    }

    @Transactional(readOnly = true)
    public CommonDtos.PageResponse<ProductDtos.ProductResponse> products(
            String search, String category, int page, int size, String sort) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 48), sort(sort));
        Page<ProductDtos.ProductResponse> result = productRepository
                .findAll(publicSearch(normalize(search), normalize(category)), pageable)
                .map(mappingService::toProduct);
        return CommonDtos.PageResponse.from(result);
    }

    @Transactional(readOnly = true)
    public List<ProductDtos.ProductResponse> featured() {
        return productRepository.findFeatured(PageRequest.of(0, 8))
                .stream().map(mappingService::toProduct).toList();
    }

    @Transactional(readOnly = true)
    public ProductDtos.ProductResponse productBySlug(String slug) {
        Product product = productRepository.findBySlugAndActiveTrue(slug)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm"));
        return mappingService.toProduct(product);
    }

    private Sort sort(String value) {
        return switch (value == null ? "newest" : value) {
            case "price-asc" -> Sort.by(Sort.Direction.ASC, "price");
            case "price-desc" -> Sort.by(Sort.Direction.DESC, "price");
            case "name" -> Sort.by(Sort.Direction.ASC, "name");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private Specification<Product> publicSearch(String search, String categorySlug) {
        return (root, query, cb) -> {
            Join<Product, Category> category = root.join("category", JoinType.INNER);
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isTrue(root.get("active")));
            predicates.add(cb.isTrue(category.get("active")));

            if (!categorySlug.isBlank()) {
                predicates.add(cb.equal(category.get("slug"), categorySlug));
            }

            for (String term : searchTerms(search)) {
                String like = "%" + term + "%";
                String slugLike = "%" + SlugUtils.toSlug(term) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(root.get("sku")), like),
                        cb.like(cb.lower(root.get("slug")), slugLike),
                        cb.like(cb.lower(cb.coalesce(root.get("shortDescription"), "")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("description"), "")), like),
                        cb.like(cb.lower(category.get("name")), like),
                        cb.like(cb.lower(category.get("slug")), slugLike)
                ));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private List<String> searchTerms(String search) {
        if (search.isBlank()) {
            return List.of();
        }
        Set<String> terms = new LinkedHashSet<>();
        String compact = search.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
        terms.add(compact);
        for (String part : compact.split(" ")) {
            if (part.length() >= 2) {
                terms.add(part);
            }
        }
        return terms.stream().limit(8).toList();
    }
}
