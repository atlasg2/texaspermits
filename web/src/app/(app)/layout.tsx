import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const devNoAuth =
    process.env.DEV_NO_AUTH === "true" &&
    process.env.NODE_ENV !== "production";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user && !devNoAuth) redirect("/login");

  return (
    <AppShell email={user?.email ?? "dev preview"}>{children}</AppShell>
  );
}
