import { usePrice } from "@/services/prices"
import { ResultsTable, ResultsTableRow, defaultColDefs } from "./resultsTable"
import { MovementIcon } from "../icons"
import { format } from "date-fns"
import { useCurrencyPairs } from "@/services/currencyPairs"
import { showCurrencyPairWindow } from "./intents"

export const InlineQuote = ({ symbol }: { symbol: string }) => {
  const quote = usePrice(symbol)

  const row = {
    ...quote,
    priceMovementType: <MovementIcon direction={quote.movementType} />,
    valueDate: format(new Date(quote.valueDate), "dd-MM-yyyy HH:mm:ss aaaa"),
    openTileBtn: (
      <button onClick={() => showCurrencyPairWindow(symbol)}>Open Tile</button>
    ),
  }

  return <ResultsTableRow row={row} cols={defaultColDefs} />
}

export const Quotes = ({ symbols }: { symbols: string[] }) => {
  return (
    <ResultsTable cols={defaultColDefs}>
      {symbols.map((symbol) => (
        <InlineQuote key={symbol} symbol={symbol} />
      ))}
    </ResultsTable>
  )
}

export const AllQuotes = () => {
  const symbols = Object.keys(useCurrencyPairs())
  return <Quotes symbols={symbols} />
}
