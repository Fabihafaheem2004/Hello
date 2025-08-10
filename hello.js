#!/usr/bin/env node
/**
 * Hello OSINT Tool v2.0 - Automated Phone Intelligence
 * Lawful phone number intelligence with automatic scanning
 * Author: Professional Node.js Security Tools Developer
 *
 * --- README ---
 * Installation:
 *   npm install inquirer chalk figlet cli-table3 google-libphonenumber node-fetch dotenv cheerio
 * Usage:
 *   node hello.js
 *
 * Requirements:
 *   - Node.js (latest LTS)
 *   - No API keys required (uses free services)
 *
 * Legal: Use this tool only for lawful purposes. Do not use for harassment, stalking, or unauthorized surveillance.
 */

const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');
const figlet = require('figlet');
const Table = require('cli-table3');
const libphonenumber = require('google-libphonenumber');
const PhoneNumberUtil = libphonenumber.PhoneNumberUtil;
const PhoneNumberType = libphonenumber.PhoneNumberType;
const PhoneNumberFormat = libphonenumber.PhoneNumberFormat;
const fetch = require('node-fetch');
const cheerio = require('cheerio');
require('dotenv').config();

const RESULTS_DIR = path.join(__dirname, 'results');
const VERSION = '2.0';
let lastResult = null;

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR);
}

function printBanner() {
  console.log(
    chalk.cyan(
      figlet.textSync('Hello', { font: 'ANSI Shadow' })
    )
  );
  console.log(chalk.gray('Automated Phone Intelligence Scanner | v' + VERSION));
  console.log(chalk.green('FREE • AUTOMATED • COMPREHENSIVE'));
  console.log();
  console.log(chalk.yellow.bold('Tool Made by : Cryptisa'));
  console.log();
}

async function legalNotice() {
  console.log(chalk.red.bold('⚠️  LEGAL WARNING ⚠️'));
  console.log(chalk.yellow('This tool searches ONLY publicly available information.'));
  console.log(chalk.yellow('Use only for lawful purposes. No harassment, stalking, or unauthorized surveillance.'));
  console.log(chalk.gray('By using this tool, you agree to comply with all applicable laws.'));
  console.log();
  
  const { agree } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'agree',
      message: 'Do you agree to use this tool lawfully?',
      default: false
    }
  ]);
  return agree;
}

function printMenu() {
  return inquirer.prompt([
    {
      type: 'list',
      name: 'menu',
      message: 'Select an option:',
      choices: [
        { name: '🔍 Enter phone number (Auto-scan)', value: 'scan' },
        { name: '📄 Export last result to JSON', value: 'export' },
        { name: '👁️  View last result', value: 'view' },
        { name: '❌ Exit', value: 'exit' }
      ]
    }
  ]);
}

async function scanPhoneNumber() {
  const { number } = await inquirer.prompt([
    {
      type: 'input',
      name: 'number',
      message: '📱 Enter phone number (with country code, e.g. +12025550123):',
      validate: input => {
        try {
          if (!PhoneNumberUtil) {
            return 'Phone number library not properly loaded. Please reinstall dependencies.';
          }
          const util = PhoneNumberUtil.getInstance();
          const num = util.parseAndKeepRawInput(input, null);
          if (!util.isValidNumber(num)) return 'Invalid phone number format.';
          return true;
        } catch (e) {
          console.error('Validation error:', e.message);
          return 'Invalid phone number. Please include country code (e.g. +1, +92, +44).';
        }
      }
    }
  ]);

  const { intensity } = await inquirer.prompt([
    {
      type: 'list',
      name: 'intensity',
      message: '🔍 Select search intensity:',
      choices: [
        { name: '🚀 Fast (8 searches, ~30 seconds)', value: 'low' },
        { name: '⚡ Balanced (10 searches, ~45 seconds)', value: 'medium' },
        { name: '🔍 Comprehensive (15 searches, ~60 seconds)', value: 'high' }
      ],
      default: 'medium'
    }
  ]);

  const inputNumberRaw = number.trim();
  console.log(chalk.green('✓ Phone number accepted. Starting optimized scan...'));
  console.log(chalk.gray(`📊 Search intensity: ${intensity.toUpperCase()}`));
  console.log();

  // Parse phone number
  const util = PhoneNumberUtil.getInstance();
  const parsedNumber = util.parseAndKeepRawInput(inputNumberRaw, null);
  
  // Start scanning process with intensity setting
  await performComprehensiveScan(inputNumberRaw, parsedNumber, intensity);
}

async function performComprehensiveScan(inputNumberRaw, parsedNumber, userIntensity = 'medium') {
  try {
    if (!PhoneNumberUtil) {
      throw new Error('Phone number library not loaded properly');
    }
    
    const util = PhoneNumberUtil.getInstance();
  
  // Basic phone analysis
  console.log(chalk.blue('🔧 Analyzing phone number structure...'));
  const e164 = util.format(parsedNumber, PhoneNumberFormat.E164);
  const national = util.format(parsedNumber, PhoneNumberFormat.NATIONAL);
  const international = util.format(parsedNumber, PhoneNumberFormat.INTERNATIONAL);
  const country = util.getRegionCodeForNumber(parsedNumber);
  const countryCode = parsedNumber.getCountryCode();
  let carrier = 'Unknown'; // Carrier information not available in this version
  
  let type = 'Unknown';
  switch (util.getNumberType(parsedNumber)) {
    case PhoneNumberType.MOBILE: type = 'Mobile'; break;
    case PhoneNumberType.FIXED_LINE: type = 'Fixed Line'; break;
    case PhoneNumberType.FIXED_LINE_OR_MOBILE: type = 'Fixed Line or Mobile'; break;
    case PhoneNumberType.TOLL_FREE: type = 'Toll Free'; break;
    case PhoneNumberType.PREMIUM_RATE: type = 'Premium Rate'; break;
    case PhoneNumberType.VOIP: type = 'VOIP'; break;
    case PhoneNumberType.PERSONAL_NUMBER: type = 'Personal Number'; break;
    case PhoneNumberType.PAGER: type = 'Pager'; break;
    case PhoneNumberType.UAN: type = 'UAN'; break;
    case PhoneNumberType.VOICEMAIL: type = 'Voicemail'; break;
    default: type = 'Unknown';
  }

  // Country information
  const countryInfo = getCountryInfo(country);
  
  console.log(chalk.green('✓ Basic analysis complete'));
  
  // Web intelligence gathering
  console.log(chalk.blue('🌐 Gathering web intelligence...'));
  let webResults = {
    socialLinks: [],
    publicProfiles: [],
    businessListings: [],
    publicRecords: [],
    notes: []
  };
  
  try {
    webResults = await gatherWebIntelligence(e164, national, international, country, userIntensity);
    console.log(chalk.green('✓ Web intelligence complete'));
  } catch (e) {
    console.log(chalk.yellow('⚠️ Web intelligence partially failed:', e.message));
    webResults.notes.push('Some web searches failed: ' + e.message);
  }

  // Additional searches
  console.log(chalk.blue('🔍 Performing additional searches...'));
  try {
    const additionalData = await performAdditionalSearches(e164, country);
    webResults = { ...webResults, ...additionalData };
    console.log(chalk.green('✓ Additional searches complete'));
  } catch (e) {
    console.log(chalk.yellow('⚠️ Additional searches failed:', e.message));
    webResults.notes.push('Additional searches failed: ' + e.message);
  }

  // Deep scan of found pages
  if (webResults.socialLinks.length > 0 || webResults.publicProfiles.length > 0 || 
      webResults.businessListings.length > 0 || webResults.publicRecords.length > 0) {
    try {
      const allLinks = [...webResults.socialLinks, ...webResults.publicProfiles, 
                        ...webResults.businessListings, ...webResults.publicRecords];
      const deepScanResults = await deepScanWebPages(allLinks, e164);
      if (deepScanResults.length > 0) {
        webResults.deepScanResults = deepScanResults;
        console.log(chalk.green(`✓ Deep scan found ${deepScanResults.length} pages with phone number references`));
      }
    } catch (e) {
      console.log(chalk.yellow('⚠️ Deep scan failed:', e.message));
    }
  }

  // Compile final result
  const result = {
    tool: 'Hello OSINT',
    version: VERSION,
    scanned_at: new Date().toISOString(),
    input_number_raw: inputNumberRaw,
    phone_analysis: {
      e164,
      national,
      international,
      country,
      country_code: countryCode,
      country_info: countryInfo,
      carrier,
      type,
      is_valid: util.isValidNumber(parsedNumber),
      is_mobile: type.includes('Mobile')
    },
    web_intelligence: webResults,
    confidence_level: webResults.socialLinks.length > 0 ? 'High' : 'Medium',
    total_findings: webResults.socialLinks.length + webResults.publicProfiles.length + webResults.businessListings.length + webResults.publicRecords.length
  };

  lastResult = result;
  saveResult(result);
  displayComprehensiveResults(result);
  
  } catch (error) {
    console.error(chalk.red('❌ Scan failed:'), error.message);
    console.log(chalk.yellow('💡 Try reinstalling dependencies: npm install google-libphonenumber'));
  }
}

function getCountryInfo(countryCode) {
  const countries = {
    'US': { name: 'United States', timezone: 'UTC-5 to UTC-10', currency: 'USD' },
    'PK': { name: 'Pakistan', timezone: 'UTC+5', currency: 'PKR' },
    'UK': { name: 'United Kingdom', timezone: 'UTC+0', currency: 'GBP' },
    'IN': { name: 'India', timezone: 'UTC+5:30', currency: 'INR' },
    'CA': { name: 'Canada', timezone: 'UTC-3.5 to UTC-8', currency: 'CAD' },
    'AU': { name: 'Australia', timezone: 'UTC+8 to UTC+11', currency: 'AUD' }
  };
  return countries[countryCode] || { name: 'Unknown', timezone: 'Unknown', currency: 'Unknown' };
}

async function gatherWebIntelligence(e164, national, international, country, userIntensity = 'medium') {
  const results = {
    socialLinks: [],
    publicProfiles: [],
    businessListings: [],
    publicRecords: [],
    notes: []
  };

  // Get search configuration based on country and user preferences
  const searchConfig = getSearchConfiguration(country, userIntensity);
  
  // Generate intelligent search queries
  const searchQueries = generateSearchQueries(e164, national, international, country, searchConfig);
  
  console.log(chalk.blue(`🔍 Executing ${searchQueries.length} optimized search queries...`));
  console.log(chalk.gray(`📊 Search intensity: ${searchConfig.intensity} | Target platforms: ${searchConfig.platforms.length}`));

  let totalResults = 0;
  let consecutiveEmptyResults = 0;
  const maxEmptyResults = 5; // Stop if too many empty results

  for (let i = 0; i < searchQueries.length; i++) {
    const query = searchQueries[i];
    try {
      console.log(chalk.gray(`  [${i + 1}/${searchQueries.length}] Searching: ${query}`));
      
      // Use only the most effective search engines based on configuration
      const searchEngines = getSearchEngines(searchConfig.intensity);
      const searchPromises = searchEngines.map(engine => engine(query));
      
      const searchResults = await Promise.allSettled(searchPromises);
      
      let queryResults = 0;
      for (const result of searchResults) {
        if (result.status === 'fulfilled' && result.value) {
          const beforeCount = getTotalResults(results);
          categorizeResults(result.value, results);
          const afterCount = getTotalResults(results);
          queryResults += (afterCount - beforeCount);
        }
      }
      
      totalResults += queryResults;
      
      // Adaptive stopping - if we're getting good results, continue; if not, stop early
      if (queryResults === 0) {
        consecutiveEmptyResults++;
        if (consecutiveEmptyResults >= maxEmptyResults && totalResults > 0) {
          console.log(chalk.yellow(`⚠️ Stopping early - found ${totalResults} results, no new results in ${maxEmptyResults} consecutive searches`));
          break;
        }
      } else {
        consecutiveEmptyResults = 0;
      }
      
      // Adaptive delay based on results and search intensity
      const delay = calculateAdaptiveDelay(queryResults, searchConfig.intensity);
      await sleep(delay);
      
    } catch (e) {
      results.notes.push(`Search failed for ${query}: ${e.message}`);
    }
  }

  // Remove duplicates and clean up
  results.socialLinks = [...new Set(results.socialLinks)].filter(link => link && link.length > 0);
  results.publicProfiles = [...new Set(results.publicProfiles)].filter(link => link && link.length > 0);
  results.businessListings = [...new Set(results.businessListings)].filter(link => link && link.length > 0);
  results.publicRecords = [...new Set(results.publicRecords)].filter(link => link && link.length > 0);
  
  const finalCount = getTotalResults(results);
  console.log(chalk.green(`✓ Found ${finalCount} total results in ${searchQueries.length} searches`));
  
  return results;
}

function getSearchConfiguration(country, userIntensity = 'medium') {
  // Country-specific search configurations
  const countryConfigs = {
    'PK': {
      intensity: userIntensity,
      platforms: ['linkedin', 'facebook', 'instagram', 'twitter', 'github', 'whatsapp', 'telegram'],
      localDirectories: ['yellowpages.pk', 'pakistanphonebook.com'],
      searchEngines: ['duckduckgo', 'searx', 'google']
    },
    'US': {
      intensity: userIntensity,
      platforms: ['linkedin', 'facebook', 'instagram', 'twitter', 'github', 'yelp', 'whitepages'],
      localDirectories: ['yellowpages.com', 'whitepages.com', 'truecaller.com'],
      searchEngines: ['duckduckgo', 'searx', 'google', 'bing']
    },
    'UK': {
      intensity: userIntensity,
      platforms: ['linkedin', 'facebook', 'instagram', 'twitter', 'github'],
      localDirectories: ['192.com', 'yellowpages.co.uk'],
      searchEngines: ['duckduckgo', 'searx', 'google']
    },
    'IN': {
      intensity: userIntensity,
      platforms: ['linkedin', 'facebook', 'instagram', 'twitter', 'github', 'whatsapp'],
      localDirectories: ['justdial.com', 'indiamart.com'],
      searchEngines: ['duckduckgo', 'searx', 'google']
    }
  };
  
  return countryConfigs[country] || {
    intensity: userIntensity,
    platforms: ['linkedin', 'facebook', 'instagram', 'twitter', 'github'],
    localDirectories: [],
    searchEngines: ['duckduckgo', 'searx']
  };
}

function generateSearchQueries(e164, national, international, country, config) {
  const queries = [];
  
  // Core phone number formats (always include)
  const coreFormats = [
    `"${e164}"`,
    `"${national.replace(/[^\d]/g, '')}"`,
    e164,
    national.replace(/[^\d]/g, '')
  ];
  
  queries.push(...coreFormats);
  
  // Platform-specific searches based on configuration
  config.platforms.forEach(platform => {
    const platformQueries = generatePlatformQueries(platform, e164, national, international);
    queries.push(...platformQueries);
  });
  
  // Country-specific searches
  if (config.localDirectories.length > 0) {
    config.localDirectories.forEach(directory => {
      queries.push(`site:${directory} "${e164}"`);
    });
  }
  
  // Add country-specific general searches
  queries.push(`"${e164}" ${country}`);
  queries.push(`site:${country.toLowerCase()} "${e164}"`);
  
  // Limit queries based on intensity
  const maxQueries = config.intensity === 'high' ? 15 : config.intensity === 'medium' ? 10 : 8;
  return queries.slice(0, maxQueries);
}

function generatePlatformQueries(platform, e164, national, international) {
  const platformConfigs = {
    'linkedin': [`site:linkedin.com "${e164}"`, `site:linkedin.com "${national.replace(/[^\d]/g, '')}"`],
    'facebook': [`site:facebook.com "${e164}"`, `site:facebook.com "${national.replace(/[^\d]/g, '')}"`],
    'instagram': [`site:instagram.com "${e164}"`, `site:instagram.com "${national.replace(/[^\d]/g, '')}"`],
    'twitter': [`site:twitter.com "${e164}"`, `site:x.com "${e164}"`],
    'github': [`site:github.com "${e164}"`],
    'whatsapp': [`site:wa.me "${e164}"`],
    'telegram': [`site:t.me "${e164}"`],
    'yelp': [`site:yelp.com "${e164}"`],
    'whitepages': [`site:whitepages.com "${e164}"`]
  };
  
  return platformConfigs[platform] || [];
}

function getSearchEngines(intensity) {
  const engineConfigs = {
    'high': [searchDuckDuckGo, searchSearx, searchGoogle, searchBing],
    'medium': [searchDuckDuckGo, searchSearx, searchGoogle],
    'low': [searchDuckDuckGo, searchSearx]
  };
  
  return engineConfigs[intensity] || engineConfigs.medium;
}

function calculateAdaptiveDelay(queryResults, intensity) {
  // Shorter delays when getting results, longer when not
  const baseDelay = intensity === 'high' ? 1000 : intensity === 'medium' ? 1500 : 2000;
  
  if (queryResults > 0) {
    return Math.max(500, baseDelay * 0.5); // Faster when getting results
  } else {
    return baseDelay * 1.5; // Slower when no results
  }
}

function getTotalResults(results) {
  return results.socialLinks.length + results.publicProfiles.length + 
         results.businessListings.length + results.publicRecords.length;
}

function categorizeResults(links, results) {
  const socialDomains = [
    'facebook.com', 'fb.com', 'm.facebook.com',
    'twitter.com', 'x.com', 'mobile.twitter.com',
    'instagram.com', 'instagr.am',
    'linkedin.com', 'www.linkedin.com',
    't.me', 'telegram.me', 'web.telegram.org',
    'vk.com', 'm.vk.com',
    'ok.ru', 'm.ok.ru',
    'pinterest.com', 'pin.it',
    'reddit.com', 'old.reddit.com',
    'youtube.com', 'youtu.be',
    'snapchat.com', 'snap.com',
    'tiktok.com', 'vm.tiktok.com',
    'discord.com', 'discord.gg',
    'whatsapp.com', 'wa.me',
    'wechat.com', 'weixin.qq.com',
    'line.me', 'line.naver.jp',
    'skype.com', 'web.skype.com',
    'snapchat.com', 'snap.com'
  ];
  
  const businessDomains = [
    'yelp.com', 'm.yelp.com',
    'yellowpages.com', 'yp.com',
    'whitepages.com', 'wp.com',
    'truecaller.com', 'tc.com',
    'foursquare.com', '4sq.com',
    'google.com/maps', 'maps.google.com',
    'bing.com/maps', 'maps.bing.com',
    'yellowpages.pk', 'pakistan.yellowpages.com',
    'pakistanphonebook.com', 'pakistanphonebook.pk',
    'pakistanidirectory.com', 'pakistanidirectory.pk',
    'pakistanbusinessdirectory.com', 'pakistanbusinessdirectory.pk'
  ];
  
  const profileDomains = [
    'about.me', 'aboutme.com',
    'gravatar.com', 'en.gravatar.com',
    'github.com', 'gist.github.com',
    'gitlab.com', 'gitlab.io',
    'stackoverflow.com', 'stackexchange.com',
    'medium.com', 'medium.com/@',
    'dev.to', 'dev.to/',
    'hashnode.dev', 'hashnode.com',
    'behance.net', 'dribbble.com',
    'flickr.com', '500px.com',
    'deviantart.com', 'artstation.com',
    'soundcloud.com', 'spotify.com',
    'twitch.tv', 'mixer.com',
    'steamcommunity.com', 'steam.com',
    'xbox.com', 'playstation.com',
    'nintendo.com', 'nintendo.net'
  ];
  
  const publicRecordDomains = [
    'courtlistener.com', 'pacer.gov',
    'justia.com', 'law.cornell.edu',
    'findlaw.com', 'avvo.com',
    'martindale.com', 'lawyers.com',
    'superlawyers.com', 'bestlawyers.com',
    'lawfirms.com', 'lawyersdirectory.com',
    'legalzoom.com', 'rocketlawyer.com',
    'nolo.com', 'lawdepot.com',
    'lawinfo.com', 'lawyers.findlaw.com',
    'lawyers.com', 'martindale.com',
    'avvo.com', 'justia.com',
    'superlawyers.com', 'bestlawyers.com'
  ];

  for (const link of links) {
    try {
      const url = new URL(link);
      const domain = url.hostname.toLowerCase();
      const path = url.pathname.toLowerCase();
      
      // Enhanced categorization with path analysis
      if (socialDomains.some(d => domain.includes(d))) {
        // Check for specific social media patterns
        if (domain.includes('linkedin.com') && (path.includes('/in/') || path.includes('/company/'))) {
          results.publicProfiles.push(link); // LinkedIn profiles are more like public profiles
        } else {
          results.socialLinks.push(link);
        }
      } else if (businessDomains.some(d => domain.includes(d))) {
        results.businessListings.push(link);
      } else if (profileDomains.some(d => domain.includes(d))) {
        results.publicProfiles.push(link);
      } else if (publicRecordDomains.some(d => domain.includes(d))) {
        results.publicRecords.push(link);
      } else {
        // Check for phone number patterns in the URL or path
        const phonePatterns = [
          /[0-9]{10,}/, // 10+ digit numbers
          /\+[0-9]{1,3}[0-9]{6,}/, // International format
          /[0-9]{3,4}[-\s]?[0-9]{3,4}[-\s]?[0-9]{4}/ // Formatted numbers
        ];
        
        const fullUrl = link.toLowerCase();
        if (phonePatterns.some(pattern => pattern.test(fullUrl))) {
          results.publicRecords.push(link);
        }
      }
    } catch (error) {
      // Skip invalid URLs
      console.log(chalk.gray(`Skipping invalid URL: ${link}`));
    }
  }
}

async function performAdditionalSearches(e164, country) {
  const additionalData = {
    locationInfo: [],
    carrierInfo: [],
    notes: []
  };

  // Country-specific searches
  if (country === 'PK') {
    // Pakistan-specific searches
    try {
      const pkResults = await searchPakistanSpecific(e164);
      additionalData.locationInfo.push(...pkResults);
    } catch (e) {
      additionalData.notes.push('Pakistan-specific search failed');
    }
  }

  return additionalData;
}

async function deepScanWebPages(links, targetNumber) {
  const results = [];
  const phonePatterns = [
    new RegExp(targetNumber.replace(/[^\d]/g, ''), 'g'),
    new RegExp(targetNumber.replace(/[^\d]/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3'), 'g'),
    new RegExp(targetNumber.replace(/[^\d]/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3'), 'g')
  ];
  
  console.log(chalk.blue('🔍 Deep scanning web pages for phone number references...'));
  
  // Limit to first 5 links to avoid overwhelming
  const limitedLinks = links.slice(0, 5);
  
  for (const link of limitedLinks) {
    try {
      console.log(chalk.gray(`  Scanning: ${link}`));
      
      const response = await fetch(link, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 10000
      });
      
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Check for phone number in text content
        const textContent = $.text();
        
        for (const pattern of phonePatterns) {
          if (pattern.test(textContent)) {
            results.push({
              url: link,
              found: true,
              context: textContent.substring(Math.max(0, textContent.indexOf(targetNumber) - 50), 
                                           textContent.indexOf(targetNumber) + 50)
            });
            break;
          }
        }
      }
      
      await sleep(2000); // Delay between page scans
    } catch (e) {
      console.log(chalk.gray(`  Page scan failed: ${e.message}`));
    }
  }
  
  return results;
}

async function searchPakistanSpecific(number) {
  // Search for Pakistan-specific information
  const results = [];
  
  // Pakistan-specific directories and platforms
  const pkPlatforms = [
    `https://www.yellowpages.pk/search?q=${encodeURIComponent(number)}`,
    `https://pakistanphonebook.com/search?q=${encodeURIComponent(number)}`,
    `https://pakistanidirectory.com/search?q=${encodeURIComponent(number)}`,
    `https://pakistanbusinessdirectory.com/search?q=${encodeURIComponent(number)}`
  ];
  
  for (const platform of pkPlatforms) {
    try {
      console.log(chalk.gray(`  Checking Pakistan platform: ${platform}`));
      
      const response = await fetch(platform, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        
        $('a[href]').each((i, el) => {
          const href = $(el).attr('href');
          if (href && href.startsWith('http')) {
            results.push(href);
          }
        });
      }
      
      await sleep(2000); // Longer delay for directory sites
    } catch (e) {
      console.log(chalk.gray(`  Pakistan platform failed: ${e.message}`));
    }
  }
  
  return results;
}

async function searchDuckDuckGo(query) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://duckduckgo.com/html/?q=${encodedQuery}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0'
      }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const html = await response.text();
    
    // Check if we got a proper response
    if (html.length < 1000 || html.includes('captcha') || html.includes('blocked')) {
      console.log(chalk.gray(`DuckDuckGo returned limited results for: ${query}`));
      return [];
    }
    
    const $ = cheerio.load(html);
    const links = [];
    
    // Try multiple selectors for DuckDuckGo results
    const selectors = [
      '.result__url', '.result__a', '.result__title a', '.web-result__title a',
      '.result a', '.web-result a', '[data-testid="result-title"] a',
      'a[href*="http"]', '.result__body a'
    ];
    
    for (const selector of selectors) {
      $(selector).each((i, el) => {
        const href = $(el).attr('href') || $(el).text().trim();
        if (href && href.startsWith('http') && !href.includes('duckduckgo.com')) {
          links.push(href);
        }
      });
    }
    
    return [...new Set(links)]; // Remove duplicates
  } catch (e) {
    console.log(chalk.gray(`DuckDuckGo search failed: ${e.message}`));
    return [];
  }
}

async function searchSearx(query) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://searx.be/search?q=${encodedQuery}&format=json&engines=google,bing`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    const links = [];
    
    if (data.results) {
      for (const result of data.results) {
        if (result.url && !result.url.includes('searx')) {
          links.push(result.url);
        }
      }
    }
    
    return links;
  } catch (e) {
    return [];
  }
}

async function searchGoogle(query) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.google.com/search?q=${encodedQuery}&num=20`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const links = [];
    
    // Extract links from Google search results
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.startsWith('/url?q=')) {
        const url = decodeURIComponent(href.split('/url?q=')[1].split('&')[0]);
        if (url && url.startsWith('http') && !url.includes('google.com')) {
          links.push(url);
        }
      }
    });
    
    return [...new Set(links)]; // Remove duplicates
  } catch (e) {
    return [];
  }
}

async function searchBing(query) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.bing.com/search?q=${encodedQuery}&count=20`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const html = await response.text();
    
    // Check if we got a proper response
    if (html.length < 1000 || html.includes('captcha') || html.includes('blocked')) {
      console.log(chalk.gray(`Bing returned limited results for: ${query}`));
      return [];
    }
    
    const $ = cheerio.load(html);
    const links = [];
    
    // Extract links from Bing search results
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.startsWith('http') && !href.includes('bing.com') && !href.includes('microsoft.com')) {
        links.push(href);
      }
    });
    
    return [...new Set(links)]; // Remove duplicates
  } catch (e) {
    console.log(chalk.gray(`Bing search failed: ${e.message}`));
    return [];
  }
}

async function searchAlternativeEngines(query) {
  const links = [];
  
  // Try multiple alternative search engines
  const searchEngines = [
    {
      name: 'Qwant',
      url: `https://www.qwant.com/?q=${encodeURIComponent(query)}&t=web`,
      selector: 'a[href*="http"]'
    },
    {
      name: 'Startpage',
      url: `https://www.startpage.com/sp/search?query=${encodeURIComponent(query)}`,
      selector: 'a[href*="http"]'
    },
    {
      name: 'Ecosia',
      url: `https://www.ecosia.org/search?q=${encodeURIComponent(query)}`,
      selector: 'a[href*="http"]'
    }
  ];
  
  for (const engine of searchEngines) {
    try {
      console.log(chalk.gray(`  Trying ${engine.name}...`));
      
      const response = await fetch(engine.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });
      
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        
        $(engine.selector).each((i, el) => {
          const href = $(el).attr('href');
          if (href && href.startsWith('http') && !href.includes(engine.name.toLowerCase())) {
            links.push(href);
          }
        });
      }
      
      await sleep(1000); // Delay between requests
    } catch (e) {
      console.log(chalk.gray(`  ${engine.name} failed: ${e.message}`));
    }
  }
  
  return [...new Set(links)];
}

function displayComprehensiveResults(result) {
  console.log('\n' + '='.repeat(80));
  console.log(chalk.cyan.bold('📊 COMPREHENSIVE PHONE INTELLIGENCE REPORT'));
  console.log('='.repeat(80));
  
  // Phone Analysis Section
  const phoneTable = new Table({
    head: [chalk.blue('Phone Analysis'), chalk.blue('Details')],
    colWidths: [25, 50]
  });
  
  phoneTable.push(
    ['📱 Input Number', result.input_number_raw],
    ['🌍 E.164 Format', result.phone_analysis.e164],
    ['🏠 National Format', result.phone_analysis.national],
    ['🌐 International', result.phone_analysis.international],
    ['🏳️ Country', `${result.phone_analysis.country_info.name} (${result.phone_analysis.country})`],
    ['📞 Country Code', `+${result.phone_analysis.country_code}`],
    ['🏢 Carrier', result.phone_analysis.carrier],
    ['📱 Type', result.phone_analysis.type],
    ['✅ Valid', result.phone_analysis.is_valid ? 'Yes' : 'No'],
    ['📱 Mobile', result.phone_analysis.is_mobile ? 'Yes' : 'No'],
    ['🕒 Timezone', result.phone_analysis.country_info.timezone],
    ['💱 Currency', result.phone_analysis.country_info.currency]
  );
  
  console.log(phoneTable.toString());
  
  // Web Intelligence Section
  console.log('\n' + chalk.cyan.bold('🌐 WEB INTELLIGENCE FINDINGS'));
  console.log('-'.repeat(80));
  
  const webTable = new Table({
    head: [chalk.blue('Category'), chalk.blue('Count'), chalk.blue('Details')],
    colWidths: [20, 10, 45]
  });
  
  webTable.push(
    ['📱 Social Media', result.web_intelligence.socialLinks.length, result.web_intelligence.socialLinks.slice(0, 3).join('\n') + (result.web_intelligence.socialLinks.length > 3 ? '\n...' : '')],
    ['👤 Public Profiles', result.web_intelligence.publicProfiles.length, result.web_intelligence.publicProfiles.slice(0, 3).join('\n') + (result.web_intelligence.publicProfiles.length > 3 ? '\n...' : '')],
    ['🏢 Business Listings', result.web_intelligence.businessListings.length, result.web_intelligence.businessListings.slice(0, 3).join('\n') + (result.web_intelligence.businessListings.length > 3 ? '\n...' : '')],
    ['📋 Public Records', result.web_intelligence.publicRecords.length, result.web_intelligence.publicRecords.slice(0, 3).join('\n') + (result.web_intelligence.publicRecords.length > 3 ? '\n...' : '')],
    ['🔍 Total Findings', result.total_findings, ''],
    ['📈 Confidence', result.confidence_level, '']
  );
  
  console.log(webTable.toString());
  
  // Summary
  console.log('\n' + chalk.cyan.bold('📋 SUMMARY'));
  console.log('-'.repeat(80));
  console.log(chalk.green(`✓ Found ${result.total_findings} total web references`));
  console.log(chalk.blue(`📊 Confidence Level: ${result.confidence_level}`));
  console.log(chalk.yellow(`📱 Social Media: ${result.web_intelligence.socialLinks.length} links`));
  console.log(chalk.cyan(`👤 Public Profiles: ${result.web_intelligence.publicProfiles.length} links`));
  console.log(chalk.magenta(`🏢 Business Listings: ${result.web_intelligence.businessListings.length} links`));
  console.log(chalk.red(`📋 Public Records: ${result.web_intelligence.publicRecords.length} links`));
  console.log(chalk.gray(`🕐 Scanned at: ${result.scanned_at}`));
  
  if (result.web_intelligence.notes.length > 0) {
    console.log('\n' + chalk.yellow.bold('⚠️ NOTES'));
    result.web_intelligence.notes.forEach(note => {
      console.log(chalk.yellow(`• ${note}`));
    });
  }
  
  console.log('\n' + chalk.green('✓ Scan complete! Results saved automatically.'));
  console.log('='.repeat(80) + '\n');
}

function saveResult(result) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(RESULTS_DIR, `hello_scan_${ts}.json`);
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
  result._filePath = filePath;
  console.log(chalk.gray(`📄 Results saved to: ${filePath}`));
}

async function exportLastResult() {
  if (!lastResult) {
    console.log(chalk.red('❌ No scan results to export. Please scan a phone number first.'));
    return;
  }
  
  const { exportPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'exportPath',
      message: '📂 Enter export file path:',
      default: `./phone_intel_${Date.now()}.json`
    }
  ]);
  
  try {
    fs.writeFileSync(exportPath, JSON.stringify(lastResult, null, 2));
    console.log(chalk.green(`✅ Exported successfully to: ${exportPath}`));
  } catch (e) {
    console.log(chalk.red(`❌ Export failed: ${e.message}`));
  }
}

function viewLastResult() {
  if (!lastResult) {
    console.log(chalk.red('❌ No results to view. Please scan a phone number first.'));
    return;
  }
  displayComprehensiveResults(lastResult);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  printBanner();
  
  const agreed = await legalNotice();
  if (!agreed) {
    console.log(chalk.red('❌ You must agree to legal terms to use this tool.'));
    process.exit(1);
  }
  
  console.log(chalk.green('🚀 Ready for phone intelligence scanning!'));
  console.log(chalk.gray('This tool searches only publicly available information.'));
  console.log();
  
  while (true) {
    const { menu } = await printMenu();
    switch (menu) {
      case 'scan':
        await scanPhoneNumber();
        break;
      case 'export':
        await exportLastResult();
        break;
      case 'view':
        viewLastResult();
        break;
      case 'exit':
        console.log(chalk.cyan('👋 Goodbye! Stay ethical.'));
        process.exit(0);
        break;
    }
  }
}

main().catch(e => {
  console.error(chalk.red('💥 Fatal error:'), e);
  process.exit(1);
});