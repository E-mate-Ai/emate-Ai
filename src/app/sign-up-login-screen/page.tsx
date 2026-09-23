import React from 'react';
import type { Metadata } from 'next';
import AuthScreen from './components/AuthScreen';

export const metadata: Metadata = {
  title: 'Sign In or Create Account — e-Mate AI',
  description:
    'Log in or register for e-Mate AI to sync your subject notebooks, track your quiz mastery, and access personalized AI study tools.',
  alternates: {
    canonical: '/sign-up-login-screen',
  },
};

export default function SignUpLoginPage() {
  return <AuthScreen />;
}
