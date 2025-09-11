interface BackgroundAgentRequest {
  task: string;
  context?: any;
  maxSteps?: number;
}

interface BackgroundAgentResponse {
  result: any;
  status: 'completed' | 'failed' | 'in_progress';
  steps: any[];
}

export class BackgroundAgentsService {
  private apiKey: string;
  private baseUrl = 'https://api.cursor.sh/v1/background-agents';

  constructor() {
    this.apiKey = process.env.CURSOR_BACKGROUND_AGENTS_API_KEY!;
    if (!this.apiKey) {
      throw new Error('CURSOR_BACKGROUND_AGENTS_API_KEY is required');
    }
  }

  async createAgent(request: BackgroundAgentRequest): Promise<BackgroundAgentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Background agent creation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Background agent creation error:', error);
      throw error;
    }
  }

  async getAgentStatus(agentId: string): Promise<BackgroundAgentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/status/${agentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get agent status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get agent status error:', error);
      throw error;
    }
  }

  async runScrapingTask(filters: any): Promise<any> {
    const task = `Scrape shopping deals from Aritzia, Reformation, and Free People websites. 
    Filters: ${JSON.stringify(filters)}
    
    For each website:
    1. Navigate to the sale section
    2. Filter by clothing type if specified: ${filters.clothingType || 'any'}
    3. Filter by size if specified: ${filters.size || 'any'}
    4. Extract product information including:
       - Product name/title
       - Brand
       - Original price
       - Sale price
       - Discount percentage
       - Available sizes
       - Product image URL
       - Product page URL
       - Stock status
    
    Return the data in a structured format for each brand.`;

    const agent = await this.createAgent({
      task,
      context: { filters },
      maxSteps: 10,
    });

    return agent;
  }
}
