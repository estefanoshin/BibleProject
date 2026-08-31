package com.eshin.bible.api.web;

import com.eshin.bible.api.db.BibleRepository;
import com.eshin.bible.api.web.dto.ChapterResponse;
import com.eshin.bible.api.web.dto.ChapterVersesResponse;
import com.eshin.bible.api.web.dto.VerseResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@Tag(name = "Verses")
public class VerseController {

    private final BibleRepository bibleRepository;

    public VerseController(BibleRepository bibleRepository) {
        this.bibleRepository = bibleRepository;
    }

    @GetMapping("/api/chapters/{chapterId}/verses")
    @Operation(summary = "List verses in a chapter")
    public ChapterVersesResponse versesByChapter(@PathVariable int chapterId) {
        ChapterResponse chapter = bibleRepository.findChapter(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found: " + chapterId));
        Integer previousChapterId = bibleRepository
                .findAdjacentChapterId(chapter.bookId(), chapter.chapterNumber(), -1)
                .orElse(null);
        Integer nextChapterId = bibleRepository
                .findAdjacentChapterId(chapter.bookId(), chapter.chapterNumber(), 1)
                .orElse(null);
        return new ChapterVersesResponse(
                chapter.chapterId(),
                chapter.bookId(),
                chapter.chapterNumber(),
                chapter.bookName(),
                chapter.version(),
                previousChapterId,
                nextChapterId,
                bibleRepository.findVersesByChapter(chapterId)
        );
    }

    @GetMapping("/api/verses/{verseId}")
    @Operation(summary = "Get a verse")
    public VerseResponse verse(@PathVariable int verseId) {
        return bibleRepository.findVerse(verseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Verse not found: " + verseId));
    }
}
