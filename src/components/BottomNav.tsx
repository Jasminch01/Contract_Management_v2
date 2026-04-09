"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiFileText, FiDollarSign, FiUsers, FiMenu, FiTrash2, FiClock, FiSettings } from "react-icons/fi";
import { MdOutlineLogout } from "react-icons/md";
import { useClerk } from "@clerk/nextjs";
import { userLogOut } from "@/api/Auth";
import { useRouter } from "next/navigation";

const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const handleLogout = async () => {
    signOut();
    userLogOut();
    router.push("/auth/login");
  };

  const navItems = [
    { label: "Home", icon: <FiHome />, link: "/dashboard" },
    { label: "Contracts", icon: <FiFileText />, link: "/dashboard/contract-management" },
    { label: "Invoices", icon: <FiDollarSign />, link: "/dashboard/invoicing" },
    { label: "Clients", icon: <FiUsers />, link: "/dashboard/buyer-management" }, 
  ];

  const moreItems = [
    { label: "Seller Management", icon: <FiUsers />, link: "/dashboard/seller-management" },
    { label: "Historical Prices", icon: <FiClock />, link: "/dashboard/historical-prices" },
    { label: "Rubbish Bin", icon: <FiTrash2 />, link: "/dashboard/rubbish-bin" },
  ];

  return (
    <div className="xl:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Dynamic Backdrop for More Menu */}
      {isMoreOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsMoreOpen(false)}
        />
      )}

      {/* Modern Bottom Sheet for "More" */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] shadow-2xl z-50 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isMoreOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        {/* Grab Handle */}
        <div className="pt-3 pb-2 flex justify-center">
          <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
        </div>
        
        <div className="px-6 pb-20 pt-4 space-y-2">
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4 px-2">More Options</h3>
          {moreItems.map((item) => (
            <Link
              key={item.link}
              href={item.link}
              onClick={() => setIsMoreOpen(false)}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.98] ${
                pathname === item.link ? "bg-purple-50 text-purple-600 font-bold" : "text-gray-700 active:bg-gray-50"
              }`}
            >
              <span className="text-xl p-2 rounded-xl bg-gray-50">{item.icon}</span>
              <span className="text-base">{item.label}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 p-4 rounded-2xl text-red-600 w-full active:bg-red-50 transition-all font-medium active:scale-[0.98]"
          >
            <span className="text-xl p-2 rounded-xl bg-red-50"><MdOutlineLogout /></span>
            <span className="text-base">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Nav Bar with Safe Area Support */}
      <div className="bg-white/90 backdrop-blur-xl border-t border-gray-100 px-6 pb-[env(safe-area-inset-bottom,20px)] pt-3 flex justify-around items-center shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        {navItems.map((item) => (
          <Link
            key={item.link}
            href={item.link}
            className={`flex flex-col items-center justify-center min-w-[64px] transition-all relative group ${
              pathname === item.link ? "text-purple-600" : "text-gray-400"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${
              pathname === item.link ? "scale-110" : "group-active:scale-90"
            }`}>
              <span className="text-[22px]">{item.icon}</span>
            </div>
            <span className={`text-[10px] mt-0.5 font-semibold transition-all ${
              pathname === item.link ? "opacity-100 translate-y-0" : "opacity-70"
            }`}>
              {item.label}
            </span>
            {pathname === item.link && (
              <div className="absolute -bottom-1 w-1 h-1 bg-purple-600 rounded-full" />
            )}
          </Link>
        ))}
        
        <button
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={`flex flex-col items-center justify-center min-w-[64px] transition-all relative group ${
            isMoreOpen ? "text-purple-600" : "text-gray-400"
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all duration-300 ${
            isMoreOpen ? "scale-110" : "group-active:scale-90"
          }`}>
            <span className="text-[22px]"><FiMenu /></span>
          </div>
          <span className="text-[10px] mt-0.5 font-semibold">More</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
