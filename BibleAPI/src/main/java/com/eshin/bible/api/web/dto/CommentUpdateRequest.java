package com.eshin.bible.api.web.dto;

import jakarta.validation.constraints.NotBlank;

public record CommentUpdateRequest(@NotBlank String comment) {
}
