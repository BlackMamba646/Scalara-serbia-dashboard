"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ExternalLink, Newspaper } from "lucide-react";

type NewsRow = {
  id: string;
  title: string;
  publisher: string | null;
  publishedAt: Date | null;
  excerpt: string | null;
  url: string;
  topics: string[] | null;
};

const publisherColors: Record<string, string> = {
  "iGaming Business": "bg-primary/10 text-primary",
  "Gaming Intelligence": "bg-chart-3/10 text-chart-3",
  "SBC News": "bg-chart-5/10 text-chart-5",
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function NewsClient({ articles }: { articles: NewsRow[] }) {
  const [search, setSearch] = useState("");
  const [publisherFilter, setPublisherFilter] = useState("all");

  const publishers = [...new Set(articles.map((n) => n.publisher).filter(Boolean) as string[])].sort();

  const filtered = articles.filter((n) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !n.title.toLowerCase().includes(q) &&
        !(n.excerpt ?? "").toLowerCase().includes(q)
      )
        return false;
    }
    if (publisherFilter !== "all" && n.publisher !== publisherFilter) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">News</h1>
        <p className="text-sm text-muted-foreground">
          AI-classified iGaming industry news from tracked publications
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Newspaper className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Articles</span>
            </div>
            <div className="text-2xl font-bold tabular-nums">{articles.length}</div>
          </CardContent>
        </Card>
        {publishers.map((pub) => (
          <Card key={pub}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{pub}</div>
              <div className="text-2xl font-bold tabular-nums">
                {articles.filter((n) => n.publisher === pub).length}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select value={publisherFilter} onValueChange={(v) => setPublisherFilter(v ?? "all")}>
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Publishers</SelectItem>
            {publishers.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No articles match your search.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function NewsCard({ article }: { article: NewsRow }) {
  return (
    <Card className="hover:bg-accent/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {article.publisher && (
                <Badge variant="secondary" className={`text-[10px] ${publisherColors[article.publisher] ?? ""}`}>
                  {article.publisher}
                </Badge>
              )}
              {article.publishedAt && (
                <span className="text-[10px] text-muted-foreground">
                  {timeAgo(article.publishedAt)}
                </span>
              )}
            </div>
            <h3 className="text-sm font-medium mb-1.5">{article.title}</h3>
            {article.excerpt && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{article.excerpt}</p>
            )}
            {article.topics && article.topics.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {article.topics.map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-muted-foreground flex items-center gap-1 hover:text-foreground"
            >
              <ExternalLink className="h-2.5 w-2.5" /> Source
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
