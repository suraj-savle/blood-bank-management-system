import React, { useState } from "react";
const WEBSITE_NAME = import.meta.env.VITE_WEBSITE_NAME;

export default function Header({ onRoleChange, currentUser }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, setRole] = useState("Donor");

  function handleRoleChange(e) {
    setRole(e.target.value);
    if (onRoleChange) onRoleChange(e.target.value);
  }

  // Navigation links based on user role
  const getNavLinks = () => {
    const commonLinks = [
      { name: "Home", path: "/" },
      { name: "About", path: "/about" },
      { name: "Contact", path: "/contact" }
    ];

    if (currentUser) {
      // User is logged in
      return [
        ...commonLinks,
        { name: "Dashboard", path: "/dashboard" },
        { name: "Profile", path: "/profile" },
        { name: "Logout", path: "/logout" }
      ];
    } else {
      // User is not logged in
      return [
        ...commonLinks,
        { name: "Login", path: "/login" },
        { name: "Create Account", path: "/createaccount" }
      ];
    }
  };

  // Admin-specific links
  const adminLinks = role === "Admin" ? [
    { name: "Admin Panel", path: "/admin" },
    { name: "User Management", path: "/admin/users" }
  ] : [];

  const navLinks = [...getNavLinks(), ...adminLinks];

  return (
    <header className="w-full bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* left: logo + title */}
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-3">
              {/* simple blood-drop logo */}
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6 text-red-600"
                >
                  <path d="M12 2C12 2 6 8 6 12a6 6 0 0012 0c0-4-6-10-6-10z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-800">{WEBSITE_NAME}</h1>
                <p className="text-xs text-gray-500 -mt-0.5">Management System</p>
              </div>
            </a>

            {/* role select (hidden on very small screens) */}
            <div className="hidden sm:flex items-center ml-4">
              <label className="sr-only">Role</label>
              <select
                value={role}
                onChange={handleRoleChange}
                className="border rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                <option>Donor</option>
                <option>Hospital</option>
                <option>Admin</option>
              </select>
            </div>
          </div>

          {/* Desktop navigation links */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.path}
                className="text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* right: actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="hidden md:inline-flex items-center px-3 py-1.5 border rounded-md text-sm bg-red-50 text-red-600 border-red-100 hover:bg-red-100 transition-colors"
            >
              New Request
            </button>

            {/* mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileOpen((s) => !s)}
                className="p-2 rounded-md hover:bg-gray-100 focus:outline-none transition-colors"
                aria-label="Open menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* mobile dropdown */}
        {mobileOpen && (
          <nav className="md:hidden text-black mt-2 pb-4 border-t">
            <div className="px-2 space-y-1">
              

              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.path}
                  className="block px-2 py-2 rounded hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              
              <button className="w-full text-left px-2 py-2 rounded hover:bg-gray-50 transition-colors">
                New Request
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}