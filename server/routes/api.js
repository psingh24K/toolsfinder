import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in API routes');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection route
router.get('/test', async (req, res) => {
    console.log('Testing Supabase connection...');
    try {
        const { data, error } = await supabase
            .from('tools')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        console.log('Supabase test successful:', data);
        res.json({
            success: true,
            message: 'Successfully connected to Supabase',
            data: data
        });
    } catch (error) {
        console.error('Connection test failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error
        });
    }
});

export default router;
