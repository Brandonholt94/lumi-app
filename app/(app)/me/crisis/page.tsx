import Link from 'next/link'
import MeHeader from '../_components/MeHeader'

function ResourceCard({
  icon,
  name,
  description,
  contact,
  href,
}: {
  icon: string
  name: string
  description: string
  contact: string
  href: string
}) {
  return (
    <a
      href={href}
      style={{
        display: 'block',
        background: 'white',
        borderRadius: 16,
        border: '1px solid rgba(45,42,62,0.07)',
        padding: '16px 18px',
        marginBottom: 10,
        textDecoration: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 24, flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <p style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '15px',
            fontWeight: 800,
            color: '#1E1C2E',
            marginBottom: 3,
          }}>
            {name}
          </p>
          <p style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '12px',
            fontWeight: 600,
            color: '#9895B0',
            lineHeight: 1.4,
            marginBottom: 8,
          }}>
            {description}
          </p>
          <span style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, rgba(244,165,130,0.12), rgba(245,201,138,0.12))',
            borderRadius: 8,
            padding: '5px 10px',
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '13px',
            fontWeight: 800,
            color: '#2D2A3E',
          }}>
            {contact}
          </span>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 4 }}>
          <path d="M3 8H13M9 4L13 8L9 12" stroke="#C4C0D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </a>
  )
}

export default function CrisisPage() {
  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#FBF8F5', paddingBottom: 48 }}>

      <MeHeader title="Crisis resources" />

      {/* Warm intro */}
      <div className="px-5" style={{ paddingTop: 20, paddingBottom: 4 }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(244,165,130,0.1), rgba(245,201,138,0.1))',
          borderRadius: 14,
          padding: '14px 16px',
        }}>
          <p style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '14px',
            fontWeight: 600,
            color: '#2D2A3E',
            lineHeight: 1.55,
          }}>
            You being here matters. If you&apos;re struggling right now, please reach out to one of these real humans. Lumi is a companion, not a crisis line.
          </p>
        </div>
      </div>

      <div className="px-5">

        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.1em',
          color: '#9895B0',
          marginBottom: 10,
          paddingLeft: 4,
        }}>
          24/7 SUPPORT
        </p>

        <ResourceCard
          icon="🆘"
          name="988 Suicide & Crisis Lifeline"
          description="Free, confidential support for people in distress. Call or text anytime."
          contact="Call or text 988"
          href="https://988lifeline.org"
        />

        <ResourceCard
          icon="💬"
          name="Crisis Text Line"
          description="Text with a trained crisis counselor. No phone call needed."
          contact="Text HOME to 741741"
          href="https://www.crisistextline.org"
        />

        <ResourceCard
          icon="🧠"
          name="NAMI Helpline"
          description="National Alliance on Mental Illness. Mental health information and support."
          contact="1-800-950-NAMI"
          href="https://www.nami.org/help"
        />

        <ResourceCard
          icon="🌐"
          name="International Association"
          description="Find crisis centers worldwide — if you&apos;re outside the US."
          contact="iasp.info/resources"
          href="https://www.iasp.info/resources/Crisis_Centres/"
        />

        <p style={{
          marginTop: 20,
          textAlign: 'center',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '12px',
          fontWeight: 600,
          color: 'rgba(45,42,62,0.4)',
          lineHeight: 1.5,
        }}>
          Lumi is not a substitute for professional mental health support.
        </p>

      </div>
    </div>
  )
}
