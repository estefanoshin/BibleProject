package com.eshin.bible.api.web;

import com.eshin.bible.api.db.BibleRepository;
import com.eshin.bible.api.web.dto.BookResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@Tag(name = "Books")
public class BookController {

    private final BibleRepository bibleRepository;

    public BookController(BibleRepository bibleRepository) {
        this.bibleRepository = bibleRepository;
    }

    @GetMapping("/api/versions/{version}/books")
    @Operation(summary = "List books in a version")
    public List<BookResponse> booksByVersion(@PathVariable String version) {
        List<BookResponse> books = bibleRepository.findBooksByVersion(version);
        if (books.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Version not found: " + version);
        }
        return books;
    }

    @GetMapping("/api/books/{bookId}")
    @Operation(summary = "Get a book")
    public BookResponse book(@PathVariable int bookId) {
        return bibleRepository.findBook(bookId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found: " + bookId));
    }
}
