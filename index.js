require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api')
const mailgun = require('mailgun-js')

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true })

const userStates = {}

// Налаштовуємо Mailgun
const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN,
})

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id

  userStates[chatId] = { step: 'ASK_NAME' }

  bot.sendMessage(
    chatId,
    "👋 Hello and welcome! We're thrilled to have you on board.\n\n" +
      "To help us get to know you better, may I ask how you'd like us to address you? (Your full name or preferred name)"
  )
})

bot.on('message', (msg) => {
  const chatId = msg.chat.id
  const text = msg.text

  if (text.startsWith('/start')) return

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
      // Після того, як користувач надає всі дані, відправляємо їх на email
      const data = {
        from: 'no-reply@yourdomain.com', // Використовуй email, зареєстрований у Mailgun
        to: 'serhiikravchenko@gmail.com', // Ваш email
        subject: 'New Client Information',
        text: `New client details:\n\nName: ${user.name}\nEmail: ${user.email}\nPhone: ${user.phone}`,
      }

      // Відправка email через Mailgun
      mg.messages().send(data, (error, body) => {
        if (error) {
          console.log('Error sending email:', error)
        } else {
          console.log('Email sent successfully:', body)
        }
      })

      // Повідомлення клієнту
      bot.sendMessage(
        chatId,
        `Perfect! 🙌\n\n` +
          `Name: ${user.name}\n` +
          `Email: ${user.email}\n` +
          `Phone: ${user.phone}\n\n` +
          `Thank you for providing your details. One of our team members will be in touch shortly.\n` +
          `For further inquiries, you can contact our manager @serhiikin.\n` +
          `Have a fantastic day! ☀️`
      )

      delete userStates[chatId] // очищаємо стан
      break
  }
})
