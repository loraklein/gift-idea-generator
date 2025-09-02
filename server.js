const express = require('express')

const app = express()

// Config
const PORT = 3000
const API_URL = 'http://golem:11434/api/chat'
const MODEL = 'gpt-oss:120b'

// Middleware
app.use(express.json())


app.post('/generate-gifts', async function (req, res) {
    console.log('Client requesting gift ideas:', req.body)
    
    // Validate the request body
    const { name, age, hobbies, occasion } = req.body
    if (!name || !age || !occasion) {
        return res.status(400).json({ error: 'Name, age, and occasion are required' })
    }

    try {
        // TODO: build the prompt and Ollama call here
        res.json({ 
            message: 'Gift generation endpoint - coming soon!',
            received: { name, age, hobbies, occasion }
        })
        
    } catch (error) {
        console.error('Error generating gift ideas:', error)
        res.status(500).json({ error: 'Internal server error', details: error.message })
    }
})

app.listen(PORT, () => {
    console.log('🎁 Gift Idea Generator running on port', PORT)
    console.log('🤖 Ollama URL:', API_URL)
    console.log('🧠 Model:', MODEL)
})