# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Toolify AI Tools Monitor** - an automated monitoring system that scrapes AI tool data from https://www.toolify.ai/zh/Best-trending-AI-Tools and provides trend analysis and personalized management features.

### Tech Stack
- **Data Collection**: Python + Selenium + Chrome WebDriver
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + Shadcn UI (planned)
- **Database**: Supabase (PostgreSQL) (planned)
- **Deployment**: Vercel (frontend) + GitHub Actions (scheduler) (planned)

## Key Files

- `collector-prototype.py` - Main web scraper implementation using Selenium
- `toolify-monitor-prd.md` - Complete product requirements document
- `sample-data.json` - Sample scraped data (200 records for testing)

## Data Collection Architecture

### Scraper Details (`collector-prototype.py`)
The scraper uses Chrome in headless mode with anti-detection measures:

```python
# Key configuration from collector-prototype.py
options.add_argument("--headless")
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_experimental_option("excludeSwitches", ["enable-automation"])
```

### Target Data Structure
Each scraped tool contains:
- `ranking` - Position in the trending list
- `tool_name` - Name of the AI tool
- `tool_url` - Full URL to tool page on Toolify
- `monthly_visits` - Traffic data (e.g., "5.8B")
- `growth` - Growth numbers (e.g., "126.6M")
- `growth_rate` - Growth percentage (e.g., "2.21%")
- `description` - Tool description
- `tags` - Comma-separated tool categories

### Scraping Strategy
- Uses CSS selector `"tr.el-table__row"` to find data rows
- Implements intelligent scrolling with 3 different scroll patterns
- Waits 5 seconds between scrolls for content loading
- Targets 3000 records via ~60 scroll attempts
- Handles dynamic content loading with `WebDriverWait`

## Development Commands

### Run the Scraper
```bash
python collector-prototype.py
```

### Dependencies Installation
```bash
pip install selenium webdriver-manager
```

The scraper auto-installs ChromeDriver via `webdriver-manager`.

## Architecture Notes

### Chrome Browser Path
The prototype is configured for Windows with specific Chrome path:
```python
options.binary_location = r"C:\Users\Administrator\AppData\Local\Google\Chrome\Bin\chrome.exe"
```

### Production Deployment Strategy
According to PRD, the system will use:
- GitHub Actions for monthly automated collection (2nd of each month)
- Supabase for data storage with `toolify_tools` and `user_actions` tables
- Vercel for frontend hosting
- User features: favorite/exclude tools, trend analysis

### Data Processing
- Tools are identified by `tool_name` as unique key
- New collections overwrite existing data (upsert by tool name)
- Sample data shows ~200 tools successfully scraped in testing

## Key Implementation Details

### Anti-Bot Measures
The scraper implements several anti-detection techniques:
- Custom user agent string
- Disables automation detection features
- Uses realistic scrolling patterns
- Implements variable wait times

### Error Handling
- Screenshot capture on failure (`toolify-page-screenshot.png`)
- Graceful fallback when data extraction fails
- Progress logging every 20 scraped items

### Output Format
Scraped data is saved as JSON with UTF-8 encoding for Chinese text support.

## Future Development

The prototype validates feasibility. Next phases include:
1. Next.js frontend with data tables and user management
2. Supabase database integration
3. GitHub Actions automation
4. User favorite/exclude functionality
5. Trend analysis features

When working on this codebase, prioritize maintaining the proven scraping strategy while building the full-stack application architecture outlined in the PRD.