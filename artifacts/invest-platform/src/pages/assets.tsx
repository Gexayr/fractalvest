import { useState } from "react";
import { Link } from "wouter";
import { useListAssets, getListAssetsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin } from "lucide-react";

export default function Assets() {
  const { data: assets, isLoading } = useListAssets({}, {
    query: { queryKey: getListAssetsQueryKey({}) }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Investments</h1>
        <p className="text-muted-foreground mt-1">Browse available fractional real estate properties.</p>
      </div>

      {isLoading ? (
        <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground h-8 w-8" /></div>
      ) : assets && assets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map(asset => (
            <Link key={asset.id} href={`/assets/${asset.id}`}>
              <Card className="bg-card hover:border-primary/50 transition-colors overflow-hidden group cursor-pointer h-full flex flex-col">
                <div className="h-48 relative overflow-hidden bg-muted">
                  {asset.imageUrl ? (
                    <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                  )}
                  <Badge className="absolute top-3 right-3 bg-background/90 text-foreground backdrop-blur-sm border-border hover:bg-background">
                    {asset.status.replace("_", " ")}
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg leading-tight line-clamp-1">{asset.name}</h3>
                      <div className="flex items-center text-muted-foreground text-sm mt-1">
                        <MapPin className="h-3 w-3 mr-1" /> {asset.location}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                  <div className="grid grid-cols-2 gap-4 mt-4 mb-6">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Price / Share</div>
                      <div className="font-mono text-lg">${asset.pricePerShare.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Expected Yield</div>
                      <div className="font-mono text-lg text-chart-1">{asset.expectedReturn}%</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Funded</span>
                      <span>{Math.round(((asset.totalShares - asset.availableShares) / asset.totalShares) * 100)}%</span>
                    </div>
                    <Progress value={((asset.totalShares - asset.availableShares) / asset.totalShares) * 100} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-muted-foreground">No assets found.</div>
      )}
    </div>
  );
}