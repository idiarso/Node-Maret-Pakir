import { Response } from 'express';
import { AuthenticatedRequest } from '../shared/types';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

export class PlateController {
    private readonly TEMP_DIR = path.join(__dirname, '../../temp');
    private readonly PYTHON_SCRIPT = path.join(__dirname, '../scripts/recognize_plate.py');

    constructor() {
        // Ensure temp directory exists
        if (!fs.existsSync(this.TEMP_DIR)) {
            fs.mkdirSync(this.TEMP_DIR, { recursive: true });
        }
    }

    recognizePlate = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { image } = req.body;

            if (!image) {
                return res.status(400).json({ message: 'No image provided' });
            }

            // Remove header from base64 string
            const base64Data = image.replace(/^data:image\/jpeg;base64,/, '');

            // Save image to temp file
            const tempImagePath = path.join(this.TEMP_DIR, `plate_${Date.now()}.jpg`);
            fs.writeFileSync(tempImagePath, base64Data, 'base64');

            try {
                // Call Python script for plate recognition
                const plateNumber = await this.runPlateRecognition(tempImagePath);
                
                // Clean up temp file
                fs.unlinkSync(tempImagePath);

                return res.json({ plateNumber });
            } catch (error) {
                // Clean up temp file
                if (fs.existsSync(tempImagePath)) {
                    fs.unlinkSync(tempImagePath);
                }
                throw error;
            }
        } catch (error) {
            console.error('Plate recognition error:', error);
            return res.status(500).json({ message: 'Error processing image' });
        }
    };

    private runPlateRecognition = (imagePath: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const process = spawn('python', [this.PYTHON_SCRIPT, imagePath]);
            let output = '';
            let error = '';

            process.stdout.on('data', (data) => {
                output += data.toString();
            });

            process.stderr.on('data', (data) => {
                error += data.toString();
            });

            process.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Plate recognition failed: ${error}`));
                    return;
                }

                const plateNumber = output.trim();
                if (!plateNumber) {
                    reject(new Error('No plate number detected'));
                    return;
                }

                resolve(plateNumber);
            });
        });
    };
} 