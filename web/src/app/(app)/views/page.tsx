import { redirect } from "next/navigation";

// Views are now folded into /projects as the view switcher. Keep this path
// alive so old links land on the merged browse screen.
export default function ViewsIndexRedirect() {
  redirect("/projects");
}
