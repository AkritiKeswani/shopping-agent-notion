import { z } from 'zod';
import { Deal, SearchFilters } from '@/types';

const OptimizedDealSchema = z.object({
  title: z.string(),
  brand: z.string(),
  originalPrice: z.number(),
  salePrice: z.number(),
  size: z.string(),
  imageUrl: z.string(),
  productUrl: z.string(),
  inStock: z.boolean(),
  reasoning: z.string(), // Why this is a good choice
  valueScore: z.number(), // 1-10 score for value
  styleScore: z.number(), // 1-10 score for style match
});

export class AIOptimizer {
  private openaiApiKey: string;
  private anthropicApiKey: string;
  private useAnthropic: boolean;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY!;
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY!;
    
    // Use Anthropic if available, otherwise fallback to OpenAI
    this.useAnthropic = !!this.anthropicApiKey;
    
    if (!this.openaiApiKey && !this.anthropicApiKey) {
      throw new Error('Either OPENAI_API_KEY or ANTHROPIC_API_KEY is required for AI optimization');
    }
  }

  async optimizeDeals(
    deals: Deal[], 
    filters: SearchFilters,
    userPreferences?: string
  ): Promise<{
    optimizedDeals: Deal[];
    reasoning: string;
    totalAnalyzed: number;
  }> {
    if (deals.length === 0) {
      return {
        optimizedDeals: [],
        reasoning: 'No deals found to optimize',
        totalAnalyzed: 0,
      };
    }

    try {
      let response;
      
      if (this.useAnthropic) {
        response = await this.callAnthropicAPI(deals, filters, userPreferences);
      } else {
        response = await this.callOpenAIAPI(deals, filters, userPreferences);
      }

      const data = await response.json();
      const content = this.useAnthropic 
        ? data.content[0].text 
        : data.choices[0].message.content;

      // Parse the AI response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse AI response');
      }

      const aiResponse = JSON.parse(jsonMatch[0]);
      
      // Convert AI response back to Deal format
      const optimizedDeals: Deal[] = aiResponse.optimizedDeals?.map((deal: any, index: number) => ({
        id: `optimized-${index}-${Date.now()}`,
        title: deal.title,
        brand: deal.brand,
        originalPrice: deal.originalPrice,
        salePrice: deal.salePrice,
        size: deal.size,
        clothingType: this.mapClothingType(deal.clothingType || 'top'),
        imageUrl: deal.imageUrl,
        productUrl: deal.productUrl,
        inStock: deal.inStock,
        scrapedAt: new Date(),
      })) || [];

      return {
        optimizedDeals,
        reasoning: aiResponse.reasoning || 'AI analysis completed',
        totalAnalyzed: deals.length,
      };

    } catch (error) {
      console.error('AI optimization error:', error);
      // Fallback to basic filtering if AI fails
      return {
        optimizedDeals: deals.slice(0, 5), // Take first 5 as fallback
        reasoning: 'AI optimization failed, using basic filtering',
        totalAnalyzed: deals.length,
      };
    }
  }

  private mapClothingType(category: string): 'jeans' | 'shirt' | 'dress' | 'top' | 'bottom' | 'outerwear' | 'accessories' {
    const lowerCategory = category.toLowerCase();
    
    if (lowerCategory.includes('jean') || lowerCategory.includes('denim')) return 'jeans';
    if (lowerCategory.includes('shirt') || lowerCategory.includes('blouse')) return 'shirt';
    if (lowerCategory.includes('dress')) return 'dress';
    if (lowerCategory.includes('top') || lowerCategory.includes('tee') || lowerCategory.includes('tank')) return 'top';
    if (lowerCategory.includes('pant') || lowerCategory.includes('short') || lowerCategory.includes('skirt')) return 'bottom';
    if (lowerCategory.includes('jacket') || lowerCategory.includes('coat') || lowerCategory.includes('sweater')) return 'outerwear';
    if (lowerCategory.includes('bag') || lowerCategory.includes('shoe') || lowerCategory.includes('jewelry')) return 'accessories';
    
    return 'top';
  }

  private async callOpenAIAPI(deals: Deal[], filters: SearchFilters, userPreferences?: string) {
    return await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(filters, userPreferences)
          },
          {
            role: 'user',
            content: this.getUserPrompt(deals)
          }
        ],
        temperature: 0.7,
      }),
    });
  }

  private async callAnthropicAPI(deals: Deal[], filters: SearchFilters, userPreferences?: string) {
    return await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.anthropicApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `${this.getSystemPrompt(filters, userPreferences)}\n\n${this.getUserPrompt(deals)}`
          }
        ],
      }),
    });
  }

  private getSystemPrompt(filters: SearchFilters, userPreferences?: string): string {
    return `You are a fashion expert and personal shopping assistant. Your job is to analyze clothing deals and select the most optimal choices based on user preferences.

User Criteria:
- Clothing Type: ${filters.clothingType || 'any'}
- Size: ${filters.size || 'any'}
- Max Price: $${filters.maxPrice || 'no limit'}
- Brands: ${filters.brands?.join(', ') || 'any'}
${userPreferences ? `- Additional Preferences: ${userPreferences}` : ''}

Analyze each deal and select only the BEST options considering:
1. Value for money (price vs quality)
2. Style and brand reputation
3. Size availability and fit
4. Current trends and versatility
5. User's specific criteria

Return only the top 5-8 most optimal deals with reasoning in JSON format:
{
  "optimizedDeals": [
    {
      "title": "Product Name",
      "brand": "Brand Name",
      "originalPrice": 100,
      "salePrice": 80,
      "size": "M",
      "imageUrl": "url",
      "productUrl": "url",
      "inStock": true,
      "reasoning": "Why this is a great choice"
    }
  ],
  "reasoning": "Overall analysis of the selection"
}`;
  }

  private getUserPrompt(deals: Deal[]): string {
    return `Here are the deals I found. Please analyze and select the most optimal ones:

${deals.map((deal, i) => `
${i + 1}. ${deal.title}
   Brand: ${deal.brand}
   Price: $${deal.salePrice} (was $${deal.originalPrice})
   Size: ${deal.size}
   Type: ${deal.clothingType}
   In Stock: ${deal.inStock}
   URL: ${deal.productUrl}
`).join('\n')}

Please return the most optimal deals in the JSON format specified above.`;
  }
}
