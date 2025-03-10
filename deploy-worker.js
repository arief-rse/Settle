// Script to deploy the Cloudflare worker
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to execute shell commands
function runCommand(command) {
    console.log(`Running: ${command}`);
    try {
        const output = execSync(command, { encoding: 'utf8' });
        console.log(output);
        return { success: true, output };
    } catch (error) {
        console.error(`Error executing command: ${command}`);
        console.error(error.message);
        return { success: false, error: error.message };
    }
}

// Function to check if wrangler is installed
function checkWrangler() {
    try {
        execSync('npx wrangler --version', { encoding: 'utf8' });
        return true;
    } catch (error) {
        return false;
    }
}

// Function to deploy the worker
async function deployWorker() {
    console.log('=== Cloudflare Worker Deployment Script ===');

    // Check if wrangler is installed
    if (!checkWrangler()) {
        console.log('Wrangler is not installed. Installing...');
        const result = runCommand('npm install -g wrangler');
        if (!result.success) {
            console.error('Failed to install Wrangler. Please install it manually with "npm install -g wrangler"');
            process.exit(1);
        }
    }

    // Check if we're in the right directory
    if (!fs.existsSync(path.join(process.cwd(), 'cloudflare-worker'))) {
        console.log('Cloudflare worker directory not found. Navigating to the correct directory...');
        try {
            process.chdir(path.join(process.cwd(), 'cloudflare-worker'));
        } catch (error) {
            console.error('Could not find the cloudflare-worker directory. Please run this script from the project root.');
            process.exit(1);
        }
    } else {
        process.chdir(path.join(process.cwd(), 'cloudflare-worker'));
    }

    console.log('Current directory:', process.cwd());

    // Check if wrangler.toml exists
    if (!fs.existsSync('wrangler.toml')) {
        console.error('wrangler.toml not found. Please make sure you are in the correct directory.');
        process.exit(1);
    }

    // Ask for Anthropic API key
    const apiKey = await new Promise(resolve => {
        rl.question('Enter your Anthropic API key (press Enter to skip if already set): ', answer => {
            resolve(answer.trim());
        });
    });

    // Set the API key as a secret if provided
    if (apiKey) {
        console.log('Setting Anthropic API key as a secret...');
        // Write the API key to a temporary file
        fs.writeFileSync('.api-key-temp', apiKey);

        // Use the file to set the secret
        const secretResult = runCommand('npx wrangler secret put ANTHROPIC_API_KEY --name anthropic-proxy < .api-key-temp');

        // Remove the temporary file
        fs.unlinkSync('.api-key-temp');

        if (!secretResult.success) {
            console.error('Failed to set the API key secret. You may need to set it manually.');
        }
    }

    // Deploy the worker
    console.log('Deploying the worker...');
    const deployResult = runCommand('npx wrangler deploy');

    if (deployResult.success) {
        console.log('Worker deployed successfully!');

        // Extract the worker URL from the deployment output
        const urlMatch = deployResult.output.match(/https:\/\/[a-zA-Z0-9-]+\.workers\.dev/);
        if (urlMatch) {
            const workerUrl = urlMatch[0];
            console.log(`Worker URL: ${workerUrl}`);

            // Update the worker URL in the AI processor file
            try {
                const aiProcessorPath = path.join(process.cwd(), '..', 'src', 'lib', 'ai-processor.ts');
                if (fs.existsSync(aiProcessorPath)) {
                    let aiProcessorContent = fs.readFileSync(aiProcessorPath, 'utf8');

                    // Replace the worker URL
                    aiProcessorContent = aiProcessorContent.replace(
                        /const workerUrl = "https:\/\/[^"]+"/,
                        `const workerUrl = "${workerUrl}"`
                    );

                    fs.writeFileSync(aiProcessorPath, aiProcessorContent);
                    console.log(`Updated worker URL in src/lib/ai-processor.ts`);
                }
            } catch (error) {
                console.error('Failed to update the worker URL in the AI processor file:', error.message);
            }
        }

        console.log('\nNext steps:');
        console.log('1. Run the test script to verify the connection: node test-api-connection.js');
        console.log('2. Build and test the extension');
    } else {
        console.error('Failed to deploy the worker. Please check the error message and try again.');
    }

    rl.close();
}

// Run the deployment
deployWorker(); 