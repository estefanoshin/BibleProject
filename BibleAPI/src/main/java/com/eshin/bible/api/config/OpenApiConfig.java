package com.eshin.bible.api.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI bibleApiOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Bible API")
                        .description("HTTP APIs for the Bible project")
                        .version("0.0.1"));
    }
}
