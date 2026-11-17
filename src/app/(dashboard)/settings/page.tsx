import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm, SettingsForm, getSettings } from "@/features/settings";

export const metadata: Metadata = { title: "Settings" };

export default async function Page() {
  const settings = await getSettings();
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <PageHeader title="Settings" />
      <Card>
        <CardHeader>
          <CardTitle>Store settings</CardTitle>
          <CardDescription>Changes apply to the next order form a customer opens.</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm settings={settings} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
