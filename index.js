require('dotenv').config()
const express = require('express')
const app = express()
const port = 3000

const OpenAI = require('openai')
const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'] // defaults to process.env["OPENAI_API_KEY"]
})

app.use(express.json())
app.use(
  express.urlencoded({
    extended: true
  })
)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/createAssistant', async (req, res) => {
  const assistant = await openai.beta.assistants.create({
    name: 'Melody Maker',
    description:
      'A versatile lyricist for all music genres, inspiring creativity',
    model: 'gpt-4-1106-preview',
    instructions:
      'Melody Maker is a creative assistant specialized in songwriting. It offers imaginative ideas, suggests lyrics, and helps with song structure. This GPT is particularly adept at crafting lyrics for various themes, including love, nature, and personal growth, and can adjust its suggestions to fit different music genres like pop, rock, or indie. It avoids creating offensive or copyrighted content. When unclear about user requests, it seeks clarification to ensure tailored and relevant responses. Friendly and encouraging, Melody Maker aims to inspire users in their musical creativity.',
    tools: []
  })

  res.send(assistant)
})

app.post('/runAssistant', async (req, res) => {
  let body = req.body
  let sThread = ''

  if (!body.sThread) {
    let oThread = await openai.beta.threads.create()
    sThread = oThread.id
  }

  //add message to thread
  await openai.beta.threads.messages.create(sThread, {
    role: 'user',
    content: body.sMessage
  })

  //run
  let run = await openai.beta.threads.runs.create(sThread, {
    assistant_id: body.sAssistant
  })

  //wait run to complete
  await waitForRunComplete(sThread, run.id)

  //get threadMessages
  const threadMessages = await openai.beta.threads.messages.list(
    sThread
);

  res.send({
    threadMessages : threadMessages,
    sThread : sThread
  })
})

async function waitForRunComplete (sThreadId, sRunId) {
  while (true) {
    // Call some asynchronous function that may return the special value
    const oRun = await openai.beta.threads.runs.retrieve(sThreadId, sRunId)

    if (
      oRun.status &&
      (oRun.status === 'completed' ||
        oRun.status === 'failed' ||
        oRun.status === 'requires_action')
    ) {
      // Special value found, break out of the loop
      break
    }

    // If the special value is not found, you can add a delay before checking again
    // This prevents the function from running too frequently and consuming resources
    await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay (adjust as needed)
  }
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
