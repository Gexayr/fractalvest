import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Building2,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  X,
  ShoppingCart,
  Banknote,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DemoPortfolio {
  totalValue: number;
  cashBalance: number;
  lastUpdated: string;
}

interface DemoHoldings {
  [assetId: string]: { shares: number; avgPrice: number };
}

interface DemoTransaction {
  id: string;
  assetId: string;
  assetName: string;
  type: "buy" | "sell";
  shares: number;
  price: number;
  date: string;
}

interface DemoChartPoint {
  date: string;
  value: number;
}

interface DemoAsset {
  id: string;
  name: string;
  location: string;
  pricePerShare: number;
  yield: number;
  funded: number;
  image: string;
  type: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LS = {
  PORTFOLIO: "fv_demo_portfolio",
  HOLDINGS: "fv_demo_holdings",
  TRANSACTIONS: "fv_demo_transactions",
  CHART_DATA: "fv_demo_chart_data",
} as const;

const DEMO_ASSETS: DemoAsset[] = [
  {
    id: "demo-1",
    name: "Sunset Boulevard Apartments",
    location: "Los Angeles, CA",
    pricePerShare: 125.0,
    yield: 8.4,
    funded: 78,
    image: "https://picsum.photos/seed/apt1/400/250",
    type: "Residential",
  },
  {
    id: "demo-2",
    name: "Harbor View Office Complex",
    location: "San Francisco, CA",
    pricePerShare: 340.0,
    yield: 6.2,
    funded: 92,
    image: "https://picsum.photos/seed/office1/400/250",
    type: "Commercial",
  },
  {
    id: "demo-3",
    name: "Riverside Luxury Condos",
    location: "Miami, FL",
    pricePerShare: 89.5,
    yield: 9.1,
    funded: 45,
    image: "https://picsum.photos/seed/condo1/400/250",
    type: "Residential",
  },
  {
    id: "demo-4",
    name: "Downtown Retail Plaza",
    location: "New York, NY",
    pricePerShare: 215.0,
    yield: 7.8,
    funded: 63,
    image: "https://picsum.photos/seed/retail1/400/250",
    type: "Retail",
  },
];

const DEFAULT_HOLDINGS: DemoHoldings = {
  "demo-1": { shares: 10, avgPrice: 120.0 },
  "demo-2": { shares: 5, avgPrice: 330.0 },
};

const DEFAULT_CASH = 2450.0;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function generatePortfolioChartData(holdings: DemoHoldings): DemoChartPoint[] {
  const today = new Date();
  const points: DemoChartPoint[] = [];
  const baseValue = computeTotalValue(holdings, DEFAULT_CASH);

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    // slight random walk, trending slightly upward
    const noise = (Math.random() - 0.45) * 0.018;
    const trend = ((29 - i) / 29) * 0.04;
    const scalar = 1 - 0.04 + trend + noise;
    points.push({
      date: label,
      value: Math.round(baseValue * scalar * 100) / 100,
    });
  }
  // last point is always current
  points[points.length - 1].value = baseValue;
  return points;
}

function generateAssetPriceHistory(asset: DemoAsset): DemoChartPoint[] {
  const today = new Date();
  const points: DemoChartPoint[] = [];
  let price = asset.pricePerShare * 0.96;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    price = price * (1 + (Math.random() - 0.46) * 0.012);
    points.push({ date: label, value: Math.round(price * 100) / 100 });
  }
  points[points.length - 1].value = asset.pricePerShare;
  return points;
}

function computeTotalValue(holdings: DemoHoldings, cash: number): number {
  let invested = 0;
  for (const asset of DEMO_ASSETS) {
    const h = holdings[asset.id];
    if (h) invested += h.shares * asset.pricePerShare;
  }
  return Math.round((invested + cash) * 100) / 100;
}

function computeTotalReturnPct(holdings: DemoHoldings): number {
  let cost = 0;
  let current = 0;
  for (const asset of DEMO_ASSETS) {
    const h = holdings[asset.id];
    if (h) {
      cost += h.shares * h.avgPrice;
      current += h.shares * asset.pricePerShare;
    }
  }
  if (cost === 0) return 0;
  return Math.round(((current - cost) / cost) * 10000) / 100;
}

function activeHoldingsCount(holdings: DemoHoldings): number {
  return Object.values(holdings).filter((h) => h.shares > 0).length;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DemoBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="sticky top-0 z-40 bg-amber-500/10 border-b border-amber-500/30 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 text-amber-400 shrink-0">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-semibold">Demo Mode</span>
        </div>
        <p className="text-sm text-amber-300/80 flex-1">
          You're exploring a demo. Data is saved locally in your browser and never shared.
          Create an account to unlock real investments.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/register">
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold h-8 px-4 text-xs"
            >
              Create Free Account
            </Button>
          </Link>
          <button
            onClick={onDismiss}
            className="text-amber-400/60 hover:text-amber-400 transition-colors ml-1"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface TradeDialogProps {
  asset: DemoAsset | null;
  mode: "buy" | "sell";
  currentShares: number;
  cashBalance: number;
  open: boolean;
  onClose: () => void;
  onConfirm: (shares: number) => void;
}

function TradeDialog({
  asset,
  mode,
  currentShares,
  cashBalance,
  open,
  onClose,
  onConfirm,
}: TradeDialogProps) {
  const [qty, setQty] = useState("1");
  const shares = Math.max(0, parseInt(qty, 10) || 0);
  const total = asset ? shares * asset.pricePerShare : 0;
  const canAfford = mode === "buy" ? total <= cashBalance : shares <= currentShares;
  const isValid = shares > 0 && canAfford;

  useEffect(() => {
    if (open) setQty("1");
  }, [open]);

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm border-border bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "buy" ? (
              <ShoppingCart className="h-5 w-5 text-primary" />
            ) : (
              <Banknote className="h-5 w-5 text-chart-2" />
            )}
            {mode === "buy" ? "Buy Shares" : "Sell Shares"}
          </DialogTitle>
          <DialogDescription className="text-left">
            {asset.name}
            <span className="block text-xs text-muted-foreground mt-0.5">{asset.location}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between text-sm text-muted-foreground border border-border bg-card p-3 rounded-sm">
            <span>Price / share</span>
            <span className="font-mono font-semibold text-foreground">
              ${asset.pricePerShare.toFixed(2)}
            </span>
          </div>

          {mode === "sell" && (
            <div className="flex justify-between text-sm text-muted-foreground border border-border bg-card p-3 rounded-sm">
              <span>Shares owned</span>
              <span className="font-mono font-semibold text-foreground">{currentShares}</span>
            </div>
          )}

          {mode === "buy" && (
            <div className="flex justify-between text-sm text-muted-foreground border border-border bg-card p-3 rounded-sm">
              <span>Cash available</span>
              <span className="font-mono font-semibold text-foreground">
                ${cashBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Number of shares</label>
            <input
              type="number"
              min={1}
              max={mode === "sell" ? currentShares : undefined}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full h-10 rounded-sm border border-border bg-card px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex justify-between text-sm font-semibold border-t border-border pt-3">
            <span>Total</span>
            <span
              className={`font-mono ${!canAfford && shares > 0 ? "text-chart-2" : "text-foreground"}`}
            >
              ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {!canAfford && shares > 0 && (
            <p className="text-xs text-chart-2">
              {mode === "buy"
                ? "Insufficient cash balance."
                : `You only own ${currentShares} share${currentShares !== 1 ? "s" : ""}.`}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!isValid}
            onClick={() => onConfirm(shares)}
            className={
              mode === "sell"
                ? "bg-chart-2 hover:bg-chart-2/90 text-white"
                : ""
            }
          >
            {mode === "buy" ? "Confirm Purchase" : "Confirm Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AssetCardProps {
  asset: DemoAsset;
  holding: { shares: number; avgPrice: number } | undefined;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onBuy: (asset: DemoAsset) => void;
  onSell: (asset: DemoAsset) => void;
}

function AssetCard({ asset, holding, selectedId, onSelect, onBuy, onSell }: AssetCardProps) {
  const isOwned = !!holding && holding.shares > 0;
  const isSelected = selectedId === asset.id;
  const currentValue = isOwned ? holding!.shares * asset.pricePerShare : 0;
  const pnl = isOwned ? currentValue - holding!.shares * holding!.avgPrice : 0;
  const pnlPct = isOwned ? (pnl / (holding!.shares * holding!.avgPrice)) * 100 : 0;
  const pnlPositive = pnl >= 0;

  return (
    <Card
      className={`bg-card overflow-hidden transition-all duration-200 cursor-pointer ${
        isSelected ? "border-primary/60 ring-1 ring-primary/30" : "hover:border-primary/30"
      }`}
      onClick={() => onSelect(asset.id)}
    >
      <div className="h-44 relative overflow-hidden bg-muted">
        <img
          src={asset.image}
          alt={asset.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
        <div className="absolute top-2.5 right-2.5 flex gap-1.5">
          <Badge className="bg-background/85 text-foreground backdrop-blur-sm border-border text-xs hover:bg-background">
            {asset.type}
          </Badge>
          {isOwned && (
            <Badge className="bg-primary/20 text-primary border-primary/40 backdrop-blur-sm text-xs hover:bg-primary/20">
              Owned
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-sm leading-tight line-clamp-1">{asset.name}</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <MapPin className="h-3 w-3" />
            {asset.location}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
              Price / Share
            </p>
            <p className="font-mono text-sm font-semibold">${asset.pricePerShare.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
              Yield
            </p>
            <p className="font-mono text-sm font-semibold text-chart-1">{asset.yield}%</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Funded</span>
            <span>{asset.funded}%</span>
          </div>
          <Progress value={asset.funded} className="h-1.5" />
        </div>

        {isOwned && (
          <div className="border border-border bg-background/50 rounded-sm p-2.5 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{holding!.shares} shares owned</span>
              <span className="font-mono font-semibold text-foreground">
                ${currentValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div
              className={`flex items-center gap-1 text-xs font-mono ${
                pnlPositive ? "text-chart-1" : "text-chart-2"
              }`}
            >
              {pnlPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {pnlPositive ? "+" : ""}${pnl.toFixed(2)} ({pnlPositive ? "+" : ""}
              {pnlPct.toFixed(2)}%)
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-0.5" onClick={(e) => e.stopPropagation()}>
          {isOwned ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => onBuy(asset)}
              >
                Buy More
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs border-chart-2/40 text-chart-2 hover:bg-chart-2/10 hover:text-chart-2"
                onClick={() => onSell(asset)}
              >
                Sell
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="w-full h-8 text-xs"
              onClick={() => onBuy(asset)}
            >
              <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
              Buy Shares
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [bannerVisible, setBannerVisible] = useState(true);

  const [holdings, setHoldings] = useState<DemoHoldings>(() =>
    lsGet<DemoHoldings>(LS.HOLDINGS, DEFAULT_HOLDINGS)
  );

  const [cashBalance, setCashBalance] = useState<number>(() => {
    const p = lsGet<DemoPortfolio | null>(LS.PORTFOLIO, null);
    return p ? p.cashBalance : DEFAULT_CASH;
  });

  const [transactions, setTransactions] = useState<DemoTransaction[]>(() =>
    lsGet<DemoTransaction[]>(LS.TRANSACTIONS, [])
  );

  const [chartData, setChartData] = useState<DemoChartPoint[]>(() => {
    const stored = lsGet<DemoChartPoint[]>(LS.CHART_DATA, []);
    if (stored.length > 0) return stored;
    const generated = generatePortfolioChartData(
      lsGet<DemoHoldings>(LS.HOLDINGS, DEFAULT_HOLDINGS)
    );
    lsSet(LS.CHART_DATA, generated);
    return generated;
  });

  const [selectedAssetId, setSelectedAssetId] = useState<string | null>("demo-1");
  const [assetChartCache, setAssetChartCache] = useState<Record<string, DemoChartPoint[]>>({});

  const [tradeDialog, setTradeDialog] = useState<{
    asset: DemoAsset | null;
    mode: "buy" | "sell";
  }>({ asset: null, mode: "buy" });

  // Persist holdings & portfolio whenever they change
  useEffect(() => {
    const totalValue = computeTotalValue(holdings, cashBalance);
    lsSet<DemoPortfolio>(LS.PORTFOLIO, {
      totalValue,
      cashBalance,
      lastUpdated: new Date().toISOString(),
    });
    lsSet(LS.HOLDINGS, holdings);
  }, [holdings, cashBalance]);

  useEffect(() => {
    lsSet(LS.TRANSACTIONS, transactions);
  }, [transactions]);

  // Lazy-generate asset price histories
  const getAssetChart = useCallback(
    (id: string) => {
      if (assetChartCache[id]) return assetChartCache[id];
      const asset = DEMO_ASSETS.find((a) => a.id === id);
      if (!asset) return [];
      const data = generateAssetPriceHistory(asset);
      setAssetChartCache((prev) => ({ ...prev, [id]: data }));
      return data;
    },
    [assetChartCache]
  );

  const selectedAsset = DEMO_ASSETS.find((a) => a.id === selectedAssetId) ?? null;
  const selectedAssetChart = selectedAssetId ? getAssetChart(selectedAssetId) : [];

  const totalValue = computeTotalValue(holdings, cashBalance);
  const returnPct = computeTotalReturnPct(holdings);
  const returnPositive = returnPct >= 0;

  const handleSelectAsset = (id: string) => {
    setSelectedAssetId((prev) => (prev === id ? null : id));
  };

  const handleOpenBuy = (asset: DemoAsset) =>
    setTradeDialog({ asset, mode: "buy" });

  const handleOpenSell = (asset: DemoAsset) =>
    setTradeDialog({ asset, mode: "sell" });

  const handleCloseDialog = () =>
    setTradeDialog({ asset: null, mode: "buy" });

  const handleConfirmTrade = (shares: number) => {
    const { asset, mode } = tradeDialog;
    if (!asset || shares <= 0) return;

    const total = shares * asset.pricePerShare;

    if (mode === "buy") {
      if (total > cashBalance) return;

      const prev = holdings[asset.id];
      const prevShares = prev?.shares ?? 0;
      const prevAvg = prev?.avgPrice ?? 0;
      const newShares = prevShares + shares;
      const newAvg =
        prevShares > 0
          ? (prevShares * prevAvg + shares * asset.pricePerShare) / newShares
          : asset.pricePerShare;

      setHoldings((h) => ({
        ...h,
        [asset.id]: { shares: newShares, avgPrice: Math.round(newAvg * 100) / 100 },
      }));
      setCashBalance((b) => Math.round((b - total) * 100) / 100);
    } else {
      const owned = holdings[asset.id]?.shares ?? 0;
      if (shares > owned) return;

      const remaining = owned - shares;
      setHoldings((h) => {
        const next = { ...h };
        if (remaining === 0) {
          delete next[asset.id];
        } else {
          next[asset.id] = { ...next[asset.id], shares: remaining };
        }
        return next;
      });
      setCashBalance((b) => Math.round((b + total) * 100) / 100);
    }

    const tx: DemoTransaction = {
      id: `tx-${Date.now()}`,
      assetId: asset.id,
      assetName: asset.name,
      type: mode,
      shares,
      price: asset.pricePerShare,
      date: new Date().toISOString(),
    };

    setTransactions((prev) => [tx, ...prev].slice(0, 50));

    // Regenerate portfolio chart to reflect new balance
    setChartData(() => {
      const newHoldings =
        mode === "buy"
          ? {
              ...holdings,
              [asset.id]: {
                shares: (holdings[asset.id]?.shares ?? 0) + shares,
                avgPrice:
                  holdings[asset.id]?.shares
                    ? (holdings[asset.id].shares * holdings[asset.id].avgPrice +
                        shares * asset.pricePerShare) /
                      ((holdings[asset.id]?.shares ?? 0) + shares)
                    : asset.pricePerShare,
              },
            }
          : { ...holdings };
      const generated = generatePortfolioChartData(newHoldings);
      lsSet(LS.CHART_DATA, generated);
      return generated;
    });

    handleCloseDialog();

    toast({
      title:
        mode === "buy"
          ? `Purchased ${shares} share${shares !== 1 ? "s" : ""}`
          : `Sold ${shares} share${shares !== 1 ? "s" : ""}`,
      description: (
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          {asset.name} — ${total.toFixed(2)} {mode === "buy" ? "debited" : "credited"}
        </span>
      ),
    });
  };

  const activeHoldings = activeHoldingsCount(holdings);
  const recentTx = transactions.slice(0, 5);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky demo banner */}
      <AnimatePresence>
        {bannerVisible && <DemoBanner onDismiss={() => setBannerVisible(false)} />}
      </AnimatePresence>

      {/* Page header */}
      <header className="border-b border-border px-4 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary cursor-pointer">
            <div className="w-7 h-7 bg-primary text-primary-foreground flex items-center justify-center font-mono text-xs">
              FV
            </div>
            FractionalVest
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-xs hidden sm:flex">
            Demo Mode
          </Badge>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-sm">
              Log in
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="text-sm">
              Create Account
            </Button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-8 space-y-8">
        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" />
            Demo Portfolio
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Explore trading and portfolio tracking. All actions stay local — nothing is real.
          </p>
        </motion.div>

        {/* ── Stats Row ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Portfolio Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <div
                className={`text-sm mt-1 flex items-center gap-0.5 ${
                  returnPositive ? "text-chart-1" : "text-chart-2"
                }`}
              >
                {returnPositive ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {Math.abs(returnPct).toFixed(2)}% all time
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Return
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold font-mono ${
                  returnPositive ? "text-chart-1" : "text-chart-2"
                }`}
              >
                {returnPositive ? "+" : ""}
                {returnPct.toFixed(2)}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">Unrealized gain/loss</div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Cash Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                ${cashBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Available to invest</div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Active Holdings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{activeHoldings}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {activeHoldings === 1 ? "Property" : "Properties"}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Portfolio Chart ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Portfolio Performance — 30 Days
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="demoPortfolioGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(152 76% 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(152 76% 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 16%)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(220 10% 55%)" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      `$${v.toLocaleString("en-US", { minimumFractionDigits: 0 })}`
                    }
                    width={72}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(220 18% 10%)",
                      border: "1px solid hsl(220 15% 16%)",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                    formatter={(v: number) => [
                      `$${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                      "Portfolio Value",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(152 76% 50%)"
                    fill="url(#demoPortfolioGradient)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Assets Grid + Asset Price Chart ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Available Properties</h2>
            <p className="text-xs text-muted-foreground">
              Click a card to view price history
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {DEMO_ASSETS.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                holding={holdings[asset.id]}
                selectedId={selectedAssetId}
                onSelect={handleSelectAsset}
                onBuy={handleOpenBuy}
                onSell={handleOpenSell}
              />
            ))}
          </div>

          {/* Asset mini-chart */}
          <AnimatePresence mode="wait">
            {selectedAsset && (
              <motion.div
                key={selectedAsset.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
              >
                <Card className="bg-card border-primary/20">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        {selectedAsset.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {selectedAsset.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">7-Day Price</p>
                      <p className="font-mono font-bold text-sm">
                        ${selectedAsset.pricePerShare.toFixed(2)}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedAssetChart}>
                        <defs>
                          <linearGradient
                            id="demoAssetGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="hsl(217 91% 60%)"
                              stopOpacity={0.25}
                            />
                            <stop
                              offset="95%"
                              stopColor="hsl(217 91% 60%)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 16%)" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "hsl(220 10% 55%)" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "hsl(220 10% 55%)" }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `$${v.toFixed(0)}`}
                          width={52}
                          domain={["auto", "auto"]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(220 18% 10%)",
                            border: "1px solid hsl(220 15% 16%)",
                            borderRadius: "6px",
                            fontSize: "11px",
                          }}
                          formatter={(v: number) => [
                            `$${v.toFixed(2)}`,
                            "Price / Share",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="hsl(217 91% 60%)"
                          fill="url(#demoAssetGradient)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Activity Feed ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTx.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Activity className="h-8 w-8 opacity-30" />
                  <p className="text-sm">No transactions yet.</p>
                  <p className="text-xs">Buy or sell shares above to see activity here.</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {recentTx.map((tx, i) => {
                    const isBuy = tx.type === "buy";
                    const total = tx.shares * tx.price;
                    return (
                      <div
                        key={tx.id}
                        className={`flex items-center justify-between py-3.5 ${
                          i < recentTx.length - 1 ? "border-b border-border" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${
                              isBuy
                                ? "bg-primary/10 text-primary"
                                : "bg-chart-2/10 text-chart-2"
                            }`}
                          >
                            {isBuy ? (
                              <ShoppingCart className="h-4 w-4" />
                            ) : (
                              <Banknote className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium capitalize">
                              {tx.type} — {tx.assetName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {tx.shares} share{tx.shares !== 1 ? "s" : ""} @{" "}
                              ${tx.price.toFixed(2)} ·{" "}
                              {new Date(tx.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`font-mono text-sm font-semibold ${
                            isBuy ? "text-chart-2" : "text-chart-1"
                          }`}
                        >
                          {isBuy ? "-" : "+"}$
                          {total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Register CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <div className="border border-primary/20 bg-primary/5 rounded-sm p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-lg font-bold">Ready to invest for real?</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Create a free account to access live properties, real returns, and a fully
                managed portfolio.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  Back to Home
                </Button>
              </Link>
              <Link href="/register">
                <Button size="default" className="px-6">
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 lg:px-8 mt-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2 font-bold tracking-tight text-primary text-sm">
            <div className="w-5 h-5 bg-primary text-primary-foreground flex items-center justify-center font-mono text-[9px]">
              FV
            </div>
            FractionalVest
          </div>
          <p className="text-xs text-muted-foreground">
            This is a demo environment. No real money or investments are involved.
          </p>
        </div>
      </footer>

      {/* Trade Dialog */}
      <TradeDialog
        asset={tradeDialog.asset}
        mode={tradeDialog.mode}
        currentShares={
          tradeDialog.asset ? (holdings[tradeDialog.asset.id]?.shares ?? 0) : 0
        }
        cashBalance={cashBalance}
        open={!!tradeDialog.asset}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmTrade}
      />
    </div>
  );
}
