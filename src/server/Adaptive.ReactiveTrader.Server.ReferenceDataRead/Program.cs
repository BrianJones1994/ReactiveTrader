﻿using System;
using System.Threading.Tasks;
using Adaptive.ReactiveTrader.Messaging;
using Common.Logging;

namespace Adaptive.ReactiveTrader.Server.ReferenceDataRead
{

    public static class ReferenceDataReaderLauncher
    {
        public static async Task<IDisposable> Run(IBroker broker)
        {
            Console.WriteLine("Reference Data Service starting...");
            try
            {
                var cache = new CurrencyPairCache();
                cache.Initialize();

                var service = new ReferenceService(cache.GetCurrencyPairUpdates());
                var serviceHost = new ReferenceServiceHost(service, broker);

                await serviceHost.Start();

                Console.WriteLine("procedure GetCurrencyPairs() registered");

                Console.WriteLine("Service Started.");
                
                return serviceHost;

            }
            catch (MessagingException e)
            {
                throw new Exception("Can't start service", e);
            }
        }
    }

    public class Program
    {
        protected static readonly ILog Log = LogManager.GetLogger<Program>();

        public static void Main(string[] args)
        {
            var uri = "ws://127.0.0.1:8080/ws";
            var realm = "com.weareadaptive.reactivetrader";

            if (args.Length > 0)
            {
                uri = args[0];
                if (args.Length > 1)
                    realm = args[1];
            }

            try
            {
                var broker = BrokerFactory.Create(uri, realm);

                using (ReferenceDataReaderLauncher.Run(broker.Result).Result)
                {
                    Console.WriteLine("Press Any Key To Stop...");
                    Console.ReadLine();
                }
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
            }
        }
   }
}