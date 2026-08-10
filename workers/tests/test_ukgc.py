from app.connectors.ukgc import UKGCConnector, _parse_csv, _normalize_row


def test_parse_csv():
    csv_text = "Account Number,Name,Status\n12345,Bet365 Group,Active\n67890,Flutter Entertainment,Active\n"
    rows = _parse_csv(csv_text)
    assert len(rows) == 2
    assert rows[0]["Account Number"] == "12345"
    assert rows[0]["Name"] == "Bet365 Group"


def test_normalize_row():
    row = {"Account Number": " 12345 ", "Status ": "Active", "Registered-Address": " London "}
    normed = _normalize_row(row)
    assert normed["account_number"] == "12345"
    assert normed["status"] == "Active"
    assert normed["registered_address"] == "London"


def test_join_datasets():
    connector = UKGCConnector()

    businesses = [
        {"account_number": "100", "name": "TestCo", "status": "Active"},
        {"account_number": "200", "name": "OtherCo", "status": "Active"},
    ]
    licences = [
        {"account_number": "100", "licence_number": "L1", "type": "Remote Casino", "status": "Active"},
        {"account_number": "100", "licence_number": "L2", "type": "Remote Bingo", "status": "Active"},
    ]
    trading_names = [
        {"account_number": "100", "trading_name": "TestBrand"},
        {"account_number": "100", "trading_name": "TestBrand2"},
    ]
    domains = [
        {"account_number": "100", "url": "testco.com"},
        {"account_number": "200", "url": "otherco.com"},
    ]

    joined = connector.join_datasets(businesses, licences, trading_names, domains)

    assert "100" in joined
    assert "200" in joined
    assert joined["100"]["name"] == "TestCo"
    assert len(joined["100"]["licences"]) == 2
    assert len(joined["100"]["trading_names"]) == 2
    assert joined["100"]["domains"] == ["testco.com"]
    assert joined["200"]["domains"] == ["otherco.com"]
    assert len(joined["200"]["licences"]) == 0


def test_join_skips_empty_account():
    connector = UKGCConnector()
    businesses = [{"account_number": "", "name": "NullCo"}]
    joined = connector.join_datasets(businesses, [], [], [])
    assert len(joined) == 0
