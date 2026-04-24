import { useState } from "react";
import { useListAssets, useCreateAsset, getListAssetsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Building2 } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "text-chart-1 border-chart-1/30 bg-chart-1/10",
  coming_soon: "text-chart-4 border-chart-4/30 bg-chart-4/10",
  fully_funded: "text-chart-2 border-chart-2/30 bg-chart-2/10",
  closed: "text-muted-foreground border-border bg-muted/30",
};

const emptyForm = {
  name: "",
  description: "",
  location: "",
  propertyType: "",
  totalShares: "",
  pricePerShare: "",
  expectedReturn: "",
  imageUrl: "",
};

export default function AdminPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: assets, isLoading } = useListAssets({}, {
    query: { queryKey: getListAssetsQueryKey({}) },
  });

  const createAssetMutation = useCreateAsset();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleField = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleCreate = () => {
    if (!form.name || !form.description || !form.location || !form.propertyType ||
        !form.totalShares || !form.pricePerShare || !form.expectedReturn) {
      toast({ title: "Validation error", description: "All required fields must be filled.", variant: "destructive" });
      return;
    }
    createAssetMutation.mutate({
      name: form.name,
      description: form.description,
      location: form.location,
      propertyType: form.propertyType,
      totalShares: parseInt(form.totalShares),
      pricePerShare: parseFloat(form.pricePerShare),
      expectedReturn: parseFloat(form.expectedReturn),
      imageUrl: form.imageUrl || undefined,
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey({}) });
        setDialogOpen(false);
        setForm(emptyForm);
        toast({ title: "Asset created", description: `"${form.name}" has been added.` });
      },
      onError: () => toast({ title: "Error", description: "Failed to create asset.", variant: "destructive" }),
    });
  };

  const handleDelete = async (id: string, name: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/assets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey({}) });
      toast({ title: "Asset deleted", description: `"${name}" has been removed.` });
    } catch {
      toast({ title: "Error", description: "Failed to delete asset.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin — Asset Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage investment assets available on the platform.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Asset
        </Button>
      </div>

      {isLoading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <Loader2 className="animate-spin text-muted-foreground h-8 w-8" />
        </div>
      ) : !assets?.length ? (
        <Card className="bg-card">
          <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
            <Building2 className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">No assets yet. Add your first one.</p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Add Asset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base font-medium">All Assets ({assets.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Location</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price/Share</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Shares Left</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Yield</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {assets.map(asset => (
                    <tr key={asset.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-medium">{asset.name}</td>
                      <td className="px-4 py-4 text-muted-foreground">{asset.propertyType}</td>
                      <td className="px-4 py-4 text-muted-foreground">{asset.location}</td>
                      <td className="px-4 py-4 text-right font-mono">${asset.pricePerShare.toLocaleString()}</td>
                      <td className="px-4 py-4 text-right font-mono">{asset.availableShares.toLocaleString()}</td>
                      <td className="px-4 py-4 text-right font-mono text-chart-1">{asset.expectedReturn}%</td>
                      <td className="px-4 py-4 text-center">
                        <Badge className={statusColors[asset.status] ?? ""}>
                          {asset.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(asset.id, asset.name)}
                          disabled={deletingId === asset.id}
                        >
                          {deletingId === asset.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="a-name">Name *</Label>
              <Input id="a-name" value={form.name} onChange={handleField("name")} placeholder="Sunset Tower Residences" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-desc">Description *</Label>
              <textarea
                id="a-desc"
                value={form.description}
                onChange={handleField("description")}
                placeholder="Brief property description..."
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="a-loc">Location *</Label>
                <Input id="a-loc" value={form.location} onChange={handleField("location")} placeholder="Miami, FL" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-type">Property Type *</Label>
                <Input id="a-type" value={form.propertyType} onChange={handleField("propertyType")} placeholder="Residential" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="a-shares">Total Shares *</Label>
                <Input id="a-shares" type="number" min="1" value={form.totalShares} onChange={handleField("totalShares")} placeholder="10000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-price">Price / Share *</Label>
                <Input id="a-price" type="number" min="0.01" step="0.01" value={form.pricePerShare} onChange={handleField("pricePerShare")} placeholder="50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-yield">Expected Yield % *</Label>
                <Input id="a-yield" type="number" min="0" step="0.1" value={form.expectedReturn} onChange={handleField("expectedReturn")} placeholder="8.2" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-img">Image URL (optional)</Label>
              <Input id="a-img" value={form.imageUrl} onChange={handleField("imageUrl")} placeholder="https://..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createAssetMutation.isPending} className="gap-2">
              {createAssetMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
