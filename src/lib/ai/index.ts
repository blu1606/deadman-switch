/**
 * AI Module - Main Entry Point
 * Phase 9.6: AI Providers Strategy
 */

export { generate, getAvailableProviders, healthCheck } from './provider';
export type { AIResponse, AIGenerateOptions } from './provider';
export { generateWithGroq, streamWithGroq, isGroqAvailable } from './groq';
export { generateWithGemini, isGeminiAvailable } from './gemini';
