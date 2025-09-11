interface BackgroundAgent {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'running' | 'completed' | 'failed';
  repository: string;
  prompt: string;
  created_at: string;
  updated_at: string;
}

interface CreateAgentRequest {
  name: string;
  repository: string;
  prompt: string;
  environment?: string;
}

interface CreateAgentResponse {
  agent: BackgroundAgent;
}

export class BackgroundAgentsService {
  private apiKey: string;
  private baseUrl = 'https://api.cursor.com';

  constructor() {
    this.apiKey = process.env.CURSOR_BACKGROUND_AGENTS_API_KEY!;
    if (!this.apiKey) {
      throw new Error('CURSOR_BACKGROUND_AGENTS_API_KEY is required');
    }
  }

  async createAgent(request: CreateAgentRequest): Promise<CreateAgentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v0/agents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create agent: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Background agent creation error:', error);
      throw error;
    }
  }

  async getAgent(agentId: string): Promise<BackgroundAgent> {
    try {
      const response = await fetch(`${this.baseUrl}/v0/agents/${agentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get agent: ${response.statusText}`);
      }

      const data = await response.json();
      return data.agent;
    } catch (error) {
      console.error('Get agent error:', error);
      throw error;
    }
  }

  async listAgents(): Promise<BackgroundAgent[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v0/agents`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to list agents: ${response.statusText}`);
      }

      const data = await response.json();
      return data.agents || [];
    } catch (error) {
      console.error('List agents error:', error);
      throw error;
    }
  }

  async addFollowUpPrompt(agentId: string, prompt: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/v0/agents/${agentId}/prompts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add follow-up prompt: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Add follow-up prompt error:', error);
      throw error;
    }
  }

  async createShoppingDealsAgent(repository: string): Promise<BackgroundAgent> {
    const prompt = `You are a shopping deals monitoring agent. Your tasks are:

1. Monitor the shopping deals data in this repository
2. When new deals are found, update the README.md with a summary of the latest deals
3. Create a deals-summary.md file with detailed information about current deals
4. Update any documentation when the deals data changes
5. Respond to issues about deals or pricing

Focus on:
- Keeping documentation up to date with current deals
- Providing clear summaries of available deals
- Maintaining accurate pricing information
- Helping users understand what deals are available

Always be helpful and provide accurate information about the shopping deals.`;

    return this.createAgent({
      name: 'Shopping Deals Monitor',
      repository,
      prompt,
    });
  }

  async createDealsUpdaterAgent(repository: string): Promise<BackgroundAgent> {
    const prompt = `You are a deals data updater agent. Your tasks are:

1. When new deals data is pushed to the repository, analyze the data
2. Update the deals-summary.md file with the latest deals information
3. Generate a formatted summary of deals by brand (Aritzia, Reformation, Free People)
4. Update the README.md with current deal counts and highlights
5. Create markdown tables showing the best deals by category
6. Ensure all pricing and discount information is accurate and well-formatted

Focus on:
- Creating clear, readable summaries
- Highlighting the best deals and discounts
- Organizing deals by brand and category
- Maintaining consistent formatting
- Providing useful insights about the deals data

Always format the output in clean, readable markdown.`;

    return this.createAgent({
      name: 'Deals Data Updater',
      repository,
      prompt,
    });
  }
}