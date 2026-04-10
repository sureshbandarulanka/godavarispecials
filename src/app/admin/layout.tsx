import { AdminAuthProvider } from "@/context/AdminAuthContext";
import "./admin.css";

export const metadata = {
  title: "Admin Panel | Godavari Specials",
  description: "Administrative dashboard for Godavari Specials",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      {children}
    </AdminAuthProvider>
  );
}
