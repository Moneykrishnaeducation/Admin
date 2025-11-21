import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  UserPlus,
  Wallet,
  ArrowDownCircle,
  Users,
  PiggyBank,
  Coins,
  Briefcase,
  DollarSign,
  CreditCard,
  Banknote,
  ArrowRight,
  Copy,
  CheckCircle,
  AlertTriangle,
  X,
  Info,
} from "lucide-react";


  const statItems = [
    { label: "Live Accounts", value: stats.live, icon: UserPlus },
    { label: "Demo Accounts", value: stats.demo, icon: Wallet },
    { label: "Real Balance (USD)", value: `$${stats.realBalance}`, icon: DollarSign },
    { label: "Total Clients (IB)", value: stats.clients, icon: Users },
    { label: "Overall Deposits", value: `$${stats.deposits}`, icon: PiggyBank },
    { label: "MAM Funds Invested", value: `$${stats.mamFunds}`, icon: Coins },
    { label: "MAM Managed Funds", value: `$${stats.mamManaged}`, icon: Briefcase },
    { label: "IB Earnings", value: `$${stats.ibEarnings}`, icon: CreditCard },
    { label: "Withdrawable", value: `$${stats.withdrawable}`, icon: Banknote },
  ];



export default Dashboard;
