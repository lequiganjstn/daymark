"use client"

import * as React from "react"

import {
  type HTMLMotionProps,
  motion,
  type SpringOptions,
  type Transition,
  useMotionValue,
  useSpring,
} from "motion/react"

import { cn } from "@/lib/utils"

interface StarLayerProps extends HTMLMotionProps<"div"> {
  count: number
  size: number
  transition: Transition
  starColor: string
}

function generateStars(count: number, starColor: string, seed: string) {
  const shadows: string[] = []
  let randomSeed = 0

  for (const character of seed) {
    randomSeed = Math.imul(randomSeed ^ character.charCodeAt(0), 16777619)
  }

  const random = () => {
    randomSeed = (randomSeed + 0x6d2b79f5) | 0
    let value = randomSeed
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }

  for (let i = 0; i < count; i++) {
    const x = Math.floor(random() * 4000) - 2000
    const y = Math.floor(random() * 4000) - 2000

    shadows.push(`${x}px ${y}px ${starColor}`)
  }

  return shadows.join(", ")
}

function StarLayer({
  count = 1000,
  size = 1,
  transition = { repeat: Infinity, duration: 50, ease: "linear" },
  starColor = "#fff",
  className,
  ...props
}: StarLayerProps) {
  const instanceId = React.useId()
  const boxShadow = React.useMemo(
    () => generateStars(count, starColor, instanceId),
    [count, starColor, instanceId]
  )

  return (
    <motion.div
      data-slot="star-layer"
      animate={{ y: [0, -2000] }}
      transition={transition}
      className={cn("absolute top-0 left-0 h-[2000px] w-full", className)}
      {...props}
    >
      <div
        className="absolute rounded-full bg-transparent"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          boxShadow,
        }}
      />
      <div
        className="absolute top-[2000px] rounded-full bg-transparent"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          boxShadow,
        }}
      />
    </motion.div>
  )
}

interface StarsBackgroundProps extends React.ComponentProps<"div"> {
  factor?: number
  speed?: number
  transition?: SpringOptions
  starColor?: string
  pointerEvents?: boolean
}

function StarsBackground({
  children,
  className,
  factor = 0.05,
  speed = 50,
  transition = { stiffness: 50, damping: 20 },
  starColor = "#fff",
  pointerEvents = true,
  ...props
}: StarsBackgroundProps) {
  const offsetX = useMotionValue(1)
  const offsetY = useMotionValue(1)

  const springX = useSpring(offsetX, transition)
  const springY = useSpring(offsetY, transition)

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      const newOffsetX = -(e.clientX - centerX) * factor
      const newOffsetY = -(e.clientY - centerY) * factor

      offsetX.set(newOffsetX)
      offsetY.set(newOffsetY)
    },
    [offsetX, offsetY, factor]
  )

  return (
    <div
      data-slot="stars-background"
      className={cn("relative size-full overflow-hidden", className)}
      onMouseMove={handleMouseMove}
      {...props}
    >
      <motion.div
        style={{ x: springX, y: springY }}
        className={cn({ "pointer-events-none": !pointerEvents })}
      >
        <StarLayer
          count={1000}
          size={1}
          transition={{ repeat: Infinity, duration: speed, ease: "linear" }}
          starColor={starColor}
        />
        <StarLayer
          count={400}
          size={2}
          transition={{
            repeat: Infinity,
            duration: speed * 2,
            ease: "linear",
          }}
          starColor={starColor}
        />
        <StarLayer
          count={200}
          size={3}
          transition={{
            repeat: Infinity,
            duration: speed * 3,
            ease: "linear",
          }}
          starColor={starColor}
        />
      </motion.div>
      {children}
    </div>
  )
}

export {
  StarLayer,
  StarsBackground,
  type StarLayerProps,
  type StarsBackgroundProps,
}
