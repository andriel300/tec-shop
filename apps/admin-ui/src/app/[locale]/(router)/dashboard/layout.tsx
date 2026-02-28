import SidebarWrapper from '../../../shared/components/sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full bg-black min-h-screen">
      {/* sidebar */}

      <aside className="w-[280px] min-w-[250px] max-w-[300px] border-r border-r-slate-800 text-white p-4">
        <div className="sticky top-0">
          <SidebarWrapper />
        </div>
      </aside>

      {/* main content area */}
      <main className="flex-1">
        <div className="overflow-auto">{children}</div>
      </main>
    </div>
  );
}
