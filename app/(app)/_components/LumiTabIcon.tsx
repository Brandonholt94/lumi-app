'use client'

import Lottie, { LottieRefCurrentProps } from 'lottie-react'
import { useRef } from 'react'
import animationData from '../../../public/lottie-sunrise.json'

export default function LumiTabIcon() {
  const lottieRef = useRef<LottieRefCurrentProps>(null)

  function handleClick() {
    const anim = lottieRef.current
    if (!anim) return
    anim.goToAndPlay(0, true)
  }

  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
        boxShadow: '0 4px 20px rgba(244,165,130,0.5)',
      }}
      onClick={handleClick}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        autoplay={false}
        loop={false}
        style={{ width: 32, height: 32 }}
      />
    </div>
  )
}
