import React from "react";
import { Outlet } from "react-router-dom";

import AdSidebar from "./AdSidebar";
import "./AppLayout.css";
import Footer from "./Footer";
import Header from "./Header";
import Sidebar from "./Sidebar";

const AppLayout = () => {
  return (
    <div className="container container--y island root-layout">
      {/* Header wrapped in container island island-item */}
      <div className="container island island-item">
        <Header />
      </div>

      <div className="container container--x container--full island">
        <Sidebar />
        <main className="container container--y container--full">
          <Outlet />
        </main>
        <AdSidebar showTsGfx={true} />
      </div>
      <Footer />
    </div>
  );
};

export default AppLayout;
