import { SignIn } from '@clerk/nextjs'
import Image from 'next/image'

const appearance = {
  variables: {
    colorPrimary: '#F4A582',
    colorBackground: '#FFFFFF',
    colorInputBackground: '#F9F6F2',
    colorText: '#1E1C2E',
    colorTextSecondary: '#7A7890',
    colorDanger: '#E8A0BF',
    colorSuccess: '#5EC269',
    borderRadius: '12px',
    fontFamily: 'var(--font-nunito-sans), sans-serif',
    fontFamilyButtons: 'var(--font-nunito-sans), sans-serif',
    fontSize: '15px',
  },
  elements: {
    // Card
    card: {
      boxShadow: '0 4px 24px rgba(45,42,62,0.08)',
      border: '1px solid rgba(45,42,62,0.07)',
      borderRadius: '20px',
    },
    // Hide Clerk's default header (we have our own logo above)
    headerTitle: { display: 'none' },
    headerSubtitle: { display: 'none' },
    logoBox: { display: 'none' },
    // Form labels
    formFieldLabel: {
      fontFamily: 'var(--font-nunito-sans), sans-serif',
      fontWeight: '700',
      fontSize: '12px',
      color: '#2D2A3E',
      letterSpacing: '0.02em',
    },
    // Inputs
    formFieldInput: {
      borderRadius: '10px',
      border: '1.5px solid rgba(45,42,62,0.12)',
      fontFamily: 'var(--font-nunito-sans), sans-serif',
      fontWeight: '600',
      fontSize: '15px',
      color: '#1E1C2E',
      background: '#F9F6F2',
      padding: '12px 14px',
      transition: 'border-color 0.2s',
    },
    formFieldInputShowPasswordButton: {
      color: '#7A7890',
    },
    // Primary button
    formButtonPrimary: {
      background: 'linear-gradient(135deg, #F4A582, #F5C98A)',
      color: '#1E1C2E',
      fontFamily: 'var(--font-nunito-sans), sans-serif',
      fontWeight: '800',
      fontSize: '15px',
      borderRadius: '12px',
      padding: '13px',
      boxShadow: 'none',
      border: 'none',
    },
    // Social buttons
    socialButtonsBlockButton: {
      borderRadius: '10px',
      border: '1.5px solid rgba(45,42,62,0.12)',
      fontFamily: 'var(--font-nunito-sans), sans-serif',
      fontWeight: '700',
      fontSize: '14px',
      color: '#1E1C2E',
      background: '#FFFFFF',
    },
    // Divider
    dividerLine: { background: 'rgba(45,42,62,0.08)' },
    dividerText: {
      fontFamily: 'var(--font-nunito-sans), sans-serif',
      fontSize: '12px',
      fontWeight: '600',
      color: '#9895B0',
    },
    // Footer links
    footerActionLink: {
      color: '#F4A582',
      fontWeight: '700',
    },
    footerActionText: {
      fontFamily: 'var(--font-nunito-sans), sans-serif',
      fontSize: '13px',
      color: '#7A7890',
    },
    // Internal nav links
    identityPreviewText: {
      fontFamily: 'var(--font-nunito-sans), sans-serif',
    },
    formResendCodeLink: {
      color: '#F4A582',
      fontWeight: '700',
    },
    // Error messages
    formFieldErrorText: {
      fontFamily: 'var(--font-nunito-sans), sans-serif',
      fontSize: '12px',
      fontWeight: '600',
    },
    alertText: {
      fontFamily: 'var(--font-nunito-sans), sans-serif',
      fontSize: '13px',
      fontWeight: '600',
    },
  },
}

export default function SignInPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: '#FBF8F5', padding: '24px 16px' }}
    >
      {/* Lumi wordmark */}
      <div style={{ marginBottom: 28 }}>
        <Image
          src="/lumi-wordmark-dark.svg"
          alt="Lumi"
          width={100}
          height={39}
          priority
        />
      </div>

      {/* Tagline */}
      <p style={{
        fontFamily: 'var(--font-nunito-sans)',
        fontSize: '14px',
        fontWeight: '600',
        color: '#9895B0',
        marginBottom: 28,
        textAlign: 'center',
      }}>
        Welcome back. Lumi missed you.
      </p>

      <SignIn appearance={appearance} />
    </div>
  )
}
