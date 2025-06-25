import React, { useState, useRef, useEffect } from 'react'
import clipboard from 'clipboard'

import CornerButton from './CornerButton'

function CopyButton(props) {
  const { content, text: defaultText = 'copy', ...rest } = props
  const [text, setText] = useState(defaultText)
  const ref = useRef(null)
  const timerRef = useRef(null)
  const clipboardRef = useRef(null)

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    clearTimer()
    clipboardRef.current = new clipboard(ref.current)
    const onSuccess = () => {
      clearTimer()
      setText('copied')
      timerRef.current = setTimeout(() => {
        setText(defaultText)
      }, 300)
    }
    const onError = () => {
      clearTimer()
      setText('failed')
      timerRef.current = setTimeout(() => {
        setText(defaultText)
      }, 300)
    }
    clipboardRef.current.on('success', onSuccess)
    clipboardRef.current.on('error', onError)
    return () => {
      clipboardRef.current && clipboardRef.current.destroy()
      clearTimer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultText])

  return (
    <CornerButton ref={ref} data-clipboard-text={content} {...rest}>
      {text}
    </CornerButton>
  )
}

export default CopyButton
