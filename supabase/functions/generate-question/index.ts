import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import OpenAI from 'npm:openai';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize OpenAI client
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables are required');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { category = 'Science', language = 'en' } = await req.json();

    // Check for existing questions in this category (limit to avoid overload)
    const { data: existingQuestions, error: queryError } = await supabase
      .from('questions')
      .select('question_text')
      .eq('category', category)
      .limit(50);

    if (queryError) {
      throw new Error(`Database query failed: ${queryError.message}`);
    }

    // Weighted difficulty selection (40% Easy, 40% Medium, 20% Hard)
    const difficultyWeights = [
      { difficulty: 'Easy', weight: 0.4 },
      { difficulty: 'Medium', weight: 0.4 },
      { difficulty: 'Hard', weight: 0.2 }
    ];

    const random = Math.random();
    let cumulativeWeight = 0;
    let selectedDifficulty = 'Medium';

    for (const item of difficultyWeights) {
      cumulativeWeight += item.weight;
      if (random <= cumulativeWeight) {
        selectedDifficulty = item.difficulty;
        break;
      }
    }

    // Create existing questions context for duplicate avoidance
    const existingQuestionsText = existingQuestions
      ?.map(q => q.question_text?.en || '')
      .filter(Boolean)
      .join('\n') || '';

    // Generate question via OpenAI
    const questionPrompt = `Create 1 unique trivia question about ${category} with ${selectedDifficulty} difficulty level.

Requirements:
- Ensure accurate facts and verify all information
- Make it educational and engaging
- Avoid these existing questions: ${existingQuestionsText}

Return ONLY a valid JSON object with this exact structure:
{
  "question_text": {
    "en": "English question text here",
    "ar": "Arabic translation here"
  },
  "answers": {
    "correct": "correct answer",
    "wrongs": ["wrong answer 1", "wrong answer 2", "wrong answer 3"]
  },
  "fact": "Interesting fact related to the correct answer",
  "image_description": "Brief description for generating a related image"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a trivia question generator. Always return valid JSON only, no additional text.'
        },
        {
          role: 'user',
          content: questionPrompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1000,
    });

    const questionData = JSON.parse(completion.choices[0].message.content || '{}');

    // Generate related image using DALL-E
    let pictureUrl = null;
    try {
      const imageResponse = await openai.images.generate({
        model: 'dall-e-3',
        prompt: `Educational illustration: ${questionData.image_description}. Clean, colorful, suitable for trivia game.`,
        size: '1024x1024',
        quality: 'standard',
        n: 1,
      });
      
      pictureUrl = imageResponse.data[0]?.url || null;
    } catch (imageError) {
      console.warn('Image generation failed:', imageError);
      // Continue without image - not critical
    }

    // Prepare question data for database
    const questionRecord = {
      category,
      difficulty: selectedDifficulty,
      question_text: questionData.question_text,
      answers: {
        options: [
          questionData.answers.correct,
          ...questionData.answers.wrongs
        ].sort(() => Math.random() - 0.5), // Shuffle options
        correct_index: 0, // Will be updated after shuffle
        fact: questionData.fact
      },
      picture_url: pictureUrl,
      viewed_by: [],
    };

    // Find correct answer index after shuffle
    questionRecord.answers.correct_index = questionRecord.answers.options.findIndex(
      option => option === questionData.answers.correct
    );

    // Insert question into database
    const { data: insertedQuestion, error: insertError } = await supabase
      .from('questions')
      .insert(questionRecord)
      .select()
      .single();

    if (insertError) {
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        question: insertedQuestion,
        message: 'Question generated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        details: error.stack || null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});