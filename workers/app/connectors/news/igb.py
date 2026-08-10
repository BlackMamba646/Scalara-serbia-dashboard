from app.connectors.news.base_news import BaseNewsConnector


class IGBConnector(BaseNewsConnector):
    source_name = "igb"
    rss_url = "https://igamingbusiness.com/feed/"
    web_url = "https://igamingbusiness.com/news/"
