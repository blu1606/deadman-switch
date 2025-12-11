import 'dotenv/config';
import { generateEmbedding } from '../src/lib/ai/embedding';
import { findCachedResponse, cacheResponse } from '../src/lib/ai/cache';

async function main() {
    console.log('🚀 Starting Cache Test...');

    const prompt1 = "How do I create a vault?";
    const response1 = "To create a vault, go to the dashboard and click 'Create Vault'.";

    // 1. Generate Embedding
    console.log(`\nGenerating embedding for: "${prompt1}"...`);
    let embedding1: number[];
    try {
        embedding1 = await generateEmbedding(prompt1);
        console.log(`✅ Embedding generated. Length: ${embedding1.length}`);
    } catch (error) {
        console.error("❌ Failed to generate embedding:", error);
        return;
    }

    // 2. Cache it
    console.log(`\nCaching response...`);
    await cacheResponse(prompt1, response1, embedding1);
    console.log(`✅ Default cached.`);

    // Wait a bit for DB propagation (optional but good for consistency)
    await new Promise(r => setTimeout(r, 1000));

    // 3. Test Hit (Exact)
    console.log(`\nTesting Exact Hit...`);
    const hit1 = await findCachedResponse(embedding1);
    if (hit1) {
        console.log(`✅ HIT! Similarity: ${hit1.similarity.toFixed(4)}`);
        console.log(`   Response: ${hit1.response}`);
    } else {
        console.log(`❌ MISS (Should have hit)`);
    }

    // 4. Test Hit (Semantic)
    const prompt2 = "How can I make a new safe?";
    console.log(`\nTesting Semantic Hit for: "${prompt2}"...`);
    const embedding2 = await generateEmbedding(prompt2);

    const hit2 = await findCachedResponse(embedding2, 0.8); // Lower threshold slightly for testing
    if (hit2) {
        console.log(`✅ HIT! Similarity: ${hit2.similarity.toFixed(4)}`);
        console.log(`   Response: ${hit2.response}`);
    } else {
        console.log(`❌ MISS (Semantic failure)`);
        console.log(`   Note: This might happen if 'how do i create a vault' and 'make a new safe' are not close enough for the model, or threshold is too high.`);
    }

    console.log('\nTest Complete.');
}

main().catch(console.error);
