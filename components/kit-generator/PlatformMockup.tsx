'use client'

// ─── PlatformMockup ───────────────────────────────────────────────────────────
// Shows each Photoroom-processed image inside a realistic platform UI frame.
// No extra API calls — purely CSS + the already-processed imageUrl.
//
// Supported platforms: Amazon listing · Instagram post · Facebook/Meta ad ·
//                      Pinterest pin  · TikTok Shop video

import type { ImageStyle } from '@/types'

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface PlatformMockupProps {
  imageUrl:     string      // Photoroom-processed image
  style:        ImageStyle  // drives which mockup renders
  productTitle: string      // from kit.scraped.title
  price?:       string      // from kit.scraped.price
  headline?:    string      // from copy.bullets[0] — used in Ads mockup
  description?: string      // truncated for Instagram / TikTok caption
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function trunc(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

// ─── Amazon listing ───────────────────────────────────────────────────────────

function AmazonMockup({ imageUrl, productTitle, price }: PlatformMockupProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-border-subtle bg-white shadow-sm">

      {/* Top navigation bar */}
      <div className="bg-[#131921] px-3 py-2 flex items-center gap-2">
        <span className="text-[#FF9900] font-extrabold text-sm tracking-tight select-none">
          amazon
        </span>
        <div className="flex-1 bg-[#FF9900] rounded-sm h-5 flex items-center px-2">
          <span className="text-[10px] text-gray-700 opacity-50 truncate">Search Amazon</span>
        </div>
        {/* Cart icon */}
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current opacity-80 shrink-0" aria-hidden="true">
          <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9h14l-2-9M9 21a1 1 0 1 0 2 0 1 1 0 0 0-2 0m6 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0"/>
        </svg>
      </div>

      {/* Product image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={productTitle}
        className="w-full aspect-square object-cover"
        draggable={false}
      />

      {/* Product info */}
      <div className="p-3 flex flex-col gap-2">
        <p className="text-xs font-medium text-gray-800 leading-tight line-clamp-2">
          {productTitle}
        </p>
        {/* Star rating */}
        <div className="flex items-center gap-1">
          <span className="text-[#FF9900] text-xs leading-none">★★★★</span>
          <span className="text-[#FF9900] text-xs leading-none opacity-40">★</span>
          <span className="text-[#007185] text-[10px] ml-0.5">4.5 · 1,247 ratings</span>
        </div>
        {/* Price */}
        <p className="text-base font-bold text-gray-900">{price ?? '$29.99'}</p>
        {/* CTAs */}
        <button className="w-full bg-[#FFD814] text-gray-900 text-xs font-semibold py-1.5 rounded-full border border-[#FCD200]">
          Add to Cart
        </button>
        <button className="w-full bg-[#FFA41C] text-gray-900 text-xs font-semibold py-1.5 rounded-full border border-[#FF8F00]">
          Buy Now
        </button>
      </div>
    </div>
  )
}

// ─── Instagram post ───────────────────────────────────────────────────────────

function InstagramMockup({ imageUrl, productTitle, description }: PlatformMockupProps) {
  const caption = description ? trunc(description, 85) : trunc(productTitle, 85)

  return (
    <div className="rounded-xl overflow-hidden border border-border-subtle bg-white shadow-sm">

      {/* Post header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {/* Instagram gradient avatar */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px] shrink-0">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <span className="text-[9px] font-bold text-gray-700">Y</span>
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-900">yourstore</span>
        </div>
        {/* Three dots */}
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-700 fill-current" aria-hidden="true">
          <circle cx="5"  cy="12" r="1.5"/>
          <circle cx="12" cy="12" r="1.5"/>
          <circle cx="19" cy="12" r="1.5"/>
        </svg>
      </div>

      {/* Product image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={productTitle}
        className="w-full aspect-square object-cover"
        draggable={false}
      />

      {/* Action bar */}
      <div className="px-3 py-2 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* Heart */}
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-gray-800" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {/* Comment */}
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-gray-800" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            {/* Send / DM */}
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-gray-800" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 2L11 13"/>
              <path d="M22 2L15 22 11 13 2 9l20-7z"/>
            </svg>
          </div>
          {/* Bookmark */}
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-gray-800" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <p className="text-xs font-semibold text-gray-900">1,234 likes</p>
        <p className="text-xs text-gray-800 leading-relaxed">
          <span className="font-semibold">yourstore </span>
          {caption}
        </p>
      </div>
    </div>
  )
}

// ─── Facebook / Meta ad ───────────────────────────────────────────────────────

function AdsMockup({ imageUrl, productTitle, headline }: PlatformMockupProps) {
  const adHeadline = headline ? trunc(headline, 55) : trunc(productTitle, 55)

  return (
    <div className="rounded-xl overflow-hidden border border-border-subtle bg-white shadow-sm">

      {/* Sponsored header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-hover flex items-center justify-center text-white font-bold text-sm shrink-0">
          Y
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 leading-tight">Your Brand</p>
          <p className="text-[10px] text-gray-500 leading-tight">Sponsored · 🌐</p>
        </div>
        {/* Facebook logo */}
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-[#1877F2] shrink-0" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </div>

      {/* Product image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={productTitle}
        className="w-full aspect-square object-cover"
        draggable={false}
      />

      {/* Ad footer */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-t border-gray-100 gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-900 leading-snug truncate">{adHeadline}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">yourstore.com</p>
        </div>
        <button className="shrink-0 bg-[#1877F2] text-white text-xs font-semibold px-3 py-1.5 rounded">
          Shop Now
        </button>
      </div>
    </div>
  )
}

// ─── Pinterest pin ────────────────────────────────────────────────────────────

function PinterestMockup({ imageUrl, productTitle }: PlatformMockupProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-border-subtle bg-white shadow-sm">

      {/* Image with Save button overlay */}
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={productTitle}
          className="w-full aspect-square object-cover"
          draggable={false}
        />
        {/* Pinterest top row */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-2.5 py-2.5">
          <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-2.5 py-1">
            <svg viewBox="0 0 24 24" className="w-3 h-3 text-white fill-current" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.428 1.808-2.428.853 0 1.267.641 1.267 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.806 1.476 1.806 1.771 0 3.135-1.867 3.135-4.56 0-2.385-1.714-4.052-4.161-4.052-2.834 0-4.497 2.125-4.497 4.322 0 .856.329 1.772.74 2.273a.3.3 0 0 1 .069.285c-.075.314-.243.995-.276 1.134-.044.183-.146.221-.337.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.966-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.522 0 10-4.477 10-10S17.522 2 12 2z"/>
            </svg>
            <span className="text-[9px] font-semibold text-white">Pinterest</span>
          </div>
          <button className="bg-[#E60023] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
            Save
          </button>
        </div>
      </div>

      {/* Pin info */}
      <div className="px-3 py-2.5">
        <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">
          {productTitle}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-[8px] font-bold text-gray-500">Y</span>
          </div>
          <span className="text-[10px] text-gray-500">yourstore</span>
        </div>
      </div>
    </div>
  )
}

// ─── TikTok Shop ──────────────────────────────────────────────────────────────

function TikTokMockup({ imageUrl, productTitle, description }: PlatformMockupProps) {
  const caption = description ? trunc(description, 65) : trunc(productTitle, 65)

  return (
    <div className="rounded-xl overflow-hidden border border-border-subtle bg-black shadow-sm relative aspect-[9/16]">

      {/* Background: the product image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={productTitle}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Bottom gradient scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

      {/* TikTok top tab bar */}
      <div className="absolute top-3 left-0 right-0 flex items-center justify-center gap-5">
        <span className="text-white/60 text-xs font-semibold">Following</span>
        <span className="text-white text-xs font-bold border-b-2 border-white pb-0.5">For You</span>
        <span className="text-white/60 text-xs font-semibold">LIVE</span>
      </div>

      {/* Right-side action buttons */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5">
        {/* Profile + follow */}
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-brand to-brand-hover flex items-center justify-center">
            <span className="text-white font-bold text-xs">Y</span>
          </div>
          <div className="w-4 h-4 rounded-full bg-[#EE1D52] flex items-center justify-center -mt-2">
            <span className="text-white text-[9px] font-bold leading-none">+</span>
          </div>
        </div>
        {/* Heart */}
        <div className="flex flex-col items-center gap-0.5">
          <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current drop-shadow" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span className="text-white text-[9px] font-semibold drop-shadow">14.2K</span>
        </div>
        {/* Comment */}
        <div className="flex flex-col items-center gap-0.5">
          <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current drop-shadow" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span className="text-white text-[9px] font-semibold drop-shadow">1,203</span>
        </div>
        {/* Share */}
        <div className="flex flex-col items-center gap-0.5">
          <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current drop-shadow" aria-hidden="true">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <span className="text-white text-[9px] font-semibold drop-shadow">Share</span>
        </div>
      </div>

      {/* Bottom caption + Shop Now button */}
      <div className="absolute bottom-4 left-3 right-14">
        <p className="text-white text-xs font-bold drop-shadow mb-1">@yourstore</p>
        <p className="text-white/90 text-[10px] leading-relaxed drop-shadow mb-3">
          {caption} <span className="text-[#69C9D0]">#shop #newdrop</span>
        </p>
        {/* TikTok Shop cart button */}
        <div className="inline-flex items-center gap-1.5 bg-[#EE1D52] rounded-full px-3 py-1.5 shadow-md">
          <svg viewBox="0 0 24 24" className="w-3 h-3 text-white fill-current" aria-hidden="true">
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9h14l-2-9M9 21a1 1 0 1 0 2 0 1 1 0 0 0-2 0m6 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0"/>
          </svg>
          <span className="text-white text-[10px] font-bold">Shop Now</span>
        </div>
      </div>
    </div>
  )
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export function PlatformMockup(props: PlatformMockupProps) {
  switch (props.style) {
    case 'amazon':    return <AmazonMockup    {...props} />
    case 'instagram': return <InstagramMockup {...props} />
    case 'ads':       return <AdsMockup       {...props} />
    case 'pinterest': return <PinterestMockup {...props} />
    case 'tiktok':    return <TikTokMockup    {...props} />
    default:          return null
  }
}
