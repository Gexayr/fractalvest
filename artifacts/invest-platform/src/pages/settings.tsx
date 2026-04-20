import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useUpdateUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, ShieldAlert, User, Wallet, LogOut } from "lucide-react";

const kycColors: Record<string, string> = {
  approved: "text-chart-1 border-chart-1/30 bg-chart-1/10",
  pending: "text-chart-4 border-chart-4/30 bg-chart-4/10",
  rejected: "text-chart-2 border-chart-2/30 bg-chart-2/10",
};

export default function Settings() {
  const { user, logout, login } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateUserMutation = useUpdateUser();

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");

  const handleSave = () => {
    if (!user) return;
    updateUserMutation.mutate({ id: user.id, data: { firstName, lastName } }, {
      onSuccess: (updated) => {
        login(localStorage.getItem("fv_token") ?? "", updated);
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Profile updated", description: "Your changes have been saved." });
      },
      onError: () => toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" })
    });
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      {/* Profile */}
      <Card className="bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Profile</CardTitle>
          </div>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled className="opacity-60" />
          </div>
          <Button onClick={handleSave} disabled={updateUserMutation.isPending}>
            {updateUserMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </CardContent>
      </Card>

      {/* KYC */}
      <Card className="bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Identity Verification</CardTitle>
          </div>
          <CardDescription>KYC status required for investments</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm">Verification status</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {user?.kycStatus === "approved" ? "Your identity has been verified" :
               user?.kycStatus === "pending" ? "Verification in progress" :
               "Verification required"}
            </p>
          </div>
          <Badge className={kycColors[user?.kycStatus ?? "pending"]}>
            {user?.kycStatus}
          </Badge>
        </CardContent>
      </Card>

      {/* Wallet */}
      <Card className="bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Wallet</CardTitle>
          </div>
          <CardDescription>Your available cash balance</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-3xl font-bold text-chart-1">
            ${(user?.walletBalance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Available for investment</p>
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="bg-card border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sign out</p>
              <p className="text-xs text-muted-foreground">Log out of your account</p>
            </div>
            <Button variant="destructive" size="sm" onClick={logout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
