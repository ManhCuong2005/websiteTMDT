package com.banhang.repository;

import com.banhang.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByActiveTrueOrderByDisplayOrderAscNameAsc();
    Optional<Category> findBySlug(String slug);
    boolean existsBySlugAndIdNot(String slug, Long id);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}
