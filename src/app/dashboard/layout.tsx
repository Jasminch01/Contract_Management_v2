"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import MobileAppBar from "@/components/MobileAppBar";
import { useUser } from "@clerk/nextjs";
import { userLogin } from "@/api/Auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoaded } = useUser();
  const [authState, setAuthState] = useState<
    "idle" | "authenticating" | "success" | "error"
  >("idle");
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const userEmail = user?.primaryEmailAddress?.emailAddress as string;
  const userId = user?.id as string;

  useEffect(() => {
    // Reset auth state when user changes
    if (!isLoaded || !user || !userEmail || !userId) {
      setAuthState("idle");
      setRetryCount(0);
      return;
    }

    // Don't re-authenticate if already successful
    if (authState === "success") return;

    // Don't start multiple authentication attempts
    if (authState === "authenticating") return;

    const authenticateWithBackend = async () => {
      setAuthState("authenticating");

      try {
        // console.log("Starting backend authentication...");

        // Add a small delay to ensure Clerk session is fully established
        await new Promise((resolve) => setTimeout(resolve, 500));

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const res = await userLogin(userEmail, userId);
        // console.log("Backend authentication successful:", res);

        setAuthState("success");
        setRetryCount(0);
      } catch (error) {
        console.error("Backend authentication failed:", error);
        setAuthState("error");

        // Retry logic with exponential backoff
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          // console.log(
          //   `Retrying in ${delay}ms... (attempt ${
          //     retryCount + 1
          //   }/${maxRetries})`
          // );

          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
            setAuthState("idle"); // This will trigger another attempt
          }, delay);
        } else {
          // console.error("Max retries reached. Authentication failed.");
          // Optionally redirect to login or show error message
          // window.location.href = "/auth/login";
        }
      }
    };

    authenticateWithBackend();
  }, [isLoaded, user, userEmail, userId, authState, retryCount]);

  // Show loading states
  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3">Loading user...</span>
      </div>
    );
  }

  // If no user after Clerk is loaded, let Clerk handle redirect
  if (!user) {
    return null;
  }

  // Show authentication loading
  if (authState === "authenticating") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3">
          Authenticating...{" "}
          {retryCount > 0 && `(Retry ${retryCount}/${maxRetries})`}
        </span>
      </div>
    );
  }

  // Show error state (optional)
  if (authState === "error" && retryCount >= maxRetries) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="text-red-600 mb-4">Authentication failed</div>
        <button
          onClick={() => {
            setAuthState("idle");
            setRetryCount(0);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // Only render dashboard after successful authentication
  if (authState !== "success") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3">Setting up your session...</span>
      </div>
    );
  }

  // Render dashboard
  return (
    <div className="xl:flex">
      <Sidebar />
      <MobileAppBar />
      <div className="xl:flex-1 min-h-screen pt-16 pb-[88px] xl:pt-0 xl:pb-0 w-full overflow-x-hidden">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
