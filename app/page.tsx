import Image from "next/image";
import Auth from "@/components/Auth";
import FileUpload from "@/components/FileUpload";

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-background to-background/50 h-full">
      <nav>
        <div className="flex justify-between items-center box-border p-4">
          <span>Physio Video Upload</span>
          <Auth />
        </div>
      </nav>
      <div className="flex flex-col items-center justify-center h-auto">
        <h1 className="text-4xl font-bold mb-8">Upload your video</h1>
        <FileUpload />
      </div>
    </div>
  );
}
