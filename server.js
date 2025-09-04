const express = require('express')
const cors = require('cors')
const { Ollama } = require('ollama')

const app = express()

// Config
const PORT = 3000
const HOST = 'http://golem:11434'
const MODEL = 'gpt-oss:120b'

const ollama = new Ollama({ host: HOST })

// Middleware
app.use(express.json())
app.use(cors())

app.post('/generate-gifts', async function (req, res) {
    console.log('Client requesting gift ideas:', req.body)
    
    // Validate the request body
    const { name, age, hobbies, occasion } = req.body
    if (!name || !age || !occasion) {
        return res.status(400).json({ error: 'Name, age, and occasion are required' })
    }

    try {
      // Build the prompt
      const prompt = `You are a helpful gift recommendation assistant. Based on the following information, suggest exactly 5 gift ideas and rank them with a "fit score" from 1-100.
  
      Person: ${name}
      Age: ${age}
      Hobbies/Interests: ${hobbies || 'Not specified'}
      Occasion: ${occasion}
      
      Please respond in this exact JSON format:
      {
        "gifts": [
          {
            "name": "Gift Name",
            "description": "Brief description of the gift",
            "fit_score": 95,
            "reasoning": "Why this is a good fit"
          }
        ]
      }
      
      Rank the gifts from highest to lowest fit score. Be specific and thoughtful in your recommendations.`
      
      const response = await ollama.chat({
          model: MODEL,
          messages: [
              {
                  role: 'user',
                  content: prompt
              }
          ]
      })
  
      const aiResponse = response.message.content
  
      let giftIdeas
      try {
          giftIdeas = JSON.parse(aiResponse)
      } catch (parseError) {
          return res.json({
              success: false,
              error: 'Could not parse AI response',
              raw_response: aiResponse
          })
      }
  
      res.json({
          success: true,
          input: { name, age, hobbies, occasion },
          ...giftIdeas
      })
  
  } catch (error) {
      console.error('Error generating gift ideas:', error)
      res.status(500).json({ error: 'Internal server error', details: error.message })
  }
})

app.listen(PORT, () => {
    console.log('🎁 Gift Idea Generator running on port', PORT)
    console.log('🤖 Ollama Host:', HOST)
    console.log('🧠 Model:', MODEL)
})