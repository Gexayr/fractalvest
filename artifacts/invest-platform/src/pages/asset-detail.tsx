import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetAsset, useGetAssetValuationHistory, useCreateTransaction, useGetDashboardSummary } from "@workspace/api-client-react";
import { getGetAssetQueryKey, getGetAssetValuationHistoryQueryKey, getGetDashboardSummaryQueryKey, getListAssetsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { MapPin, TrendingUp, ChevronLeft, AlertCircle, Building2, Minus, Plus } from "lucide-react";
import { Link } from "wouter";

const statusColors: Record<string, string> = {
  active: "text-chart-1 border-chart-1/30 bg-chart-1/10",
  coming_soon: "text-chart-4 border-chart-4/30 bg-chart-4/10",
  fully_funded: "text-muted-foreground border-border bg-muted/50",
  closed: "text-muted-foreground border-border bg-muted/50",
};

export default function AssetDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [buyOpen, setBuyOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [shares, setShares] = useState(1);

  const { data: asset, isLoading } = useGetAsset(id, {
    query: { enabled: !!id, queryKey: getGetAssetQueryKey(id) }
  });

  const { data: valuationHistory } = useGetAssetValuationHistory(id, {
    query: { enabled: !!id, queryKey: getGetAssetValuationHistoryQueryKey(id) }
  });

  const { data: summary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  const createTxMutation = useCreateTransaction();

  const handleTransaction = (type: "buy" | "sell") => {
    if (!user) { navigate("/login"); return; }
    createTxMutation.mutate({ data: { assetId: id, type, shares } }, {
      onSuccess: () => {
        toast({ title: type === "buy" ? "Shares purchased" : "Shares sold", description: `${shares} share${shares > 1 ? "s" : ""} of ${asset?.name} ${type === "buy" ? "purchased" : "sold"} successfully.` });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAssetQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey() });
        setBuyOpen(false);
        setSellOpen(false);
        setShares(1);
      },
      onError: (err: any) => {
        toast({ title: "Transaction failed", description: err?.error?.error ?? "An error occurred", variant: "destructive" });
      }
    });
  };

  const chartData = valuationHistory?.map(v => ({
    date: new Date(v.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: v.pricePerShare,
  })) ?? [];

  const soldOutPercent = asset ? ((asset.totalShares - asset.availableShares) / asset.totalShares) * 100 : 0;

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );

  if (!asset) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <AlertCircle className="h-12 w-12 text-muted-foreground" />
      <p className="text-muted-foreground">Asset not found</p>
      <Link href="/assets"><Button variant="outline">Browse assets</Button></Link>
    </div>
  );

  const totalCost = asset.pricePerShare * shares;

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/assets">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <ChevronLeft className="h-4 w-4" />
            All assets
          </Button>
        </Link>
        <Badge className={statusColors[asset.status]}>
          {asset.status.replace("_", " ")}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {asset.imageUrl && (
            <div className="aspect-video rounded-lg overflow-hidden border border-border">
              <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
            </div>
          )}

          <div>
            <h1 className="text-3xl font-bold tracking-tight">{asset.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground mt-2">
              <MapPin className="h-4 w-4" />
              <span>{asset.location}</span>
              <span className="text-border">•</span>
              <Building2 className="h-4 w-4" />
              <span>{asset.propertyType}</span>
            </div>
          </div>

          <Card className="bg-card">
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">About this property</CardTitle></CardHeader>
            <CardContent><p className="text-sm leading-relaxed">{asset.description}</p></CardContent>
          </Card>

          {chartData.length > 0 && (
            <Card className="bg-card">
              <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Price Per Share History</CardTitle></CardHeader>
              <CardContent className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(152 76% 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(152 76% 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 16%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }} tickFormatter={v => `$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(220 18% 10%)", border: "1px solid hsl(220 15% 16%)", borderRadius: "6px", fontSize: "12px" }}
                      formatter={(v: number) => [`$${v.toFixed(2)}`, "Price/Share"]}
                    />
                    <Area type="monotone" dataKey="value" stroke="hsl(152 76% 50%)" fill="url(#colorVal)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {(asset as any).highlights?.length > 0 && (
            <Card className="bg-card">
              <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Investment Highlights</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {((asset as any).highlights as string[]).map((h: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-chart-1 mt-0.5 shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="bg-card sticky top-4">
            <CardHeader><CardTitle className="text-base">Investment Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Price / Share</p>
                  <p className="font-mono font-bold text-lg">${asset.pricePerShare.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Expected Return</p>
                  <p className="font-mono font-bold text-lg text-chart-1">{asset.expectedReturn.toFixed(1)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Total Valuation</p>
                  <p className="font-mono font-semibold">${(asset.totalValuation / 1000000).toFixed(2)}M</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Available</p>
                  <p className="font-mono font-semibold">{asset.availableShares.toLocaleString()} shares</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Shares sold</span>
                  <span>{soldOutPercent.toFixed(1)}%</span>
                </div>
                <Progress value={soldOutPercent} className="h-1.5" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{(asset.totalShares - asset.availableShares).toLocaleString()} sold</span>
                  <span>{asset.totalShares.toLocaleString()} total</span>
                </div>
              </div>

              {asset.status === "active" && (
                <div className="space-y-2 pt-2">
                  <Button className="w-full" onClick={() => { setShares(1); setBuyOpen(true); }}>Buy Shares</Button>
                  <Button variant="outline" className="w-full" onClick={() => { setShares(1); setSellOpen(true); }}>Sell Shares</Button>
                </div>
              )}

              {user && (
                <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                  <p>Wallet: <span className="font-mono text-foreground">${summary?.walletBalance?.toLocaleString("en-US", { minimumFractionDigits: 2 }) ?? "—"}</span></p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Buy Modal */}
      <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Buy Shares — {asset.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4 justify-center">
              <Button variant="outline" size="icon" onClick={() => setShares(Math.max(1, shares - 1))}><Minus className="h-4 w-4" /></Button>
              <span className="font-mono text-3xl font-bold w-16 text-center">{shares}</span>
              <Button variant="outline" size="icon" onClick={() => setShares(Math.min(asset.availableShares, shares + 1))}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="text-center space-y-1">
              <p className="text-muted-foreground text-sm">{shares} share{shares > 1 ? "s" : ""} × ${asset.pricePerShare.toLocaleString()}</p>
              <p className="font-mono text-2xl font-bold text-chart-1">${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyOpen(false)}>Cancel</Button>
            <Button onClick={() => handleTransaction("buy")} disabled={createTxMutation.isPending}>
              {createTxMutation.isPending ? "Processing..." : `Buy ${shares} share${shares > 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sell Modal */}
      <Dialog open={sellOpen} onOpenChange={setSellOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Sell Shares — {asset.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4 justify-center">
              <Button variant="outline" size="icon" onClick={() => setShares(Math.max(1, shares - 1))}><Minus className="h-4 w-4" /></Button>
              <span className="font-mono text-3xl font-bold w-16 text-center">{shares}</span>
              <Button variant="outline" size="icon" onClick={() => setShares(shares + 1)}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="text-center space-y-1">
              <p className="text-muted-foreground text-sm">{shares} share{shares > 1 ? "s" : ""} × ${asset.pricePerShare.toLocaleString()}</p>
              <p className="font-mono text-2xl font-bold text-chart-2">${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSellOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleTransaction("sell")} disabled={createTxMutation.isPending}>
              {createTxMutation.isPending ? "Processing..." : `Sell ${shares} share${shares > 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
