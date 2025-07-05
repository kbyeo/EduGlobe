import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import xlsx from 'xlsx';
import { Client } from 'pg';


//load env file from supabaseStorage.env into process.env
dotenv.config({ path: './PlayWright/eduglobe.env' }); 

//get credentials to login into supabase
const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_PROJECT_KEY;
//initialise supabase client and set up connection and stores instance into 'supabase'
const supabase = createClient(supabaseUrl, supabaseKey);

//name of supabase bucketa
const BUCKET_NAME = 'edurec-bucket';

//Using session pooler ipv4 connection
const pgClient = new Client({
  connectionString: process.env.SUPABASE_DATABASE_URL, 
});

//async function
async function main() {
    //new
    try {
        await pgClient.connect();

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
        .list(folderPrefix, { offset: 0 });

        //if folder is empty or fails
        if (listerror) throw listerror;
        if (!files || files.length === 0) {
            console.log('No files found.');
            return;
        }
        
        //Clone edurec_mapping table
        await pgClient.query('BEGIN');
        await pgClient.query(`
        CREATE TABLE IF NOT EXISTS edurec_mappings_staging (LIKE edurec_mappings INCLUDING ALL);
        `);
        await pgClient.query('TRUNCATE edurec_mappings_staging');
        
        //array for json data
        const allRows = [];
        const newPUs = [];
        const currentPUs = await pgClient.query('SELECT partner_university FROM country');
        //converts pus to array then set 
        const knownPUs = currentPUs.rows.map(row => row.partner_university);

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

            console.log(`Transforming and Reshaping File: ${file.name} - Number of rows: ${rows.length}`);
            for (const row of rows) {
                //checking for new PUS
                const pu = row['Partner University'];
                if (pu && !knownPUs.includes(pu) && !newPUs.includes(pu)) {
                        newPUs.push(pu);
                }
            // Adjust type conversion for Supabase schema and appends all the rows to the allRows array
            allRows.push({
                    'faculty': row['Faculty'],
                    'partner_university': row['Partner University'] || null,
                    'pu_course_1': row['PU Course 1'] || null,
                    'pu_course_1_title': row['PU Course 1 Title'] || null,
                    'pu_crse1_units': Number(row['PU Crse1 Units']) || null,
                    'pu_course_2': row['PU Course 2'] || null,
                    'pu_course_2_title': row['PU Course 2 Title'] || null,
                    'pu_crse2_units': Number(row['PU Crse2 Units']) || null,
                    'nus_course_1': row['NUS Course 1'] || null,
                    'nus_course_1_title': row['NUS Course 1 Title'] || null,
                    'nus_crse1_units': Number(row['NUS Crse1 Units']) || null,
                    'nus_course_2': row['NUS Course 2'] || null,
                    'nus_course_2_title': row['NUS Course 2 Title'] || null,
                    'nus_crse2_units': Number(row['NUS Crse2 Units']) || null,
                    'pre_approved': row['Pre Approved?'] || null 
                });
            }
        }
        
        //upload new pus into country table
        if (newPUs.length > 0) {
        const placeholders = newPUs.map((_, i) => `($${i + 1}, 'Pending')`).join(', ');
        await pgClient.query(
            `INSERT INTO country (partner_university, country) VALUES ${placeholders}`,
            newPUs
        );
        console.log(`Inserted ${newPUs.length} new partner universities with placeholder country.`);
        } else {
            console.log('no new PUs');
        }
        await pgClient.query('COMMIT');

        console.log('Inserting Mappings into edurec_mappings...')
        await pgClient.query('BEGIN');
        //push 2500 rows per batch
        const batchSize = 2500;
        const columns = Object.keys(allRows[0]);

        for (let start = 0; start < allRows.length; start += batchSize) {
        //get the batch 
        const batch = allRows.slice(start, start + batchSize);
        //flat array to store values
        const values = [];
        //store the index / placeholder
        const params = [];

        //push the batch value and index into the respective arrays
        batch.forEach((row, i) => {
            columns.forEach((col, j) => {
            params.push(`$${i * columns.length + j + 1}`);
            values.push(row[col]);
            });
        });
        
        console.log('pushing data into staging table...')
        //flatten and insert the batch data into the supabase database staging table
        const insertSQL = `
            INSERT INTO edurec_mappings_staging (${columns.join(', ')})
            VALUES
            ${batch
            //map takes in 3 parameters (value, index and array)
            .map(
                (_, i) =>
                `(${columns
                    .map((__, j) => `$${i * columns.length + j + 1}`)
                    .join(', ')})`
            )
            .join(',\n')}
        `;
        //console.log(insertSQL);
        //console.log(values);
        
        //insertSQL is an parameterised query string (placeholders), values are the values being inserted 
        //into the parameterised query string
        await pgClient.query(insertSQL, values);
        console.log(`Inserted batch rows: ${batch.length}`);
        }

        //Swap tables atomically
        console.log('dropping edurec mappings and view')
        await pgClient.query('DROP TABLE IF EXISTS edurec_mappings CASCADE');
        console.log('renaming staging table')
        await pgClient.query('ALTER TABLE edurec_mappings_staging RENAME TO edurec_mappings');

        //finalise the transaction
        await pgClient.query('COMMIT');
        console.log('Table swap successful');

        await pgClient.query(`
        ALTER TABLE edurec_mappings
        ADD CONSTRAINT fk_partner_university
        FOREIGN KEY (partner_university)
        REFERENCES country(partner_university)
        ON DELETE SET NULL;
        `);
        console.log('foreign key added successfully');

        await pgClient.query(`
          CREATE VIEW edurec_mappings_with_country_view AS
          SELECT
            edurec_mappings.*,
            country.country
          FROM
            edurec_mappings 
          LEFT JOIN
            country
            ON edurec_mappings.partner_university = country.partner_university;
        `);
        console.log('View edurec_mappings_with_country created');

    } catch (err) {
        //undo SQL operations if error
        await pgClient.query('ROLLBACK');
        console.error('Error during processing:', err);
    } finally {
        await pgClient.end();
    }
}

//run the main function and catch any error 
main().catch(console.error);