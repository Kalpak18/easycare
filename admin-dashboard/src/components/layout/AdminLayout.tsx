import Sidebar from "./Sidebar";
import Header from "./Header";
import SocketListener from "../realtime/SocketListener";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex flex-col flex-1 h-screen">
        <Header />

        <SocketListener />

        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}