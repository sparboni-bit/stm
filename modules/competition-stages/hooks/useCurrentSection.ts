"use client"

import { useStageContext } from "./useStageContext"

export function useCurrentSection() {
  return useStageContext().currentSection
}
