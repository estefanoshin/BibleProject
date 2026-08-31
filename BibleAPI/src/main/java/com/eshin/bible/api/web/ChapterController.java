package com.eshin.bible.api.web;

import com.eshin.bible.api.db.BibleRepository;
import com.eshin.bible.api.web.dto.ChapterResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@Tag(name = "Chapters")
public class ChapterController {

    private final BibleRepository bibleRepository;

    public ChapterController(BibleRepository bibleRepository) {
        this.bibleRepository = bibleRepository;
    }

    @GetMapping("/api/books/{bookId}/chapters")
    @Operation(summary = "List chapters in a book")
    public List<ChapterResponse> chaptersByBook(@PathVariable int bookId) {
        bibleRepository.findBook(bookId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found: " + bookId));
        return bibleRepository.findChaptersByBook(bookId);
    }

    @GetMapping("/api/chapters/{chapterId}")
    @Operation(summary = "Get a chapter")
    public ChapterResponse chapter(@PathVariable int chapterId) {
        return bibleRepository.findChapter(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapter not found: " + chapterId));
    }
}
