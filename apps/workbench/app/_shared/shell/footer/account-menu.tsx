"use client";

import { CaretSortIcon, ExitIcon } from "@radix-ui/react-icons";
import type { ProjectMemberRole } from "@repo/contracts/validation/enum";
import { DropdownMenu, Toaster, type MenuItem } from "@repo/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AccountMenuProps = {
  email: string;
  role: ProjectMemberRole;
};

export function AccountMenu({ email, role }: AccountMenuProps) {
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok && response.status !== 401) {
        Toaster.toast.error("Unable to log out. Please try again.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      Toaster.toast.error("Unable to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  const menuItems: MenuItem[] = [
    {
      type: "action",
      id: "logout",
      label: loggingOut ? "Logging out..." : "Log out",
      onSelect: handleLogout,
      disabled: loggingOut,
      closeOnSelect: false,
      rightIcon: ExitIcon,
    },
  ];

  return (
    <DropdownMenu
      label={email}
      placement="top-start"
      rightIcon={CaretSortIcon}
      items={menuItems}
    />
  );
}
