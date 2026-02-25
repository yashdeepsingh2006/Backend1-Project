import express from 'express';
import dotenv from 'dotenv';
import connectDB from './DB/db';

dotenv.config();
const app = express();
connectDB();

app.get('/', (req, res) => {
    res.send('Root route');
})

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Listening at Port ${PORT}`);
})