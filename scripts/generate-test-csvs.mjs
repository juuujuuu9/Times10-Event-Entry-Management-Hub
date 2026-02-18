#!/usr/bin/env node
/**
 * Generate test CSV files with various edge cases
 * Run with: node scripts/generate-test-csvs.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const OUTPUT_DIR = './test-csvs';

try {
  mkdirSync(OUTPUT_DIR, { recursive: true });
} catch {}

const TEST_CASES = [
  {
    name: 'valid-simple',
    description: 'Valid CSV with 3 attendees',
    content: `email,first_name,last_name,company
alice@example.com,Alice,Smith,TechCorp
bob@example.com,Bob,Johnson,DesignInc
charlie@example.com,Charlie,Brown,StartupCo`,
  },
  {
    name: 'empty',
    description: 'CSV with only headers (no data)',
    content: `email,first_name,last_name`,
  },
  {
    name: 'missing-email',
    description: 'Rows without valid emails should be skipped',
    content: `email,first_name,last_name
valid@example.com,Valid,User
notanemail,Bad,User1
@nodomain.com,Bad,User2
spaces in@email.com,Bad,User3
multiple@at@signs.com,Bad,User4
,NoEmail,User5

,EmptyEmail,User6`,
  },
  {
    name: 'duplicates',
    description: 'Same email appears twice (first wins)',
    content: `email,first_name,last_name
duplicate@test.com,First,Entry
duplicate@test.com,Second,Entry
duplicate@test.com,Third,Entry`,
  },
  {
    name: 'special-chars',
    description: 'Names with special characters and accents',
    content: `email,first_name,last_name,company
jose@example.com,José,García,Mañana Café
francois@example.com,François,Müller,Café & Co
quoted@example.com,"John ""Johnny""",O'Connor,D'Arcy Inc
emoji@example.com,Alice 🎉,Smith 😊,Party Corp
chinese@example.com,伟,王,中国公司`,
  },
  {
    name: 'csv-injection',
    description: 'Attempt CSV/formula injection (should be literal)',
    content: `email,first_name,last_name
formula@example.com,"=CMD|' /C calc'!A0",Formula
plus@example.com,+CMD|' /C calc'!A0,Plus
minus@example.com,-CMD|' /C calc'!A0,Minus
at@example.com,@SUM(A1:A10),At`,
  },
  {
    name: 'long-fields',
    description: 'Very long names and emails',
    content: `email,first_name,last_name
${'a'.repeat(100)}@example.com,${'Long'.repeat(20)},${'Name'.repeat(20)}
short@example.com,A,B`,
  },
  {
    name: 'extra-columns',
    description: 'CSV with extra columns beyond standard fields',
    content: `email,first_name,last_name,phone,dietary_restrictions,table_number,vip_code,notes
vip@example.com,Very,Important Person,555-1234,Vegetarian,12,VIP2024,Bring to front table
regular@example.com,Regular,Attendee,555-5678,None,5,,No special requests`,
  },
  {
    name: 'header-variants',
    description: 'Different header naming conventions',
    content: `Email,First Name,Last Name,Phone Number,e-mail,first,last
variant1@example.com,Test,One,555-0001,variant1@example.com,Test,One
variant2@example.com,Test,Two,555-0002,variant2@example.com,Test,Two`,
  },
  {
    name: 'quoted-fields',
    description: 'Fields with commas and quotes',
    content: `email,first_name,last_name,company
quoted@example.com,"John, Jr.","Smith, Esq.","Law Firm, LLC"
multiline@example.com,"Jane
Mary",Doe,"Corp, Inc."
esaped@example.com,"Bob ""The Builder""",Smith,Build Inc`,
  },
  {
    name: 'bom-utf8',
    description: 'CSV with UTF-8 BOM (Byte Order Mark)',
    content: '\uFEFFemail,first_name,last_name
bom@example.com,BOM,Test',
  },
  {
    name: 'windows-line-endings',
    description: 'CSV with Windows CRLF line endings',
    content: 'email,first_name,last_name\r\ncrlf@example.com,Windows,User\r\nsecond@example.com,Another,User',
  },
  {
    name: 'mixed-whitespace',
    description: 'Fields with extra whitespace',
    content: `email,first_name,last_name
  spaces@example.com  ,  Leading,Trailing  	tab@example.com	,Tab,User`,
  },
  {
    name: 'case-insensitive-headers',
    description: 'Headers in different cases',
    content: `EMAIL,FIRST_NAME,LAST_NAME
upper@example.com,Upper,Case
Lower@example.com,Lower,Case`,
  },
  {
    name: 'empty-rows',
    description: 'CSV with blank lines between data',
    content: `email,first_name,last_name
first@example.com,First,User

second@example.com,Second,User


third@example.com,Third,User`,
  },
];

console.log('Generating test CSV files...\n');

for (const testCase of TEST_CASES) {
  const filename = join(OUTPUT_DIR, `${testCase.name}.csv`);
  writeFileSync(filename, testCase.content);
  console.log(`✓ ${testCase.name}.csv`);
  console.log(`  ${testCase.description}`);
  console.log(`  ${testCase.content.split('\n').length - 1} data rows`);
  console.log();
}

console.log(`All test files written to ${OUTPUT_DIR}/`);
console.log('\nTo test imports, run:');
console.log('  npm run dev');
console.log(`  Then upload files from ${OUTPUT_DIR}/ to the import page`);
