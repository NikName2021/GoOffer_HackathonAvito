import { useState } from 'react'

import type {
  CreateOwnAdRequest,
  CreateProfileRequest,
  CreateViewedAdRequest,
} from '@/types/profileRequest.type'

function createEmptyProfile(): CreateProfileRequest {
  return {
    name: '',
    joinedAt: '',
    likes: 0,
    chatsCount: 0,
    ownAds: [],
    views: [],
  }
}

function createEmptyOwnAd(): CreateOwnAdRequest {
  return {
    title: '',
    category: '',
    price: 0,
    viewCount: 0,
    isArchived: false,
    isSold: false,
  }
}

function createEmptyView(): CreateViewedAdRequest {
  return {
    title: '',
    category: '',
    price: 0,
    viewCount: 0,
    lastViewedAt: '',
    isFavorite: false,
    isPurchased: false,
  }
}

export function useCreateProfileForm() {
  const [profile, setProfile] = useState<CreateProfileRequest>(createEmptyProfile)

  function updateProfile(patch: Partial<CreateProfileRequest>) {
    setProfile((current) => ({ ...current, ...patch }))
  }

  function addOwnAd() {
    setProfile((current) => ({ ...current, ownAds: [...current.ownAds, createEmptyOwnAd()] }))
  }

  function updateOwnAd(index: number, ad: CreateOwnAdRequest) {
    setProfile((current) => ({
      ...current,
      ownAds: current.ownAds.map((item, itemIndex) => (itemIndex === index ? ad : item)),
    }))
  }

  function removeOwnAd(index: number) {
    setProfile((current) => ({
      ...current,
      ownAds: current.ownAds.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  function addView() {
    setProfile((current) => ({ ...current, views: [...current.views, createEmptyView()] }))
  }

  function updateView(index: number, view: CreateViewedAdRequest) {
    setProfile((current) => ({
      ...current,
      views: current.views.map((item, itemIndex) => (itemIndex === index ? view : item)),
    }))
  }

  function removeView(index: number) {
    setProfile((current) => ({
      ...current,
      views: current.views.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  return {
    addOwnAd,
    addView,
    profile,
    removeOwnAd,
    removeView,
    reset: () => setProfile(createEmptyProfile()),
    updateOwnAd,
    updateProfile,
    updateView,
  }
}
