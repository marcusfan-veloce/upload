'use client'
import UploadLinkManager from "@/components/UploadLinkManager";
import FolderSelector from "@/components/FolderSelector";
import AuthDebug from "@/components/AuthDebug";
import TokenStatus from "@/components/TokenStatus";
import { supabase } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Dashboard() {

  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="bg-gradient-to-b from-background to-background/50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold mb-8">Welcome to your Dashboard</h1>
            <Button variant="destructive" onClick={() => {handleSignOut()}}>
              Sign Out
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <UploadLinkManager />
            <FolderSelector />
          </div>

          <div className="mb-8">
            <TokenStatus />
          </div>
        </div>
      </div>
    </div>
  );
}