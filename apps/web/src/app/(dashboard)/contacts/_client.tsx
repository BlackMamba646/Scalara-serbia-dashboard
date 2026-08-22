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
import { Button } from "@/components/ui/button";
import { Search, Users, Star, Mail, ExternalLink } from "lucide-react";

type ContactRow = {
  id: string;
  name: string;
  title: string | null;
  companyName: string | null;
  email: string | null;
  linkedinUrl: string | null;
  isDecisionMaker: boolean;
  confidence: number | null;
};

export function ContactsClient({ contacts }: { contacts: ContactRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.companyName ?? "").toLowerCase().includes(q) ||
      (c.title ?? "").toLowerCase().includes(q)
    );
  });

  const decisionMakers = contacts.filter((c) => c.isDecisionMaker).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
        <p className="text-sm text-muted-foreground">
          Decision-makers at tracked companies
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Contacts</span>
            </div>
            <div className="text-2xl font-bold tabular-nums">{contacts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-chart-2" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Decision Makers</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-chart-2">{decisionMakers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">With Email</div>
            <div className="text-2xl font-bold tabular-nums text-primary">
              {contacts.filter((c) => c.email).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base">Contact Database</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-56 pl-8 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>LinkedIn</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead className="pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {contact.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{contact.name}</div>
                        {contact.isDecisionMaker && (
                          <Badge variant="secondary" className="text-[9px] bg-chart-2/10 text-chart-2">
                            Decision Maker
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{contact.title ?? "—"}</TableCell>
                  <TableCell className="text-sm font-medium">{contact.companyName ?? "—"}</TableCell>
                  <TableCell>
                    {contact.email ? (
                      <span className="text-xs font-mono text-muted-foreground">{contact.email}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{"—"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.linkedinUrl ? (
                      <span className="text-xs text-primary flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> Profile
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{"—"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium tabular-nums">{contact.confidence ?? 0}%</span>
                  </TableCell>
                  <TableCell className="pr-4">
                    <Button variant="outline" size="sm" className="h-7 text-xs" disabled={!contact.email}>
                      <Mail className="mr-1 h-3 w-3" />
                      Email
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {contacts.length === 0
                ? "No contacts yet. Contacts will appear as the system discovers decision-makers."
                : "No contacts match your search."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
