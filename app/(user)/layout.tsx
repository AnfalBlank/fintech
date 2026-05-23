import { UserAppShell } from "@/components/user/app-shell";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UserAppShell>{children}</UserAppShell>;
}
