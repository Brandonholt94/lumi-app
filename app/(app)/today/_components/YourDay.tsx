'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  pointerWithin,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

type TimeBlock = 'morning' | 'afternoon' | 'evening'

interface Task {
  id: string
  text: string
  tag: string | null
  notes: string | null
  time_block: TimeBlock | null
  completed: boolean
  created_at: string
}

interface BlockedState {
  morning:   Task[]
  afternoon: Task[]
  evening:   Task[]
}

// ─────────────────────────────────────────────────────────
// Zone config
// ─────────────────────────────────────────────────────────

// Phosphor Bold icons — official SVGs from Phosphor library
function IconSunHorizon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 256 256" fill={color}>
      <path d="M240,148H203.89c.07-1.33.11-2.66.11-4a76,76,0,0,0-152,0c0,1.34,0,2.67.11,4H16a12,12,0,0,0,0,24H240a12,12,0,0,0,0-24ZM76,144a52,52,0,0,1,104,0c0,1.34-.07,2.67-.17,4H76.17C76.07,146.67,76,145.34,76,144Zm144,56a12,12,0,0,1-12,12H48a12,12,0,0,1,0-24H208A12,12,0,0,1,220,200ZM12.62,92.21a12,12,0,0,1,15.17-7.59l12,4a12,12,0,1,1-7.58,22.77l-12-4A12,12,0,0,1,12.62,92.21Zm56-48.41a12,12,0,1,1,22.76-7.59l4,12A12,12,0,1,1,72.62,55.8Zm140,60a12,12,0,0,1,7.59-15.18l12-4a12,12,0,0,1,7.58,22.77l-12,4a12,12,0,0,1-15.17-7.59Zm-48-55.59,4-12a12,12,0,1,1,22.76,7.59l-4,12a12,12,0,1,1-22.76-7.59Z"/>
    </svg>
  )
}

function IconSun({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 256 256" fill={color}>
      <path d="M116,36V20a12,12,0,0,1,24,0V36a12,12,0,0,1-24,0Zm80,92a68,68,0,1,1-68-68A68.07,68.07,0,0,1,196,128Zm-24,0a44,44,0,1,0-44,44A44.05,44.05,0,0,0,172,128ZM51.51,68.49a12,12,0,1,0,17-17l-12-12a12,12,0,0,0-17,17Zm0,119-12,12a12,12,0,0,0,17,17l12-12a12,12,0,1,0-17-17ZM196,72a12,12,0,0,0,8.49-3.51l12-12a12,12,0,0,0-17-17l-12,12A12,12,0,0,0,196,72Zm8.49,115.51a12,12,0,0,0-17,17l12,12a12,12,0,0,0,17-17ZM48,128a12,12,0,0,0-12-12H20a12,12,0,0,0,0,24H36A12,12,0,0,0,48,128Zm80,80a12,12,0,0,0-12,12v16a12,12,0,0,0,24,0V220A12,12,0,0,0,128,208Zm108-92H220a12,12,0,0,0,0,24h16a12,12,0,0,0,0-24Z"/>
    </svg>
  )
}

function IconMoonStars({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 256 256" fill={color}>
      <path d="M244,96a12,12,0,0,1-12,12H220v12a12,12,0,0,1-24,0V108H184a12,12,0,0,1,0-24h12V72a12,12,0,0,1,24,0V84h12A12,12,0,0,1,244,96ZM144,60h4v4a12,12,0,0,0,24,0V60h4a12,12,0,0,0,0-24h-4V32a12,12,0,0,0-24,0v4h-4a12,12,0,0,0,0,24Zm75.81,90.38A12,12,0,0,1,222,162.3,100,100,0,1,1,93.7,34a12,12,0,0,1,15.89,13.6A85.12,85.12,0,0,0,108,64a84.09,84.09,0,0,0,84,84,85.22,85.22,0,0,0,16.37-1.59A12,12,0,0,1,219.81,150.38ZM190,172A108.13,108.13,0,0,1,84,66,76,76,0,1,0,190,172Z"/>
    </svg>
  )
}

const ZONES: {
  key:            TimeBlock
  label:          string
  icon:           (color: string) => React.ReactNode
  timeLabel:      string
  accentColor:    string
  accentBg:       string
  borderColor:    string
  emptyMessage:   string
  hardestMessage: string
}[] = [
  {
    key:            'morning',
    label:          'Morning',
    icon:           (c) => <IconSunHorizon color={c} />,
    timeLabel:      'Before noon',
    accentColor:    '#C49820',
    accentBg:       'rgba(245,201,138,0.13)',
    borderColor:    'rgba(245,201,138,0.45)',
    emptyMessage:   "What's one thing to tackle before the day gets loud?",
    hardestMessage: "Mornings tend to be your hardest stretch. Even one task here is a real win.",
  },
  {
    key:            'afternoon',
    label:          'Afternoon',
    icon:           (c) => <IconSun color={c} />,
    timeLabel:      'Noon – 5pm',
    accentColor:    '#C86040',
    accentBg:       'rgba(244,165,130,0.11)',
    borderColor:    'rgba(244,165,130,0.40)',
    emptyMessage:   "Afternoon is open — drag something in when you're ready.",
    hardestMessage: "This stretch is usually your toughest. Lumi's paying extra attention here.",
  },
  {
    key:            'evening',
    label:          'Evening',
    icon:           (c) => <IconMoonStars color={c} />,
    timeLabel:      'After 5pm',
    accentColor:    '#5060A0',
    accentBg:       'rgba(143,170,224,0.11)',
    borderColor:    'rgba(143,170,224,0.38)',
    emptyMessage:   "Good for lighter tasks — things that don't need full focus.",
    hardestMessage: "Evenings can spiral. Keep this block light if you can.",
  },
]

function currentBlock(): TimeBlock {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

// ─────────────────────────────────────────────────────────
// Confetti Burst
// ─────────────────────────────────────────────────────────

function ConfettiBurst({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1400)
    return () => clearTimeout(t)
  }, [onDone])

  const COLORS = ['#F4A582', '#F5C98A', '#E8A0BF', '#8FAAE0', '#B8AECC', '#5EC269']
  // 24 pieces bursting outward from the checkmark button area
  const pieces = Array.from({ length: 24 }, (_, i) => {
    const angle  = (i / 24) * 360
    const dist   = 28 + (i % 5) * 10                        // 28–68px travel
    const dx     = Math.cos((angle * Math.PI) / 180) * dist
    const dy     = Math.sin((angle * Math.PI) / 180) * dist - 18  // bias upward
    const size   = 5 + (i % 3) * 2
    const isCirc = i % 3 !== 0
    const delay  = (i % 5) * 0.025
    const spin   = i % 2 === 0 ? 300 : -300
    return { dx, dy, size, isCirc, color: COLORS[i % COLORS.length], delay, spin }
  })

  return (
    // overflow:visible so pieces escape the card boundary
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible', zIndex: 20 }}>
      <style>{`
        @keyframes confBurst {
          0%   { transform: translate(0,0) rotate(0deg) scale(1); opacity: 1; }
          55%  { opacity: 1; }
          100% { transform: translate(var(--cdx),var(--cdy)) rotate(var(--cspin)) scale(0.5); opacity: 0; }
        }
      `}</style>
      {pieces.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top:   '50%',
            right: 24,               // anchored near the checkmark button
            width:  p.size,
            height: p.size,
            borderRadius: p.isCirc ? '50%' : 2,
            background: p.color,
            // @ts-ignore CSS custom properties
            '--cdx':   `${p.dx}px`,
            '--cdy':   `${p.dy}px`,
            '--cspin': `${p.spin}deg`,
            animation: `confBurst 1.1s cubic-bezier(0.22,1,0.36,1) ${p.delay}s both`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Drag handle icon
// ─────────────────────────────────────────────────────────

function DragHandle() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
      <circle cx="3.5" cy="2.5"  r="1.1"/><circle cx="9.5" cy="2.5"  r="1.1"/>
      <circle cx="3.5" cy="6.5"  r="1.1"/><circle cx="9.5" cy="6.5"  r="1.1"/>
      <circle cx="3.5" cy="10.5" r="1.1"/><circle cx="9.5" cy="10.5" r="1.1"/>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────
// Task card (draggable)
// ─────────────────────────────────────────────────────────

function TaskCard({
  task,
  onComplete,
  onTap,
}: {
  task:       Task
  onComplete: (id: string) => void
  onTap:      (task: Task) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id })
  const [celebrating, setCelebrating] = useState(false)

  function handleComplete(e: React.MouseEvent) {
    e.stopPropagation()
    if (task.completed || celebrating) return
    setCelebrating(true)
    onComplete(task.id)
  }

  return (
    <div
      ref={setNodeRef}
      {...(!task.completed ? { ...attributes, ...listeners } : {})}
      draggable={false}
      onClick={() => { if (!isDragging) onTap(task) }}
      style={{
        position: 'relative',
        background: task.completed ? 'rgba(94,194,105,0.06)' : 'white',
        borderRadius: 13,
        border: task.completed
          ? '1px solid rgba(94,194,105,0.22)'
          : '1px solid rgba(45,42,62,0.08)',
        boxShadow: isDragging ? 'none' : '0 1px 4px rgba(45,42,62,0.05)',
        padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: task.completed ? 'default' : isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.25 : 1,
        marginBottom: 7,
        transition: 'opacity 0.12s, background 0.2s',
        overflow: 'visible',           // let confetti burst outside card bounds
        zIndex: celebrating ? 10 : 1, // float above sibling cards during burst
        touchAction: 'none',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Confetti */}
      {celebrating && <ConfettiBurst onDone={() => setCelebrating(false)} />}

      {/* Drag handle — visual affordance only, drag activates on whole card */}
      {!task.completed && (
        <div style={{ color: 'rgba(45,42,62,0.18)', flexShrink: 0, pointerEvents: 'none' }}>
          <DragHandle />
        </div>
      )}

      {/* Text */}
      <p style={{
        fontFamily: 'var(--font-nunito-sans)',
        fontSize: '13px',
        fontWeight: 700,
        color: task.completed ? '#9895B0' : '#1E1C2E',
        flex: 1,
        lineHeight: 1.35,
        marginLeft: task.completed ? 4 : 0,
      }}>
        {task.completed && (
          <span style={{ marginRight: 5 }}>🎉</span>
        )}
        {task.text}
      </p>

      {/* Notes dot */}
      {task.notes && !task.completed && (
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#F4A582', flexShrink: 0,
        }} />
      )}

      {/* Complete / done indicator */}
      {!task.completed ? (
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={handleComplete}
          style={{
            width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
            border: '1.8px solid rgba(45,42,62,0.15)',
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.15s, background 0.15s',
          }}
          onPointerEnter={e => {
            e.currentTarget.style.borderColor = '#5EC269'
            e.currentTarget.style.background  = 'rgba(94,194,105,0.08)'
          }}
          onPointerLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(45,42,62,0.15)'
            e.currentTarget.style.background  = 'transparent'
          }}
        />
      ) : (
        <div style={{
          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(94,194,105,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#5EC269" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Drag overlay ghost card
// ─────────────────────────────────────────────────────────

function TaskCardGhost({ task }: { task: Task }) {
  return (
    <div style={{
      background: 'white', borderRadius: 13,
      border: '1.5px solid rgba(244,165,130,0.45)',
      boxShadow: '0 10px 32px rgba(45,42,62,0.18)',
      padding: '10px 12px',
      display: 'flex', alignItems: 'center', gap: 10,
      transform: 'rotate(2deg) scale(1.02)',
    }}>
      <div style={{ color: 'rgba(45,42,62,0.18)', flexShrink: 0 }}>
        <DragHandle />
      </div>
      <p style={{
        fontFamily: 'var(--font-nunito-sans)', fontSize: '13px',
        fontWeight: 700, color: '#1E1C2E', flex: 1, lineHeight: 1.35,
      }}>
        {task.text}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Drop zone
// ─────────────────────────────────────────────────────────

function DropZone({
  zone, tasks, isActiveNow, isHardest,
  onComplete, onTap, addingHere, onStartAdd, onCancelAdd, onConfirmAdd,
}: {
  zone:          typeof ZONES[0]
  tasks:         Task[]
  isActiveNow:   boolean
  isHardest:     boolean
  onComplete:    (id: string) => void
  onTap:         (task: Task) => void
  addingHere:    boolean
  onStartAdd:    () => void
  onCancelAdd:   () => void
  onConfirmAdd:  (text: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: zone.key })
  const inputRef = useRef<HTMLInputElement>(null)
  const [addText, setAddText] = useState('')

  useEffect(() => {
    if (addingHere) {
      setAddText('')
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [addingHere])

  const incomplete = tasks.filter(t => !t.completed)
  const done       = tasks.filter(t =>  t.completed)

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
        <span style={{ lineHeight: 1, display: 'flex' }}>{zone.icon(isActiveNow ? zone.accentColor : '#9895B0')}</span>
        <p style={{
          fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 800,
          color: isActiveNow ? zone.accentColor : '#2D2A3E',
          transition: 'color 0.2s',
        }}>
          {zone.label}
        </p>
        <span style={{
          fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 600, color: '#9895B0',
        }}>
          {zone.timeLabel}
        </span>
        {isActiveNow && (
          <span style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-nunito-sans)', fontSize: '9px', fontWeight: 800,
            letterSpacing: '0.06em', color: zone.accentColor,
            background: zone.accentBg,
            border: `1px solid ${zone.accentColor}44`,
            borderRadius: 99, padding: '2px 8px',
          }}>
            NOW
          </span>
        )}
      </div>

      {/* Lumi hardest-time banner */}
      {isHardest && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 7,
          background: 'rgba(244,165,130,0.08)',
          border: '1px solid rgba(244,165,130,0.20)',
          borderRadius: 11, padding: '8px 11px', marginBottom: 9,
        }}>
          <span style={{ fontSize: 11, marginTop: 1 }}>✦</span>
          <p style={{
            fontFamily: 'var(--font-nunito-sans)', fontSize: '11.5px', fontWeight: 500,
            color: 'rgba(200,96,64,0.9)', lineHeight: 1.45,
          }}>
            <span style={{ fontWeight: 800 }}>Lumi: </span>
            {zone.hardestMessage}
          </p>
        </div>
      )}

      {/* Drop area */}
      <div
        ref={setNodeRef}
        style={{
          minHeight: tasks.length === 0 && !addingHere ? 44 : 'auto',
          borderRadius: 16,
          border: isOver
            ? `2px dashed ${zone.accentColor}`
            : '1.5px dashed rgba(45,42,62,0.12)',
          background: isOver ? zone.accentBg : 'transparent',
          padding: tasks.length > 0 || addingHere ? '10px 10px 3px' : '0',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        {/* Empty state */}
        {tasks.length === 0 && !addingHere && (
          <div style={{
            height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 18px', textAlign: 'center',
          }}>
            <p style={{
              fontFamily: 'var(--font-nunito-sans)', fontSize: '12px',
              fontWeight: 500, color: '#B0ACCA', lineHeight: 1.5,
            }}>
              {zone.emptyMessage}
            </p>
          </div>
        )}

        {/* Incomplete tasks */}
        {incomplete.map(task => (
          <TaskCard key={task.id} task={task} onComplete={onComplete} onTap={onTap} />
        ))}

        {/* Completed tasks */}
        {done.map(task => (
          <TaskCard key={task.id} task={task} onComplete={onComplete} onTap={onTap} />
        ))}

        {/* Inline add form */}
        {addingHere && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
            <input
              ref={inputRef}
              value={addText}
              onChange={e => setAddText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && addText.trim()) onConfirmAdd(addText.trim())
                if (e.key === 'Escape') onCancelAdd()
              }}
              placeholder="What's the task?"
              style={{
                flex: 1, padding: '9px 12px',
                fontFamily: 'var(--font-nunito-sans)', fontSize: '13px',
                fontWeight: 600, color: '#1E1C2E',
                background: 'white', border: '1.5px solid rgba(244,165,130,0.45)',
                borderRadius: 10, outline: 'none',
              }}
            />
            <button
              onClick={() => addText.trim() && onConfirmAdd(addText.trim())}
              style={{
                padding: '9px 14px', borderRadius: 10,
                background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
                border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-nunito-sans)', fontSize: '12px',
                fontWeight: 800, color: '#1E1C2E', flexShrink: 0,
              }}
            >
              Add
            </button>
            <button
              onClick={onCancelAdd}
              style={{
                padding: '9px 10px', borderRadius: 10,
                background: 'rgba(45,42,62,0.06)', border: 'none',
                cursor: 'pointer', color: '#9895B0',
                fontFamily: 'var(--font-nunito-sans)', fontSize: '12px', fontWeight: 700,
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* + Add task */}
      {!addingHere && (
        <button
          onClick={onStartAdd}
          style={{
            marginTop: 7, display: 'flex', alignItems: 'center', gap: 5,
            background: 'none', border: 'none', cursor: 'pointer', padding: '3px 2px',
            fontFamily: 'var(--font-nunito-sans)', fontSize: '12px',
            fontWeight: 700, color: '#9895B0',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Add task
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Tray — unblocked Brain Dump tasks
// ─────────────────────────────────────────────────────────

function TrayCard({ task, onTap }: { task: Task; onTap: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      draggable={false}
      style={{
        background: 'white', borderRadius: 12,
        border: '1px solid rgba(45,42,62,0.07)',
        padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 9,
        opacity: isDragging ? 0.2 : 1,
        marginBottom: 7,
        boxShadow: '0 1px 3px rgba(45,42,62,0.04)',
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <div style={{ color: 'rgba(45,42,62,0.18)', flexShrink: 0, pointerEvents: 'none' }}>
        <DragHandle />
      </div>
      <p style={{
        fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 600,
        color: '#2D2A3E', flex: 1, lineHeight: 1.3,
      }}>
        {task.text}
      </p>
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={onTap}
        style={{
          background: 'rgba(244,165,130,0.11)', border: '1px solid rgba(244,165,130,0.28)',
          borderRadius: 8, padding: '4px 10px', cursor: 'pointer', flexShrink: 0,
          fontFamily: 'var(--font-nunito-sans)', fontSize: '11px', fontWeight: 800,
          color: '#C86040',
        }}
      >
        Add →
      </button>
    </div>
  )
}

function Tray({ tasks, onAssign }: {
  tasks:    Task[]
  onAssign: (task: Task, block: TimeBlock) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'tray' })
  const [picking, setPicking] = useState<Task | null>(null)

  if (tasks.length === 0) return null

  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{
        fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800,
        letterSpacing: '0.1em', color: '#9895B0', marginBottom: 9,
      }}>
        FROM BRAIN DUMP
      </p>

      <div
        ref={setNodeRef}
        style={{
          background: isOver ? 'rgba(244,165,130,0.06)' : 'transparent',
          border: `1.5px dashed ${isOver ? 'rgba(244,165,130,0.45)' : 'rgba(45,42,62,0.10)'}`,
          borderRadius: 16, padding: '8px 8px 1px',
          transition: 'all 0.15s',
        }}
      >
        {tasks.map(task => (
          <TrayCard key={task.id} task={task} onTap={() => setPicking(task)} />
        ))}
      </div>

      {/* Block picker sheet */}
      {picking && (
        <>
          <div
            onClick={() => setPicking(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              background: 'rgba(30,28,46,0.4)',
              backdropFilter: 'blur(2px)',
            }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
            background: '#FBF8F5', borderRadius: '22px 22px 0 0',
            padding: '16px 20px 44px',
            boxShadow: '0 -8px 40px rgba(45,42,62,0.14)',
          }}>
            <div style={{
              width: 36, height: 4, borderRadius: 2,
              background: 'rgba(45,42,62,0.12)', margin: '0 auto 18px',
            }} />
            <p style={{
              fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800,
              letterSpacing: '0.1em', color: '#9895B0', marginBottom: 5,
            }}>
              ADD TO WHICH BLOCK?
            </p>
            <p style={{
              fontFamily: 'var(--font-fraunces)', fontSize: '18px', fontWeight: 700,
              color: '#1E1C2E', marginBottom: 20, lineHeight: 1.25,
            }}>
              {picking.text}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ZONES.map(z => (
                <button
                  key={z.key}
                  onClick={() => { onAssign(picking, z.key); setPicking(null) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 14,
                    background: z.accentBg, border: `1.5px solid ${z.borderColor}`,
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ display: 'flex', width: 22, alignItems: 'center', justifyContent: 'center' }}>
                    {z.icon(z.accentColor)}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-nunito-sans)', fontSize: '14px',
                    fontWeight: 800, color: '#1E1C2E', flex: 1,
                  }}>
                    {z.label}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-nunito-sans)', fontSize: '11px',
                    fontWeight: 500, color: '#9895B0',
                  }}>
                    {z.timeLabel}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Task detail drawer
// ─────────────────────────────────────────────────────────

function TaskDetailDrawer({
  task, onClose, onSave, onDelete, onComplete,
}: {
  task:       Task | null
  onClose:    () => void
  onSave:     (id: string, text: string, notes: string) => void
  onDelete:   (id: string) => void
  onComplete: (id: string) => void
}) {
  const [text,  setText]  = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    setText(task?.text  ?? '')
    setNotes(task?.notes ?? '')
  }, [task?.id])

  if (!task) return null

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(30,28,46,0.42)',
          backdropFilter: 'blur(2px)',
        }}
      />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: '#FBF8F5', borderRadius: '22px 22px 0 0',
        padding: '16px 20px 44px',
        boxShadow: '0 -8px 40px rgba(45,42,62,0.16)',
      }}>
        {/* Handle bar */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'rgba(45,42,62,0.12)', margin: '0 auto 20px',
        }} />

        {/* Task name input */}
        <p style={{
          fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800,
          letterSpacing: '0.1em', color: '#9895B0', marginBottom: 6,
        }}>
          TASK
        </p>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={task.completed}
          style={{
            width: '100%', padding: '12px 14px', boxSizing: 'border-box',
            fontFamily: 'var(--font-nunito-sans)', fontSize: '15px', fontWeight: 700,
            color: task.completed ? '#9895B0' : '#1E1C2E',
            background: 'white', border: '1px solid rgba(45,42,62,0.10)',
            borderRadius: 12, outline: 'none', marginBottom: 16,
            opacity: task.completed ? 0.7 : 1,
          }}
        />

        {/* Notes */}
        <p style={{
          fontFamily: 'var(--font-nunito-sans)', fontSize: '10px', fontWeight: 800,
          letterSpacing: '0.1em', color: '#9895B0', marginBottom: 6,
        }}>
          NOTES
        </p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          disabled={task.completed}
          placeholder="Context, steps, anything helpful…"
          rows={3}
          style={{
            width: '100%', padding: '12px 14px', boxSizing: 'border-box',
            fontFamily: 'var(--font-nunito-sans)', fontSize: '13px', fontWeight: 500,
            color: '#1E1C2E', lineHeight: 1.55,
            background: 'white', border: '1px solid rgba(45,42,62,0.10)',
            borderRadius: 12, outline: 'none', resize: 'none', marginBottom: 20,
            opacity: task.completed ? 0.7 : 1,
          }}
        />

        {/* Action buttons */}
        {!task.completed ? (
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <button
              onClick={() => { onComplete(task.id); onClose() }}
              style={{
                flex: 1, padding: '13px',
                background: 'rgba(94,194,105,0.10)',
                border: '1.5px solid rgba(94,194,105,0.28)',
                borderRadius: 13, cursor: 'pointer',
                fontFamily: 'var(--font-nunito-sans)', fontSize: '13px',
                fontWeight: 800, color: '#3a9a47',
              }}
            >
              Done 🎉
            </button>
            <button
              onClick={() => { onSave(task.id, text.trim() || task.text, notes); onClose() }}
              style={{
                flex: 1, padding: '13px',
                background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
                border: 'none', borderRadius: 13, cursor: 'pointer',
                fontFamily: 'var(--font-nunito-sans)', fontSize: '13px',
                fontWeight: 800, color: '#1E1C2E',
              }}
            >
              Save
            </button>
          </div>
        ) : (
          <div style={{
            textAlign: 'center', padding: '14px',
            background: 'rgba(94,194,105,0.08)',
            border: '1px solid rgba(94,194,105,0.2)',
            borderRadius: 13, marginBottom: 12,
            fontFamily: 'var(--font-nunito-sans)', fontSize: '13px',
            fontWeight: 700, color: '#3a9a47',
          }}>
            🎉 Completed — nice work.
          </div>
        )}

        {/* Remove from day */}
        <button
          onClick={() => { onDelete(task.id); onClose() }}
          style={{
            display: 'block', width: '100%',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-nunito-sans)', fontSize: '12px',
            fontWeight: 600, color: 'rgba(45,42,62,0.32)',
            textAlign: 'center', padding: '4px',
          }}
        >
          Remove from day
        </button>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────

export default function YourDay() {
  const [blocked,   setBlocked]   = useState<BlockedState>({ morning: [], afternoon: [], evening: [] })
  const [tray,      setTray]      = useState<Task[]>([])
  const [hardest,   setHardest]   = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [dragging,  setDragging]  = useState<Task | null>(null)
  const [editing,   setEditing]   = useState<Task | null>(null)
  const [addingTo,  setAddingTo]  = useState<TimeBlock | null>(null)
  const activeBlock = currentBlock()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 180, tolerance: 6 } }),
  )

  const load = useCallback(async () => {
    try {
      const res  = await fetch('/api/your-day')
      const data = await res.json()
      const b: BlockedState = { morning: [], afternoon: [], evening: [] }
      for (const t of data.blocked ?? []) {
        if (t.time_block && t.time_block in b) b[t.time_block as TimeBlock].push(t)
      }
      setBlocked(b)
      setTray(data.tray ?? [])
      setHardest(data.hardestTime ?? null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Drag helpers ─────────────────────────────────────────

  function findTask(id: string): Task | undefined {
    return [...blocked.morning, ...blocked.afternoon, ...blocked.evening, ...tray].find(t => t.id === id)
  }

  function handleDragStart(e: DragStartEvent) {
    const task = findTask(e.active.id as string)
    if (task) setDragging(task)
  }

  function handleDragEnd(e: DragEndEvent) {
    setDragging(null)
    const { active, over } = e
    if (!over) return

    const taskId   = active.id as string
    const target   = over.id  as string
    const newBlock = target === 'tray' ? null : target as TimeBlock

    let moved: Task | undefined
    const nb: BlockedState = {
      morning:   blocked.morning.filter(t =>   { if (t.id === taskId) { moved = t; return false } return true }),
      afternoon: blocked.afternoon.filter(t => { if (t.id === taskId) { moved = t; return false } return true }),
      evening:   blocked.evening.filter(t =>   { if (t.id === taskId) { moved = t; return false } return true }),
    }
    const nt = tray.filter(t => { if (t.id === taskId) { moved = t; return false } return true })
    if (!moved) return

    const updated = { ...moved, time_block: newBlock }
    if (newBlock) nb[newBlock] = [...nb[newBlock], updated]
    else          nt.unshift(updated)

    setBlocked(nb)
    setTray(nt)

    fetch('/api/captures', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, time_block: newBlock }),
    })
  }

  // ── CRUD helpers ──────────────────────────────────────────

  function handleComplete(id: string) {
    const upd = (arr: Task[]) => arr.map(t => t.id === id ? { ...t, completed: true } : t)
    setBlocked(p => ({ morning: upd(p.morning), afternoon: upd(p.afternoon), evening: upd(p.evening) }))
    setTray(prev => prev.filter(t => t.id !== id))
    fetch('/api/captures', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, completed: true }),
    })
  }

  function handleSave(id: string, text: string, notes: string) {
    const upd = (arr: Task[]) => arr.map(t => t.id === id ? { ...t, text, notes } : t)
    setBlocked(p => ({ morning: upd(p.morning), afternoon: upd(p.afternoon), evening: upd(p.evening) }))
    setTray(prev => prev.map(t => t.id === id ? { ...t, text, notes } : t))
    fetch('/api/captures', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, text, notes }),
    })
  }

  function handleDelete(id: string) {
    setBlocked(p => ({
      morning:   p.morning.filter(t =>   t.id !== id),
      afternoon: p.afternoon.filter(t => t.id !== id),
      evening:   p.evening.filter(t =>   t.id !== id),
    }))
    setTray(prev => prev.filter(t => t.id !== id))
    fetch(`/api/captures?id=${id}`, { method: 'DELETE' })
  }

  function handleAssignFromTray(task: Task, block: TimeBlock) {
    setTray(prev => prev.filter(t => t.id !== task.id))
    setBlocked(p => ({ ...p, [block]: [...p[block], { ...task, time_block: block }] }))
    fetch('/api/captures', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, time_block: block }),
    })
  }

  async function handleConfirmAdd(text: string) {
    if (!addingTo) return
    setAddingTo(null)
    const block = addingTo

    const res  = await fetch('/api/captures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, tag: 'task' }),
    })
    const created: Task = await res.json()
    const withBlock = { ...created, time_block: block, notes: null }
    setBlocked(p => ({ ...p, [block]: [...p[block], withBlock] }))

    // Persist the block assignment
    fetch('/api/captures', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: created.id, time_block: block }),
    })
  }

  // ── Skeleton ──────────────────────────────────────────────

  if (loading) {
    return (
      <div>
        <style>{`@keyframes shimmer { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }`}</style>
        {[72, 60, 68].map((h, i) => (
          <div key={i} style={{
            height: h, borderRadius: 16, marginBottom: 12,
            background: 'linear-gradient(90deg, rgba(45,42,62,0.05) 25%, rgba(45,42,62,0.09) 50%, rgba(45,42,62,0.05) 75%)',
            backgroundSize: '200% 100%', animation: `shimmer 1.4s ease-in-out infinite ${i * 0.1}s`,
          }} />
        ))}
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>

        {/* Brain Dump tray */}
        <Tray tasks={tray} onAssign={handleAssignFromTray} />

        {/* Three time-block zones */}
        {ZONES.map(zone => (
          <DropZone
            key={zone.key}
            zone={zone}
            tasks={blocked[zone.key]}
            isActiveNow={activeBlock === zone.key}
            isHardest={hardest === zone.key}
            onComplete={handleComplete}
            onTap={task => setEditing(task)}
            addingHere={addingTo === zone.key}
            onStartAdd={() => setAddingTo(zone.key)}
            onCancelAdd={() => setAddingTo(null)}
            onConfirmAdd={handleConfirmAdd}
          />
        ))}

        {/* Ghost card while dragging */}
        <DragOverlay>
          {dragging && <TaskCardGhost task={dragging} />}
        </DragOverlay>

      </DndContext>

      {/* Task detail drawer */}
      <TaskDetailDrawer
        task={editing}
        onClose={() => setEditing(null)}
        onSave={handleSave}
        onDelete={handleDelete}
        onComplete={handleComplete}
      />
    </>
  )
}
