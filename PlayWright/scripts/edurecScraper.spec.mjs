import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
var count = 0;
const screenshotPath = `PlayWright/screenshots/${count}_error.png`;


dotenv.config({ path: './PlayWright/eduglobe.env' });

//supabase auth
const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_PROJECT_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

//Time elapsed since Jan 1 1970 00:00 UTC, used to check how long the script has ran for
const start = Date.now();

//filename configuration
const now = new Date();
//pad the number with a 0 in front, example 5 -> 05
const pad = (n) => n.toString().padStart(2, '0');

const timestamp =
  now.getFullYear() + '-' +
  pad(now.getMonth() + 1) + '-' +
  pad(now.getDate()) + '_' +
  pad(now.getHours()) + '-' +
  pad(now.getMinutes()) + '-' +
  pad(now.getSeconds());

//function to login and go to mappings page
async function runScraper() {
  //launches browswer and saves it as browser to use as a handle later
  const browser = await chromium.launch({ headless: true });
  //creates a new isolated browser environment
  const context = await browser.newContext({
  //saved session to avoid MFA
  storageState: './PlayWright/edurecAuth.json'
  });
  //const fileContents = fs.readFileSync('./PlayWright/edurecAuth.json', 'utf-8');
  //console.log('edurecAuth.json contents:\n', fileContents);

  //creates a new tab
  const page = await context.newPage();
  console.log('new tabbed open')
  // disable timeouts globally for this script
  page.setDefaultTimeout(0); 


  // Login + navigation
  
  await page.goto('https://myedurec.nus.edu.sg/psp/cs90prd/?cmd=login&languageCd=ENG&');
  console.log('in edurec')

  await page.locator('span').filter({ hasText: 'Please click here to login to' }).getByRole('link').click();
  console.log('clicked login page')

  await page.waitForLoadState('networkidle');
  console.log('wait for load state')

  //check if storage session does not exist or expired
  const isLoginPage = await page.getByRole('textbox', { name: 'User Account' }).count() > 0;
  console.log(isLoginPage);

  if (isLoginPage) {
    // Session expired or no cookie, write to file and exit early. 

    // uploads a txt alert file to supabase bucket
    const content = 'Your edurecAuth.json cookie has expired. Please refresh session.';
    const fileName = `alerts/COOKIE_EXPIRED_${timestamp}.txt`;
    const { data, error } = await supabase
      .storage
      .from('edurec-bucket')
      .upload(fileName, content, {
        contentType: 'text/plain',
        upsert: true,
      });
    //checks if upload fails
    if (error) {
      console.error('Failed to upload alert to Supabase:', error.message);
    } else {
      console.log('Alert uploaded to Supabase storage:', data.path);
    }
       // stops execution of runScraper function
      await browser.close();
      return; 
    }
  
  //Navigating to EduRec mappings page  
  await page.locator('#N_STDACAD_SHORTCUT').click();
  await page.getByRole('link', { name: 'Global Education' }).click();




  //await mainFrame.getByRole('button', { name: 'Look up Faculty' }).click();

  //function to download mapping from each faculty
  async function downloadFacultyMappings(faculty) {
    await page.reload();
    await page.waitForLoadState('networkidle');

    const mainFrame = page.frameLocator('iframe[title="Main Content"]');
    await mainFrame.locator('img[alt="Search for Programs"]').waitFor({ state: 'visible' });
    await page.getByRole('link', { name: 'Search Course Mappings' }).click();

    const ptModFrame = page.frameLocator('iframe[name^="ptModFrame_"]');

    await mainFrame.getByRole('button', { name: 'Look up Faculty' }).click();
    console.log('look up faculty')
    await ptModFrame.getByLabel('Search by:').selectOption('2');
    console.log('select option 2')

    await ptModFrame.getByRole('button', { name: 'Look Up' }).click();
    console.log('look up')

    await ptModFrame.getByRole('link', { name: faculty, exact: true }).click();
    console.log('click the faculties')

    await mainFrame.getByRole('button', { name: 'Fetch Mappings' }).click();
    console.log('fetching mappings')
    

       
    const mainFrame1 = page.frame({ name: 'main_target_win2' });
    if (!mainFrame1) throw new Error('Main Content iframe not found');

    // Wait until spinner display is none or visibility hidden
    await mainFrame1.waitForSelector('#WAIT_win2', { state: 'hidden', timeout: 240000 });
    console.log('Loading spinner gone — mappings loaded');

  
    /*await page.screenshot({ path: screenshotPath, fullPage: true });
    const screenshotBuffer = fs.readFileSync(screenshotPath);
    const screenshotFileName = `/screenshot/${Date.now()}.png`;
    const { data, error } = await supabase
      .storage
      .from('edurec-bucket')
      .upload(screenshotFileName, screenshotBuffer, {
        contentType: 'image/png',
        upsert: true,
      });
      count +=1;

    if (error) {
      console.error('Failed to upload screenshot:', error.message);
    } else {
      console.log('Screenshot uploaded to Supabase storage:', data.path);
    }*/
    
    // Wait for actual mapping content to show up

    //console.log('download button ready')
  
    //await new Promise(r => setTimeout(r, 4 * 60 * 1000)); // small delay before click
    const downloadBtn = mainFrame.locator('#N_EXSP_DRVD\\$hexcel\\$0');
    const isVisible = await downloadBtn.isVisible();
  const isEnabled = await downloadBtn.isEnabled();

console.log('Button visible:', isVisible);
console.log('Button enabled:', isEnabled);

if (isVisible && isEnabled) {
  console.log('Button is ready to be clicked');
} else {
  console.log('Button is NOT ready to be clicked');
}

    /*console.log('starting download...');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      downloadBtn.click(),
    ]);*/
try {
  console.log('➡️ Attempting to click download button...');
  const clicked = await downloadBtn.click({ timeout: 5000 });
  console.log('✅ Button clicked');
} catch (err) {
  console.error('❌ Click failed:', err);
}  console.log('Button clicked');

const download = await page.waitForEvent('download', { timeout: 5000 });
console.log('Download received:', await download.suggestedFilename());
    
    console.log('done');

    const facultyName = await mainFrame.locator('#ACAD_GROUP_TBL_DESCR').innerText();
    console.log('found faculty name');

    const safeFileName = facultyName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').trim();
    
    const downloadPath = await download.path();
    console.log('after download path')
    const fileName = `${timestamp}/${safeFileName}.xls`;
    const fileBuffer = fs.readFileSync(downloadPath);
    //uploads each xls file into the bucket in the folder 'name'
    console.log('uploading')
    const { data, error } = await supabase
      .storage
      .from('edurec-bucket')
      .upload(fileName, fileBuffer, {
        contentType: 'application/vnd.ms-excel',
        upsert: true,
      });

    if (error) {
      console.error('Upload failed:', error.message);
    } else {
      console.log('Uploaded to Supabase:', data.path);
    }
  }

  const mainFrame = page.frameLocator('iframe[title="Main Content"]');
  await mainFrame.locator('img[alt="Search for Programs"]').waitFor({ state: 'visible' });
  await page.getByRole('link', { name: 'Search Course Mappings' }).click();
  const ptModFrame = page.frameLocator('iframe[name^="ptModFrame_"]');
  await mainFrame.getByRole('button', { name: 'Look up Faculty' }).click();

  //get the number of faculties in the table
  await ptModFrame.locator('tbody tr td span[id^="RESULT4$"]').first().waitFor();
  const facultyCount = await ptModFrame.locator('tbody tr td span[id^="RESULT4$"]').count();
  console.log('Number of faculties found:', facultyCount);
  //store all the faculties listed in an array from the table
  const facultyNames = [];
  for (let i = 0; i < facultyCount; i++) {
    const facultyLocator = ptModFrame.locator(`tbody tr td span[id="RESULT4$${i}"]`);
    const name = await facultyLocator.innerText();
    //append
    facultyNames.push(name);
  }

  await page.getByRole('button', { name: 'Close' }).click();
  //loop through and download the xls file for each faculty with the function downloadFacultyMappings
  for (const facultyName of facultyNames) {
    console.log(`Processing faculty: ${facultyName}`);
    //console.log(`Number of rows in Excel file: ${rows.length}`);
    await downloadFacultyMappings(facultyName);
  }

  await browser.close();
  //uploads the timestamp of when the scraper last ran into the bucket as a txt file
  const latest_update_timestamp = `latest_update_timestamp.txt`;
  
  const { data, error } = await supabase
      .storage
      .from('edurec-bucket')
      .upload(latest_update_timestamp, timestamp, {
        contentType: 'text/plain',
        upsert: true,
      });

    if (error) {
      console.error('Failed to upload alert to Supabase:', error.message);
    } else {
      console.log('Alert uploaded to Supabase storage:', data.path);
    }

  const end = Date.now();
  //get how long the script ran for
  const durationSeconds = ((end - start) / 1000).toFixed(2);
  console.log(`Scraper ran for ${durationSeconds} seconds`);

  // Returns the date for the output 
  return timestamp.split('_')[0];
}

// Run the scraper if this file is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runScraper().then(date => {
    console.log('Finished scrape for date:', date);
    
  }).catch(err => {
    console.error('Scraper failed:', err);
    process.exit(1);
  });
}

//export to other files if needed
export default runScraper;