import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to data.json in the project root
const DATA_FILE_PATH = path.join(__dirname, '../../../data.json');

/**
 * Overwrites data.json with the latest session data.
 * @param {Object} data - The data to log.
 */
export const logSessionData = (data) => {
  try {
    const sessionLog = {
      timestamp: new Date().toISOString(),
      ...data
    };
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(sessionLog, null, 2), 'utf8');
    console.log(`[Logger] Session data updated in ${DATA_FILE_PATH}`);
  } catch (error) {
    console.error('[Logger] Error writing session data:', error.message);
  }
};
