"use client"

import { useStageContext } from "./useStageContext"

export function useNavigation() {
  return useStageContext().navigation
}
