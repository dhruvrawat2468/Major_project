import dotenv from "dotenv";
dotenv.config();
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString, {      //-> Universal template to connect to any PostgreSQL database
 host:
'aws-1-ap-south-1.pooler.supabase.com',
port:5432,
database:'postgres',
user:'postgres.zjnwfeanowvhdgdivsxd',
pool_mode:'session',  
});

export default sql;