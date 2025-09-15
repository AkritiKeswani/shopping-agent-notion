import { Browserbase } from '@browserbasehq/sdk';

const browserbase = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY!,
});

export { browserbase };
