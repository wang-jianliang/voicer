"use client"
import { motion } from "framer-motion"

const LoadingAnimation = () => {
  const circleStyle = {
    display: "block",
    width: "1.5rem",
    height: "1.5rem",
    backgroundColor: "currentColor",
    borderRadius: "0.75rem",
  }

  const containerVariants = {
    start: {
      transition: {
        staggerChildren: 0.2,
      },
    },
    end: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const circleVariants = {
    start: {
      scale: 0.5,
      transition: {
        duration: 0.5,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "reverse",
        ease: "easeInOut",
      },
    },
    end: {
      scale: 1,
      transition: {
        duration: 0.5,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "reverse",
        ease: "easeInOut",
      },
    },
  }

  return (
    <div className="flex items-center justify-center">
      <motion.div
        className="flex space-x-4 text-orange-500"
        variants={containerVariants}
        initial="start"
        animate="end"
        aria-label="Loading"
      >
        {[...Array(5)].map((_, index) => (
          // @ts-ignore
          <motion.span key={index} style={circleStyle} variants={circleVariants} aria-hidden="true" />
        ))}
      </motion.div>
    </div>
  )
}

export default LoadingAnimation

