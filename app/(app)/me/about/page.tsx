import Link from 'next/link'
import MeHeader from '../_components/MeHeader'

function AboutRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '13px 16px',
      borderBottom: '1px solid rgba(45,42,62,0.06)',
    }}>
      <span style={{
        fontFamily: 'var(--font-nunito-sans)',
        fontSize: '14px',
        fontWeight: 600,
        color: '#9895B0',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-nunito-sans)',
        fontSize: '14px',
        fontWeight: 700,
        color: '#2D2A3E',
      }}>
        {value}
      </span>
    </div>
  )
}

export default function AboutPage() {
  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ paddingBottom: 48 }}>

      <MeHeader title="About Lumi" />

      <div className="px-5">

        {/* Brand mark + tagline */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/lumi-wordmark-dark.svg"
            alt="Lumi"
            style={{ height: 32, marginBottom: 10, display: 'inline-block' }}
          />
          <p style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: '13px',
            fontWeight: 600,
            color: '#9895B0',
            lineHeight: 1.5,
          }}>
            Your AI companion for the ADHD brain.{'\n'}167 hours a week — whenever you need it.
          </p>
        </div>

        {/* App info */}
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.1em',
          color: '#9895B0',
          marginBottom: 8,
          paddingLeft: 4,
        }}>
          APP INFO
        </p>

        <div style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid rgba(45,42,62,0.07)',
          overflow: 'hidden',
          marginBottom: 20,
        }}>
          <AboutRow label="Version" value="v0.1" />
          <AboutRow label="Built by" value="Craft + Code LLC" />
          <AboutRow label="Website" value="lumimind.app" />
          <div style={{ padding: '13px 16px' }}>
            <span style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '14px',
              fontWeight: 600,
              color: '#9895B0',
            }}>
              AI powered by
            </span>
            <span style={{
              fontFamily: 'var(--font-nunito-sans)',
              fontSize: '14px',
              fontWeight: 700,
              color: '#2D2A3E',
              marginLeft: 8,
            }}>
              Claude (Anthropic)
            </span>
          </div>
        </div>

        {/* Legal */}
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.1em',
          color: '#9895B0',
          marginBottom: 8,
          paddingLeft: 4,
        }}>
          LEGAL
        </p>

        <div style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid rgba(45,42,62,0.07)',
          overflow: 'hidden',
          marginBottom: 24,
        }}>
          <a href="https://lumimind.app/privacy" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 16px',
            borderBottom: '1px solid rgba(45,42,62,0.06)',
            textDecoration: 'none',
          }}>
            <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '14px', fontWeight: 600, color: '#2D2A3E' }}>
              Privacy Policy
            </span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M6 3L11 8L6 13" stroke="#C4C0D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <a href="https://lumimind.app/terms" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 16px',
            textDecoration: 'none',
          }}>
            <span style={{ fontFamily: 'var(--font-nunito-sans)', fontSize: '14px', fontWeight: 600, color: '#2D2A3E' }}>
              Terms of Service
            </span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M6 3L11 8L6 13" stroke="#C4C0D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>

        <p style={{
          textAlign: 'center',
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: '12px',
          fontWeight: 600,
          color: 'rgba(45,42,62,0.3)',
          lineHeight: 1.5,
        }}>
          Made with care for the ADHD community.{'\n'}Lumi is not a medical device or crisis line.
        </p>

      </div>
    </div>
  )
}
