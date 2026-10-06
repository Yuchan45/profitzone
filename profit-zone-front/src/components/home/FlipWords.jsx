import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '../../lib/utils.js'

function FlipWords({ words, duration = 3000, className }) {
  const [currentWord, setCurrentWord] = useState(words[0])
  const [isAnimating, setIsAnimating] = useState(false)

  const startAnimation = useCallback(() => {
    const word = words[words.indexOf(currentWord) + 1] || words[0]
    setCurrentWord(word)
    setIsAnimating(true)
  }, [currentWord, words])

  useEffect(() => {
    if (isAnimating) return undefined

    const id = setTimeout(startAnimation, duration)
    return () => clearTimeout(id)
  }, [isAnimating, duration, startAnimation])

  const parts = currentWord.split(' ')

  return (
  <span className="inline-grid text-left">
    {words.map((word) => (
      <span
        key={word}
        aria-hidden="true"
        className="invisible col-start-1 row-start-1 whitespace-nowrap"
      >
        {word}
      </span>
    ))}

    <AnimatePresence mode="wait" onExitComplete={() => setIsAnimating(false)}>
      <motion.div
        key={currentWord}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 10 }}
        exit={{
          opacity: 0,
          y: -14,
          filter: 'blur(6px)',
          transition: { duration: 0.28, ease: 'easeIn' },
        }}
        className={cn('col-start-1 row-start-1 text-brand-text', className)}
      >
        {parts.map((word, wordIndex) => (
          <motion.span
            key={word + wordIndex}
            initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: wordIndex * 0.3, duration: 0.3 }}
            className="inline-block whitespace-nowrap"
          >
            {word.split('').map((letter, letterIndex) => (
              <motion.span
                key={word + letterIndex}
                initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  delay: wordIndex * 0.3 + letterIndex * 0.05,
                  duration: 0.2,
                }}
                className="inline-block"
              >
                {letter}
              </motion.span>
            ))}
            {wordIndex < parts.length - 1 && <span className="inline-block">&nbsp;</span>}
          </motion.span>
        ))}
      </motion.div>
    </AnimatePresence>
  </span>
)
}

export default FlipWords