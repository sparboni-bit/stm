"use client"

import { useContext } from "react"

import { StageContext } from "../context/StageContext"

export function useStageContext() {
  const context = useContext(StageContext)

  if (!context) {
    throw new Error("Stage hooks must be used inside StageProvider")
  }

  return context
}
