import { redirect } from "next/navigation";

// A named view now lives at /projects?view=KEY. Preserve old deep links.
export default async function ViewRedirect({
  params,
}: {
  params: Promise<{ view: string }>;
}) {
  const { view } = await params;
  redirect(`/projects?view=${encodeURIComponent(view)}`);
}
