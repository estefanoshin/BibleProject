package com.eshin.bible.api.db;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@ConditionalOnProperty(name = "bible.offline", havingValue = "false")
public class TestTableRepository {

    private final JdbcTemplate jdbcTemplate;

    public TestTableRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<String> findAllValues() {
        return jdbcTemplate.queryForList(
                "SELECT random_names FROM test_table",
                String.class
        );
    }
}
