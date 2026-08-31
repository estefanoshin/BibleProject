package com.eshin.bible.api.web;

import com.eshin.bible.api.db.BibleRepository;
import com.eshin.bible.api.web.dto.VersionResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/versions")
@Tag(name = "Versions")
public class VersionController {

    private final BibleRepository bibleRepository;

    public VersionController(BibleRepository bibleRepository) {
        this.bibleRepository = bibleRepository;
    }

    @GetMapping
    @Operation(summary = "List Bible versions")
    public List<VersionResponse> versions() {
        return bibleRepository.findVersions();
    }
}
