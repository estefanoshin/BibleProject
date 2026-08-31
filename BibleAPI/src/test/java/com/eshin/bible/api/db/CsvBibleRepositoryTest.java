package com.eshin.bible.api.db;

import com.eshin.bible.api.web.dto.BookResponse;
import com.eshin.bible.api.web.dto.ChapterResponse;
import com.eshin.bible.api.web.dto.VerseResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class CsvBibleRepositoryTest {

    @TempDir
    Path resourcesDir;

    @Test
    void offsetsIdsSoVersionsDoNotCollide() throws IOException {
        writeVersion(
                "RV1960",
                """
                book_id,name,version
                1,Génesis,RV-1960
                """,
                """
                chapter_id,book_id,cNum
                1,1,1
                2,1,2
                """,
                """
                versicle_id,book_id,chapter_id,vNum,text_value
                1,1,1,1,En el principio
                2,1,1,2,"Y la tierra, vacía."
                """
        );
        writeVersion(
                "RVA2015",
                """
                book_id,name,version
                1,Génesis,RVA-2015
                """,
                """
                chapter_id,book_id,cNum
                1,1,1
                """,
                """
                versicle_id,book_id,chapter_id,vNum,text_value
                1,1,1,1,En el principio creó Dios
                """
        );

        CsvBibleRepository repository = new CsvBibleRepository("file:" + resourcesDir.toAbsolutePath());

        assertThat(repository.findVersions()).hasSize(2);
        assertThat(repository.findBook(1)).map(BookResponse::version).contains("RV-1960");
        assertThat(repository.findBook(2)).map(BookResponse::name).contains("Génesis");
        assertThat(repository.findBook(2)).map(BookResponse::version).contains("RVA-2015");

        ChapterResponse firstRvaChapter = repository.findChaptersByBook(2).getFirst();
        assertThat(firstRvaChapter.chapterId()).isEqualTo(3);
        assertThat(repository.findVersesByChapter(3))
                .extracting(VerseResponse::text)
                .containsExactly("En el principio creó Dios");
        assertThat(repository.findAdjacentChapterId(1, 1, 1)).contains(2);
        assertThat(repository.findVerse(3)).map(VerseResponse::verseId).contains(3);
    }

    private void writeVersion(String folder, String books, String chapters, String verses) throws IOException {
        Path dir = resourcesDir.resolve(folder);
        Files.createDirectories(dir);
        Files.writeString(dir.resolve("books.csv"), books, StandardCharsets.UTF_8);
        Files.writeString(dir.resolve("chapters.csv"), chapters, StandardCharsets.UTF_8);
        Files.writeString(dir.resolve("versicles.csv"), verses, StandardCharsets.UTF_8);
    }
}
