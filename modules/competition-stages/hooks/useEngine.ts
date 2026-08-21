"use client"

import { useStageContext } from "./useStageContext"

export function useEngine() {
  return useStageContext().engine
}
