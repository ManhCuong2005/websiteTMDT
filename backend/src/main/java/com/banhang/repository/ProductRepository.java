package com.banhang.repository;

import com.banhang.domain.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    Optional<Product> findBySlugAndActiveTrue(String slug);
    Optional<Product> findBySlug(String slug);
    boolean existsBySlugAndIdNot(String slug, Long id);
    boolean existsBySkuIgnoreCaseAndIdNot(String sku, Long id);
    long countByActiveTrue();
    long countByActiveTrueAndStockQuantityLessThanEqual(int threshold);
    boolean existsByCategoryId(Long categoryId);

    @Query("""
        select p from Product p
        join p.category c
        where p.active = true
        and c.active = true
        and (
            :search = ''
            or lower(p.name) like lower(concat('%', :search, '%'))
            or lower(p.sku) like lower(concat('%', :search, '%'))
            or lower(coalesce(p.shortDescription, '')) like lower(concat('%', :search, '%'))
        )
        and (
            :categorySlug = ''
            or c.slug = :categorySlug
        )
        """)
    Page<Product> searchPublic(
            @Param("search") String search,
            @Param("categorySlug") String categorySlug,
            Pageable pageable
    );

    @Query("select p from Product p where p.active = true and p.featured = true order by p.createdAt desc")
    List<Product> findFeatured(Pageable pageable);

    @Query("""
        select p from Product p
        join p.category c
        where (
            :search = ''
            or lower(p.name) like lower(concat('%', :search, '%'))
            or lower(p.sku) like lower(concat('%', :search, '%'))
        )
        and (
            :categoryId is null
            or c.id = :categoryId
        )
        """)
    Page<Product> searchAdmin(
            @Param("search") String search,
            @Param("categoryId") Long categoryId,
            Pageable pageable
    );
}
