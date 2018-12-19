// @ts-ignore
import React, { lazy, Suspense } from 'react'

import { styled, ThemeProvider } from 'rt-theme'

const MainRoute = lazy(() => import('./MainRoute'))

const Fallback = styled.div`
  width: 100vw;
  height: 100vh;
  background-color: ${p => p.theme.component.backgroundColor};
`

export default function MainRouteLoader() {
  return (
    <ThemeProvider>
      <Suspense fallback={<Fallback />}>
        <MainRoute />
      </Suspense>
    </ThemeProvider>
  )
}
export { MainRouteLoader as MainRoute }
