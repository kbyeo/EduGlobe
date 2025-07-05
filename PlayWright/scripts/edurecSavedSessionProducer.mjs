import { chromium, expect } from "@playwright/test";
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

dotenv.config({ path: './PlayWright/eduglobe.env' });

async function getSavedSession() {
    const browser = await chromium.launch( {headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('https://myedurec.nus.edu.sg/');

    await page.locator('span').filter({ hasText: 'Please click here to login to' }).getByRole('link').click();
    await page.getByRole('textbox', { name: 'User Account' }).click();
    await page.getByRole('textbox', { name: 'User Account' }).fill(process.env.NUS_USERNAME);
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill(process.env.NUS_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    await page.locator('#N_STDACAD_SHORTCUT').waitFor({ timeout: 0 });

    await page.context().storageState( {path: "./PlayWright/edurecAuth.json" });
    await browser.close();

    await uploadSessionFile();

};

async function uploadSessionFile() {
  const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
  const supabaseKey = process.env.SUPABASE_PROJECT_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const filePath = './PlayWright/edurecAuth.json';
  const fileName = 'sessions/edurecAuth.json'; 

  const fileBuffer = fs.readFileSync(filePath);

  //uploads edurec.auth to supabase bucket
  const { data, error } = await supabase.storage
    .from('edurec-bucket')   
    .upload(fileName, fileBuffer, {
      upsert: true,
      contentType: 'application/json',
    });

  if (error) {
    throw error;
  }
  console.log('File uploaded successfully:', data);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  getSavedSession().then(() => {
    console.log('Session saved successfully!');
  }).catch(err => {
    console.error('Error running getSavedSession:', err);
    process.exit(1);
  });
}

