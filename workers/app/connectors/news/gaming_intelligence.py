from app.connectors.news.base_news import BaseNewsConnector


class GamingIntelligenceConnector(BaseNewsConnector):
    source_name = "gaming_intelligence"
    rss_url = "https://gamingintelligence.com/feed/"
    web_url = "https://gamingintelligence.com/"
