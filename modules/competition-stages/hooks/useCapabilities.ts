"use client"

import { useStageContext } from "./useStageContext"

export function useCapabilities() {
  return useStageContext().capabilities
}
