package com.eshin.bible.api.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record SavedPassageRequest(
        @NotBlank String version,
        @Positive int bookId,
        @Positive int chapterId,
        @Positive int canonicalBookId,
        @Positive int chapterNumber,
        @NotBlank String bookName,
        @NotBlank String reference,
        @NotEmpty List<SavedVerseDto> verses
) {
}
