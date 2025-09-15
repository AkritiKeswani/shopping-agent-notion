# Shopping Agent Notion

A sophisticated web scraping and shopping assistant that helps you discover and save clothing items from popular fashion brands within your budget constraints.

## 🛍️ Features

### Smart Shopping Search
- **Multi-brand Support**: Search across Aritzia and Reformation simultaneously
- **Budget Management**: Set spending limits and get results that stay within your budget
- **Size Filtering**: Find items in your preferred size
- **Clothing Type Filtering**: Search for specific categories like tops, dresses, jeans, etc.
- **Price Filtering**: Automatically excludes $0 items and items over budget

### Intelligent Results
- **Fair Brand Distribution**: Ensures equal representation from both brands
- **Smart Interleaving**: Results are mixed to provide variety
- **Budget Enforcement**: Strict adherence to spending limits
- **Real-time Pricing**: Live price data from retailer websites

### Notion Integration
- **Automatic Saving**: Save discovered items directly to your Notion database
- **Organized Storage**: Items are categorized with brand, price, size, and other details
- **Easy Access**: View and manage your saved items in Notion

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Notion account with API access
- Browserbase account for cloud browser automation
- OpenAI API key for Stagehand AI capabilities

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AkritiKeswani/shopping-agent-notion.git
   cd shopping-agent-notion
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Browserbase Configuration
   BROWSERBASE_API_KEY=your_browserbase_api_key
   BROWSERBASE_PROJECT_ID=your_browserbase_project_id
   
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key
   
   # Notion Configuration
   NOTION_API_KEY=your_notion_api_key
   NOTION_DATABASE_ID=your_notion_database_id
   ```

4. **Set up Notion Database**
   - Create a new Notion database
   - Add the following properties:
     - **Name** (Title)
     - **Brand** (Select)
     - **Price** (Number)
     - **Sizes** (Multi-select)
     - **Wanted Size** (Select)
     - **URL** (URL)
     - **Image URL** (URL)
     - **session URL** (URL)
     - **Selected** (Checkbox)
     - **Month** (Date)
   - Copy the database ID from the URL and add it to your `.env.local`

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 💡 How to Use

### Basic Search
1. **Enter your search query** (e.g., "tops", "dresses", "jeans")
2. **Select your size** from the dropdown
3. **Choose brands** you want to search (Aritzia, Reformation, or both)
4. **Set your budget** (e.g., $200, $500, $1000)
5. **Click "Search"** to start the search

### Understanding Results
- **Budget Summary**: Shows total spend and remaining budget
- **Brand Breakdown**: Number of items found per brand
- **Item Details**: Each item shows name, brand, price, and size
- **View Button**: Click to open the product page in a new tab

### Saving to Notion
1. **Click "Save to Notion"** after getting results
2. **Items are automatically saved** to your Notion database
3. **Check your Notion workspace** to see the saved items

## 🎯 Use Cases

### Personal Shopping
- Find items within your budget from multiple brands
- Compare prices and styles across retailers
- Save interesting items for later consideration

### Wardrobe Planning
- Search for specific clothing types you need
- Build outfits within budget constraints
- Track items you're considering purchasing

### Sale Hunting
- Discover discounted items across brands
- Find items in your size during sales
- Save items for price comparison

## 🔧 Technical Architecture

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Responsive design** for mobile and desktop

### Backend
- **API Routes** for search and save functionality
- **Browserbase** for cloud browser automation and scraping
- **Stagehand** for intelligent web interaction and data extraction
- **MCP (Model Context Protocol)** for enhanced AI-powered scraping
- **Data processing** and filtering
- **Notion API integration**

### Data Flow
1. User submits search parameters
2. **Browserbase** launches cloud browsers for each brand
3. **Stagehand** with **MCP** intelligently navigates and extracts product data
4. Results are filtered and processed with budget constraints
5. Items are displayed with fair brand distribution
6. Selected items can be saved to Notion database

## 📊 Budget Management

The system includes sophisticated budget management:
- **Pre-filtering**: Removes items over budget before display
- **Fair distribution**: Ensures both brands are represented
- **Strict enforcement**: Never exceeds your set budget
- **Real-time calculation**: Shows exact spend and remaining budget

## 🛡️ Error Handling

- **Graceful degradation**: Continues working even if one brand fails
- **Clear error messages**: User-friendly error reporting
- **Retry mechanisms**: Automatic retry for failed requests
- **Fallback options**: Alternative approaches when primary methods fail

## 🔒 Privacy & Security

- **No data storage**: Search results are not permanently stored
- **Secure API keys**: Environment variables for sensitive data
- **HTTPS only**: All communications are encrypted
- **No tracking**: No user behavior tracking or analytics

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Compatible with static site generation
- **Railway**: Good for full-stack applications
- **AWS/GCP**: For enterprise deployments

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is for personal use. Please respect the terms of service of the websites being scraped.

## 🆘 Troubleshooting

### Common Issues

**"No results found"**
- Check your internet connection
- Verify API keys are correct
- Try a different search term

**"Budget exceeded"**
- This shouldn't happen with the current implementation
- Check if you have the latest version

**"Notion save failed"**
- Verify Notion API key and database ID
- Check database permissions
- Ensure database has the required properties

**"Scraping timeout"**
- Some websites may be slow to respond
- Try again in a few minutes
- Check if the target websites are accessible

### Getting Help
- Check the console for error messages
- Verify all environment variables are set
- Ensure you have the latest version of the code

## 🔮 Future Enhancements

- Support for additional clothing brands
- Price tracking and alerts
- Wishlist functionality
- Size recommendation system
- Style matching algorithms
- Mobile app version

---

**Note**: This tool is designed for personal use and educational purposes. Please respect the terms of service of the websites being accessed and use responsibly.