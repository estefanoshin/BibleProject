package com.eshin.bible.api.web;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import com.jayway.jsonpath.JsonPath;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.zip.GZIPOutputStream;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserDataControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void seed() throws IOException {
        jdbcTemplate.execute("DROP TABLE IF EXISTS comments");
        jdbcTemplate.execute("DROP TABLE IF EXISTS saved_passages");
        jdbcTemplate.execute("DROP TABLE IF EXISTS read_chapters");
        jdbcTemplate.execute("DROP TABLE IF EXISTS book_chapter_numbers");
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
        jdbcTemplate.execute("""
                CREATE TABLE comments (
                  comment_id INT IDENTITY PRIMARY KEY,
                  versicle_id INT NOT NULL,
                  comment NVARCHAR(MAX) NOT NULL,
                  version NVARCHAR(50) NOT NULL,
                  [date] DATETIME2 NOT NULL
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE saved_passages (
                  passage_id INT IDENTITY PRIMARY KEY,
                  version NVARCHAR(50) NOT NULL,
                  book_id INT NOT NULL,
                  chapter_id INT NOT NULL,
                  canonical_book_id INT NOT NULL,
                  chapter_number INT NOT NULL,
                  book_name NVARCHAR(200) NOT NULL,
                  reference NVARCHAR(400) NOT NULL,
                  verses_json NVARCHAR(MAX) NOT NULL,
                  [date] DATETIME2 NOT NULL
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE read_chapters (
                  canonical_book_id INT NOT NULL,
                  chapter_number INT NOT NULL,
                  PRIMARY KEY (canonical_book_id, chapter_number)
                )
                """);
        jdbcTemplate.execute("""
                CREATE TABLE book_chapter_numbers (
                  canonical_book_id INT NOT NULL,
                  chapter_number INT NOT NULL,
                  PRIMARY KEY (canonical_book_id, chapter_number)
                )
                """);
        jdbcTemplate.update("INSERT INTO books (book_id, name, version) VALUES (?, ?, ?)", 1, "Génesis", "RVA-2015");
        jdbcTemplate.update("INSERT INTO chapters (chapter_id, book_id, cNum) VALUES (?, ?, ?)", 10, 1, 1);
        jdbcTemplate.update(
                "INSERT INTO versicles (versicle_id, book_id, chapter_id, vNum, text_value) VALUES (?, ?, ?, ?, ?)",
                100, 1, 10, 1, gzip("En el principio creó Dios los cielos y la tierra.")
        );
    }

    @Test
    void commentsAreStoredAndListed() throws Exception {
        mockMvc.perform(post("/api/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"versicleId":100,"comment":"Nota de prueba","version":"RVA-2015"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.comment").value("Nota de prueba"))
                .andExpect(jsonPath("$.versicleId").value(100))
                .andExpect(jsonPath("$.verseText").value("En el principio creó Dios los cielos y la tierra."))
                .andExpect(jsonPath("$.chapterNumber").value(1));

        mockMvc.perform(get("/api/comments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].bookName").value("Génesis"));
    }

    @Test
    void commentsCanBeUpdatedAndDeleted() throws Exception {
        String body = mockMvc.perform(post("/api/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"versicleId":100,"comment":"Primera","version":"RVA-2015"}
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        int id = JsonPath.read(body, "$.id");

        mockMvc.perform(patch("/api/comments/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"comment":"Editada"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.comment").value("Editada"));

        mockMvc.perform(delete("/api/comments/" + id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/comments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void unknownVerseCommentReturnsNotFound() throws Exception {
        mockMvc.perform(post("/api/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"versicleId":999,"comment":"x","version":"RVA-2015"}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void passagesAreStoredAndDeleted() throws Exception {
        mockMvc.perform(post("/api/passages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "version":"RVA-2015",
                                  "bookId":1,
                                  "chapterId":10,
                                  "canonicalBookId":1,
                                  "chapterNumber":1,
                                  "bookName":"Génesis",
                                  "reference":"Génesis 1:1",
                                  "verses":[{"verseId":100,"verseNumber":1,"text":"En el principio"}]
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.reference").value("Génesis 1:1"))
                .andExpect(jsonPath("$.verses[0].verseId").value(100));

        String listed = mockMvc.perform(get("/api/passages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andReturn()
                .getResponse()
                .getContentAsString();
        int id = JsonPath.read(listed, "$[0].id");

        mockMvc.perform(delete("/api/passages/" + id))
                .andExpect(status().isNoContent());
    }

    @Test
    void readProgressIsReplaced() throws Exception {
        mockMvc.perform(put("/api/read-progress")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"readChapters":["1:1","1:2"],"bookChapters":{"1":[1,2,3]}}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.readChapters.length()").value(2))
                .andExpect(jsonPath("$.bookChapters['1'].length()").value(3));

        mockMvc.perform(get("/api/read-progress"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.readChapters[0]").value("1:1"));
    }

    private static byte[] gzip(String text) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        try (GZIPOutputStream out = new GZIPOutputStream(buffer)) {
            out.write(text.getBytes(StandardCharsets.UTF_8));
        }
        return buffer.toByteArray();
    }
}
