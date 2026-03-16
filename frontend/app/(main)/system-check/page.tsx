import { SystemCheckView } from "@/components/dashboard/system-check-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Check | Super Admin",
  description: "Monitor platform infrastructure and service health",
};

export default function SystemCheckPage() {
  return <SystemCheckView />;
}
