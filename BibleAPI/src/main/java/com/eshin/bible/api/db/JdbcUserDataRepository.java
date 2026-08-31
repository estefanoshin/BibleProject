package com.eshin.bible.api.db;

import com.eshin.bible.api.web.dto.CommentRequest;
import com.eshin.bible.api.web.dto.CommentResponse;
import com.eshin.bible.api.web.dto.ReadProgressRequest;
import com.eshin.bible.api.web.dto.ReadProgressResponse;
import com.eshin.bible.api.web.dto.SavedPassageRequest;
import com.eshin.bible.api.web.dto.SavedPassageResponse;
import com.eshin.bible.api.web.dto.SavedVerseDto;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
@ConditionalOnProperty(name = "bible.offline", havingValue = "false")
public class JdbcUserDataRepository {

    private static final String COMMENT_SELECT = """
            SELECT c.comment_id, c.versicle_id, c.comment, c.version, c.[date],
                   v.book_id, v.chapter_id, v.vNum, v.text_value, b.name AS book_name, ch.cNum
            FROM comments c
            INNER JOIN versicles v ON v.versicle_id = c.versicle_id
            INNER JOIN books b ON b.book_id = v.book_id
            INNER JOIN chapters ch ON ch.chapter_id = v.chapter_id
            """;

    private static final TypeReference<List<SavedVerseDto>> VERSES_TYPE = new TypeReference<>() {
    };

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final RowMapper<CommentResponse> commentMapper = (rs, rowNum) -> new CommentResponse(
            rs.getInt("comment_id"),
            rs.getInt("versicle_id"),
            rs.getString("comment"),
            rs.getString("version"),
            toInstant(rs.getTimestamp("date")),
            rs.getInt("book_id"),
            rs.getInt("chapter_id"),
            rs.getInt("cNum"),
            rs.getInt("vNum"),
            rs.getString("book_name"),
            GzipText.decompress(rs.getBytes("text_value"))
    );

    public JdbcUserDataRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = new ObjectMapper();
    }

    public List<CommentResponse> findComments() {
        return jdbcTemplate.query(COMMENT_SELECT + " ORDER BY c.[date] DESC, c.comment_id DESC", commentMapper);
    }

    public Optional<CommentResponse> findComment(int commentId) {
        List<CommentResponse> rows = jdbcTemplate.query(
                COMMENT_SELECT + " WHERE c.comment_id = ?",
                commentMapper,
                commentId
        );
        return rows.stream().findFirst();
    }

    public Optional<CommentResponse> insertComment(CommentRequest request) {
        Instant now = Instant.now();
        KeyHolder keys = new GeneratedKeyHolder();
        int updated = jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    "INSERT INTO comments (versicle_id, comment, version, [date]) VALUES (?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            statement.setInt(1, request.versicleId());
            statement.setString(2, request.comment().trim());
            statement.setString(3, request.version().trim());
            statement.setTimestamp(4, Timestamp.from(now));
            return statement;
        }, keys);
        if (updated == 0) {
            return Optional.empty();
        }
        Integer id = generatedId(keys);
        return id == null ? Optional.empty() : findComment(id);
    }

    public Optional<CommentResponse> updateComment(int commentId, String comment) {
        int updated = jdbcTemplate.update(
                "UPDATE comments SET comment = ?, [date] = ? WHERE comment_id = ?",
                comment.trim(),
                Timestamp.from(Instant.now()),
                commentId
        );
        if (updated == 0) {
            return Optional.empty();
        }
        return findComment(commentId);
    }

    public boolean deleteComment(int commentId) {
        return jdbcTemplate.update("DELETE FROM comments WHERE comment_id = ?", commentId) > 0;
    }

    public boolean verseExists(int versicleId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM versicles WHERE versicle_id = ?",
                Integer.class,
                versicleId
        );
        return count != null && count > 0;
    }

    public List<SavedPassageResponse> findPassages() {
        return jdbcTemplate.query(
                """
                SELECT passage_id, version, [date], book_id, chapter_id, canonical_book_id,
                       chapter_number, book_name, reference, verses_json
                FROM saved_passages
                ORDER BY [date] DESC, passage_id DESC
                """,
                this::mapPassage
        );
    }

    public Optional<SavedPassageResponse> findPassage(int passageId) {
        List<SavedPassageResponse> rows = jdbcTemplate.query(
                """
                SELECT passage_id, version, [date], book_id, chapter_id, canonical_book_id,
                       chapter_number, book_name, reference, verses_json
                FROM saved_passages
                WHERE passage_id = ?
                """,
                this::mapPassage,
                passageId
        );
        return rows.stream().findFirst();
    }

    public SavedPassageResponse insertPassage(SavedPassageRequest request) {
        Instant now = Instant.now();
        KeyHolder keys = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    """
                    INSERT INTO saved_passages (
                      version, book_id, chapter_id, canonical_book_id, chapter_number,
                      book_name, reference, verses_json, [date]
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    Statement.RETURN_GENERATED_KEYS
            );
            statement.setString(1, request.version().trim());
            statement.setInt(2, request.bookId());
            statement.setInt(3, request.chapterId());
            statement.setInt(4, request.canonicalBookId());
            statement.setInt(5, request.chapterNumber());
            statement.setString(6, request.bookName().trim());
            statement.setString(7, request.reference().trim());
            statement.setString(8, writeVerses(request.verses()));
            statement.setTimestamp(9, Timestamp.from(now));
            return statement;
        }, keys);
        Integer id = generatedId(keys);
        if (id == null) {
            throw new IllegalStateException("saved passage insert did not return an id");
        }
        return findPassage(id).orElseThrow();
    }

    public boolean deletePassage(int passageId) {
        return jdbcTemplate.update("DELETE FROM saved_passages WHERE passage_id = ?", passageId) > 0;
    }

    public ReadProgressResponse findProgress() {
        List<String> readChapters = jdbcTemplate.query(
                """
                SELECT canonical_book_id, chapter_number
                FROM read_chapters
                ORDER BY canonical_book_id, chapter_number
                """,
                (rs, rowNum) -> rs.getInt("canonical_book_id") + ":" + rs.getInt("chapter_number")
        );
        Map<String, List<Integer>> bookChapters = new LinkedHashMap<>();
        jdbcTemplate.query(
                """
                SELECT canonical_book_id, chapter_number
                FROM book_chapter_numbers
                ORDER BY canonical_book_id, chapter_number
                """,
                rs -> {
                    String bookId = String.valueOf(rs.getInt("canonical_book_id"));
                    bookChapters.computeIfAbsent(bookId, key -> new ArrayList<>())
                            .add(rs.getInt("chapter_number"));
                }
        );
        return new ReadProgressResponse(readChapters, bookChapters);
    }

    @Transactional
    public ReadProgressResponse replaceProgress(ReadProgressRequest request) {
        jdbcTemplate.update("DELETE FROM read_chapters");
        jdbcTemplate.update("DELETE FROM book_chapter_numbers");
        List<String> keys = request.readChapters() == null ? List.of() : request.readChapters();
        LinkedHashSet<String> uniqueKeys = new LinkedHashSet<>(keys);
        for (String key : uniqueKeys) {
            int[] parts = parseChapterKey(key);
            if (parts == null) {
                continue;
            }
            jdbcTemplate.update(
                    "INSERT INTO read_chapters (canonical_book_id, chapter_number) VALUES (?, ?)",
                    parts[0],
                    parts[1]
            );
        }
        Map<String, List<Integer>> books = request.bookChapters() == null ? Map.of() : request.bookChapters();
        for (Map.Entry<String, List<Integer>> entry : books.entrySet()) {
            int bookId;
            try {
                bookId = Integer.parseInt(entry.getKey());
            } catch (NumberFormatException ex) {
                continue;
            }
            if (entry.getValue() == null) {
                continue;
            }
            for (Integer chapterNumber : entry.getValue()) {
                if (chapterNumber == null) {
                    continue;
                }
                jdbcTemplate.update(
                        "INSERT INTO book_chapter_numbers (canonical_book_id, chapter_number) VALUES (?, ?)",
                        bookId,
                        chapterNumber
                );
            }
        }
        return findProgress();
    }

    private SavedPassageResponse mapPassage(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        return new SavedPassageResponse(
                rs.getInt("passage_id"),
                rs.getString("version"),
                toInstant(rs.getTimestamp("date")),
                rs.getInt("book_id"),
                rs.getInt("chapter_id"),
                rs.getInt("canonical_book_id"),
                rs.getInt("chapter_number"),
                rs.getString("book_name"),
                rs.getString("reference"),
                readVerses(rs.getString("verses_json"))
        );
    }

    private String writeVerses(List<SavedVerseDto> verses) {
        try {
            return objectMapper.writeValueAsString(verses);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Could not serialize saved verses", ex);
        }
    }

    private List<SavedVerseDto> readVerses(String json) {
        try {
            List<SavedVerseDto> verses = objectMapper.readValue(json, VERSES_TYPE);
            return verses == null ? List.of() : verses;
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Could not read saved verses", ex);
        }
    }

    private static Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? Instant.now() : timestamp.toInstant();
    }

    private static Integer generatedId(KeyHolder keys) {
        Number key = keys.getKey();
        if (key != null) {
            return key.intValue();
        }
        if (keys.getKeys() == null) {
            return null;
        }
        for (Object value : keys.getKeys().values()) {
            if (value instanceof Number number) {
                return number.intValue();
            }
        }
        return null;
    }

    private static int[] parseChapterKey(String key) {
        if (key == null) {
            return null;
        }
        String[] parts = key.split(":");
        if (parts.length != 2) {
            return null;
        }
        try {
            return new int[] {Integer.parseInt(parts[0]), Integer.parseInt(parts[1])};
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
