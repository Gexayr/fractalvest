import { useAuth } from "@/lib/auth";
import { useGetDashboardSummary, useGetRecentActivity, usePortfolioPerformanceHistory } from "@workspace/api-client-react";
import { getGetDashboardSummaryQueryKey, getGetRecentActivityQueryKey, getPortfolioPerformanceHistoryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });
  
  const { data: activity, isLoading: isLoadingActivity } = useGetRecentActivity({ limit: 5 }, {
    query: { queryKey: getGetRecentActivityQueryKey({ limit: 5 }) }
  });
  
  const { data: performance, isLoading: isLoadingPerf } = usePortfolioPerformanceHistory(user?.id || "", { period: "1m" }, {
    query: { enabled: !!user?.id, queryKey: getPortfolioPerformanceHistoryQueryKey(user?.id || "", { period: "1m" }) }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">Your portfolio snapshot and recent market activity.</p>
      </div>
      
      {isLoadingSummary ? (
        <div className="h-32 flex items-center justify-center border border-border bg-card"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">${summary.portfolioValue.toLocaleString()}</div>
              <div className={`text-sm mt-1 flex items-center ${summary.totalReturnPercent >= 0 ? "text-chart-1" : "text-chart-2"}`}>
                {summary.totalReturnPercent >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                {Math.abs(summary.totalReturnPercent).toFixed(2)}% All time
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Return</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">${summary.totalReturn.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mt-1">Realized & unrealized</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cash Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">${summary.walletBalance.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mt-1">Available to invest</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">{summary.activeHoldings}</div>
              <div className="text-sm text-muted-foreground mt-1">Properties</div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="col-span-1 lg:col-span-2 bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Performance (1M)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPerf ? (
              <div className="h-[300px] flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : performance && performance.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performance}>
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }}
                      itemStyle={{ color: 'hsl(var(--chart-1))' }}
                    />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">No performance data available.</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5" /> Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingActivity ? (
              <div className="h-32 flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : activity && activity.length > 0 ? (
              <div className="space-y-4">
                {activity.map((item) => (
                  <div key={item.id} className="flex justify-between items-center pb-4 border-b border-border last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium text-sm capitalize">{item.type} {item.assetName && `- ${item.assetName}`}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{new Date(item.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right font-mono text-sm">
                      <div className={item.type === 'buy' || item.type === 'withdrawal' ? 'text-chart-2' : 'text-chart-1'}>
                        {item.type === 'buy' || item.type === 'withdrawal' ? '-' : '+'}${item.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">No recent activity.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}