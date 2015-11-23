﻿using System;

namespace Adaptive.ReactiveTrader.MessageBroker
{
    public static class MessageBrokerLauncher
    {
        public static IDisposable Run()
        {
            Console.WriteLine("Messagee Broker Starting...");

            var broker = new MessageBroker();
            broker.Start();

            return broker;
        }
    }

    internal class Program
    {
        public static void Main(string[] args)
        {
            using (MessageBrokerLauncher.Run())
            {
                Console.WriteLine("Press any key...");
                Console.ReadLine();
            }
        }
    }
}