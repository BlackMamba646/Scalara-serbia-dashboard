"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Search,
  ExternalLink,
  File,
  FileCheck2,
  FilePen,
} from "lucide-react";

type DocumentRow = {
  id: string;
  companyId: string | null;
  companyName: string | null;
  documentType: string;
  name: string;
  mimeType: string | null;
  webUrl: string | null;
  fileSize: number | null;
  uploadedBy: string | null;
  ndaStatus: string | null;
  ndaSignedDate: Date | null;
  ndaExpiryDate: Date | null;
  ndaCounterparty: string | null;
  createdAt: Date;
};

const typeIcons: Record<string, typeof FileText> = {
  nda: FileCheck2,
  proposal: FilePen,
  contract: FileCheck2,
  default: File,
};

const ndaStatusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-chart-4/10 text-chart-4",
  under_review: "bg-chart-2/10 text-chart-2",
  signed: "bg-success/10 text-success",
  expired: "bg-destructive/10 text-destructive",
};

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function DocumentsClient({ documents }: { documents: DocumentRow[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = documents.filter((d) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !d.name.toLowerCase().includes(q) &&
        !(d.companyName ?? "").toLowerCase().includes(q)
      )
        return false;
    }
    if (typeFilter !== "all" && d.documentType !== typeFilter) return false;
    return true;
  });

  const ndas = documents.filter((d) => d.documentType === "nda");
  const proposals = documents.filter((d) => d.documentType === "proposal");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="text-sm text-muted-foreground">
          NDAs, proposals, contracts, and other files
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Total</span>
            </div>
            <div className="text-2xl font-bold tabular-nums">{documents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">NDAs</div>
            <div className="text-2xl font-bold tabular-nums text-chart-2">{ndas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Proposals</div>
            <div className="text-2xl font-bold tabular-nums text-chart-3">{proposals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Signed NDAs</div>
            <div className="text-2xl font-bold tabular-nums text-primary">
              {ndas.filter((n) => n.ndaStatus === "signed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base">Document Library</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-56 pl-8 text-sm"
                />
              </div>
              <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="nda">NDA</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map((doc) => {
              const Icon = typeIcons[doc.documentType] ?? typeIcons.default;
              return (
                <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors">
                  <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{doc.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[9px]">{doc.documentType}</Badge>
                      {doc.ndaStatus && (
                        <Badge variant="secondary" className={`text-[9px] ${ndaStatusColors[doc.ndaStatus] ?? ""}`}>
                          NDA: {doc.ndaStatus.replace("_", " ")}
                        </Badge>
                      )}
                      {doc.companyName && (
                        <Link href={`/companies/${doc.companyId}`} className="text-[10px] text-primary hover:underline">
                          {doc.companyName}
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-muted-foreground">{formatDate(doc.createdAt)}</div>
                    {doc.uploadedBy && (
                      <div className="text-[10px] text-muted-foreground">{doc.uploadedBy}</div>
                    )}
                  </div>
                  {doc.webUrl && (
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {documents.length === 0
                ? "No documents yet. Upload documents from company account pages."
                : "No documents match your filters."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
