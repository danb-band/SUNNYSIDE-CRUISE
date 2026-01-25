import Link from "next/link";
import { Archive, ArchiveRestore } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ArchiveToggleLinkProps {
  showArchived: boolean;
}

export function ArchiveToggleLink({ showArchived }: ArchiveToggleLinkProps) {
  return (
    <Link
      href={showArchived ? "/" : "/?view=archived"}
      className={cn(buttonVariants({ size: "sm" }), "bg-blue-500 hover:bg-blue-600 text-white")}
    >
      {showArchived ? (
        <>
          <ArchiveRestore className="mr-2 h-4 w-4" />
          Show Active
        </>
      ) : (
        <>
          <Archive className="mr-2 h-4 w-4" />
          Show Archived
        </>
      )}
    </Link>
  );
}
