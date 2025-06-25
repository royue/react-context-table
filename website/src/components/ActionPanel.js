import React, { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import Inspector from 'react-inspector'

import CornerButton from './CornerButton'

const Container = styled.div`
  position: relative;
  outline: 1px solid #edf0f2;
  padding: 15px 0;
`

const ActionsContainer = styled.div`
  max-height: 200px;
  overflow-y: auto;
  padding: 0 15px;
`

const ClearButton = styled(CornerButton)`
  background-color: transparent;
`

const ActionPanel = ({ channel }) => {
  const [actions, setActions] = useState([])

  // 事件处理函数
  const onAction = useCallback(action => {
    setActions(prev => [action, ...prev.slice(0, 99)])
  }, [])

  const onClear = useCallback(() => {
    setActions([])
  }, [])

  useEffect(() => {
    channel.on(onAction)
    return () => {
      channel.off(onAction)
    }
  }, [channel, onAction])

  if (!actions.length) return null
  return (
    <Container>
      <ActionsContainer>
        {actions.map((action, idx) => (
          <Inspector
            key={`${action.name}-${actions.length - idx}`}
            showNonenumerable={false}
            name={action.name}
            data={action.args}
          />
        ))}
      </ActionsContainer>
      <ClearButton onClick={onClear}>clear</ClearButton>
    </Container>
  )
}

export default ActionPanel
