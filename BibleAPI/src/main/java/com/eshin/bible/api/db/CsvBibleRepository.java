package com.eshin.bible.api.db;

import com.eshin.bible.api.web.dto.BookResponse;
import com.eshin.bible.api.web.dto.ChapterResponse;
import com.eshin.bible.api.web.dto.VerseResponse;
import com.eshin.bible.api.web.dto.VersionResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
@ConditionalOnProperty(name = "bible.offline", havingValue = "true", matchIfMissing = true)
public class CsvBibleRepository implements BibleRepository {

    private static final Logger log = LoggerFactory.getLogger(CsvBibleRepository.class);

    private final List<BookResponse> books;
    private final List<ChapterResponse> chapters;
    private final List<VerseResponse> verses;

    public CsvBibleRepository(
            @Value("${bible.resources-location:classpath:bible-data}") String resourcesLocation
    ) {
        LoadedData loaded = load(resourcesLocation);
        this.books = List.copyOf(loaded.books);
        this.chapters = List.copyOf(loaded.chapters);
        this.verses = List.copyOf(loaded.verses);
        log.info(
                "Offline mode: loaded {} books, {} chapters, {} verses from {}",
                books.size(),
                chapters.size(),
                verses.size(),
                resourcesLocation
        );
    }

    @Override
    public List<VersionResponse> findVersions() {
        Map<String, Integer> counts = new HashMap<>();
        for (BookResponse book : books) {
            counts.merge(book.version(), 1, Integer::sum);
        }
        return counts.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new VersionResponse(entry.getKey(), entry.getValue()))
                .toList();
    }

    @Override
    public List<BookResponse> findBooksByVersion(String version) {
        return books.stream()
                .filter(book -> book.version().equals(version))
                .sorted(Comparator.comparingInt(BookResponse::bookId))
                .toList();
    }

    @Override
    public Optional<BookResponse> findBook(int bookId) {
        return books.stream().filter(book -> book.bookId() == bookId).findFirst();
    }

    @Override
    public List<ChapterResponse> findChaptersByBook(int bookId) {
        return chapters.stream()
                .filter(chapter -> chapter.bookId() == bookId)
                .sorted(Comparator.comparingInt(ChapterResponse::chapterNumber))
                .toList();
    }

    @Override
    public Optional<ChapterResponse> findChapter(int chapterId) {
        return chapters.stream().filter(chapter -> chapter.chapterId() == chapterId).findFirst();
    }

    @Override
    public Optional<Integer> findAdjacentChapterId(int bookId, int chapterNumber, int step) {
        Comparator<ChapterResponse> byNumber = Comparator.comparingInt(ChapterResponse::chapterNumber);
        return chapters.stream()
                .filter(chapter -> chapter.bookId() == bookId)
                .filter(chapter -> step < 0
                        ? chapter.chapterNumber() < chapterNumber
                        : chapter.chapterNumber() > chapterNumber)
                .sorted(step < 0 ? byNumber.reversed() : byNumber)
                .map(ChapterResponse::chapterId)
                .findFirst();
    }

    @Override
    public List<VerseResponse> findVersesByChapter(int chapterId) {
        return verses.stream()
                .filter(verse -> verse.chapterId() == chapterId)
                .sorted(Comparator.comparingInt(VerseResponse::verseNumber))
                .toList();
    }

    @Override
    public Optional<VerseResponse> findVerse(int verseId) {
        return verses.stream().filter(verse -> verse.verseId() == verseId).findFirst();
    }

    static LoadedData load(String resourcesLocation) {
        try {
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource[] bookFiles = resolveBookFiles(resolver, resourcesLocation);
            Arrays.sort(bookFiles, Comparator.comparing(CsvBibleRepository::resourcePath));

            List<BookResponse> books = new ArrayList<>();
            List<ChapterResponse> chapters = new ArrayList<>();
            List<VerseResponse> verses = new ArrayList<>();
            int bookOff = 0;
            int chapterOff = 0;
            int verseOff = 0;

            for (Resource bookFile : bookFiles) {
                String directory = directoryOf(bookFile);
                Resource chapterFile = resolver.getResource(directory + "/chapters.csv");
                Resource verseFile = resolver.getResource(directory + "/versicles.csv");
                if (!chapterFile.exists() || !verseFile.exists()) {
                    throw new IllegalStateException("Missing chapters.csv or versicles.csv next to " + resourcePath(bookFile));
                }

                Map<Integer, BookResponse> booksByOriginalId = new HashMap<>();
                for (Map<String, String> row : readCsv(bookFile)) {
                    BookResponse book = new BookResponse(
                            Integer.parseInt(row.get("book_id")) + bookOff,
                            row.get("name"),
                            row.get("version")
                    );
                    books.add(book);
                    booksByOriginalId.put(Integer.parseInt(row.get("book_id")), book);
                }

                for (Map<String, String> row : readCsv(chapterFile)) {
                    int originalBookId = Integer.parseInt(row.get("book_id"));
                    BookResponse book = booksByOriginalId.get(originalBookId);
                    if (book == null) {
                        throw new IllegalStateException("Chapter references unknown book_id " + originalBookId);
                    }
                    chapters.add(new ChapterResponse(
                            Integer.parseInt(row.get("chapter_id")) + chapterOff,
                            book.bookId(),
                            Integer.parseInt(row.get("cNum")),
                            book.name(),
                            book.version()
                    ));
                }

                for (Map<String, String> row : readCsv(verseFile)) {
                    int originalBookId = Integer.parseInt(row.get("book_id"));
                    BookResponse book = booksByOriginalId.get(originalBookId);
                    if (book == null) {
                        throw new IllegalStateException("Verse references unknown book_id " + originalBookId);
                    }
                    verses.add(new VerseResponse(
                            Integer.parseInt(row.get("versicle_id")) + verseOff,
                            book.bookId(),
                            Integer.parseInt(row.get("chapter_id")) + chapterOff,
                            Integer.parseInt(row.get("vNum")),
                            row.getOrDefault("text_value", "")
                    ));
                }

                bookOff = books.stream().mapToInt(BookResponse::bookId).max().orElse(0);
                chapterOff = chapters.stream().mapToInt(ChapterResponse::chapterId).max().orElse(0);
                verseOff = verses.stream().mapToInt(VerseResponse::verseId).max().orElse(0);
            }

            return new LoadedData(books, chapters, verses);
        } catch (IOException e) {
            throw new IllegalStateException("Unable to load Bible CSVs from " + resourcesLocation, e);
        }
    }

    private static Resource[] resolveBookFiles(PathMatchingResourcePatternResolver resolver, String location)
            throws IOException {
        List<String> patterns = new ArrayList<>();
        patterns.add(trimSlash(location) + "/*/books.csv");
        if (!location.startsWith("file:") && !location.startsWith("classpath")) {
            patterns.add("file:" + trimSlash(location) + "/*/books.csv");
        }
        patterns.add("file:../frontend/public/resources/*/books.csv");
        patterns.add("file:frontend/public/resources/*/books.csv");

        for (String pattern : patterns) {
            Resource[] found = resolver.getResources(pattern);
            Resource[] existing = Arrays.stream(found).filter(Resource::exists).toArray(Resource[]::new);
            if (existing.length > 0) {
                return existing;
            }
        }
        throw new IllegalStateException("No books.csv files found for Bible resources at " + location);
    }

    private static List<Map<String, String>> readCsv(Resource resource) throws IOException {
        try (InputStream in = resource.getInputStream()) {
            return SimpleCsv.read(in);
        }
    }

    private static String resourcePath(Resource resource) {
        try {
            return resource.getURL().toString();
        } catch (IOException e) {
            return resource.getDescription();
        }
    }

    private static String directoryOf(Resource bookFile) {
        String path = resourcePath(bookFile);
        int slash = path.lastIndexOf('/');
        return slash >= 0 ? path.substring(0, slash) : path;
    }

    private static String trimSlash(String location) {
        if (location.endsWith("/")) {
            return location.substring(0, location.length() - 1);
        }
        return location;
    }

    record LoadedData(List<BookResponse> books, List<ChapterResponse> chapters, List<VerseResponse> verses) {
    }
}
