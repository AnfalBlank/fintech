import { CourierShell } from "@/components/courier/courier-shell";

export default function CourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CourierShell>{children}</CourierShell>;
}
