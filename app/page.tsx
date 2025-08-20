'use client'
import Auth from "@/components/Auth";
import { getCurrentUser, supabase } from "@/lib/auth";
import { useEffect, useState } from "react";

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    getCurrentUser().then(user => {
      setUser(user)
      setLoading(false)
    })
  }, [])

  return (
    <div className="bg-gradient-to-b from-background to-background/50 h-full justify-center items-center flex">
      {user ?

        <div className="flex flex-col justify-center items-center box-border p-4 space-y-2 font-[Rubik]">
          <span className="font-semibold text-4xl">GMA Video Upload</span>
          <span>Welcome back, {user.raw_user_meta_data?.full_name || user.raw_user_meta_data?.name}!</span>
          <Auth />
        </div>

      :

        <div className="flex flex-col justify-center items-center box-border p-4 space-y-2 font-[Rubik]">
          <span className="font-semibold text-4xl">GMA Video Upload</span>
          <span className="text-xl">Setup a quick personal upload link in a few clicks!</span>
          <span className="text-xl">To begin, press the button below.</span>
          <Auth />
        </div>

      }
    </div>
  );
}
