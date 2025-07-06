# FinBuddy Fresh 📱💰

A modern React Native trading and portfolio management app built with Expo, featuring real-time stock data, interactive charts, and comprehensive portfolio tracking.

## Features ✨

### 📊 **Portfolio Management**
- Real-time portfolio tracking
- Stock holdings with current values
- Profit/loss calculations
- Portfolio summary with total value and cash balance

### 📈 **Advanced Charting**
- TradingView integration for professional charts
- Multiple timeframes (1D, 1W, 1M, 3M, 1Y, 5Y)
- Landscape mode for enhanced chart viewing
- Full-screen chart experience in landscape

### 🏢 **Company Data**
- NASDAQ company listings
- Real-time stock prices via Finnhub API
- Company search and filtering
- Detailed company information

### 💼 **Trading Features**
- Buy/sell stock functionality
- Real-time price updates
- Trading modal with search capabilities
- Account balance management ($100,000 starting balance)

### 👤 **User Management**
- Secure authentication with Supabase
- User profiles with editable information
- Session management
- Profile photo support

### 🎨 **Modern UI/UX**
- Clean, professional design
- Dark/light theme support
- Responsive layout
- Smooth animations and transitions
- Tab-based navigation

## Tech Stack 🛠️

### Frontend
- **React Native** with Expo
- **TypeScript** for type safety
- **Expo Router** for file-based routing
- **React Query** for data fetching
- **Zustand** for state management
- **React Native Vector Icons** for iconography

### Backend
- **Hono** web framework
- **tRPC** for type-safe APIs
- **Supabase** for database and authentication
- **Node.js** runtime

### APIs & Services
- **Finnhub API** for real-time stock data
- **TradingView** for advanced charting
- **Supabase** for user management and data storage

### Development Tools
- **TypeScript** configuration
- **Metro** bundler
- **ESLint** for code quality
- **Git** for version control

## Installation & Setup 🚀

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (for testing)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/finbuddy-fresh.git
cd finbuddy-fresh
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
FINNHUB_API_KEY=your_finnhub_api_key
```

### 4. Configure app.json
Update the `extra` section in `app.json` with your API keys:
```json
{
  "expo": {
    "extra": {
      "SUPABASE_URL": "your_supabase_url",
      "SUPABASE_ANON_KEY": "your_supabase_anon_key",
      "FINNHUB_API_KEY": "your_finnhub_api_key"
    }
  }
}
```

### 5. Database Setup
Set up your Supabase database with the following tables:

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT,
  surname TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  password TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Companies Table
```sql
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  symbol TEXT UNIQUE,
  name TEXT,
  sector TEXT,
  industry TEXT,
  marketCap TEXT,
  price DECIMAL,
  change DECIMAL,
  changePercentage DECIMAL
);
```

#### Portfolio Table
```sql
CREATE TABLE portfolio (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  company_ticker TEXT REFERENCES companies(symbol),
  quantity INTEGER,
  average_cost DECIMAL,
  current_total_value DECIMAL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 6. Start the Backend Server
```bash
npm run server
# Backend will run on http://localhost:3000
```

### 7. Start the Expo Development Server
```bash
npx expo start
```

## Project Structure 📁

```
finbuddy-fresh/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab navigation
│   └── _layout.tsx        # Root layout
├── backend/               # Backend API
│   └── trpc/             # tRPC routes
├── components/           # Reusable components
├── constants/           # Theme and colors
├── contexts/           # React contexts
├── lib/               # Utilities and configurations
├── services/         # External service integrations
├── stores/          # State management
└── assets/         # Images and static files
```

## Key Features Implementation 🔧

### Authentication
- Supabase Auth integration
- Secure session management
- Auto-login with stored credentials (development)

### Real-time Data
- Finnhub API integration for stock prices
- tRPC for type-safe API calls
- React Query for caching and synchronization

### Charts
- TradingView widget integration
- Responsive design with orientation support
- Full-screen landscape mode

### Trading System
- Virtual trading with $100,000 starting balance
- Real-time price updates
- Portfolio tracking and calculations

## Development 👨‍💻

### Available Scripts
```bash
npm start          # Start Expo development server
npm run server     # Start backend server
npm run build      # Build for production
npm run test       # Run tests
```

### Code Quality
- TypeScript for type safety
- ESLint for code linting
- Consistent code formatting

## Contributing 🤝

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- [Expo](https://expo.dev/) for the amazing React Native framework
- [Supabase](https://supabase.io/) for backend services
- [TradingView](https://tradingview.com/) for charting capabilities
- [Finnhub](https://finnhub.io/) for real-time market data

## Support 📞

For support, email support@finbuddy.app or create an issue in this repository.

---

**Built with ❤️ by the FinBuddy Team**

## 🚀 Production Deployment & API Health

- **Backend deployed on Vercel:**
  - Main API: https://finbuddy-fresh.vercel.app/api/trpc/[procedure]
  - Health check: https://finbuddy-fresh.vercel.app/api/health
- **Dynamic API routes** are now supported via `[trpc].js` for tRPC endpoints.
- **ESM support**: Project uses ES Modules (`"type": "module"` in `package.json`).

## Troubleshooting

- **404 on API endpoints:**
  - Ensure Vercel deployment is complete and successful.
  - Confirm `api/[trpc].js` exists at the project root for dynamic tRPC routes.
- **Supabase errors (e.g., fetch failed):**
  - Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in Vercel project environment variables.
  - Make sure these match your Supabase project.
  - Redeploy after updating environment variables.
- **ESM/CommonJS warnings:**
  - Project is set to ESM. If you see conversion warnings, ensure all backend code uses `import/export` syntax.

--- 