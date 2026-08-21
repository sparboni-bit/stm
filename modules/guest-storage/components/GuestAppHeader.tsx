"use client"

import Image from "next/image"
import Link from "next/link"

export function GuestAppHeader() {
  return (
    <header className="border-b border-neutral-200 bg-white lg:hidden">
      <div className="mx-auto flex min-h-[68px] w-full items-center justify-between px-5">
        <Link href="/guest" aria-label="Pickleball Arena guest home">
          <Image
            src="/brand/pickleball-arena-logo2.png"
            alt="Pickleball Arena"
            width={180}
            height={64}
            priority
            className="h-auto w-[168px]"
          />
        </Link>

        <Link
          href="/login"
          className="inline-flex min-h-11 items-center justify-center bg-[var(--arena-yellow)] px-4 text-sm font-bold text-[var(--arena-black)]"
        >
          Sign in
        </Link>
      </div>
    </header>
  )
}
