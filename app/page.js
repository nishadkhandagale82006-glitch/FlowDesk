"use client";

import { useState } from "react";
import { UserPlus, Plus } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import DashboardStats from "@/components/DashboardStats";
import TaskList from "@/components/TaskList";
import ProductivityStats from "@/components/ProductivityStats";
import RecentActivity from "@/components/RecentActivity";

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Sidebar />

      {/* Main content area - padded for fixed sidebar on desktop and fixed bottom nav on mobile */}
      <div className="flex-1 flex flex-col md:pl-64 pb-20 md:pb-0">
        <Header />
        <main className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-7 px-5 py-7 sm:px-7 lg:gap-8 lg:px-10">
          <DashboardStats refreshKey={refreshKey} />
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-5 sm:p-6">
            <div><h2 className="text-lg font-semibold text-slate-950">Keep the day moving</h2><p className="mt-1 text-sm text-slate-600">Capture the next action or add someone to the team.</p></div>
            <div className="flex flex-wrap gap-2">
              <a href="#recent-tasks" className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"><Plus size={16} aria-hidden="true" />Create task</a>
              <a href="/team#add-member" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><UserPlus size={16} aria-hidden="true" />Add team member</a>
            </div>
          </section>
          <div id="recent-tasks" className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,.85fr)]">
            <TaskList onActivityChange={() => setRefreshKey((value) => value + 1)} />
            <div className="flex min-w-0 flex-col gap-6">
              <ProductivityStats refreshKey={refreshKey} />
              <RecentActivity refreshKey={refreshKey} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
