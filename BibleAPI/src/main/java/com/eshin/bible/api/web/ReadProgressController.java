package com.eshin.bible.api.web;

import com.eshin.bible.api.db.JdbcUserDataRepository;
import com.eshin.bible.api.web.dto.ReadProgressRequest;
import com.eshin.bible.api.web.dto.ReadProgressResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@ConditionalOnProperty(name = "bible.offline", havingValue = "false")
@Tag(name = "Read progress")
public class ReadProgressController {

    private final JdbcUserDataRepository userDataRepository;

    public ReadProgressController(JdbcUserDataRepository userDataRepository) {
        this.userDataRepository = userDataRepository;
    }

    @GetMapping("/api/read-progress")
    @Operation(summary = "Get marked-read chapters")
    public ReadProgressResponse get() {
        return userDataRepository.findProgress();
    }

    @PutMapping("/api/read-progress")
    @Operation(summary = "Replace marked-read chapters")
    public ReadProgressResponse replace(@RequestBody ReadProgressRequest request) {
        ReadProgressRequest body = request == null
                ? new ReadProgressRequest(List.of(), Map.of())
                : request;
        return userDataRepository.replaceProgress(body);
    }
}
