import { getCurrentUserIdAction } from "@/features/user/actions";
import { useEffect, useState } from "react";

export const useCurrentUserId = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUserIdAction().then(setUserId);
  }, []);

  return userId;
};
