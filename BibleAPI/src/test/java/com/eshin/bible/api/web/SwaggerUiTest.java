package com.eshin.bible.api.web;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SwaggerUiTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void swaggerUiIndexIsAvailable() throws Exception {
        mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Swagger UI")));
    }

    @Test
    void openApiDocsIncludeApiEndpoints() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/health']").exists())
                .andExpect(jsonPath("$.paths['/api/versions']").exists())
                .andExpect(jsonPath("$.paths['/api/versions/{version}/books']").exists())
                .andExpect(jsonPath("$.paths['/api/books/{bookId}']").exists())
                .andExpect(jsonPath("$.paths['/api/books/{bookId}/chapters']").exists())
                .andExpect(jsonPath("$.paths['/api/chapters/{chapterId}']").exists())
                .andExpect(jsonPath("$.paths['/api/chapters/{chapterId}/verses']").exists())
                .andExpect(jsonPath("$.paths['/api/verses/{verseId}']").exists());
    }
}
