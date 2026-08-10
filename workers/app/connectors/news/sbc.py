from app.connectors.news.base_news import BaseNewsConnector


class SBCConnector(BaseNewsConnector):
    source_name = "sbc"
    rss_url = "https://sbcnews.co.uk/feed/"
    web_url = "https://sbcnews.co.uk/"
