# Bolt Blitz ⚡️

A real-time multiplayer trivia game built with Next.js, Supabase, and OpenAI.

## Features

- 🎮 Real-time multiplayer trivia gameplay
- 🧠 AI-generated questions using OpenAI
- 🏆 Global leaderboards with live updates
- 💎 Virtual currency system (gems & coins)
- 🔐 Secure authentication with Supabase
- 📱 Responsive design for all devices
- ⚡ High-performance animated splash screen with Phaser.js
- 🎨 Modern UI with GPU-accelerated animations

## Quick Start

### 1. Environment Setup

Copy the environment variables:

```bash
cp .env.example .env.local
```

Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 2. Database Setup

1. Go to your Supabase dashboard
2. Open the SQL Editor
3. Run the migration script from `supabase/migrations/create_database_schema.sql`

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Performance Testing

### Splash Screen Performance

The app features a high-performance animated splash screen built with Phaser.js:

1. **Preview in browser**: Navigate to the root URL to see the splash screen
2. **Check FPS in DevTools**: 
   - Open Chrome DevTools (F12)
   - Go to Performance tab
   - Record while splash screen is running
   - Target: 120 FPS with GPU acceleration
3. **Test on mobile**: 
   - Use Chrome DevTools device emulation
   - Test portrait/landscape orientations
   - Verify touch compatibility and responsiveness
4. **Memory management**: Monitor memory usage during long sessions

### Performance Features

- **GPU Acceleration**: Phaser.js WebGL renderer for optimal performance
- **Responsive Design**: Auto-scaling canvas with orientation change support
- **Memory Optimization**: Proper cleanup and resource management
- **Mobile-First**: Touch-friendly controls and PWA-ready design

## Testing Instructions

### Active Gameplay Testing

**Important**: Test the active gameplay interface thoroughly:

1. **Multiplayer Split-Screen**: 
   - Navigate to Tournament mode from main menu
   - Verify split-screen layout with Team A (blue) and Team B (purple) panels
   - Check team scores update in real-time
   - Test turn indicators and panel highlighting

2. **Answer Submission**:
   - Click answer options to select (should highlight in blue)
   - Submit answers and verify correct/wrong feedback animations
   - Check point calculation (Easy: 100, Medium: 200, Hard: 400)
   - Verify haptic feedback on mobile devices (vibration)

3. **Tool Activation**:
   - Click available tools in team panels or solo mode
   - Test tool effects:
     - 50/50: Should eliminate 2 wrong answers
     - Double Points: Should double next correct answer points
     - Time Freeze: Should pause timer for 10 seconds
   - Verify tools become disabled after use (one-time only)
   - Check tool confirmation dialogs with effect previews

4. **Realtime Updates**:
   - Open game in multiple browser tabs/devices
   - Verify scores update across all instances
   - Test tool usage synchronization
   - Check turn switching in multiplayer modes

5. **Mobile Touch Testing**:
   - Test answer selection with touch gestures
   - Verify tool activation on touch screens
   - Check haptic feedback (vibration) on correct/wrong answers
   - Test responsive layout on different screen sizes
   - Verify orientation handling (portrait/landscape)

6. **Timer and Animations**:
   - Verify 30-second countdown timer
   - Check timer turns red and pulses at 10 seconds
   - Test automatic submission when time runs out
   - Verify smooth transitions between questions
   - Check result overlay animations (green for correct, red for wrong)

7. **Question Display**:
   - Verify questions load with proper formatting
   - Check category banners with themed backgrounds
   - Test difficulty indicators (green/yellow/red)
   - Verify question images display correctly
   - Check question counter (X of total)

8. **Game Flow**:
   - Test complete game flow from start to finish
   - Verify game completion screen
   - Check navigation back to main menu
   - Test exit game functionality

### Achievement System Testing

**Important**: Test the achievement system interface thoroughly:

1. **Achievement Tabs**:
   - Navigate to `/achievements` from main menu
   - Test all four tabs: Daily, Weekly, Milestone, Special
   - Verify tab switching with proper icons and colors
   - Check responsive layout on mobile devices

2. **Progress Updates**:
   - Verify achievement progress bars update correctly
   - Check progress percentages match current/target values
   - Test completion detection (progress >= target)
   - Verify visual indicators for completed achievements

3. **Reward Collection**:
   - Click "Collect Reward" on completed achievements
   - Verify rewards are added to user account (coins/gems)
   - Check achievement status updates to "unlocked"
   - Test reward collection animations and feedback

4. **Achievement Types**:
   - **Daily**: Test daily task completion and reset
   - **Weekly**: Verify weekly challenge progress
   - **Milestone**: Check long-term goal tracking
   - **Special**: Test rare achievement unlocks

5. **Visual Design**:
   - Verify tier styling (bronze/silver/gold/platinum)
   - Check animated backgrounds and particle effects
   - Test hover effects and card animations
   - Verify proper contrast and readability

6. **Mobile Touch Testing**:
   - Test achievement card interactions on touch screens
   - Verify reward collection buttons work with touch
   - Check scrolling and navigation on mobile
   - Test responsive layout across screen sizes

7. **Database Integration**:
   - Verify achievements load from Supabase correctly
   - Test real-time updates when achievements complete
   - Check reward collection updates user data
   - Verify achievement creation for new users

8. **Performance**:
   - Test loading times for achievement data
   - Verify smooth animations and transitions
   - Check memory usage during extended use
   - Test background particle system performance

**Important**: Test the game shop interface thoroughly:

1. **Shop Navigation**:
   - Navigate to `/shop` from main menu
   - Test all four tabs: Games, Tools, Categories, Premium Features
   - Verify tab switching with proper icons and colors
   - Check responsive layout on mobile devices

2. **Product Display**:
   - Verify product cards show correct pricing and descriptions
   - Check featured deals banner with discount badges
   - Test product previews and effect descriptions
   - Verify age restriction warnings for appropriate items

3. **Purchase Flow**:
   - Test "Buy Now" button functionality
   - Verify purchase confirmation dialogs for high-value items
   - Check purchase processing animations and feedback
   - Test cart functionality (add/remove items)

4. **Database Integration**:
   - Verify purchases update user coins in Supabase
   - Check purchase history loads from shop_purchases table
   - Test purchase recording with correct timestamps
   - Verify balance updates reflect in UI immediately

5. **Visual Design**:
   - Check category-specific color themes and gradients
   - Verify animated backgrounds and particle effects
   - Test hover effects and card animations
   - Check proper contrast and readability

6. **Mobile Testing**:
   - Test purchase buttons on touch screens
   - Verify cart and history dialogs work with touch
   - Check scrolling and navigation on mobile
   - Test responsive layout across screen sizes

7. **Security Features**:
   - Test age restriction checks for users under 18
   - Verify high-value purchase confirmations
   - Check secure payment processing indicators
   - Test parental control warnings

### Edge Functions Setup

**Important**: Before testing the AI question generator, you need to deploy the edge function with the updated OpenAI SDK:

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions** in the sidebar
3. Create a new function called `generate-question`
4. Copy the contents of `supabase/functions/generate-question/index.ts` into the function editor
5. **Note**: The function now uses `npm:openai` for better compatibility with Deno
5. Add the `OPENAI_API_KEY` environment variable in the function settings
6. Deploy the function and ensure it's active

**Deployment Note**: If you previously deployed this function, redeploy it after updating the code to use the new OpenAI SDK import.

**Note**: The application uses `supabase.functions.invoke()` for stable edge function calls instead of raw fetch requests.

### Authentication Testing

1. **Authentication Screen**: Navigate to `/auth` for the full authentication experience
   - **Language Toggle**: Switch between English and Arabic with RTL support
   - **Visual Effects**: Dynamic lightning animations and floating particles
   - **Form Validation**: Real-time email validation and password strength indicator

2. **Sign Up**: Create a new account with email/password/username/age
   - Minimum age: 7 years
   - Unique username required
   - Starting currency: 100 gems, 50 coins
   - Real-time validation with visual feedback

3. **Sign In**: Use existing credentials
   - Error handling for invalid credentials
   - Automatic profile loading
   - Smooth transitions and animations

4. **Error Scenarios**:
   - Try signing up with existing email (should show friendly message)
   - Try signing in with wrong password (should show error)
   - Test with invalid email formats
   - Test with weak passwords (strength indicator)

5. **Mobile Testing**:
   - Test on mobile devices for touch interactions
   - Check keyboard optimization and input focus
   - Verify portrait/landscape transitions
   - Test RTL layout in Arabic mode

### Game Setup Testing

1. **Team Configuration**:
   - Navigate to game setup from main menu cards with mode parameters
   - Test different game modes: Quick Match, Create Room, Practice, Tournament, Daily Challenge
   - **Quick Match**: Verify no team UI shown (single 1vs1 mode with matchmaking)
   - Test team name input and avatar selection
   - Configure categories (max 3 per team, no duplicates)
   - Test ready status toggle

2. **Tool Management**:
   - **Click Selection**: Click tools to select/deselect them (visual feedback with checkmarks)
   - **Turn-based Selection**: In multiplayer modes, teams take turns selecting tools
   - Test maximum 3 tools per team limit
   - Remove tools by clicking on badges
   - Verify locked tools cannot be selected

3. **Category Selection**:
   - Select categories for each team
   - Verify duplicate prevention between teams
   - Test visual feedback for selections
   - Test mode-specific category limits (2-4 categories depending on mode)

4. **Game Start**:
   - Ensure start button only enables when both teams ready
   - Test countdown animation and transition
   - **Supabase Integration**: Verify game creation in games table (empty jsonb {} for single modes)
   - Test auto-start for Daily Challenge mode

5. **Scrolling and Navigation**:
   - **Test scrolling up/down on all pages** (auth, main, game-setup)
  - Verify rules sidebar scrolls properly with long content
  - Check page containers allow full content visibility

6. **Tool Interaction Testing**:
   - **Click tool cards to select/deselect** (should show checkmark when selected)
  - Test hover effects and visual feedback
   - **Turn-based selection in multiplayer**: Teams alternate tool selection
  - Test tool limits and error messages

7. **Font Visibility Testing**:
   - **Font Visibility**: Check black text visibility on all backgrounds
  - Verify readability of all text elements
   - Test contrast on gradients and dark themes

8. **Mobile Testing**:
   - **Test tool clicking/selection on touch screens**
   - Verify responsive layout on mobile
   - Check touch interactions for all controls
   - **Test scrolling with touch gestures**

## Settings & Profile Management Testing

**Important**: Test the settings & profile management interface thoroughly:

1. **Profile Management**:
   - Navigate to `/settings` from main menu
   - Test username editing with availability check
   - Verify profile information display (email, age, member since)
   - Check statistics and achievement badges showcase

2. **Game Preferences**:
   - Test language selection with live preview (EN/AR with RTL)
   - Change difficulty preferences and verify save to Supabase
   - Manage category favorites (add/remove from grid)
   - Toggle notification preferences and audio settings
   - Adjust volume sliders for effects and music

3. **Account Management**:
   - Test password change with strength requirements
   - Verify data export functionality (downloads JSON file)
   - Test account deletion confirmation dialog
   - Check security settings and privacy options

4. **App Settings**:
   - Test theme selection (Dark/Light/Auto) with localStorage
   - Change animation preferences (Full/Reduced/Off)
   - Adjust accessibility options (font size/contrast sliders)
   - Toggle data usage settings (Wi-Fi only mode)
   - Test cache management and storage info

5. **Support & Legal**:
   - Test contact support ticket form submission
   - Verify help center and legal links (stub)
   - Check app version information display
   - Test rate app functionality

6. **Database Integration**:
   - Verify settings save to Supabase users.preferences jsonb
   - Test real-time updates when preferences change
   - Check username availability validation
   - Verify profile data loads correctly from users table

7. **Mobile Testing**:
   - Test all settings on touch screens
   - Verify responsive layout and collapsible sections
   - Check smooth transitions and touch-friendly controls
   - Test slider controls and toggle switches on mobile

8. **Visual Design**:
   - Verify dark theme with electric blue/purple accents
   - Check neural network background animations
   - Test tab switching with themed colors
   - Verify proper contrast and readability

9. **Navigation Testing**:
   - **Test navigation from dashboard to settings**:
     - Navigate to `/main` dashboard
     - Click "Settings & Profile" card in the main features section
     - Verify smooth navigation to `/settings` route
     - Test hover effects and lightning animations on the settings card
     - Verify responsive layout on mobile devices
     - Test back navigation from settings to main menu
### Features Testing

1. **Main Dashboard**: 
   - **Quick Match Mode**: Test single 1vs1 setup without team configuration UI
   - Edit username with real-time Supabase updates
   - Check live leaderboard with real-time subscriptions
   - View achievements and progress
   - Test language toggle (EN/AR) with RTL support
   - Test on mobile for touch interactions and responsive layout
   - **Navigation Testing**: Test achievements and shop buttons from main dashboard
     - Click "Achievements" card to navigate to `/achievements`
     - Click "Game Shop" card to navigate to `/shop`
    - Click "Settings & Profile" card to navigate to `/settings`
    - Click "Settings & Profile" card to navigate to `/settings`
     - Verify hover effects and lightning animations
     - Test responsive layout on mobile devices

2. **Authentication Flow**:
   - Navigate to `/auth` for full authentication experience
   - Test bilingual support and RTL layout
   - Real-time form validation and visual feedback

3. **Splash Screen**:
   - High-performance Phaser.js animations targeting 120 FPS
   - GPU-accelerated effects and particle systems
   - Mobile-responsive with orientation change support

4. **Game Setup Interface**:
   - Team configuration with color-coded sections
   - Category selection grid with duplicate prevention
   - **Tool click selection with turn-based logic for multiplayer**
   - Rules sidebar with expandable sections
   - Start button with countdown animation

4. **AI Questions**: Test the OpenAI integration in main dashboard
5. **Real-time Features**: Live leaderboard updates via Supabase subscriptions

### Game Mode Testing

1. **Quick Match Mode**:
   - **Test single 1vs1 setup with no team UI**
   - Verify 2 categories, 2 tools limit
   - Check difficulty selection
   - Test 4 questions per user configuration

2. **Create Room Mode**:
   - Test room code generation and copying
   - Verify 3 categories, 3 tools limit
   - Test private room setup
   - Check 6 questions per user (2 per category)

3. **Practice Mode**:
   - Test solo configuration (no teams)
   - Verify 2 categories, 2 tools limit
   - Check difficulty selection
   - Test 4 questions per user setup

4. **Tournament Mode**:
   - **Test turn-based tool selection between teams**
   - Verify fixed Medium difficulty
   - Check 4 categories, 3 tools limit
   - Test 8 questions per team configuration

5. **Daily Challenge Mode**:
   - Test auto-start countdown (3 seconds)
   - Verify no configuration options shown
   - Check daily bonus display (50 coins)
   - Test 5 questions auto-generation

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public API key for client-side | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key for server-side operations | ✅ |
| `OPENAI_API_KEY` | OpenAI API key for question generation | ✅ |

**Development Note**: The application includes hardcoded fallback values for Supabase URL and anonymous key to work in development environments like Bolt.new/StackBlitz. In production deployments, always use proper environment variables and remove the hardcoded values from `lib/supabase.ts`.

**Performance Note**: The splash screen uses Phaser.js for high-performance animations targeting 120 FPS. All animations are GPU-accelerated and optimized for both desktop and mobile devices.

## Authentication Features

- **Bilingual Support**: Full English/Arabic support with RTL layout
- **Real-time Validation**: Email validation and password strength indicators
- **Visual Effects**: Dynamic background animations with particles and lightning
- **Responsive Design**: Mobile-first with touch optimization
- **Modern UI**: Vibrant gradients, glass morphism effects, and smooth animations
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Performance**: GPU-accelerated animations and lazy loading
- **Security**: Integrated with Supabase Auth with proper error handling
- **User Experience**: Toast notifications and smooth transitions

## Database Schema

The application uses the following tables:
- `users`: Player profiles and stats
- `questions`: AI-generated trivia questions
- `games`: Game sessions and teams
- `leaderboards`: Global rankings
- `achievements`: Progress tracking
- `shop_purchases`: Transaction history

## Tech Stack

- **Frontend**: Next.js 13, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Animations**: Phaser.js (WebGL/Canvas)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **AI**: OpenAI GPT for question generation
- **Deployment**: Vercel/Netlify compatible

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck
```

## Troubleshooting

### Common Issues

1. **Missing environment variables**: Ensure all required env vars are set in `.env.local`
2. **Database errors**: Run the migration script in Supabase SQL Editor
3. **Auth errors**: Check Supabase project settings and RLS policies
4. **Build errors**: Run `npm run typecheck` to identify TypeScript issues

### Support

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify environment variables are correctly set
3. Ensure database migration has been run