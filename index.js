require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api')

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true })

const userStates = {}
let botStats = { totalUsers: 0, totalRequests: 0 }

// Функція для отримання привітання в залежності від часу доби
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

// Стартова команда
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id

  // Збільшити кількість користувачів
  botStats.totalUsers++

  userStates[chatId] = { step: 'ASK_NAME' }

  const greeting = getGreeting()

  bot.sendMessage(
    chatId,
    `${greeting}, 👋 Welcome! We're thrilled to have you on board.\n\n` +
      "To help us get to know you better, may I ask how you'd like us to address you? (Your full name or preferred name)"
  )
})

// Обробка текстових повідомлень
bot.on('message', (msg) => {
  const chatId = msg.chat.id
  const text = msg.text

  if (text.startsWith('/start')) return

  // Збільшити загальну кількість запитів
  botStats.totalRequests++

  const user = userStates[chatId]
  if (!user) return

  switch (user.step) {
    case 'ASK_NAME':
      user.name = text.trim()
      user.step = 'ASK_EMAIL'
      bot.sendMessage(
        chatId,
        `Great, ${user.name}! 😊\nNext, could you please share your email address?`
      )
      break

    case 'ASK_EMAIL':
      user.email = text.trim()
      user.step = 'ASK_PHONE'
      bot.sendMessage(
        chatId,
        `Thank you! 📧 Now, could you also share your phone number?`
      )
      break

    case 'ASK_PHONE':
      user.phone = text.trim()
      user.step = 'SUMMARY'
      bot.sendMessage(
        chatId,
        `Thank you for providing your details, ${user.name}! 🙌\n\n` +
          `Here is the information you've provided:\n` +
          `Name: ${user.name}\n` +
          `Email: ${user.email}\n` +
          `Phone: ${user.phone}\n\n` +
          `One of our team members will be in touch shortly. You can contact our manager directly via Telegram: @serhiikin.\n` +
          `Have a wonderful day! ☀️`
      )

      // Відправка даних вам у Telegram
      const managerChatId = process.env.MANAGER_CHAT_ID // Chat ID вашого менеджера (вставити тут)
      const messageForManager =
        `New user registration:\n\n` +
        `Name: ${user.name}\n` +
        `Email: ${user.email}\n` +
        `Phone: ${user.phone}`

      bot.sendMessage(managerChatId, messageForManager)

      delete userStates[chatId] // очищаємо стан
      break
  }
})

// Команда для перегляду статистики
bot.onText(/\/stats/, (msg) => {
  const chatId = msg.chat.id
  const statsMessage =
    `Bot Stats:\n\n` +
    `Total Users: ${botStats.totalUsers}\n` +
    `Total Requests: ${botStats.totalRequests}`

  bot.sendMessage(chatId, statsMessage)
})
