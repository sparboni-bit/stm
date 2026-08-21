"use client"

import { useStageContext } from "./useStageContext"

export function useStageActions() {
  return useStageContext().actions
}
