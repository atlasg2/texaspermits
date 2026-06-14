import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const devNoAuth = process.env.DEV_NO_AUTH === "true";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user && !devNoAuth) redirect("/login");
  const email = user?.email ?? "dev preview";

  return <AppShell email={email}>{children}</AppShell>;
}
