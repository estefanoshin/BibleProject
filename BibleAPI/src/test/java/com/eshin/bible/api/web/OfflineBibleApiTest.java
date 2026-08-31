package com.eshin.bible.api.web;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import javax.sql.DataSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "bible.offline=true",
        "OFFLINE=true"
})
class OfflineBibleApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired(required = false)
    private DataSource dataSource;

    @Test
    void readsVersionsFromCsvWithoutADatabase() throws Exception {
        assertThat(dataSource).isNull();
        mockMvc.perform(get("/api/versions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.version == 'RV-1960')]").exists())
                .andExpect(jsonPath("$[?(@.version == 'RVA-2015')]").exists());
    }
}
