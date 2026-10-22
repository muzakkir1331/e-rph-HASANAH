'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import OnboardingModal from '@/components/profile/OnboardingModal';
import UpgradeToProModal from '@/components/subscription/UpgradeToProModal';

export default function ModalContainer() {
  const {
    isOnboardingModalOpen,
    setIsOnboardingModalOpen,
    isUpgradeModalOpen,
    setIsUpgradeModalOpen
  } = useAuth();

  return (
    <>
      <OnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
      />
      <UpgradeToProModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </>
  );
}
