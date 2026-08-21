"use client"

import { useEffect, useMemo, useState } from "react"
import {
  generateIndividualRotationTemplateFamilyAction,
  getIndividualRotationTemplateBatchStatusAction,
} from "@/modules/stage-engines/engines/individual-rotation/actions/templateActions"
import { RescoreTemplatesButton } from "./RescoreTemplatesButton"

type StatusRow=Awaited<ReturnType<typeof getIndividualRotationTemplateBatchStatusAction>>[number]
type Completed={key:string;durationMs:number;score:number|null}

function keyOf(f:{playerCount:number;usableCourtCount:number;seedCount:number}){
  return `${f.playerCount}-${f.usableCourtCount}-${f.seedCount}`
}
function label(f:{playerCount:number;usableCourtCount:number;seedCount:number}){
  return `${f.playerCount}P / ${f.usableCourtCount}C / ${f.seedCount}S`
}
function duration(ms:number){
  const s=Math.round(ms/1000)
  if(s<60)return `${s}s`
  return `${Math.floor(s/60)}m ${s%60}s`
}

export default function IndividualRotationTemplatesDevPage(){
  const [status,setStatus]=useState<StatusRow[]>([])
  const [running,setRunning]=useState(false)
  const [current,setCurrent]=useState<StatusRow|null>(null)
  const [completed,setCompleted]=useState<Completed[]>([])
  const [error,setError]=useState<string|null>(null)

  async function refresh(){
    setError(null)
    try{
      setStatus(await getIndividualRotationTemplateBatchStatusAction({minPlayers:4,maxPlayers:16,maxRounds:12}))
    }catch(e){
      setError(e instanceof Error?e.message:"Unable to read template coverage.")
    }
  }

  useEffect(()=>{ void refresh() },[])

  const completeCount=status.filter(x=>x.complete).length
  const missing=status.filter(x=>!x.complete)
  const elapsed=useMemo(()=>completed.reduce((n,x)=>n+x.durationMs,0),[completed])

  async function continueMissing(){
    if(running||missing.length===0)return
    setRunning(true);setError(null);setCompleted([])
    try{
      // Snapshot missing families at start. Each family is persisted independently.
      for(const family of [...missing]){
        setCurrent(family)
        const result=await generateIndividualRotationTemplateFamilyAction({
          playerCount:family.playerCount,
          usableCourtCount:family.usableCourtCount,
          seedCount:family.seedCount,
          maxRounds:12,
        })
        setCompleted(prev=>[...prev,{
          key:keyOf(family),durationMs:result.durationMs,
          score:result.rows.at(-1)?.fairnessScore??null,
        }])
        // Refresh after every successful family: browser/network failure is resumable.
        await refresh()
      }
    }catch(e){
      setError(e instanceof Error?e.message:"Batch interrupted.")
    }finally{
      setCurrent(null);setRunning(false)
      await refresh()
    }
  }

  return <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Development tool</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-950">Individual Rotation Template Library</h1>
      <p className="mt-2 text-sm text-slate-500">
        Resumable offline generation · 4–16 players · 1–4 usable courts · 0–2 seeds · R1–R12.
      </p>
    </div>

    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={refresh} disabled={running}
        className="min-h-11 border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 disabled:opacity-50">
        Refresh status
      </button>
      <button type="button" onClick={continueMissing} disabled={running||missing.length===0}
        className="min-h-11 bg-slate-950 px-4 text-sm font-bold text-white disabled:bg-slate-300">
        {running?"Generating…":`Continue missing families (${missing.length})`}
      </button>
      <RescoreTemplatesButton />
    </div>

    <section className="border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Coverage</p>
          <p className="mt-1 text-xl font-bold">{completeCount} / {status.length} complete</p>
          {current?<p className="mt-1 text-sm text-slate-500">Generating {label(current)}…</p>:null}
        </div>
        {completed.length?<p className="text-sm text-slate-500">This run: {completed.length} families · {duration(elapsed)}</p>:null}
      </div>
      <div className="mt-4 h-2 bg-slate-100">
        <div className="h-full bg-slate-950" style={{width:status.length?`${Math.round(completeCount/status.length*100)}%`:"0%"}} />
      </div>
    </section>

    {error?<div className="border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>:null}

    <div className="overflow-x-auto border border-slate-200 bg-white">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead><tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
          <th className="px-3 py-3">Family</th><th className="px-3 py-3">Status</th>
          <th className="px-3 py-3">Stored</th><th className="px-3 py-3">Missing rounds</th>
          <th className="px-3 py-3">Last run</th>
        </tr></thead>
        <tbody>{status.map(row=>{
          const done=completed.find(x=>x.key===keyOf(row))
          return <tr key={keyOf(row)} className="border-b border-slate-200 last:border-b-0">
            <td className="px-3 py-3 font-semibold">{label(row)}</td>
            <td className="px-3 py-3 font-bold">{row.complete?"COMPLETE":"MISSING"}</td>
            <td className="px-3 py-3">{row.storedRounds}/12</td>
            <td className="px-3 py-3">{row.complete?"—":row.missingRounds.join(", ")}</td>
            <td className="px-3 py-3">{done?`${duration(done.durationMs)} · R12 ${done.score??"—"}`:"—"}</td>
          </tr>
        })}</tbody>
      </table>
    </div>
  </main>
}
