import { useEffect, useState } from "react";
import { getCurrentUserIdAction } from "@/features/comment/actions";

export const useCurrentUserId = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUserIdAction().then(setUserId);
  }, []);

  return userId;
};
