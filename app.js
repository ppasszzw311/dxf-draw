import express from "express";
import { engine } from 'express-handlebars';
import jsdom from "jsdom";
const { JSDOM } = jsdom;
import bodyParser from "body-parser";
import { fileURLToPath} from 'url';
import { dirname, join } from "path";
import mariadb from 'mariadb';

import {start, stepMake, built, newPage, step01, step02, step03, step04, uploadResult} from './lib/handlers.js';


const app = express()
const PORT = process.env.PORT || '3000'
app.set('port', PORT);

// set main js 

// set public filedirect 
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(__dirname + '/public'))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.engine('handlebars', engine({ extname: '.hbs', defaultLayouts: 'main', }))
app.set('view engine', 'handlebars')
app.set('views', './views')

app.get('/', start)
app.get('/step', stepMake)
app.get('/built', built)
app.get('/newpage', newPage)
// 逐步一頁一頁處理
app.get('/step01', step01)
app.post('/step02', step02)
app.post('/step03', step03)
app.post('/step04', step04)
app.post('/convert', (req, res) => {
  // 从请求中获取SVG文件数据
  const svg = req.body.svg;

  // 解析SVG数据
  const { document } = new JSDOM(svg).window;
  const paths = document.getElementsByTagName('path');

  // 创建DXF文档
  const dxfdoc = new Drawing.DXFDocument({ version: 'AC1018' });

  // 将SVG中的path元素添加到DXF文档中
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    const d = path.getAttribute('d');
    const pathData = Drawing.makePathData(d);
    const entity = new Drawing.Entities.Polyline(pathData);
    dxfdoc.addEntity(entity);
  }

  // 将DXF文档写入文件并发送到客户端
  const filePath = 'converted.dxf';
  fs.writeFileSync(filePath, dxfdoc.toDxfString());
  res.download(filePath);
});

app.post('/api', uploadResult)

// // 連線資料庫
// const pool = mariadb.createPool({
//   host: 'localhost:mysql',
//   user: 'root',
//   password: 'Klove06ching',
//   connectionLimit: 5
// });

// asyncFunction();
// async function asyncFunction() {
//   let conn;
//   try {
//     conn = await pool.getConnection();
//     const rows = await conn.query("DESCRIBE LocationDevice;");
//     console.log(rows); //[ {val: 1}, meta: ... ]
//     // const res = await conn.query("INSERT INTO myTable value (?, ?)", [1, "mariadb"]);
//     // console.log(res); // { affectedRows: 1, insertId: 1, warningStatus: 0 }

//   } catch (err) {
//     throw err;
//   } finally {
//     if (conn) return conn.end();
//   }
// }

app.listen(PORT, () => console.log(
  `Express start on http://localhost:${PORT}`
))

// test ing 

