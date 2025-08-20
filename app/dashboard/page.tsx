'use client'
import Auth from "@/components/Auth";
import UploadLinkManager from "@/components/UploadLinkManager";
import FolderSelector from "@/components/FolderSelector";
import AuthDebug from "@/components/AuthDebug";

export default function Dashboard() {
  return (
    <div className="bg-gradient-to-b from-background to-background/50 min-h-screen">
      <nav>
        <div className="flex justify-between items-center box-border p-4">
          <span className="text-xl font-semibold">Physio Video Dashboard</span>
          <Auth />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Welcome to your Dashboard</h1>

          <AuthDebug />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <UploadLinkManager />
            <FolderSelector />
          </div>
        </div>
      </div>
    </div>
  );
}