import { useAuth } from "@/lib/auth";
import { useGetPortfolio, usePortfolioPerformanceHistory } from "@workspace/api-client-react";
import { getGetPortfolioQueryKey, getPortfolioPerformanceHistoryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, MapPin, Building2 } from "lucide-react";
import { useState } from "react";

export default function Portfolio() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("1m");

  const { data: portfolio, isLoading } = useGetPortfolio(user?.id ?? "", {
    query: { enabled: !!user?.id, queryKey: getGetPortfolioQueryKey(user?.id ?? "") }
  });

  const { data: performance } = usePortfolioPerformanceHistory(user?.id ?? "", { period }, {
    query: { enabled: !!user?.id, queryKey: getPortfolioPerformanceHistoryQueryKey(user?.id ?? "", { period }) }
  });

  const chartData = performance?.map(p => ({
    date: new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: p.value,
    invested: p.invested,
  })) ?? [];

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );

  const pnlPositive = (portfolio?.totalProfitLoss ?? 0) >= 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
        <p className="text-muted-foreground mt-1">Your holdings, performance, and return on investment.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Invested", value: `$${(portfolio?.totalInvested ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, sub: null },
          { label: "Current Value", value: `$${(portfolio?.currentValue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, sub: null },
          {
            label: "Total P&L",
            value: `${pnlPositive ? "+" : ""}$${Math.abs(portfolio?.totalProfitLoss ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
            sub: `${pnlPositive ? "+" : ""}${(portfolio?.totalProfitLossPercent ?? 0).toFixed(2)}%`,
            color: pnlPositive ? "text-chart-1" : "text-chart-2"
          },
          { label: "Cash Balance", value: `$${(portfolio?.walletBalance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, sub: null },
        ].map((s, i) => (
          <Card key={i} className="bg-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle></CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold font-mono ${s.color ?? ""}`}>{s.value}</p>
              {s.sub && <p className={`text-sm mt-0.5 ${s.color ?? "text-muted-foreground"}`}>{s.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance chart */}
      {chartData.length > 0 && (
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Performance</CardTitle>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1w">1W</SelectItem>
                <SelectItem value="1m">1M</SelectItem>
                <SelectItem value="3m">3M</SelectItem>
                <SelectItem value="6m">6M</SelectItem>
                <SelectItem value="1y">1Y</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152 76% 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(152 76% 50%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 16%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }} tickFormatter={v => `$${v.toLocaleString()}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(220 18% 10%)", border: "1px solid hsl(220 15% 16%)", borderRadius: "6px", fontSize: "12px" }}
                  formatter={(v: number, name: string) => [`$${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, name === "value" ? "Portfolio Value" : "Invested"]}
                />
                <Area type="monotone" dataKey="invested" stroke="hsl(217 91% 60%)" fill="url(#investedGradient)" strokeWidth={1.5} strokeDasharray="4 4" />
                <Area type="monotone" dataKey="value" stroke="hsl(152 76% 50%)" fill="url(#perfGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Holdings */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Holdings ({portfolio?.holdings?.length ?? 0})</h2>
        {portfolio?.holdings?.length === 0 ? (
          <Card className="bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
              <Building2 className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No holdings yet</p>
              <Link href="/assets"><Button>Browse investments</Button></Link>
            </CardContent>
          </Card>
        ) : (
          portfolio?.holdings?.map(h => {
            const pnlPos = h.profitLoss >= 0;
            return (
              <Link key={h.assetId} href={`/assets/${h.assetId}`}>
                <Card className="bg-card hover:border-primary/30 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {h.assetImageUrl ? <img src={h.assetImageUrl} alt={h.assetName} className="w-full h-full object-cover" /> : <Building2 className="h-6 w-6 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{h.assetName}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <span>{h.assetLocation}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <p className="font-mono font-bold">${h.currentValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                      <div className={`flex items-center justify-end gap-1 text-sm font-mono ${pnlPos ? "text-chart-1" : "text-chart-2"}`}>
                        {pnlPos ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        <span>{pnlPos ? "+" : ""}{h.profitLossPercent.toFixed(2)}%</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 text-xs text-muted-foreground space-y-0.5 hidden md:block">
                      <p>{h.shares} shares</p>
                      <p className="font-mono">${h.pricePerShare.toFixed(2)}/sh</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
