#!/usr/bin/env python3
"""Fetch a Bible Gateway version and write CSVs."""

from __future__ import annotations

import csv
import re
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VERSION = ""
OUT_DIR = ROOT / "frontend" / "public" / "resources" / VERSION
CACHE_DIR = Path("/tmp/bible_custom_cache")
_CACHE_LOCK = threading.Lock()
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

BOOKS = [
    (1, "Génesis", "Genesis"),
    (2, "Éxodo", "Exodus"),
    (3, "Levítico", "Leviticus"),
    (4, "Números", "Numbers"),
    (5, "Deuteronomio", "Deuteronomy"),
    (6, "Josué", "Joshua"),
    (7, "Jueces", "Judges"),
    (8, "Rut", "Ruth"),
    (9, "1 Samuel", "1 Samuel"),
    (10, "2 Samuel", "2 Samuel"),
    (11, "1 Reyes", "1 Kings"),
    (12, "2 Reyes", "2 Kings"),
    (13, "1 Crónicas", "1 Chronicles"),
    (14, "2 Crónicas", "2 Chronicles"),
    (15, "Esdras", "Ezra"),
    (16, "Nehemías", "Nehemiah"),
    (17, "Ester", "Esther"),
    (18, "Job", "Job"),
    (19, "Salmos", "Psalm"),
    (20, "Proverbios", "Proverbs"),
    (21, "Eclesiastés", "Ecclesiastes"),
    (22, "Cantares", "Song of Songs"),
    (23, "Isaías", "Isaiah"),
    (24, "Jeremías", "Jeremiah"),
    (25, "Lamentaciones", "Lamentations"),
    (26, "Ezequiel", "Ezekiel"),
    (27, "Daniel", "Daniel"),
    (28, "Oseas", "Hosea"),
    (29, "Joel", "Joel"),
    (30, "Amós", "Amos"),
    (31, "Abdías", "Obadiah"),
    (32, "Jonás", "Jonah"),
    (33, "Miqueas", "Micah"),
    (34, "Nahúm", "Nahum"),
    (35, "Habacuc", "Habakkuk"),
    (36, "Sofonías", "Zephaniah"),
    (37, "Hageo", "Haggai"),
    (38, "Zacarías", "Zechariah"),
    (39, "Malaquías", "Malachi"),
    (40, "Mateo", "Matthew"),
    (41, "Marcos", "Mark"),
    (42, "Lucas", "Luke"),
    (43, "Juan", "John"),
    (44, "Hechos", "Acts"),
    (45, "Romanos", "Romans"),
    (46, "1 Corintios", "1 Corinthians"),
    (47, "2 Corintios", "2 Corinthians"),
    (48, "Gálatas", "Galatians"),
    (49, "Efesios", "Ephesians"),
    (50, "Filipenses", "Philippians"),
    (51, "Colosenses", "Colossians"),
    (52, "1 Tesalonicenses", "1 Thessalonians"),
    (53, "2 Tesalonicenses", "2 Thessalonians"),
    (54, "1 Timoteo", "1 Timothy"),
    (55, "2 Timoteo", "2 Timothy"),
    (56, "Tito", "Titus"),
    (57, "Filemón", "Philemon"),
    (58, "Hebreos", "Hebrews"),
    (59, "Santiago", "James"),
    (60, "1 Pedro", "1 Peter"),
    (61, "2 Pedro", "2 Peter"),
    (62, "1 Juan", "1 John"),
    (63, "2 Juan", "2 John"),
    (64, "3 Juan", "3 John"),
    (65, "Judas", "Jude"),
    (66, "Apocalipsis", "Revelation"),
]

CHAPTER_COUNTS = {
    1: 50, 2: 40, 3: 27, 4: 36, 5: 34, 6: 24, 7: 21, 8: 4, 9: 31, 10: 24,
    11: 22, 12: 25, 13: 29, 14: 36, 15: 10, 16: 13, 17: 10, 18: 42, 19: 150,
    20: 31, 21: 12, 22: 8, 23: 66, 24: 52, 25: 5, 26: 48, 27: 12, 28: 14,
    29: 3, 30: 9, 31: 1, 32: 4, 33: 7, 34: 3, 35: 3, 36: 3, 37: 2, 38: 14,
    39: 4, 40: 28, 41: 16, 42: 24, 43: 21, 44: 28, 45: 16, 46: 16, 47: 13,
    48: 6, 49: 6, 50: 4, 51: 4, 52: 5, 53: 3, 54: 6, 55: 4, 56: 3, 57: 1,
    58: 13, 59: 5, 60: 5, 61: 3, 62: 5, 63: 1, 64: 1, 65: 1, 66: 22,
}

SKIP_TAGS = {"script", "style", "sup"}
SKIP_CLASS_PREFIXES = ("footnote", "crossreference", "chapternum", "versenum")
VERSE_CLASS_RE = re.compile(r"(?:^|\s)text\s+([A-Za-z0-9]+)-(\d+)-(\d+)(?:\s|$)")
LEADING_VERSE_RE = re.compile(r"^(\d{1,3})\s+")
WHITESPACE_RE = re.compile(r"\s+")


class PassageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.in_passage = False
        self.passage_depth = 0
        self.skip_depth = 0
        self.in_heading = 0
        self.current_verse: int | None = None
        self.fragments: dict[int, list[str]] = OrderedDict()
        self._pending_versenum = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = {k: (v or "") for k, v in attrs}
        classes = attr.get("class", "")
        class_list = classes.split()

        if not self.in_passage:
            if tag == "div" and "passage-content" in class_list:
                self.in_passage = True
                self.passage_depth = 1
            return

        if self.skip_depth:
            self.skip_depth += 1
            if "versenum" in class_list:
                self._pending_versenum = True
            return

        if tag == "div":
            self.passage_depth += 1

        if "chapternum" in class_list:
            self.current_verse = 1
            self.fragments.setdefault(1, [])
        elif "versenum" in class_list:
            self._pending_versenum = True

        should_skip = (
            tag in SKIP_TAGS
            or any(c.startswith(SKIP_CLASS_PREFIXES) for c in class_list)
            or "footnotes" in class_list
            or "publisher-info-bottom" in class_list
        )
        if should_skip:
            self.skip_depth = 1
            return

        if tag in {"h1", "h2", "h3", "h4"}:
            self.in_heading += 1
            return

        match = VERSE_CLASS_RE.search(classes)
        if match and tag == "span" and not self.in_heading:
            verse_n = int(match.group(3))
            if self.current_verse is None or verse_n >= self.current_verse:
                self.current_verse = verse_n
            self.fragments.setdefault(self.current_verse, [])

        if tag == "br" and self.current_verse is not None and not self.in_heading:
            self.fragments.setdefault(self.current_verse, []).append(" ")

    def handle_endtag(self, tag: str) -> None:
        if self.skip_depth:
            self.skip_depth -= 1
            return
        if tag in {"h1", "h2", "h3", "h4"} and self.in_heading:
            self.in_heading -= 1
        if self.in_passage and tag == "div":
            self.passage_depth -= 1
            if self.passage_depth <= 0:
                self.in_passage = False

    def handle_data(self, data: str) -> None:
        if self._pending_versenum:
            digits = re.sub(r"\D", "", data)
            if digits:
                self.current_verse = int(digits)
                self.fragments.setdefault(self.current_verse, [])
            self._pending_versenum = False
            return
        if not self.in_passage or self.skip_depth or self.in_heading:
            return
        if self.current_verse is None:
            return
        text = data.strip()
        if not text:
            return
        lead = LEADING_VERSE_RE.match(text)
        if lead:
            maybe = int(lead.group(1))
            if maybe != self.current_verse and 1 <= maybe <= 176:
                self.current_verse = maybe
                self.fragments.setdefault(maybe, [])
                text = text[lead.end() :].strip()
                if not text:
                    return
        self.fragments.setdefault(self.current_verse, []).append(text)


def parse_verses(html: str) -> dict[int, str]:
    parser = PassageParser()
    parser.feed(html)
    verses: dict[int, str] = OrderedDict()
    for num, parts in parser.fragments.items():
        joined = WHITESPACE_RE.sub(" ", " ".join(parts)).replace("\xa0", " ").strip()
        joined = re.sub(r"\s+([,.;:!?])", r"\1", joined)
        if joined:
            verses[num] = joined
    return verses


def fetch_html(book_en: str, chapter: int) -> str:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    key = f"{VERSION}_{book_en.replace(' ', '_')}_{chapter}.html"
    cache_path = CACHE_DIR / key
    if cache_path.exists() and cache_path.stat().st_size > 1000:
        return cache_path.read_text(encoding="utf-8")

    query = urllib.parse.urlencode(
        {"search": f"{book_en} {chapter}", "version": VERSION}
    )
    url = f"https://www.biblegateway.com/passage/?{query}"
    req = urllib.request.Request(
        url, headers={"User-Agent": USER_AGENT, "Accept-Language": "es"}
    )
    last_err: Exception | None = None
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                html = resp.read().decode("utf-8", "replace")
            with _CACHE_LOCK:
                cache_path.write_text(html, encoding="utf-8")
            time.sleep(0.2)
            return html
        except (urllib.error.URLError, TimeoutError) as exc:
            last_err = exc
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Failed to fetch {book_en} {chapter}: {last_err}")


def chapter_plan() -> list[tuple[int, int, int, str, str]]:
    rows = []
    chapter_id = 1
    for book_id, name_es, name_en in BOOKS:
        for cnum in range(1, CHAPTER_COUNTS[book_id] + 1):
            rows.append((chapter_id, book_id, cnum, name_es, name_en))
            chapter_id += 1
    return rows


def write_books_and_chapters() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with (OUT_DIR / "books.csv").open("w", encoding="utf-8", newline="") as fh:
        writer = csv.writer(fh, lineterminator="\n")
        writer.writerow(["book_id", "name", "version"])
        for book_id, name_es, _ in BOOKS:
            writer.writerow([book_id, name_es, VERSION])
    with (OUT_DIR / "chapters.csv").open("w", encoding="utf-8", newline="") as fh:
        writer = csv.writer(fh, lineterminator="\n")
        writer.writerow(["chapter_id", "book_id", "cNum"])
        for chapter_id, book_id, cnum, *_ in chapter_plan():
            writer.writerow([chapter_id, book_id, cnum])


def load_chapter(
    item: tuple[int, int, int, str, str],
) -> tuple[int, int, int, str, dict[int, str]]:
    chapter_id, book_id, cnum, name_es, name_en = item
    verses = parse_verses(fetch_html(name_en, cnum))
    if not verses:
        raise RuntimeError(f"no verses parsed for {name_es} {cnum}")
    return chapter_id, book_id, cnum, name_es, verses


def main() -> int:
    global VERSION, OUT_DIR
    print("Input version to fetch")
    VERSION = input().strip()
    OUT_DIR = ROOT / "frontend" / "public" / "resources" / VERSION
    write_books_and_chapters()
    plan = chapter_plan()
    parsed: dict[int, dict[int, str]] = {}
    total = len(plan)
    print(f"Fetching {total} {VERSION} chapters from Bible Gateway")
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(load_chapter, item) for item in plan]
        done = 0
        for fut in as_completed(futures):
            chapter_id, _book_id, cnum, name_es, verses = fut.result()
            parsed[chapter_id] = verses
            done += 1
            if done % 25 == 0 or done == total:
                print(f"{done}/{total} {name_es} {cnum} ({len(verses)} verses)")

    rows: list[list[object]] = []
    next_id = 1
    for chapter_id, book_id, _cnum, _name_es, _name_en in plan:
        verses = parsed[chapter_id]
        for vnum in sorted(verses):
            rows.append([next_id, book_id, chapter_id, vnum, verses[vnum]])
            next_id += 1

    verses_path = OUT_DIR / "versicles.csv"
    with verses_path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.writer(fh, lineterminator="\n")
        writer.writerow(["versicle_id", "book_id", "chapter_id", "vNum", "text_value"])
        writer.writerows(rows)
    print(f"Wrote {len(rows)} versicles to {verses_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
