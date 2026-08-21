type BracketConnectorProps = {
  sourceX: number
  sourceY: number
  siblingY: number
  targetX: number
  targetY: number
}

export function BracketConnector({
  sourceX,
  sourceY,
  siblingY,
  targetX,
  targetY,
}: BracketConnectorProps) {
  const middleX = sourceX + (targetX - sourceX) / 2
  const topY = Math.min(sourceY, siblingY)
  const bottomY = Math.max(sourceY, siblingY)

  return (
    <g fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-300" shapeRendering="crispEdges">
      <path d={`M ${sourceX} ${sourceY} H ${middleX}`} />
      <path d={`M ${sourceX} ${siblingY} H ${middleX}`} />
      <path d={`M ${middleX} ${topY} V ${bottomY}`} />
      <path d={`M ${middleX} ${targetY} H ${targetX}`} />
    </g>
  )
}
