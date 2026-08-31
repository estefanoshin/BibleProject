package com.eshin.bible.api.web.dto;

public record ChapterResponse(
        int chapterId,
        int bookId,
        int chapterNumber,
        String bookName,
        String version
) {
}
