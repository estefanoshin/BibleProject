package com.eshin.bible.api.db;

import com.eshin.bible.api.web.dto.BookResponse;
import com.eshin.bible.api.web.dto.ChapterResponse;
import com.eshin.bible.api.web.dto.VerseResponse;
import com.eshin.bible.api.web.dto.VersionResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@ConditionalOnProperty(name = "bible.offline", havingValue = "false")
public class JdbcBibleRepository implements BibleRepository {

    private static final RowMapper<BookResponse> BOOK_MAPPER = (rs, rowNum) -> new BookResponse(
            rs.getInt("book_id"),
            rs.getString("name"),
            rs.getString("version")
    );

    private static final RowMapper<ChapterResponse> CHAPTER_MAPPER = (rs, rowNum) -> new ChapterResponse(
            rs.getInt("chapter_id"),
            rs.getInt("book_id"),
            rs.getInt("cNum"),
            rs.getString("book_name"),
            rs.getString("version")
    );

    private static final RowMapper<VerseResponse> VERSE_MAPPER = (rs, rowNum) -> new VerseResponse(
            rs.getInt("versicle_id"),
            rs.getInt("book_id"),
            rs.getInt("chapter_id"),
            rs.getInt("vNum"),
            GzipText.decompress(rs.getBytes("text_value"))
    );

    private final JdbcTemplate jdbcTemplate;

    public JdbcBibleRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public List<VersionResponse> findVersions() {
        return jdbcTemplate.query(
                """
                SELECT version, COUNT(*) AS book_count
                FROM books
                GROUP BY version
                ORDER BY version
                """,
                (rs, rowNum) -> new VersionResponse(
                        rs.getString("version"),
                        rs.getInt("book_count")
                )
        );
    }

    @Override
    public List<BookResponse> findBooksByVersion(String version) {
        return jdbcTemplate.query(
                """
                SELECT book_id, name, version
                FROM books
                WHERE version = ?
                ORDER BY book_id
                """,
                BOOK_MAPPER,
                version
        );
    }

    @Override
    public Optional<BookResponse> findBook(int bookId) {
        List<BookResponse> books = jdbcTemplate.query(
                """
                SELECT book_id, name, version
                FROM books
                WHERE book_id = ?
                """,
                BOOK_MAPPER,
                bookId
        );
        return books.stream().findFirst();
    }

    @Override
    public List<ChapterResponse> findChaptersByBook(int bookId) {
        return jdbcTemplate.query(
                """
                SELECT c.chapter_id, c.book_id, c.cNum, b.name AS book_name, b.version
                FROM chapters c
                INNER JOIN books b ON b.book_id = c.book_id
                WHERE c.book_id = ?
                ORDER BY c.cNum
                """,
                CHAPTER_MAPPER,
                bookId
        );
    }

    @Override
    public Optional<ChapterResponse> findChapter(int chapterId) {
        List<ChapterResponse> chapters = jdbcTemplate.query(
                """
                SELECT c.chapter_id, c.book_id, c.cNum, b.name AS book_name, b.version
                FROM chapters c
                INNER JOIN books b ON b.book_id = c.book_id
                WHERE c.chapter_id = ?
                """,
                CHAPTER_MAPPER,
                chapterId
        );
        return chapters.stream().findFirst();
    }

    @Override
    public Optional<Integer> findAdjacentChapterId(int bookId, int chapterNumber, int step) {
        String operator = step < 0 ? "<" : ">";
        String direction = step < 0 ? "DESC" : "ASC";
        List<Integer> ids = jdbcTemplate.query(
                """
                SELECT TOP 1 chapter_id
                FROM chapters
                WHERE book_id = ? AND cNum %s ?
                ORDER BY cNum %s
                """.formatted(operator, direction),
                (rs, rowNum) -> rs.getInt("chapter_id"),
                bookId,
                chapterNumber
        );
        return ids.stream().findFirst();
    }

    @Override
    public List<VerseResponse> findVersesByChapter(int chapterId) {
        return jdbcTemplate.query(
                """
                SELECT versicle_id, book_id, chapter_id, vNum, text_value
                FROM versicles
                WHERE chapter_id = ?
                ORDER BY vNum
                """,
                VERSE_MAPPER,
                chapterId
        );
    }

    @Override
    public Optional<VerseResponse> findVerse(int verseId) {
        List<VerseResponse> verses = jdbcTemplate.query(
                """
                SELECT versicle_id, book_id, chapter_id, vNum, text_value
                FROM versicles
                WHERE versicle_id = ?
                """,
                VERSE_MAPPER,
                verseId
        );
        return verses.stream().findFirst();
    }
}
