"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; // Import usePathname
import { MdOutlineLogout } from "react-icons/md";
import { useState } from "react"; // Import useState
import { FaBars, FaTrash } from "react-icons/fa"; // Import hamburger icon
import Image from "next/image";
import { useClerk } from "@clerk/nextjs";
import { userLogOut } from "@/api/Auth";

const menus = [
  {
    page: "Dashboard",
    link: "/dashboard",
  },
  {
    page: "Contract Management",
    link: "/dashboard/contract-management",
  },
  {
    page: "Invoicing",
    link: "/dashboard/invoicing",
  },
  {
    page: "Buyer Management",
    link: "/dashboard/buyer-management",
  },
  {
    page: "Seller Management",
    link: "/dashboard/seller-management",
  },
  {
    page: "Historical Daily Prices",
    link: "/dashboard/historical-prices",
  },
  {
    page: "Rubbish Bin",
    link: "/dashboard/rubbish-bin",
  },
];

const Sidebar = () => {
  const { signOut } = useClerk();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State to manage sidebar visibility
  const router = useRouter();

  const handleLogout = async () => {
    signOut();
    userLogOut();
    router.push("/auth/login");
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Close sidebar when a menu item is clicked
  const handleMenuItemClick = () => {
    if (isSidebarOpen) {
      toggleSidebar(); // Close the sidebar on mobile
    }
  };

  return (
    <>
      {/* Mobile Menu Icon */}
      <div className="xl:hidden fixed top-5 left-5 z-50">
        <button
          onClick={toggleSidebar}
          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <FaBars className="text-xl" />
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed xl:relative 2xl:w-[15%] h-screen shadow-right border-r border-gray-200 bg-white transform transition-transform duration-300 ease-in-out top-0 z-20 ${
          isSidebarOpen
            ? "translate-x-0 w-[50%]"
            : "-translate-x-full xl:translate-x-0"
        }`}
      >
        <div className="h-screen px-2 flex flex-col justify-between">
          <div>
            {/* Logo and User Info */}
            <div className="pt-24">
              <Link
                href={"/"}
                className="flex items-center justify-center gap-3"
                onClick={handleMenuItemClick} // Close sidebar on mobile
              >
                <Image
                  className="rounded-full size-10"
                  src={"/Original.png"}
                  alt="user-image"
                  width={100}
                  height={100}
                />
                <p className="font-bold">Jack Zacker</p>
              </Link>
            </div>

            {/* Menu Links */}
            <div className="pt-7">
              {menus.map((menu, idx) => (
                <li key={idx} className="list-none mb-4">
                  <Link
                    href={menu.link}
                    className={`flex items-center justify-center gap-5 px-5 pb-2 transition-all ${
                      pathname === menu.link
                        ? "shadow-md"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={handleMenuItemClick}
                  >
                    {menu.link === "/rubbish-bin" && (
                      <FaTrash className="ml-2" />
                    )}
                    <span>{menu.page}</span>
                  </Link>
                </li>
              ))}
            </div>
          </div>

          {/* Logout Button */}
          <div className="xl:pb-10 flex justify-center">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100"
            >
              <MdOutlineLogout />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
