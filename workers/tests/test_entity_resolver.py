from app.pipeline.entity_resolver import (
    extract_domain,
    fuzzy_match,
    normalize_company_name,
)


def test_normalize_removes_suffixes():
    assert normalize_company_name("Bet365 Group Ltd") == "bet365 group"
    assert normalize_company_name("Flutter Entertainment PLC") == "flutter entertainment"
    assert normalize_company_name("Entain Holdings Limited") == "entain holdings"
    assert normalize_company_name("Acme Corp") == "acme"
    assert normalize_company_name("Test LLC") == "test"


def test_normalize_strips_punctuation():
    assert normalize_company_name("  Sky Betting & Gaming  ") == "sky betting gaming"


def test_extract_domain():
    assert extract_domain("https://www.bet365.com/path") == "bet365.com"
    assert extract_domain("www.example.com") == "example.com"
    assert extract_domain("example.com") == "example.com"
    assert extract_domain("") == ""


def test_fuzzy_match_exact():
    assert fuzzy_match("Bet365", "Bet365") == 1.0


def test_fuzzy_match_suffix_difference():
    score = fuzzy_match("Bet365 Group Ltd", "Bet365 Group")
    assert score == 1.0


def test_fuzzy_match_similar():
    score = fuzzy_match("Flutter Entertainment", "Flutter Entertainmnt")
    assert score > 0.85


def test_fuzzy_match_different():
    score = fuzzy_match("Bet365", "William Hill")
    assert score < 0.5
