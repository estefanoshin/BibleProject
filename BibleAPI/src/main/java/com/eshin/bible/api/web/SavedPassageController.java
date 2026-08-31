package com.eshin.bible.api.web;

import com.eshin.bible.api.db.JdbcUserDataRepository;
import com.eshin.bible.api.web.dto.SavedPassageRequest;
import com.eshin.bible.api.web.dto.SavedPassageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@ConditionalOnProperty(name = "bible.offline", havingValue = "false")
@Tag(name = "Saved passages")
public class SavedPassageController {

    private final JdbcUserDataRepository userDataRepository;

    public SavedPassageController(JdbcUserDataRepository userDataRepository) {
        this.userDataRepository = userDataRepository;
    }

    @GetMapping("/api/passages")
    @Operation(summary = "List saved passages")
    public List<SavedPassageResponse> list() {
        return userDataRepository.findPassages();
    }

    @PostMapping("/api/passages")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Save a passage")
    public SavedPassageResponse create(@Valid @RequestBody SavedPassageRequest request) {
        return userDataRepository.insertPassage(request);
    }

    @DeleteMapping("/api/passages/{passageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a saved passage")
    public void delete(@PathVariable int passageId) {
        if (!userDataRepository.deletePassage(passageId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Passage not found: " + passageId);
        }
    }
}
