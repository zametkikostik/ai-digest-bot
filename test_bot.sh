#!/bin/bash
# Тест бота — проверка всех команд и кнопок

BOT_TOKEN="8341305314:AAGgyDgXQ8L3JKr7NqukTC4vSsNiJNIzYAc"
CHAT_ID="1271633868"  # Ваш ID

echo "🧪 ТЕСТ БОТА @AidenHelpbot"
echo "=========================="
echo ""

# Функция отправки команды
send_command() {
    local cmd=$1
    echo "📤 Отправка: $cmd"
    curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
        -d "chat_id=$CHAT_ID" \
        -d "text=$cmd" \
        -d "parse_mode=Markdown" > /dev/null
    sleep 1
}

# Функция проверки
test_command() {
    local cmd=$1
    local desc=$2
    echo ""
    echo "🔹 Тест: $desc"
    send_command "$cmd"
}

# Тесты
test_command "/start" "Приветствие и кнопки"
sleep 2

test_command "/help" "Список команд"
sleep 2

test_command "/categories" "Категории"
sleep 2

test_command "/tutor" "AI Репетитор"
sleep 2

test_command "/language" "AI Учитель языков"
sleep 2

test_command "/lawyer_ru" "AI Юрист Россия"
sleep 2

test_command "/lawyer_bg" "AI Юрист Болгария"
sleep 2

test_command "/crypto" "Криптовалюты"
sleep 2

test_command "/weather Москва" "Погода"
sleep 2

test_command "/inflation" "Инфляция"
sleep 2

test_command "/ask Что такое AI?" "AI вопрос"
sleep 3

echo ""
echo "✅ Тест завершён!"
echo "📱 Проверьте бот @AidenHelpbot"
