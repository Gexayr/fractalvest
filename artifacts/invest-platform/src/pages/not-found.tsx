import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background gap-6">
      <AlertCircle className="h-12 w-12 text-muted-foreground" />
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold font-mono">404</h1>
        <p className="text-muted-foreground">Page not found</p>
      </div>
      <Link href="/"><Button variant="outline">Go home</Button></Link>
    </div>
  );
}
