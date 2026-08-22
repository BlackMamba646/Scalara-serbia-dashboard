"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ShieldCheck, Globe } from "lucide-react";

type LicenseRow = {
  id: string;
  companyName: string | null;
  licenseNumber: string | null;
  jurisdiction: string;
  regulator: string;
  licenseType: string | null;
  licenseStatus: string | null;
  legalEntityName?: string | null;
  effectiveDate: Date | null;
  expiryDate: Date | null;
};

const statusStyles: Record<string, string> = {
  active: "bg-success/10 text-success border-success/30",
  pending: "bg-warning/10 text-warning border-warning/30",
  conditional: "bg-chart-2/10 text-chart-2 border-chart-2/30",
  suspended: "bg-destructive/10 text-destructive border-destructive/30",
  revoked: "bg-destructive/10 text-destructive border-destructive/30",
  expired: "bg-muted text-muted-foreground border-border",
};

const PAGE_SIZE = 50;

export function LicensesClient({ licenses }: { licenses: LicenseRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jurisdictionFilter, setJurisdictionFilter] = useState("all");
  const [page, setPage] = useState(1);

  const jurisdictions = [...new Set(licenses.map((l) => l.jurisdiction))].sort();

  const filtered = licenses.filter((l) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !(l.companyName ?? "").toLowerCase().includes(q) &&
        !(l.licenseNumber ?? "").toLowerCase().includes(q) &&
        !(l.legalEntityName ?? "").toLowerCase().includes(q)
      )
        return false;
    }
    if (statusFilter !== "all" && l.licenseStatus !== statusFilter) return false;
    if (jurisdictionFilter !== "all" && l.jurisdiction !== jurisdictionFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const activeCount = licenses.filter((l) => l.licenseStatus === "active").length;
  const pendingCount = licenses.filter((l) => l.licenseStatus === "pending").length;
  const jurisdictionCount = new Set(licenses.map((l) => l.jurisdiction)).size;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Licenses</h1>
        <p className="text-sm text-muted-foreground">
          Cross-jurisdiction gambling license tracker
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Total</span>
            </div>
            <div className="text-2xl font-bold tabular-nums">{licenses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Active</div>
            <div className="text-2xl font-bold tabular-nums text-success">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pending</div>
            <div className="text-2xl font-bold tabular-nums text-warning">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Jurisdictions</span>
            </div>
            <div className="text-2xl font-bold tabular-nums">{jurisdictionCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base">License Database</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search licenses..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="h-8 w-52 pl-8 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "all"); setPage(1); }}>
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={jurisdictionFilter} onValueChange={(v) => { setJurisdictionFilter(v ?? "all"); setPage(1); }}>
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jurisdictions</SelectItem>
                  {jurisdictions.map((j) => (
                    <SelectItem key={j} value={j}>{j}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Company</TableHead>
                <TableHead>License #</TableHead>
                <TableHead>Jurisdiction</TableHead>
                <TableHead>Regulator</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Effective</TableHead>
                <TableHead className="pr-4">Expiry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((lic) => (
                <TableRow key={lic.id}>
                  <TableCell className="pl-4">
                    <div>
                      <div className="font-medium text-sm">{lic.companyName ?? "Unknown"}</div>
                      {lic.legalEntityName && (
                        <div className="text-[10px] text-muted-foreground truncate max-w-40">{lic.legalEntityName}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">{lic.licenseNumber ?? "-"}</span>
                  </TableCell>
                  <TableCell className="text-sm">{lic.jurisdiction}</TableCell>
                  <TableCell className="text-sm">{lic.regulator}</TableCell>
                  <TableCell>
                    <span className="text-xs">{lic.licenseType ?? "-"}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${statusStyles[lic.licenseStatus ?? ""] ?? ""}`}>
                      {lic.licenseStatus ?? "unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">
                    {lic.effectiveDate?.toLocaleDateString() ?? "—"}
                  </TableCell>
                  <TableCell className="pr-4 text-xs tabular-nums">
                    {lic.expiryDate?.toLocaleDateString() ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No licenses match your filters.
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-xs text-muted-foreground">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, safePage - 1))}
                  disabled={safePage <= 1}
                  className="px-3 py-1.5 text-xs rounded-md border bg-background hover:bg-accent disabled:opacity-40 disabled:pointer-events-none"
                >
                  Previous
                </button>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {safePage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                  disabled={safePage >= totalPages}
                  className="px-3 py-1.5 text-xs rounded-md border bg-background hover:bg-accent disabled:opacity-40 disabled:pointer-events-none"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
