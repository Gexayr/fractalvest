import { useAuth } from "@/lib/auth";
import { useListTransactions } from "@workspace/api-client-react";
import { getListTransactionsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react";

const statusColors: Record<string, string> = {
  completed: "text-chart-1 border-chart-1/30 bg-chart-1/10",
  pending: "text-chart-4 border-chart-4/30 bg-chart-4/10",
  failed: "text-chart-2 border-chart-2/30 bg-chart-2/10",
  cancelled: "text-muted-foreground border-border bg-muted/50",
};

export default function Transactions() {
  const { user } = useAuth();

  const { data: transactions, isLoading } = useListTransactions(
    { userId: user?.id, limit: 50 },
    { query: { enabled: !!user?.id, queryKey: getListTransactionsQueryKey({ userId: user?.id, limit: 50 }) } }
  );

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16" />)}
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground mt-1">Complete history of all your investment activity.</p>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {transactions?.length ?? 0} transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactions?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Clock className="h-10 w-10" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transactions?.map(tx => (
                <div key={tx.id} className="px-6 py-4 flex items-center gap-4 hover:bg-accent/30 transition-colors">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${tx.type === "buy" ? "bg-chart-1/15 text-chart-1" : "bg-chart-2/15 text-chart-2"}`}>
                    {tx.type === "buy" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{tx.assetName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tx.type === "buy" ? "Bought" : "Sold"} {tx.shares} share{tx.shares > 1 ? "s" : ""} at ${tx.pricePerShare.toFixed(2)}/sh
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-mono font-bold ${tx.type === "buy" ? "text-chart-2" : "text-chart-1"}`}>
                      {tx.type === "buy" ? "-" : "+"}${tx.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <Badge className={`shrink-0 hidden sm:flex ${statusColors[tx.status]}`}>
                    {tx.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
