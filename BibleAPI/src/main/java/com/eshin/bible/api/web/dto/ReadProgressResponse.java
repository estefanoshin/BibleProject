package com.eshin.bible.api.web.dto;

import java.util.List;
import java.util.Map;

public record ReadProgressResponse(
        List<String> readChapters,
        Map<String, List<Integer>> bookChapters
) {
}
