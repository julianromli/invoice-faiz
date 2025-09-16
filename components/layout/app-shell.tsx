"use client";

import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { FilePlus2, Home, LayoutDashboard, NotebookPen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import type { ReactNode } from "react";

const navLinks = [
  {
    label: "Overview",
    href: "/",
    icon: Home,
  },
  {
    label: "Create invoice",
    href: "/new",
    icon: FilePlus2,
  },
  {
    label: "Invoice dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Guides",
    href: "https://github.com/julianromli/invoice-faiz#readme",
    icon: NotebookPen,
    external: true,
  },
] as const;

type LinkConfig = (typeof navLinks)[number];

const buildIcon = (
  Icon: LinkConfig["icon"],
  isActive: boolean
): ReactNode => (
  <Icon
    className={cn(
      "h-5 w-5 flex-shrink-0",
      isActive ? "text-orange-500" : "text-neutral-700 dark:text-neutral-200"
    )}
  />
);

export const AppShell = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <div className="flex h-full min-h-screen flex-col md:flex-row">
        <Sidebar open={open} setOpen={setOpen}>
          <SidebarBody className="justify-between gap-8">
            <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
              {open ? <Brand /> : <BrandIcon />}
              <nav className="mt-8 flex flex-col gap-2">
                {navLinks.map((link) => {
                  const isActive = link.external
                    ? false
                    : link.href === "/"
                    ? pathname === link.href
                    : pathname.startsWith(link.href);

                  return (
                    <SidebarLink
                      key={link.href}
                      link={{
                        label: link.label,
                        href: link.href,
                        icon: buildIcon(link.icon, isActive),
                      }}
                      className={cn(
                        "rounded-md px-2 transition-colors",
                        isActive
                          ? "bg-orange-100 text-orange-600 dark:bg-orange-600/20"
                          : "text-neutral-700 hover:bg-neutral-200 dark:text-neutral-200 dark:hover:bg-neutral-700/40"
                      )}
                      prefetch={link.external ? false : undefined}
                      {...(link.external
                        ? {
                            target: "_blank",
                            rel: "noreferrer",
                          }
                        : {})}
                    />
                  );
                })}
              </nav>
            </div>
            <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700/60">
              <SidebarLink
                link={{
                  label: "Julian Romli",
                  href: "https://www.linkedin.com/in/julianromli/",
                  icon: (
                    <Image
                      src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=facearea&facepad=3&w=96&h=96&q=80"
                      alt="Team avatar"
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ),
                }}
                className="rounded-md px-2 text-sm text-neutral-600 hover:bg-neutral-200 dark:text-neutral-200 dark:hover:bg-neutral-700/40"
                target="_blank"
                rel="noreferrer"
                prefetch={false}
              />
            </div>
          </SidebarBody>
        </Sidebar>
        <main className="flex-1 overflow-x-hidden">
          <div className="min-h-screen w-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

const Brand = () => {
  return (
    <Link
      href="/"
      className="flex items-center gap-3 text-sm font-medium text-neutral-900 dark:text-neutral-100"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
        IG
      </div>
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        Invoice Generator
      </motion.span>
    </Link>
  );
};

const BrandIcon = () => {
  return (
    <Link
      href="/"
      className="flex items-center justify-center text-sm text-neutral-900 dark:text-neutral-100"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
        IG
      </div>
    </Link>
  );
};
