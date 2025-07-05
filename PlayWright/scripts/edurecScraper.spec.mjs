import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: './PlayWright/eduglobe.env' });

//supabase auth
const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_PROJECT_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

//Time elapsed since Jan 1 1970 00:00 UTC, used to check how long the script has ran for
const start = Date.now();

//filename configuration
const now = new Date();

const sgDate = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Singapore',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
}).formatToParts(now);

// Convert parts to a timestamp string
const parts = Object.fromEntries(sgDate.map(({ type, value }) => [type, value]));

const timestamp = `${parts.year}-${parts.month}-${parts.day}_${parts.hour}:${parts.minute}:${parts.second}`;
console.log(timestamp); // e.g. "2025-07-05_22-42-11"

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
  console.log("At login page: ", isLoginPage);

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
  console.log('clicked academics')

  const ptModFrame = page.frameLocator('iframe[name^="ptModFrame_"]');
  await page.getByRole('link', { name: 'Global Education' }).click();
  console.log('clicked global education')


  const mainFrameLocator = page.frameLocator('iframe[title="Main Content"]');
  await mainFrameLocator.locator('img[alt="Search for Programs"]').waitFor({ state: 'visible' });
  await page.getByRole('link', { name: 'Search Course Mappings' }).click();
  console.log('clicked search course mappings')

  await mainFrameLocator.getByRole('button', { name: 'Look up Faculty' }).click();
  console.log('clicked look up faculty to count and store faculties')
  

  //function to download mapping from each faculty
  async function downloadFacultyMappings(faculty) {
    await mainFrameLocator.getByRole('button', { name: 'Look up Faculty' }).click();
    console.log('clicked look up faculty')

    await ptModFrame.getByLabel('Search by:').selectOption('2');
    console.log('selected option 2')

    await ptModFrame.getByRole('button', { name: 'Look Up' }).click();
    console.log('clicked look up')

    await ptModFrame.getByRole('link', { name: faculty, exact: true }).click();
    console.log('clicking', faculty)

    await mainFrameLocator.getByRole('button', { name: 'Fetch Mappings' }).click();
    console.log('fetching mappings')
    
    const mainFrame = page.frame({ name: 'main_target_win2' });
    if (!mainFrame) throw new Error('Main Content iframe not found');

    // Wait until spinner display is none or visibility hidden
    await mainFrameLocator.locator('#WAIT_win2').waitFor({ state: 'hidden' });
    console.log('Loading spinner gone — mappings loaded');

    // Listen once for the download event
    const downloadPromise = new Promise(resolve => {
      page.once('download', resolve);
    });

    await mainFrame.evaluate(() => {
      //find the button
      const btn = document.querySelector('#N_EXSP_DRVD\\$hexcel\\$0');
      if (btn) { //if btn is not null
        // Force click ignoring any overlay or blockers
        btn.click();
      }
    });
    
    console.log('Forced click done, waiting for download...');

    const download = await downloadPromise;
    console.log('downloaded')

    
    const downloadPath = await download.path();
    console.log('getting download path')

    const fileName = `${timestamp}/${faculty}.xls`;
    const fileBuffer = fs.readFileSync(downloadPath);
    //uploads each xls file into the bucket in the folder 'name'
    console.log('uploading to supabase bucket')
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

  //get the number of faculties in the table
  await ptModFrame.locator('tbody tr td span[id^="RESULT4$"]').first().waitFor();
  const facultyCount = await ptModFrame.locator('tbody tr td span[id^="RESULT4$"]').count();
  console.log('Number of faculties found:', facultyCount);
  //store all the faculties listed in an array from the table
  const facultyNames = [];
  console.log('adding the faculties into an array')
  for (let i = 0; i < facultyCount; i++) {
    const facultyLocator = ptModFrame.locator(`tbody tr td span[id="RESULT4$${i}"]`);
    const name = await facultyLocator.innerText();
    //append
    facultyNames.push(name);
  }

  await page.getByRole('button', { name: 'Close' }).click();
  console.log('closed overlay')
  //loop through and download the xls file for each faculty with the function downloadFacultyMappings
  for (const facultyName of facultyNames) {
    console.log(`Processing faculty: ${facultyName}`);
    //console.log(`Number of rows in Excel file: ${rows.length}`);
    await downloadFacultyMappings(facultyName);
  }

  await browser.close();
  console.log('finished scraping and uploading')

  //uploads the timestamp of when the scraper last ran into the bucket as a txt file
  const latest_update_timestamp = `latest_update_timestamp.txt`;
  console.log('uploading latest timestamp')
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
  console.log(`Script ran for ${durationSeconds} seconds`);

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