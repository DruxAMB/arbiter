import { Dashboard } from "@/components/dashboard"
import { Landing } from "@/components/landing"
import { AppShell } from "@/components/app-shell"

export default function Home() {
  return <AppShell landing={<Landing />} dashboard={<Dashboard />} />
}

