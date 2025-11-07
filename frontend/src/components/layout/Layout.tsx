import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar at top */}
      <Navbar />
      
      {/* Main content area - grows to fill space */}
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          <Outlet /> {/* React Router renders page content here */}
        </div>
      </main>
      
      {/* Footer at bottom */}
      <Footer />
    </div>
  );
}