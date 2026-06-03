import { createBrowserRouter, Outlet } from "react-router";
import { useActivityMonitor } from "../hooks/useActivityMonitor";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { PartySelectionPage } from "./pages/PartySelectionPage";
import { CreatePartyPage } from "./pages/CreatePartyPage";
import { JoinPartyPage } from "./pages/JoinPartyPage";
import { PartyQueuePage } from "./pages/PartyQueuePage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { VibeShiftPage } from "./pages/VibeShiftPage";
import { DashboardPage } from "./pages/DashboardPage";
import { SongDetailPage } from "./pages/SongDetailPage";
import { CreateSongPage } from "./pages/CreateSongPage";
import { EditSongPage } from "./pages/EditSongPage";
import { AdminDashboard } from './pages/AdminDashboard';

function RootLayout() {
  useActivityMonitor();
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
      {
        path: "/",
        Component: LandingPage,
      },
      {
        path: "/login",
        Component: LoginPage,
      },
      {
        path: "/register",
        Component: RegisterPage,
      },
      {
        path: "/admin",
        element: <AdminDashboard />,
      },
      {
        path: "/party/select",
        Component: PartySelectionPage,
      },
      {
        path: "/party/create",
        Component: CreatePartyPage,
      },
      {
        path: "/party/join",
        Component: JoinPartyPage,
      },
      {
        path: "/party/:code/queue",
        Component: PartyQueuePage,
      },
      {
        path: "/party/:code/statistics",
        Component: StatisticsPage,
      },
      {
        path: "/party/:code/vibe-shift",
        Component: VibeShiftPage,
      },
      {
        path: "/dashboard",
        Component: DashboardPage,
      },
      {
        path: "/songs/new",
        Component: CreateSongPage,
      },
      {
        path: "/songs/:id",
        Component: SongDetailPage,
      },
      {
        path: "/songs/:id/edit",
        Component: EditSongPage,
      },
    ],
  },
]);