import express from 'express';
import dotenv from 'dotenv';
import connectDB from './DB/db.js';
import listinRoutes from './Routes/listing.route.js';
import path from 'path';
import { fileURLToPath } from 'url';
import methodOverride from 'method-override';


dotenv.config();

const app = express();

connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.get('/', (req, res) => {
    res.send('Root route');
})


app.use('/listing', listinRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Listening at Port ${PORT}`);
})