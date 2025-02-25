import { NextResponse } from 'next/server'
import Replicate from 'replicate'

// Add environment variable check
if (!process.env.REPLICATE_API_TOKEN) {
  throw new Error('REPLICATE_API_TOKEN is not set in environment variables')
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function POST(req: Request) {
  try {
    const { prompt, model, parameters } = await req.json()
    
    if (!prompt) {
      return new NextResponse('Prompt is required', { status: 400 })
    }

    if (!model) {
      return new NextResponse('Model is required', { status: 400 })
    }

    console.log('Starting image generation with:', {
      model,
      prompt,
      parameters
    })

    const output = await replicate.run(
      model,
      {
        input: {
          prompt,
          ...parameters
        }
      }
    )

    console.log('Generation successful, output:', output)
    return NextResponse.json({ url: output })
  } catch (error: any) {
    console.error('[REPLICATE_ERROR] Full error:', error)
    console.error('[REPLICATE_ERROR] Error message:', error.message)
    console.error('[REPLICATE_ERROR] Error response:', error.response)
    console.error('[REPLICATE_ERROR] Environment check:', {
      hasToken: !!process.env.REPLICATE_API_TOKEN,
      tokenPrefix: process.env.REPLICATE_API_TOKEN?.substring(0, 5)
    })
    
    // Return more detailed error message
    return new NextResponse(
      JSON.stringify({
        error: error.message,
        details: error.response || 'No additional details available'
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
} 