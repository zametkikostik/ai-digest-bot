#!/bin/bash
# Скрипт перезапуска бота

cd "/home/kostik/aiden bot"

./stop_bot.sh
sleep 2
./start_bot.sh
