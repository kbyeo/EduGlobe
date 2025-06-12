import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: 'supabaseStorage.env' });

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

//test.setTimeout(30 * 60 * 1000);
test.setTimeout(0); // disables timeout
const start = Date.now();

const now = new Date();

const pad = (n) => n.toString().padStart(2, '0');

const timestamp = 
  now.getFullYear() + '-' +
  pad(now.getMonth() + 1) + '-' +
  pad(now.getDate()) + '_' +
  pad(now.getHours()) + '-' +
  pad(now.getMinutes()) + '-' +
  pad(now.getSeconds())

test('test', async ({ page }) => {
  //Intial steps
  await page.goto('https://myedurec.nus.edu.sg/psp/cs90prd/?cmd=login&languageCd=ENG&');
  await page.locator('span').filter({ hasText: 'Please click here to login to' }).getByRole('link').click();
  await page.locator('#N_STDACAD_SHORTCUT').click();
  await page.getByRole('link', { name: 'Global Education' }).click();

  const mainFrame = page.frameLocator('iframe[title="Main Content"]');
  await mainFrame.locator('img[alt="Search for Programs"]').waitFor({ state: 'visible' });

  await page.getByRole('link', { name: 'Search Course Mappings' }).click();

  const ptModFrame = page.frameLocator('iframe[name^="ptModFrame_"]');

  await mainFrame.getByRole('button', { name: 'Look up Faculty' }).click();

  //Faculty Mapping Function
  async function downloadFacultyMappings(page, faculty) {
    await mainFrame.getByRole('button', { name: 'Look up Faculty' }).click();
    await ptModFrame.getByLabel('Search by:').selectOption('2');
    await ptModFrame.getByRole('button', { name: 'Look Up' }).click();
    await ptModFrame.getByRole('link', { name: faculty, exact: true }).click();

    await mainFrame.getByRole('button', { name: 'Fetch Mappings' }).click();

    await mainFrame.getByRole('button', { name: 'Download Partner University' }).waitFor({ state: 'visible' });

    const downloadPromise = page.waitForEvent('download');
    await mainFrame.getByRole('button', { name: 'Download Partner University' }).click();

    // Locate the element inside the frame and extract its text
    const facultyName = await mainFrame.locator('#ACAD_GROUP_TBL_DESCR').innerText();
    // Sanitize the name for filesystem safety
    const safeFileName = facultyName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').trim();
    
    const download = await downloadPromise;
    const downloadPath = await download.path();

    const fileName = `${timestamp}/${safeFileName}.xls`;
    const fileBuffer = fs.readFileSync(downloadPath);

    const { data, error } = await supabase
    .storage
    .from('edurec-bucket') // replace with your actual Supabase bucket name
    .upload(fileName, fileBuffer, {
      contentType: 'application/vnd.ms-excel',
      upsert: true, // overwrite if already exists
    });

    if (error) {
      console.error('Upload failed:', error.message);
    } else {
      console.log('Uploaded to Supabase:', data.path);
    }
  }


  //Gets the list of faculties
  await ptModFrame.locator('tbody tr td span[id^="RESULT4$"]').first().waitFor();
  const facultyCount = await ptModFrame.locator('tbody tr td span[id^="RESULT4$"]').count();
  console.log('Number of faculties found:', facultyCount);


  const facultyNames = [];
  for (let i = 0; i < facultyCount; i++) {
    const facultyLocator = ptModFrame.locator(`tbody tr td span[id="RESULT4$${i}"]`);
    const name = await facultyLocator.innerText();
    facultyNames.push(name);
  }
  
  await page.getByRole('button', { name: 'Close' }).click();

  for (const facultyName of facultyNames) {
  console.log(`Processing faculty: ${facultyName}`);
  await downloadFacultyMappings(page, facultyName);
}

  const end = Date.now();
  const durationSeconds = ((end - start) / 1000).toFixed(2);
  console.log(`Test ran for ${durationSeconds} seconds`);
});




