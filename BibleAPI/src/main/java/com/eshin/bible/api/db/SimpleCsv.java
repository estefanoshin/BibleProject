package com.eshin.bible.api.db;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

final class SimpleCsv {

    private SimpleCsv() {
    }

    static List<Map<String, String>> read(InputStream in) throws IOException {
        try (Reader reader = new InputStreamReader(in, StandardCharsets.UTF_8);
             BufferedReader buffered = new BufferedReader(reader)) {
            buffered.mark(1);
            int first = buffered.read();
            if (first != 0xFEFF) {
                buffered.reset();
            }
            List<String> header = parseRecord(buffered);
            if (header == null) {
                return List.of();
            }
            List<Map<String, String>> rows = new ArrayList<>();
            List<String> record;
            while ((record = parseRecord(buffered)) != null) {
                if (record.size() == 1 && record.getFirst().isEmpty()) {
                    continue;
                }
                Map<String, String> row = new LinkedHashMap<>();
                for (int i = 0; i < header.size(); i++) {
                    String value = i < record.size() ? record.get(i) : "";
                    row.put(header.get(i), value);
                }
                rows.add(row);
            }
            return rows;
        }
    }

    private static List<String> parseRecord(BufferedReader reader) throws IOException {
        int first = reader.read();
        if (first == -1) {
            return null;
        }
        List<String> fields = new ArrayList<>();
        StringBuilder field = new StringBuilder();
        boolean quoted = false;
        int c = first;
        while (c != -1) {
            if (quoted) {
                if (c == '"') {
                    reader.mark(1);
                    int next = reader.read();
                    if (next == '"') {
                        field.append('"');
                    } else {
                        quoted = false;
                        if (next != -1) {
                            reader.reset();
                        }
                    }
                } else {
                    field.append((char) c);
                }
            } else if (c == '"') {
                quoted = true;
            } else if (c == ',') {
                fields.add(field.toString());
                field.setLength(0);
            } else if (c == '\n') {
                break;
            } else if (c != '\r') {
                field.append((char) c);
            }
            c = reader.read();
        }
        fields.add(field.toString());
        return fields;
    }
}
