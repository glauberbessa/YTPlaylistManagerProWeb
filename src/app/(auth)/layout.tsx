import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session) {
    redirect("/playlists");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      {children}
    </div>
  );
}
