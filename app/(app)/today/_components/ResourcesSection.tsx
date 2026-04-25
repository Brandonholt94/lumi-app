'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'

interface ResourceItem {
  id: string
  title: string
  slug: string
  excerpt: string
  thumbnailUrl: string | null
  categoryName: string | null
  url: string
}

export default function ResourcesSection({ desktop = false }: { desktop?: boolean }) {
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/resources')
      .then(r => r.json())
      .then(d => setResources(d.resources ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!loading && resources.length === 0) return null

  // Desktop Insights: 4-card Swiper slider
  if (desktop) {
    return (
      <div style={{ marginTop: 8, paddingBottom: 40 }}>
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
          color: '#9895B0', marginBottom: 14,
        }}>
          FROM THE LUMI LIBRARY
        </p>
        <style>{`
          /* Hide Swiper's default arrows — we use custom buttons */
          .lumi-resources-swiper .swiper-button-prev,
          .lumi-resources-swiper .swiper-button-next { display: none !important; }

          /* Custom nav buttons */
          .lumi-swiper-prev, .lumi-swiper-next {
            position: absolute;
            top: 42%;
            transform: translateY(-50%);
            z-index: 10;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: white;
            border: 1px solid rgba(45,42,62,0.10);
            box-shadow: 0 2px 10px rgba(45,42,62,0.12);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: box-shadow 0.15s, opacity 0.2s;
          }
          .lumi-swiper-prev:hover, .lumi-swiper-next:hover {
            box-shadow: 0 4px 16px rgba(45,42,62,0.16);
          }
          .lumi-swiper-prev { left: -18px; }
          .lumi-swiper-next { right: -18px; }
          .lumi-swiper-prev.swiper-button-disabled,
          .lumi-swiper-next.swiper-button-disabled { opacity: 0; pointer-events: none; }
        `}</style>
        <div style={{ position: 'relative', margin: '0 20px' }}>
          <button className="lumi-swiper-prev">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#2D2A3E" viewBox="0 0 256 256">
              <path d="M168.49,199.51a12,12,0,0,1-17,17l-80-80a12,12,0,0,1,0-17l80-80a12,12,0,0,1,17,17L97,128Z"/>
            </svg>
          </button>
          <button className="lumi-swiper-next">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#2D2A3E" viewBox="0 0 256 256">
              <path d="M184.49,136.49l-80,80a12,12,0,0,1-17-17L159,128,87.51,56.49a12,12,0,1,1,17-17l80,80A12,12,0,0,1,184.49,136.49Z"/>
            </svg>
          </button>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} tall />)}
            </div>
          ) : (
            <Swiper
              modules={[Navigation]}
              navigation={{ prevEl: '.lumi-swiper-prev', nextEl: '.lumi-swiper-next' }}
              slidesPerView={4}
              spaceBetween={16}
              className="lumi-resources-swiper"
            >
              {resources.map(r => (
                <SwiperSlide key={r.id}>
                  <ResourceCard resource={r} tall />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </div>
    )
  }

  // Mobile / Today: horizontal scroll strip
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{
        fontFamily: 'var(--font-nunito-sans)',
        fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
        color: '#9895B0', marginBottom: 10,
      }}>
        FROM THE LUMI LIBRARY
      </p>

      {/* Horizontal scroll container — negative margin to bleed past px-5 */}
      <div style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        marginLeft: -20,
        marginRight: -20,
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 4,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
        className="hide-scrollbar"
      >
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : resources.map(r => <ResourceCard key={r.id} resource={r} />)
        }
      </div>
    </div>
  )
}

function ResourceCard({ resource, tall = false }: { resource: ResourceItem; tall?: boolean }) {
  const imgH = tall ? 180 : 96
  const cardW = tall ? undefined : 160  // grid cards: full column width; scroll cards: fixed 160

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        flexShrink: tall ? undefined : 0,
        width: cardW,
        borderRadius: 16,
        background: 'white',
        border: '1px solid rgba(45,42,62,0.07)',
        boxShadow: '0 2px 8px rgba(45,42,62,0.06)',
        textDecoration: 'none',
        display: 'block',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        padding: '8px 8px 0',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 6px 20px rgba(45,42,62,0.10)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 2px 8px rgba(45,42,62,0.06)' }}
      onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
      onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.97)')}
      onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {/* Thumbnail */}
      <div style={{ width: '100%', height: imgH, background: '#F3EFE9', position: 'relative', overflow: 'hidden', borderRadius: 10 }}>
        {resource.thumbnailUrl ? (
          <Image
            src={resource.thumbnailUrl}
            alt={resource.title}
            fill
            style={{ objectFit: 'cover' }}
            sizes={tall ? '33vw' : '160px'}
            unoptimized
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, rgba(244,165,130,0.25), rgba(245,201,138,0.2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="rgba(244,165,130,0.5)"/>
            </svg>
          </div>
        )}
      </div>

      {/* Text */}
      <div style={{ padding: tall ? '12px 6px 16px' : '10px 3px 12px' }}>
        {resource.categoryName && (
          <p style={{
            fontFamily: 'var(--font-nunito-sans)',
            fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
            color: '#F4A582', marginBottom: 5, textTransform: 'uppercase',
          }}>
            {resource.categoryName}
          </p>
        )}
        <p style={{
          fontFamily: 'var(--font-nunito-sans)',
          fontSize: tall ? 14 : 12,
          fontWeight: 700,
          color: '#2D2A3E',
          lineHeight: 1.35,
          display: '-webkit-box',
          WebkitLineClamp: tall ? 2 : 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {resource.title}
        </p>
      </div>
    </a>
  )
}

function SkeletonCard({ tall = false }: { tall?: boolean }) {
  return (
    <div style={{
      flexShrink: tall ? undefined : 0,
      width: tall ? undefined : 160,
      borderRadius: 16,
      background: 'white',
      border: '1px solid rgba(45,42,62,0.07)',
      padding: '8px 8px 0',
    }}>
      <div style={{ width: '100%', height: tall ? 180 : 96, borderRadius: 10, background: '#F0EDE8', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ padding: '10px 11px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ height: 8, width: '50%', borderRadius: 4, background: '#F0EDE8', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 10, width: '90%', borderRadius: 4, background: '#F0EDE8', animation: 'pulse 1.5s ease-in-out 0.1s infinite' }} />
        <div style={{ height: 10, width: '70%', borderRadius: 4, background: '#F0EDE8', animation: 'pulse 1.5s ease-in-out 0.2s infinite' }} />
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
