package com.eshin.bible.api.web;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.zip.GZIPOutputStream;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BibleNavigationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void seedBible() throws IOException {
        jdbcTemplate.execute("DROP TABLE IF EXISTS versicles");
        jdbcTemplate.execute("DROP TABLE IF EXISTS chapters");
        jdbcTemplate.execute("DROP TABLE IF EXISTS books");
        jdbcTemplate.execute("""
                CREATE TABLE books (
                  book_id INT NOT NULL PRIMARY KEY,
                  name NVARCHAR(200) NOT NULL,
                  version NVARCHAR(50) NOT NULL
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE chapters (
                  chapter_id INT NOT NULL PRIMARY KEY,
                  book_id INT NOT NULL,
                  cNum INT NOT NULL
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE versicles (
                  versicle_id INT NOT NULL PRIMARY KEY,
                  book_id INT NOT NULL,
                  chapter_id INT NOT NULL,
                  vNum INT NOT NULL,
                  text_value VARBINARY(MAX)
                )
                """);

        jdbcTemplate.update("INSERT INTO books (book_id, name, version) VALUES (?, ?, ?)", 1, "Génesis", "RVA-2015");
        jdbcTemplate.update("INSERT INTO books (book_id, name, version) VALUES (?, ?, ?)", 2, "Éxodo", "RVA-2015");
        jdbcTemplate.update("INSERT INTO books (book_id, name, version) VALUES (?, ?, ?)", 101, "Génesis", "RV-1960");
        jdbcTemplate.update("INSERT INTO chapters (chapter_id, book_id, cNum) VALUES (?, ?, ?)", 10, 1, 1);
        jdbcTemplate.update("INSERT INTO chapters (chapter_id, book_id, cNum) VALUES (?, ?, ?)", 11, 1, 2);
        jdbcTemplate.update(
                "INSERT INTO versicles (versicle_id, book_id, chapter_id, vNum, text_value) VALUES (?, ?, ?, ?, ?)",
                100, 1, 10, 1, gzip("En el principio creó Dios los cielos y la tierra.")
        );
        jdbcTemplate.update(
                "INSERT INTO versicles (versicle_id, book_id, chapter_id, vNum, text_value) VALUES (?, ?, ?, ?, ?)",
                101, 1, 10, 2, gzip("Y la tierra estaba desordenada y vacía.")
        );
    }

    @Test
    void versionsListsDistinctTranslations() throws Exception {
        mockMvc.perform(get("/api/versions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].version").value("RV-1960"))
                .andExpect(jsonPath("$[0].bookCount").value(1))
                .andExpect(jsonPath("$[1].version").value("RVA-2015"))
                .andExpect(jsonPath("$[1].bookCount").value(2));
    }

    @Test
    void booksAreListedByVersion() throws Exception {
        mockMvc.perform(get("/api/versions/RVA-2015/books"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].bookId").value(1))
                .andExpect(jsonPath("$[0].name").value("Génesis"));
    }

    @Test
    void unknownVersionReturnsNotFound() throws Exception {
        mockMvc.perform(get("/api/versions/missing/books"))
                .andExpect(status().isNotFound());
    }

    @Test
    void chaptersAreListedByBook() throws Exception {
        mockMvc.perform(get("/api/books/1/chapters"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].chapterId").value(10))
                .andExpect(jsonPath("$[0].chapterNumber").value(1))
                .andExpect(jsonPath("$[0].bookName").value("Génesis"));
    }

    @Test
    void versesAreDecompressedForAChapter() throws Exception {
        mockMvc.perform(get("/api/chapters/10/verses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.chapterNumber").value(1))
                .andExpect(jsonPath("$.bookName").value("Génesis"))
                .andExpect(jsonPath("$.previousChapterId").doesNotExist())
                .andExpect(jsonPath("$.nextChapterId").value(11))
                .andExpect(jsonPath("$.verses.length()").value(2))
                .andExpect(jsonPath("$.verses[0].verseNumber").value(1))
                .andExpect(jsonPath("$.verses[0].text").value("En el principio creó Dios los cielos y la tierra."));
    }

    @Test
    void verseByIdReturnsDecompressedText() throws Exception {
        mockMvc.perform(get("/api/verses/101"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verseId").value(101))
                .andExpect(jsonPath("$.text").value("Y la tierra estaba desordenada y vacía."));
    }

    @Test
    void unknownChapterReturnsNotFound() throws Exception {
        mockMvc.perform(get("/api/chapters/999/verses"))
                .andExpect(status().isNotFound());
    }

    private static byte[] gzip(String text) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        try (GZIPOutputStream out = new GZIPOutputStream(buffer)) {
            out.write(text.getBytes(StandardCharsets.UTF_8));
        }
        return buffer.toByteArray();
    }
}
