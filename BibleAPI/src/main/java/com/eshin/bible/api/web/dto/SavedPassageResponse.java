package com.eshin.bible.api.web.dto;

import java.time.Instant;
import java.util.List;

public record SavedPassageResponse(
        int id,
        String version,
        Instant date,
        int bookId,
        int chapterId,
        int canonicalBookId,
        int chapterNumber,
        String bookName,
        String reference,
        List<SavedVerseDto> verses
) {
}
