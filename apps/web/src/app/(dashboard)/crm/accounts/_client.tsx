"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building2,
  Search,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Plus,
} from "lucide-react";
import { createAccount } from "@/lib/actions/crm";

type Account = {
  id: string;
  canonicalName: string;
  legalName: string | null;
  country: string | null;
  companyType: string | null;
  employeeCount: number | null;
  websiteUrl: string | null;
  industry: string | null;
  lifecycleStage: string | null;
  estimatedValue: number | null;
  accountOwner: string | null;
  lastActivityAt: Date | null;
  nextActivityAt: Date | null;
  updatedAt: Date;
};

const stageColors: Record<string, string> = {
  lead: "bg-muted text-muted-foreground",
  prospect: "bg-chart-4/10 text-chart-4",
  qualified: "bg-chart-2/10 text-chart-2",
  customer: "bg-primary/10 text-primary",
  churned: "bg-destructive/10 text-destructive",
  partner: "bg-chart-3/10 text-chart-3",
};

function timeAgo(d: Date | null) {
  if (!d) return "No activity";
  const now = new Date();
  const diff = now.getTime() - new Date(d).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function formatValue(v: number | null) {
  if (v == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function AddAccountForm() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [companyType, setCompanyType] = useState("other");

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createAccount({
        canonicalName: formData.get("canonicalName") as string,
        legalName: (formData.get("legalName") as string) || undefined,
        country: (formData.get("country") as string) || undefined,
        companyType: companyType as "operator" | "vendor" | "studio" | "affiliate" | "regulator" | "other",
        websiteUrl: (formData.get("websiteUrl") as string) || undefined,
        linkedinUrl: (formData.get("linkedinUrl") as string) || undefined,
        industry: (formData.get("industry") as string) || undefined,
        description: (formData.get("description") as string) || undefined,
        leadSource: (formData.get("leadSource") as string) || undefined,
      });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="h-4 w-4 mr-1" /> Add Account
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Account</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <Input name="canonicalName" placeholder="Company name *" required />
          <Input name="legalName" placeholder="Legal name (if different)" />
          <div className="grid grid-cols-2 gap-3">
            <Input name="country" placeholder="Country" />
            <Select value={companyType} onValueChange={(v) => v && setCompanyType(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Company type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operator">Operator</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="affiliate">Affiliate</SelectItem>
                <SelectItem value="regulator">Regulator</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input name="websiteUrl" placeholder="Website URL" />
            <Input name="industry" placeholder="Industry" />
          </div>
          <Input name="linkedinUrl" placeholder="LinkedIn URL" />
          <Input name="leadSource" placeholder="Lead source (e.g. referral, event)" />
          <Textarea name="description" placeholder="Description..." rows={2} />
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Creating..." : "Create Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AccountsClient({ accounts }: { accounts: Account[] }) {
  const [search, setSearch] = useState("");

  const filtered = accounts.filter((a) =>
    a.canonicalName.toLowerCase().includes(search.toLowerCase()) ||
    (a.country?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (a.industry?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const byStage = accounts.reduce<Record<string, number>>((acc, a) => {
    const stage = a.lifecycleStage || "unknown";
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            {accounts.length} companies added to CRM
          </p>
        </div>
        <AddAccountForm />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {(["lead", "prospect", "qualified", "customer", "partner", "churned"] as const).map(
          (stage) => (
            <Card key={stage}>
              <CardContent className="p-3">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {stage}
                </span>
                <div className="text-xl font-bold tabular-nums mt-0.5">
                  {byStage[stage] || 0}
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search accounts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          {accounts.length === 0
            ? 'No accounts yet. Click "Add Account" to create one, or go to a company page and click "Add as Account".'
            : "No accounts match your search."}
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map((account) => (
            <Link key={account.id} href={`/companies/${account.id}`}>
              <Card className="hover:bg-accent/30 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">
                          {account.canonicalName}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          {account.country && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {account.country}
                            </span>
                          )}
                          {account.companyType && (
                            <span>{account.companyType}</span>
                          )}
                          {account.industry && (
                            <span>{account.industry}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {account.estimatedValue != null && (
                        <span className="text-xs font-medium flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatValue(account.estimatedValue)}
                        </span>
                      )}
                      {account.accountOwner && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {account.accountOwner}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo(account.lastActivityAt)}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${stageColors[account.lifecycleStage || ""] ?? ""}`}
                      >
                        {account.lifecycleStage}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
