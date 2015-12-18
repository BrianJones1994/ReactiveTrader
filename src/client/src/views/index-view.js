import React from 'react';
import CurrencyPairs from 'components/currency-pairs';
import Blotter from 'components/blotter';
import Modal from 'components/modal';
import Header from 'components/header';
import Analytics from 'components/analytics';
import system from 'system';

import { serviceContainer, model as serviceModel } from 'services2';

var _log:system.logger.Logger = system.logger.create('index-view');

/**
 *
 * @param DTO
 * @returns {{id: *, trader: (*|string), status: *, direction: *, pair: *, rate: *, dateTime: *, valueDate: *, amount: *}}
 */
const formatTradeForDOM = (DTO) => {
  return {
    id: DTO.TradeId,
    trader: DTO.TraderName,
    status: DTO.Status,
    direction: DTO.Direction,
    pair: DTO.CurrencyPair,
    rate: DTO.SpotRate,
    dateTime: DTO.TradeDate,
    valueDate: DTO.ValueDate,
    amount: DTO.Notional
  };
};

class IndexView extends React.Component {

  constructor(props, context) {
    super(props, context);

    this.state = {
      trades: [],
      history: [],
      positions: [],
      connected: false,
      services: {}
    };

    this.attachEvents();
  }

  /**
   * Adds transport subscriptions
   */
  attachEvents() {
    const self = this;

    serviceContainer.blotterService.getTradesStream().subscribe(blotter => {
        blotter.Trades.forEach((trade) => this._processTrade(trade, false));
        this.setState({
          trades: this.state.trades
        });
      },
      err => {
        _log.error(err.message);
      },
      ()=> {

      }
    );

    serviceContainer.analyticsService.getAnalyticsStream(new serviceModel.AnalyticsRequest('USD')).subscribe(data => {
        this.setState({
          history: data.History,
          positions: data.CurrentPositions
        });
      },
      err => {
        _log.error(err.message);
      },
      ()=> {

      }
    );

    serviceContainer.connectionStatusStream.subscribe((isConnected:Boolean) => {
      _log.info(`IsConnected:${isConnected}`);
        //self.setState({connected: isConnected});
      },
      err => {
        _log.error(err.message);
      },
      ()=> {

      }
    );

    serviceContainer.serviceStatusStream.subscribe((services:serviceModel.serviceStatusSummaryLookup) => {
        _log.info(`services:${services}`);
        console.log('services-1', services)
        // self.setState({services});
      },
      err => {
        _log.error(err.message);
      },
      ()=> {

      }
    );
    //
    //on('open', ()=> self.setState({connected: true}))
    //  .on('close', ()=> self.setState({connected: false}))
    //  .on('statusUpdate', (services) => {
    //    // update ui indicators for all known services in header
    //    self.setState({services});
    //  });
  }

  /**
   * Re-establishes a connection to broker once it times out
   */
  reconnect() {

    // TODO KEITH
    //Modal.close();
    //rt.transport.isConnected || rt.transport.open();
  }


  componentDidMount() {

    // TODO KEITH
    //rt.on('timeout', () => {
    //  Modal.setTitle('Session expired')
    //    .setBody(<div>
    //      <div>Your 15 minute session expired, you are now disconnected from the server.</div>
    //      <div>Click reconnect to start a new session.</div>
    //      <div className='modal-action'>
    //        <button className='btn btn-large' onClick={() => this.reconnect()}>Reconnect</button>
    //      </div>
    //    </div>)
    //    .setClass('error-modal')
    //    .open();
    //});
  }

  /**
   * Processor for data coming from the blotter service that converts DTO object to DOM
   * @param {Object} trade
   * @param {Boolean=} update immediately, defaults to false
   * @private
   */
  _processTrade(trade, update) {
    trade = formatTradeForDOM(trade);
    const exists = _.findWhere(this.state.trades, {id: trade.id});

    if (!exists) {
      this.state.trades.unshift(trade);
    }
    else {
      this.state.trades[_.indexOf(this.state.trades, exists)] = trade;
    }

    update && this.setState({
      trades: this.state.trades
    });
  }

  /**
   * Sends a trade to execution service, preps response back for show in CP tile
   * @param {Object} payload
   */
  addTrade(payload) {
    var request = {
      CurrencyPair: payload.pair,
      SpotRate: payload.rate,
      //todo: support valueDate and non spot
      // ValueDate: (new Date()).toISOString(),
      Direction: payload.direction,
      Notional: payload.amount,
      DealtCurrency: payload.pair.substr(payload.direction === 'buy' ? 0 : 3, 3)
    };
    serviceContainer.executionService.executeTrade(request).subscribe(response => {
        const trade = response.Trade,
          dt = new Date(trade.ValueDate),
          message = {
            pair: trade.CurrencyPair,
            id: trade.TradeId,
            status: trade.Status,
            direction: trade.Direction.toLowerCase(),
            amount: trade.Notional,
            trader: trade.TraderName,
            valueDate: trade.ValueDate, // todo get this from DTO
            rate: trade.SpotRate
          };

        window.fin && new window.fin.desktop.Notification({
          url: '/#/growl',
          message,
          onClick: function () {
            const win = window.fin.desktop.Window.getCurrent();
            win.getState(state => {
              switch (state) {
                case 'minimized':
                  win.restore();
                default:
                  win.bringToFront();
              }
            });

            window.fin.desktop.InterApplicationBus.publish('acknowledgeTrade', message.id);
          }
        });
        payload.onACK(message);
      },
      (error) => {
        _log.error(error.message);
      }
    );
  }

  render() {
    const services = this.state.services;

    return (
      <div>
        <Modal/>
        <Header status={this.state.connected} services={services}/>
        <CurrencyPairs onExecute={(payload) => this.addTrade(payload)} services={services}/>
        <Analytics status={services.analytics} history={this.state.history} positions={this.state.positions}/>
        <Blotter trades={this.state.trades} status={services.blotter}/>
      </div>
    );
  }

}

export default IndexView;
