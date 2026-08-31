package com.eshin.bible.api.web.dto;

import java.time.Instant;

public record CommentResponse(
        int id,
        int versicleId,
        String comment,
        String version,
        Instant date,
        int bookId,
        int chapterId,
        int chapterNumber,
        int verseNumber,
        String bookName,
        String verseText
) {
}
