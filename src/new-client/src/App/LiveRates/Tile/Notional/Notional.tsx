import { useCallback } from "react"
import { FaRedo } from "react-icons/fa"
import { useRfqState, QuoteStateStage } from "../Rfq"
import { symbolBind, useTileCurrencyPair } from "../Tile.context"
import {
  InputWrapper,
  CurrencyPairSymbol,
  Input,
  ResetInputValue,
  ErrorMessage,
} from "./Notional.styles"
import { concat, merge, pipe } from "rxjs"
import { currencyPairs$ } from "@/services/currencyPairs"
import { filter, map, pluck, take } from "rxjs/operators"
import { createKeyedSignal } from "@react-rxjs/utils"

const [rawNotional$, onChangeNotionalValue] = createKeyedSignal(
  (x) => x.symbol,
  (symbol: string, rawVal: string) => ({ symbol, rawVal }),
)
export { onChangeNotionalValue }

const multipliers: Record<string, number> = {
  k: 1_000,
  m: 1_000_000,
}

const formatter = new Intl.NumberFormat("default")

export const [useNotional, getNotional$] = symbolBind((symbol) =>
  concat(
    currencyPairs$.pipe(
      take(1),
      map((ccPairs) => ({
        symbol,
        rawVal: ccPairs[symbol].defaultNotional.toString(),
      })),
    ),
    rawNotional$(symbol),
  ).pipe(
    map(({ rawVal }) => {
      const lastChar = rawVal.slice(-1).toLowerCase()
      const value = Math.abs(
        Number(rawVal.replace(/,|k$|m$|K$|M$/g, "")) *
          (multipliers[lastChar] || 1),
      )
      return {
        value,
        inputValue: formatter.format(value) + (lastChar === "." ? "." : ""),
      }
    }),
    filter(({ value }) => !Number.isNaN(value)),
  ),
)
export const [, getNotionalValue$] = symbolBind(
  pipe(getNotional$, pluck("value")),
)

export const [useIsNotionalValid] = symbolBind(
  pipe(
    getNotionalValue$,
    map((value) => value <= MAX_NOTIONAL),
  ),
  true,
)

const [useDefaultNotional, defaultNotional$] = symbolBind((symbol) =>
  currencyPairs$.pipe(map((pairs) => pairs[symbol].defaultNotional)),
)

export const notionalInput$ = (symbol: string) =>
  merge(...[defaultNotional$, getNotional$].map((fn) => fn(symbol)))

const MAX_NOTIONAL = 1_000_000_000

type Props = {
  id: string
  value: string
  onChange: (e: any) => void
  base: string
  valid: boolean
  disabled: boolean
  canReset: boolean
  onReset: () => void
}

export const NotionalInputInner: React.FC<Props> = ({
  id,
  base,
  valid,
  disabled,
  value,
  onChange,
  canReset,
  onReset,
}) => {
  const ref = useCallback((node: HTMLInputElement | null) => {
    if (node) {
      setTimeout(() => {
        console.log('Focussing input', node)
        node.focus()
      }, 3000)
    }
  }, [])

  return (
    <InputWrapper>
      <CurrencyPairSymbol htmlFor={id}>{base}</CurrencyPairSymbol>
      <Input
        ref={ref}
        type="text"
        id={id}
        className={!valid ? `is-invalid` : undefined}
        disabled={disabled}
        value={value}
        onChange={onChange}
        onFocus={(event) => {
          event.target.select()
        }}
      />
      <ResetInputValue isVisible={canReset} onClick={onReset}>
        <FaRedo className="flipHorizontal" />
      </ResetInputValue>
      {!valid && <ErrorMessage>Max exceeded</ErrorMessage>}
    </InputWrapper>
  )
}

export const NotionalInput: React.FC = () => {
  const { base, symbol } = useTileCurrencyPair()
  const defaultNotional = useDefaultNotional()
  const notional = useNotional()
  const valid = useIsNotionalValid()
  const { stage: quoteStage } = useRfqState()
  const id = `notional-input-${symbol}`

  return (
    <NotionalInputInner
      id={id}
      base={base}
      valid={valid}
      disabled={[QuoteStateStage.Received, QuoteStateStage.Requested].includes(
        quoteStage,
      )}
      value={notional.inputValue}
      onChange={(e) => {
        onChangeNotionalValue(symbol, e.target.value)
      }}
      canReset={notional.value !== defaultNotional}
      onReset={() => {
        onChangeNotionalValue(symbol, defaultNotional.toString(10))
      }}
    />
  )
}
