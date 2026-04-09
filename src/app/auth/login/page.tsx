/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useSignIn } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FiDownload } from "react-icons/fi";

type SignInStep = "credentials" | "verification";

export default function SignInWithEmailVerification() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<SignInStep>("credentials");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowInstallBtn(false);
    }
  };

  // Step 1: Handle email/password submission and send verification code
  const handleCredentialsSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!isLoaded) return;

    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const emailValue = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      if (!emailValue || !password) {
        throw new Error("Email and password are required");
      }

      setEmail(emailValue);

      // Create sign-in attempt with email verification strategy
      const result = await signIn.create({
        identifier: emailValue,
        password,
        strategy: "password",
      });

      // Check if the sign-in attempt was successful but needs verification
      if (result.status === "needs_first_factor") {
        // Find the email verification factor
        const emailCodeFactor = result.supportedFirstFactors?.find(
          (factor) => factor.strategy === "email_code"
        );

        if (emailCodeFactor && emailCodeFactor.emailAddressId) {
          // Send email verification code
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: emailCodeFactor.emailAddressId,
          });

          setStep("verification");
        } else {
          throw new Error("Email verification not available");
        }
      } else if (result.status === "complete") {
        // If no verification is needed, sign in directly
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(err?.errors?.[0]?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle email verification code submission
  const handleVerificationSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!isLoaded) return;

    setLoading(true);
    setError("");

    try {
      if (!verificationCode) {
        throw new Error("Verification code is required");
      }

      // Verify the email code
      const result = await signIn.attemptFirstFactor({
        strategy: "email_code",
        code: verificationCode,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      } else {
        setError("Verification failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err?.errors?.[0]?.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    if (!isLoaded || !signIn) return;

    setLoading(true);
    setError("");

    try {
      // Get the current sign-in attempt
      const currentSignIn = signIn;

      if (currentSignIn.supportedFirstFactors) {
        const emailCodeFactor = currentSignIn.supportedFirstFactors.find(
          (factor) => factor.strategy === "email_code"
        );

        if (emailCodeFactor && emailCodeFactor.emailAddressId) {
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: emailCodeFactor.emailAddressId,
          });

          // Show success message (you can customize this)
          setError(""); // Clear any previous errors
          // Optional: Show a temporary success message
          // setSuccessMessage("New code sent!");
        } else {
          throw new Error("Email verification not available");
        }
      } else {
        throw new Error("No verification methods available");
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  // Go back to credentials step
  const handleBackToCredentials = () => {
    setStep("credentials");
    setVerificationCode("");
    setError("");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#F5F5F5] p-4">
      <div className="flex flex-col lg:flex-row justify-center items-center gap-8 lg:gap-32 w-full">
        {/* Left decorative image - hidden on mobile */}
        <div className="hidden lg:block mt-10">
          <Image src={"/deg1.png"} width={400} height={400} alt="design" />
        </div>

        {/* Main form container */}
        <div className="bg-white py-6 px-4 sm:py-8 sm:px-6 shadow-xl rounded-lg border-t-4 border-[#9586E0] w-full max-w-md">
          {/* Logo and Title */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <Image
                src={"/Frame.png"}
                alt="logo"
                width={50}
                height={50}
                className="w-10 h-10 sm:w-12 sm:h-12"
              />
            </div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
              {step === "credentials" ? "Sign in" : "Verify your email"}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">
              {step === "credentials"
                ? "Enter your details to sign in to your account"
                : `We've sent a verification code to ${email}`}
            </p>
          </div>

          {/* PWA Smart Banner - Professional Mobile UI */}
          {showInstallBtn && (
            <div className="fixed bottom-6 left-4 right-4 z-50 animate-in slide-in-from-bottom-10 duration-500">
              <div className="bg-white/90 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-2.5 rounded-xl">
                    <Image
                      src="/Frame.png"
                      alt="App Icon"
                      width={32}
                      height={32}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Contract Manager</h4>
                    <p className="text-[11px] text-gray-500 font-medium">Install app for better experience</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowInstallBtn(false)}
                    className="text-xs text-gray-400 px-2 py-1 hover:text-gray-600 transition-colors"
                  >
                    Not now
                  </button>
                  <button
                    onClick={handleInstallClick}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center gap-1.5"
                  >
                    <FiDownload className="text-sm" />
                    Install
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Credentials Form */}
          {step === "credentials" && (
            <form
              onSubmit={handleCredentialsSubmit}
              className="space-y-3 sm:space-y-4"
            >
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs sm:text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#2A5D36] focus:ring-[#2A5D36] text-xs sm:text-sm p-2 sm:p-2.5 border"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs sm:text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#2A5D36] focus:ring-[#2A5D36] text-xs sm:text-sm p-2 sm:p-2.5 border"
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <div className="text-red-500 text-xs sm:text-sm bg-red-50 p-2 rounded-md border border-red-200">
                  {error}
                </div>
              )}

              <div className="pt-1 sm:pt-2">
                <button
                  type="submit"
                  disabled={loading || !isLoaded}
                  className="w-full flex justify-center py-2 px-4 sm:py-2.5 sm:px-4 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-[#2A5D36] hover:bg-[#1e4a2a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A5D36] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Email Verification Form */}
          {step === "verification" && (
            <form
              onSubmit={handleVerificationSubmit}
              className="space-y-3 sm:space-y-4"
            >
              <div>
                <label
                  htmlFor="verification-code"
                  className="block text-xs sm:text-sm font-medium text-gray-700"
                >
                  Verification Code
                </label>
                <input
                  id="verification-code"
                  name="verification-code"
                  type="text"
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#2A5D36] focus:ring-[#2A5D36] text-xs sm:text-sm p-2 sm:p-2.5 border text-center font-mono tracking-widest"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-600 mb-2">
                  Didn&apos;t receive the code?
                </p>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-xs text-[#2A5D36] hover:text-[#1e4a2a] font-medium disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>

              {error && (
                <div className="text-red-500 text-xs sm:text-sm bg-red-50 p-2 rounded-md border border-red-200">
                  {error}
                </div>
              )}

              <div className="pt-1 sm:pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={
                    loading || !isLoaded || verificationCode.length !== 6
                  }
                  className="w-full flex justify-center py-2 px-4 sm:py-2.5 sm:px-4 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-[#2A5D36] hover:bg-[#1e4a2a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A5D36] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    "Verify & Sign in"
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBackToCredentials}
                  className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A5D36] transition-colors duration-200"
                >
                  Back to sign in
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right decorative image - hidden on mobile */}
        <div className="hidden lg:block">
          <Image src={"/deg2.png"} width={400} height={400} alt="design" />
        </div>
      </div>
    </div>
  );
}
