import ClientUpload from "@/components/ClientUpload";

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function UploadPage({ params }: PageProps) {
  const { token } = await params;

  return (
    <div className="bg-gradient-to-b from-background to-background/50 min-h-screen">
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h1 className="text-4xl font-bold mb-8">Upload Video</h1>
        <ClientUpload token={token} />
      </div>
    </div>
  );
}
