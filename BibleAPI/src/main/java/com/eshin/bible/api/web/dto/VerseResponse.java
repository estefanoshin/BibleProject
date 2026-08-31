package com.eshin.bible.api.web.dto;

public record VerseResponse(
        int verseId,
        int bookId,
        int chapterId,
        int verseNumber,
        String text
) {
}
