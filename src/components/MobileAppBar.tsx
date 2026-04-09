"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const MobileAppBar = () => {
  const pathname = usePathname();

  const getTitle = (path: string) => {
    if (path === "/dashboard") return "Dashboard";
    if (path.includes("/contract-management")) return "Contracts";
    if (path.includes("/invoicing")) return "Invoicing";
    if (path.includes("/buyer-management")) return "Clients";
    if (path.includes("/seller-management")) return "Sellers";
    if (path.includes("/historical-prices")) return "History";
    if (path.includes("/rubbish-bin")) return "Trash";
    return "Contract Manager";
  };

  return (
    <div className="xl:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50 flex items-center justify-between px-4 transition-all duration-300">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Image
          src="/Frame.png"
          alt="Logo"
          width={32}
          height={32}
          className="rounded-lg shadow-sm"
        />
        <h1 className="font-bold text-lg text-gray-800 tracking-tight">
          {getTitle(pathname)}
        </h1>
      </Link>

      <div className="flex items-center gap-3">
        {/* Profile Avatar Quick Link */}
        <Link 
          href="/dashboard"
          className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center border border-purple-200 overflow-hidden"
        >
          <Image
            src="/Original.png"
            alt="User"
            width={32}
            height={32}
          />
        </Link>
      </div>
    </div>
  );
};

export default MobileAppBar;
