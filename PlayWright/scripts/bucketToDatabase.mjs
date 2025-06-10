import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import xlsx from 'xlsx';

//load env file from supabaseStorage.env into process.env
dotenv.config({ path: './supabaseStorage.env' }); // adjust path if needed

//get credentials to login into supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
//initialise supabase client and set up connection and stores instance into 'supabase'
const supabase = createClient(supabaseUrl, supabaseKey);
//name of supabase bucket
const BUCKET_NAME = 'edurec-bucket'; // change if needed
//async function
async function main() {
    //download the latest timestamp text file
    const { data, error } = await supabase
    .storage
    .from('edurec-bucket')
    .download('latest_update_timestamp.txt');
    //if download error
    if (error) {
    console.error('Error downloading timestamp file:', error.message);
    return;
    }
    
    //read content of text file. `data` is a Blob so we must convert it to string using .text()
    const timestamp = await data.text();
    //create a path prefix using the content of the downloaded txt file
    const folderPrefix = `${timestamp}/`;

    //gets the list of all the xls files in the edurec bucket's latest time stamp folder
    //files is an array
    const { data: files, listerror } = await supabase.storage
    .from(BUCKET_NAME)
    .list(folderPrefix, { offset:0 });

    //if folder is empty or fails
    if (listerror) throw listerror;
    if (!files || files.length === 0) {
        console.log('No files found.');
        return;
    }
    
    for (const file of files) {

        //gets the path of each xls file 
        const fullPath = `${folderPrefix}${file.name}`;
        //downloads each file from that bucket and folder
        const { data: fileData, error: downloadError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .download(fullPath);
        //check if download error
        if (downloadError) {
        console.error(`Failed to download ${file.name}:`, downloadError.message);
        continue;
        }

        //converts the data in each xls file to a buffer
        const buffer = await fileData.arrayBuffer();
        //reads the buffer
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        //reads the first sheet
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        //converts the rows in the sheet into json format, each object represents a row
        const rows = xlsx.utils.sheet_to_json(sheet);

        for (const row of rows) {
        // Adjust type conversion for Supabase schema
            const record = {
                'Faculty': row['Faculty'],
                'Partner University': row['Partner University'] || null,
                'PU Course 1': row['PU Course 1'] || null,
                'PU Course 1 Title': row['PU Course 1 Title'] || null,
                'PU Crse1 Units': Number(row['PU Crse1 Units']) || null,
                'PU Course 2': row['PU Course 2'] || null,
                'PU Course 2 Title': row['PU Course 2 Title'] || null,
                'PU Crse2 Units': Number(row['PU Crse2 Units']) || null,
                'NUS Course 1': row['NUS Course 1'] || null,
                'NUS Course 1 Title': row['NUS Course 1 Title'] || null,
                'NUS Crse1 Units': Number(row['NUS Crse1 Units']) || null,
                'NUS Course 2': row['NUS Course 2'] || null,
                'NUS Course 2 Title': row['NUS Course 2 Title'] || null,
                'NUS Crse2 Units': Number(row['NUS Crse2 Units']) || null,
                'Pre Approved?': row['Pre Approved?'] || null 
            };
        
        //insert each row to the database
        const { error: insertError } = await supabase
            .from('edurec_mappings')
            .insert(record);
        //handle insert error
        if (insertError) {
            console.error('Insert failed:', insertError.message);
        } else {
            console.log(`Inserted row from ${file.name}`);
        }
        }
    }
    }

//execute
main().catch(console.error);