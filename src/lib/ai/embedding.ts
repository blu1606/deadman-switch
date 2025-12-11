import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { embed } from 'ai';

// Initialize provider with the project's specific env var
const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_AI_API_KEY,
});

/**
 * Generate a vector embedding for the given text using Google's text-embedding-004 model.
 * Dimensions: 768
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    if (!text) throw new Error('Text is required for embedding generation');

    try {
        const { embedding } = await embed({
            model: google.textEmbeddingModel('text-embedding-004'),
            value: text,
        });
        return embedding;
    } catch (error) {
        console.error('Embedding generation failed:', error);
        // Return empty array or throw? Throwing is better so caller knows it failed.
        throw error;
    }
}
