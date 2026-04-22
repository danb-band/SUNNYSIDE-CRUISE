import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const AUTH_BROADCAST_CHANNEL = "auth";

export function useAuthSync() {
  const router = useRouter();

  useEffect(() => {
    const channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
    channel.onmessage = (e: MessageEvent<{ event: string }>) => {
      if (e.data.event === "SIGNED_OUT") router.push("/login");
      if (e.data.event === "SIGNED_IN" && window.location.pathname === "/login") router.push("/");
    };
    return () => channel.close();
  }, [router]);
}
