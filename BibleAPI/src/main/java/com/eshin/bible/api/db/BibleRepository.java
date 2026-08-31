package com.eshin.bible.api.db;

import com.eshin.bible.api.web.dto.BookResponse;
import com.eshin.bible.api.web.dto.ChapterResponse;
import com.eshin.bible.api.web.dto.VerseResponse;
import com.eshin.bible.api.web.dto.VersionResponse;

import java.util.List;
import java.util.Optional;

public interface BibleRepository {

    List<VersionResponse> findVersions();

    List<BookResponse> findBooksByVersion(String version);

    Optional<BookResponse> findBook(int bookId);

    List<ChapterResponse> findChaptersByBook(int bookId);

    Optional<ChapterResponse> findChapter(int chapterId);

    Optional<Integer> findAdjacentChapterId(int bookId, int chapterNumber, int step);

    List<VerseResponse> findVersesByChapter(int chapterId);

    Optional<VerseResponse> findVerse(int verseId);
}
