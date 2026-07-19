package com.banhang.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "categories")
public class Category extends BaseEntity {
    @Column(nullable = false, unique = true, length = 120)
    private String name;

    @Column(nullable = false, unique = true, length = 140)
    private String slug;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    @Column(nullable = false)
    private boolean active = true;
}
