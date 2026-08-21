"use client"

import { useStageContext } from "./useStageContext"

export function useStage() {
  return useStageContext().stage
}
