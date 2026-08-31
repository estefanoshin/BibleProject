package com.eshin.bible.api.web.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ChapterVersesResponse(
        int chapterId,
        int bookId,
        int chapterNumber,
        String bookName,
        String version,
        Integer previousChapterId,
        Integer nextChapterId,
        List<VerseResponse> verses
) {
}
