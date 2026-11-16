"use client";

import type { Project } from "@repo/contracts/type";
import { List, Text, Toaster } from "@repo/ui";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProjectList({
  projects,
  configuredProjectId,
}: {
  projects: Project[];
  configuredProjectId: string | null;
}) {
  const router = useRouter();

  useEffect(() => {
    const url = new URL(window.location.href);

    if (url.searchParams.get("reason") !== "project-access-denied") return;

    url.searchParams.delete("reason");

    window.history.replaceState(window.history.state, "", url);

    Toaster.toast.error("Don't have access to this project.", {
      id: "project-autorization-denied",
    });
  }, []);

  const currentId = configuredProjectId?.toLowerCase();

  return (
    <main className="px-mini bg-dot-pattern flex min-h-dvh w-full justify-center">
      <Toaster />
      <div className="gap-regularPlus flex w-full max-w-60 flex-col">
        {projects.length === 0 ? (
          <Text variant="input-helper-sm">You do not have access to any projects.</Text>
        ) : (
          <List
            aria-label="Your projects"
            listItems={projects.map((project) => ({
              id: project.id,
              text: project.name,
              disabled: project.id.toLowerCase() !== currentId,
              onSelect:
                project.id.toLowerCase() === currentId
                  ? () => router.push("/tokens/color")
                  : undefined,
            }))}
          />
        )}
      </div>
    </main>
  );
}
