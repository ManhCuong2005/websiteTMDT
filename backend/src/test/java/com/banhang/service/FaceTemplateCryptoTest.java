package com.banhang.service;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

class FaceTemplateCryptoTest {
    @Test
    void encryptsAndDecryptsEmbeddingWithRandomIv() {
        FaceTemplateCrypto crypto = new FaceTemplateCrypto("test-secret");
        List<Double> embedding = IntStream.range(0, 512)
                .mapToObj(index -> Math.sin(index) / 16.0)
                .toList();

        String first = crypto.encrypt(embedding);
        String second = crypto.encrypt(embedding);

        assertNotEquals(first, second);
        float[] expected = new float[embedding.size()];
        for (int index = 0; index < expected.length; index++) {
            expected[index] = embedding.get(index).floatValue();
        }
        assertArrayEquals(expected, crypto.decrypt(first), 0.000001f);
    }
}
