import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
  
  // Return null or a fallback link in case redirect doesn't happen client-side immediately
  return (
    <div className="flex items-center justify-center min-h-screen">
      <a href="/login" className="text-pink-500 hover:underline">
        Ir al Login
      </a>
    </div>
  );
}
