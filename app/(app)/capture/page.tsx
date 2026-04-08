import CaptureInput from './_components/CaptureInput'

function getFormattedDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export default function CapturePage() {
  const date = getFormattedDate()

  return (
    <div className="flex flex-col h-full px-5 pt-3 pb-4 overflow-y-auto">

      {/* Header */}
      <h1
        className="leading-none mb-[4px]"
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: '34px',
          fontWeight: 900,
          color: '#1E1C2E',
        }}
      >
        Brain Dump
      </h1>
      <p
        className="mb-4"
        style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '12px',
          fontWeight: 600,
          color: '#9895B0',
        }}
      >
        {date}
      </p>

      {/* Lumi hint */}
      <div
        className="rounded-[14px] px-4 py-3 mb-4 flex gap-[10px] items-start"
        style={{
          background: 'rgba(244,165,130,0.07)',
          border: '1.5px solid rgba(244,165,130,0.18)',
        }}
      >
        <span style={{ fontSize: '13px', marginTop: '1px', flexShrink: 0 }}>✦</span>
        <p
          style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '12px',
            fontWeight: 600,
            color: '#2D2A3E',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: '#F4A582', fontWeight: 700 }}>Lumi: </strong>
          No sorting, no priority — just get it out of your head. That&apos;s the whole job right now.
        </p>
      </div>

      {/* Interactive capture input + list */}
      <CaptureInput />

    </div>
  )
}
