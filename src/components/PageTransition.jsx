import React from 'react'
import { motion as Motion } from 'framer-motion'

function PageTransition({children}) {
  return (
    <Motion.div
        initial={{opacity: 0, y: 20}} // start
        animate={{opacity:1 , y: 0}}
        exit={{opacity:0, y: -20}}
        transition={{duration:0.3}}
    >
        {children}
    </Motion.div>
  )
}

export default PageTransition