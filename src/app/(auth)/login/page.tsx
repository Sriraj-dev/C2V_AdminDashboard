import type { Metadata } from "next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/features/auth";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { expired } = await searchParams;
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">C2V Vendor Login</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {expired === "1" && (
            <Alert>
              <AlertDescription>Your session ended. Log in again.</AlertDescription>
            </Alert>
          )}
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
