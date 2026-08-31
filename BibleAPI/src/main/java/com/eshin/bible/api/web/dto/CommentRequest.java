package com.eshin.bible.api.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record CommentRequest(
        @Positive int versicleId,
        @NotBlank String comment,
        @NotBlank String version
) {
}
