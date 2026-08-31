package com.eshin.bible.api.web;

import com.eshin.bible.api.db.JdbcUserDataRepository;
import com.eshin.bible.api.web.dto.CommentRequest;
import com.eshin.bible.api.web.dto.CommentResponse;
import com.eshin.bible.api.web.dto.CommentUpdateRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@ConditionalOnProperty(name = "bible.offline", havingValue = "false")
@Tag(name = "Comments")
public class CommentController {

    private final JdbcUserDataRepository userDataRepository;

    public CommentController(JdbcUserDataRepository userDataRepository) {
        this.userDataRepository = userDataRepository;
    }

    @GetMapping("/api/comments")
    @Operation(summary = "List verse comments")
    public List<CommentResponse> list() {
        return userDataRepository.findComments();
    }

    @PostMapping("/api/comments")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a verse comment")
    public CommentResponse create(@Valid @RequestBody CommentRequest request) {
        if (!userDataRepository.verseExists(request.versicleId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Verse not found: " + request.versicleId());
        }
        return userDataRepository.insertComment(request)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not save comment"));
    }

    @PatchMapping("/api/comments/{commentId}")
    @Operation(summary = "Update a verse comment")
    public CommentResponse update(@PathVariable int commentId, @Valid @RequestBody CommentUpdateRequest request) {
        return userDataRepository.updateComment(commentId, request.comment())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found: " + commentId));
    }

    @DeleteMapping("/api/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a verse comment")
    public void delete(@PathVariable int commentId) {
        if (!userDataRepository.deleteComment(commentId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found: " + commentId);
        }
    }
}
