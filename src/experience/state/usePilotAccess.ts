"use client";

import { useState } from "react";
import { pilotRequested } from "./variant";

export const usePilotAccess = () => {
  const [allowed] = useState(() => process.env.NODE_ENV !== "production" || pilotRequested(window.location.search));
  return allowed;
};
