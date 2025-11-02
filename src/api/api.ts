import axios, { AxiosInstance } from "axios";
import toast from "react-hot-toast";
import { userLogOut } from "./Auth";
// import { Clerk } from "@clerk/clerk-js";

//singleton Clerk instance
// const clerk = new Clerk(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!);

// await clerk.load();
export const instance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  withCredentials: true,
});

instance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    // Handle request error
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // try {
      //   // Clerk signout
      //   await clerk.signOut();
      // } catch (err) {
      //   console.error("Clerk signout failed:", err);
      // }
      userLogOut();
      // Show toast immediately
      toast.error("Your session has expired. Redirecting to login...", {
        duration: 3000,
        position: "top-center",
        style: {
          background: "#fee2e2",
          border: "1px solid #fecaca",
          color: "#dc2626",
        },
      });

      // Smooth redirect with delay
      setTimeout(() => {
        // Add a fade-out effect to the page before redirect
        document.body.style.opacity = "0.7";
        document.body.style.transition = "opacity 0.3s ease-out";

        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 300);
      }, 3000);
    }

    return Promise.reject(error);
  }
);
