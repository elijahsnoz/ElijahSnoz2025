import { redirect } from "next/navigation";

// This app is only ever visited through elijahsnoz.me/ar or /art (see
// ../vercel.json rewrites). Its own deployment root just redirects there.
export default function RootRedirect() {
  redirect("/ar");
}
