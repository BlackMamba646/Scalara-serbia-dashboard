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
import { useRouter } from "next/navigation";
import { Search, Building2, Globe } from "lucide-react";

type CompanyRow = {
  id: string;
  name: string;
  legalName: string | null;
  country: string | null;
  type: string | null;
  employees: number | null;
  website: string | null;
  description: string | null;
  isActive: boolean;
};

const typeStyles: Record<string, string> = {
  operator: "bg-primary/10 text-primary",
  vendor: "bg-chart-3/10 text-chart-3",
  studio: "bg-chart-2/10 text-chart-2",
  affiliate: "bg-chart-5/10 text-chart-5",
  other: "bg-muted text-muted-foreground",
};

const PAGE_SIZE = 50;

export function CompaniesClient({ companies }: { companies: CompanyRow[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = companies.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      if (!c.name.toLowerCase().includes(q)) return false;
    }
    if (typeFilter !== "all" && c.type !== typeFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const operators = companies.filter((c) => c.type === "operator").length;
  const vendors = companies.filter((c) => c.type === "vendor").length;
  const studios = companies.filter((c) => c.type === "studio").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
        <p className="text-sm text-muted-foreground">
          Tracked iGaming companies with intelligence profiles
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Total</span>
            </div>
            <div className="text-2xl font-bold tabular-nums">{companies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Operators</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-primary">{operators}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Vendors</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-chart-3">{vendors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Studios</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-chart-2">{studios}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base">Company Database</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="h-8 w-56 pl-8 text-sm"
                />
              </div>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v ?? "all"); setPage(1); }}>
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="operator">Operators</SelectItem>
                  <SelectItem value="vendor">Vendors</SelectItem>
                  <SelectItem value="studio">Studios</SelectItem>
                  <SelectItem value="affiliate">Affiliates</SelectItem>
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
                <TableHead>Type</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Website</TableHead>
                <TableHead className="pr-4">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((c) => (
                <CompanyRowItem key={c.id} company={c} />
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No companies match your search.
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

function CompanyRowItem({ company: c }: { company: CompanyRow }) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  return (
    <>
      <TableRow
        className="cursor-pointer"
        onClick={() => router.push(`/companies/${c.id}`)}
        onDoubleClick={() => setExpanded(!expanded)}
      >
        <TableCell className="pl-4">
          <div>
            <div className="font-medium text-sm">{c.name}</div>
            {c.legalName && c.legalName !== c.name && (
              <div className="text-[10px] text-muted-foreground truncate max-w-48">{c.legalName}</div>
            )}
          </div>
        </TableCell>
        <TableCell>
          {c.type ? (
            <Badge variant="secondary" className={`text-[10px] ${typeStyles[c.type] ?? typeStyles.other}`}>
              {c.type}
            </Badge>
          ) : (
            <span className="text-muted-foreground">--</span>
          )}
        </TableCell>
        <TableCell className="text-sm">{c.country ?? "--"}</TableCell>
        <TableCell className="tabular-nums text-sm">{c.employees?.toLocaleString() ?? "--"}</TableCell>
        <TableCell>
          {c.website ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              {c.website}
            </div>
          ) : (
            <span className="text-muted-foreground">--</span>
          )}
        </TableCell>
        <TableCell className="pr-4">
          <Badge variant="secondary" className={`text-[10px] ${c.isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
            {c.isActive ? "Active" : "Inactive"}
          </Badge>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={6} className="pl-4 pr-4 py-4">
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1">Description</div>
                <p className="text-sm">{c.description ?? "No description available."}</p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                {c.website && (
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {c.website}
                  </div>
                )}
                <div>Active: {c.isActive ? "Yes" : "No"}</div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
