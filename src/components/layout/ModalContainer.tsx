'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import OnboardingModal from '@/components/profile/OnboardingModal';

export default function ModalContainer() {
  const {
    isOnboardingModalOpen,
    setIsOnboardingModalOpen
  } = useAuth();

  return (
    <>
      <OnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
      />
    </>
  );
}
