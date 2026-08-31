package com.eshin.bible.api.config;

import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.Map;

public class OfflineEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String[] DATASOURCE_AUTO_CONFIG = {
            "org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration",
            "org.springframework.boot.jdbc.autoconfigure.DataSourceTransactionManagerAutoConfiguration",
            "org.springframework.boot.jdbc.autoconfigure.JdbcTemplateAutoConfiguration",
            "org.springframework.boot.jdbc.autoconfigure.JdbcClientAutoConfiguration",
            "org.springframework.boot.jdbc.autoconfigure.health.DataSourceHealthContributorAutoConfiguration"
    };

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        if (!isOffline(environment)) {
            return;
        }
        environment.getPropertySources().addFirst(new MapPropertySource(
                "offlineDatasourceExclusion",
                Map.of("spring.autoconfigure.exclude", String.join(",", DATASOURCE_AUTO_CONFIG))
        ));
    }

    private static boolean isOffline(ConfigurableEnvironment environment) {
        Boolean fromYaml = environment.getProperty("bible.offline", Boolean.class);
        if (fromYaml != null) {
            return fromYaml;
        }
        Boolean fromEnv = environment.getProperty("OFFLINE", Boolean.class);
        if (fromEnv != null) {
            return fromEnv;
        }
        return true;
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}
