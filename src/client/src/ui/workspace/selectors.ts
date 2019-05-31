import { createSelector } from 'reselect'
import { GlobalState } from 'StoreTypes'
import { WindowConfig } from 'rt-components'

type Center = 'screen' | 'parent'
export interface ExternalWindowProps {
  title: string
  config: WindowConfig
  browserConfig: { center: Center }
}

const makeExternalWindowProps: (key: string) => ExternalWindowProps = (key: string) => ({
  title: `${key} Spot`,
  config: {
    name: `${key}`,
    width: 366, // 346 content + 10 padding
    height: 193,
    url: `/spot/${key}`,
  },
  browserConfig: { center: 'screen' },
})

const getSpotTiles = (state: GlobalState) => state.currencyPairs
const getSpotTilesLayout = (state: GlobalState) => state.layout.spotTiles

export const selectSpotTiles = createSelector(
  [getSpotTiles, getSpotTilesLayout],
  (spotTileKeys, tilesLayout) =>
    Object.keys(spotTileKeys).map(key => ({
      key,
      externalWindowProps: makeExternalWindowProps(key),
      tornOff: tilesLayout[key] === undefined ? false : !tilesLayout[key],
    })),
)

export const selectSpotCurrencies = createSelector(
  [getSpotTiles],
  spotTileKeys => Array.from(new Set(Object.keys(spotTileKeys).map(key => spotTileKeys[key].base))),
)

const getExecutionStatus = ({ compositeStatusService }: GlobalState) =>
  compositeStatusService.execution && compositeStatusService.execution.connectionStatus

export const selectExecutionStatus = createSelector(
  getExecutionStatus,
  status => status,
)
