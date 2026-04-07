"use client";

import { useState } from "react";
import AdminLayout, { type AdminPage } from "@/components/admin/AdminLayout";
import Dashboard      from "@/components/admin/Dashboard";
import UsersPage      from "@/components/admin/UsersPage";
import DepositsPage   from "@/components/admin/DepositsPage";
import WithdrawalsPage from "@/components/admin/WithdrawalsPage";
import TradesPage     from "@/components/admin/TradesPage";
import AssetsPage     from "@/components/admin/AssetsPage";
import ReportsPage    from "@/components/admin/ReportsPage";
import SignalsPage    from "@/components/admin/SignalsPage";
import IntegrationPage from "@/components/admin/IntegrationPage";
import KycPage        from "@/components/admin/KycPage";
import SettingsPage   from "@/components/admin/SettingsPage";
import OtcConfigPage  from "@/components/admin/OtcConfigPage";

export default function AdminPage() {
  const [page, setPage] = useState<AdminPage>("dashboard");

  const content = {
    dashboard:   <Dashboard />,
    users:       <UsersPage />,
    deposits:    <DepositsPage />,
    withdrawals: <WithdrawalsPage />,
    kyc:         <KycPage />,
    trades:      <TradesPage />,
    assets:      <AssetsPage />,
    signals:     <SignalsPage />,
    reports:     <ReportsPage />,
    integration: <IntegrationPage />,
    settings:    <SettingsPage />,
    otc_config:  <OtcConfigPage />,
  }[page];

  return (
    <AdminLayout page={page} setPage={setPage}>
      {content}
    </AdminLayout>
  );
}
