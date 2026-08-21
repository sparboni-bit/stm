"use client"

import { useStageContext } from "./useStageContext"

export function useManifest() {
  return useStageContext().manifest
}
