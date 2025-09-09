const express = require('express')
const cors = require('cors')
const { Ollama } = require('ollama')
const util = require('util')

const app = express()

// Config
const PORT = 3000
const HOST = 'http://golem:11434'
const MODEL = 'gpt-oss:120b'

const ollama = new Ollama({ host: HOST })

const dateAnalysisToolSchema = {
  "type": "function",
  "function": {
    "name": "analyzeGiftDate",
    "description": "Analyze the gift date to determine season, weather patterns, and timing context for gift recommendations",
    "parameters": {
      "type": "object",
      "properties": {
        "giftDate": {
          "type": "string",
          "description": "The date when the gift will be given (YYYY-MM-DD format)"
        }
      },
      "required": ["giftDate"]
    }
  }
};

// Analyze gift date and provide seasonal context
async function analyzeGiftDate(giftDate) {
  try {
    const date = new Date(giftDate);
    const today = new Date();
    
    // Calculate days until the gift date
    const timeDiff = date.getTime() - today.getTime();
    const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Determine season based on month
    const month = date.getMonth() + 1;
    let season;
    if (month >= 3 && month <= 5) season = 'spring';
    else if (month >= 6 && month <= 8) season = 'summer';
    else if (month >= 9 && month <= 11) season = 'fall';
    else season = 'winter';
    
    // Weather patterns per season
    const weatherPatterns = {
      'spring': 'mild temperatures, occasional rain, perfect for outdoor activities',
      'summer': 'warm to hot weather, ideal for outdoor adventures and summer activities',
      'fall': 'cooling temperatures, beautiful foliage, great for cozy indoor activities',
      'winter': 'cold weather, potential for snow, perfect for indoor entertainment and warm items'
    };
    
    let timingContext;
    if (daysUntil < 0) timingContext = 'past date - consider belated gift options';
    else if (daysUntil <= 3) timingContext = 'urgent - need quick shipping or local pickup options';
    else if (daysUntil <= 7) timingContext = 'soon - consider expedited shipping';
    else if (daysUntil <= 30) timingContext = 'moderate time - standard shipping available';
    else timingContext = 'plenty of time - can consider custom or special order items';
    
    return {
      giftDate: giftDate,
      season: season,
      month: month,
      daysUntil: daysUntil,
      weatherPatterns: weatherPatterns[season],
      timingContext: timingContext,
      isHolidaySeason: month === 12 || month === 11,
      isSummerSeason: month >= 6 && month <= 8
    };
  } catch (error) {
    console.error('Error analyzing gift date:', error);
    return {
      giftDate: giftDate,
      season: 'unknown',
      month: null,
      daysUntil: null,
      weatherPatterns: 'weather patterns unknown',
      timingContext: 'timing context unavailable',
      isHolidaySeason: false,
      isSummerSeason: false
    };
  }
}

// Tool call processing function
async function processToolCalls(messages, tools) {
  const response = await ollama.chat({
    model: MODEL,
    messages: messages,
    tools: tools,
    stream: false
  });

  if (response.message && response.message.tool_calls && response.message.tool_calls.length > 0) {
    let toolCall = response.message.tool_calls[0];
    
    if (toolCall.function.name === "analyzeGiftDate") {
      // Access the arguments directly (they're already an object)
      let dateData = await analyzeGiftDate(toolCall.function.arguments.giftDate);

      let newMessages = [
        // previous messages:
        ...messages,

        // the tool call message:
        response.message,

        // the tool result message:
        {
          "role": "tool",
          "tool_name": toolCall.function.name,
          "content": JSON.stringify(dateData)
        }
      ];

      console.log("LLM tool requested:", util.inspect(response.message, false, null, true));
      console.log("Date analysis result:", util.inspect(dateData, false, null, true));

      let nextResult = await processToolCalls(newMessages, tools);

      return {
        message: nextResult.message,
        toolCalls: [toolCall, ...nextResult.toolCalls],
        toolResults: [dateData, ...nextResult.toolResults]
      };
    } else {
      console.log("Unknown tool called:", toolCall.function.name);
    }
  }

  // the LLM either didn't request a tool call or called an unrecognized tool
  return {
    message: response.message,
    toolCalls: [],
    toolResults: []
  };
}

// Middleware
app.use(express.json())
app.use(cors())

app.post('/generate-gifts', async function (req, res) {
    console.log('Client requesting gift ideas:', req.body)
    
    // Validate the request body
    const { name, age, hobbies, occasion, giftDate } = req.body
    if (!name || !age || !occasion) {
        return res.status(400).json({ error: 'Name, age, and occasion are required' })
    }

    try {
      // Build initial prompt with tool call instruction
      const prompt = `You are a helpful gift recommendation assistant. Based on the following information, suggest exactly 5 gift ideas and rank them with a "fit score" from 1-100.
  
      Person: ${name}
      Age: ${age}
      Hobbies/Interests: ${hobbies || 'Not specified'}
      Occasion: ${occasion}
      Gift Date: ${giftDate || 'Not specified'}
      
      IMPORTANT: If a gift date is provided, you MUST call the analyzeGiftDate tool first to get seasonal and timing context before making recommendations. This will help you suggest more appropriate gifts based on the season, weather patterns, and timing urgency.
      
      After getting the date analysis, please respond in this exact JSON format:
      {
        "gifts": [
          {
            "name": "Gift Name",
            "description": "Brief description of the gift",
            "fit_score": 95,
            "reasoning": "Why this is a good fit (include seasonal/timing context if available)"
          }
        ]
      }
      
      Rank the gifts from highest to lowest fit score. Be specific and thoughtful in your recommendations, considering seasonal appropriateness and timing constraints.`
      
      const messages = [
        {
          role: 'user',
          content: prompt
        }
      ];

      // Process with tool calls
      const result = await processToolCalls(messages, [dateAnalysisToolSchema]);
      const aiResponse = result.message.content;
  
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
          input: { name, age, hobbies, occasion, giftDate },
          ...giftIdeas,
          toolCalls: result.toolCalls,
          toolResults: result.toolResults
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