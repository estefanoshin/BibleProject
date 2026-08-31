package com.eshin.bible.api.db;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.zip.GZIPInputStream;

public final class GzipText {

    private GzipText() {
    }

    public static String decompress(byte[] compressed) {
        if (compressed == null || compressed.length == 0) {
            return "";
        }
        try (GZIPInputStream in = new GZIPInputStream(new ByteArrayInputStream(compressed));
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            in.transferTo(out);
            return out.toString(StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Unable to decompress verse text", e);
        }
    }
}
